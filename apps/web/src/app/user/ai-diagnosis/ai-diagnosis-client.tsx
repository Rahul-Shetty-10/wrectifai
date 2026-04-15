'use client';

import { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  Bot, 
  ImageIcon, 
  Mic, 
  ShieldAlert, 
  Sparkles, 
  Video, 
  Wrench, 
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  HelpCircle,
} from 'lucide-react';
import { SessionGuard } from '@/components/auth/session-guard';
import { UserSidebar, UserSidebarMobile } from '@/components/dashboard/user-sidebar';
import { UserTopLogoHeader } from '@/components/dashboard/user-top-logo-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  type UserAiDiagnosisContent, 
  type UserSidebarContent,
  createDiagnosisSession,
  createIssueRequest,
  fetchUserVehicles,
  type AiDiagnosisMockResult,
  type UserVehicle,
  USER_AI_DIAGNOSIS_DEFAULT
} from '@/lib/api';

type Props = {
  sidebar: UserSidebarContent;
  content: UserAiDiagnosisContent;
};

type Step = 'input' | 'analyzing' | 'result';

export function AiDiagnosisClient({ sidebar, content: initialContent }: Props) {
  const content = initialContent?.header && initialContent?.input ? initialContent : USER_AI_DIAGNOSIS_DEFAULT;
  const searchParams = useSearchParams();
  const symptomsFromUrl = searchParams.get('symptoms');

  const [step, setStep] = useState<Step>('input');
  const [symptoms, setSymptoms] = useState(symptomsFromUrl || '');
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [hasMedia, setHasMedia] = useState(false);
  const [results, setResults] = useState<AiDiagnosisMockResult[]>([]);
  const [vehicles, setVehicles] = useState<UserVehicle[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [lastDiagnosisSessionId, setLastDiagnosisSessionId] = useState('');
  const [raisingRequest, setRaisingRequest] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.max(120, textareaRef.current.scrollHeight)}px`;
    }
  }, [symptoms]);

  useEffect(() => {
    async function loadVehicles() {
      try {
        const data = await fetchUserVehicles();
        setVehicles(data);
        setSelectedVehicleId(data.find((v) => v.isDefault)?.id ?? data[0]?.id ?? '');
      } catch {
        setVehicles([]);
        setSelectedVehicleId('');
      }
    }
    void loadVehicles();
  }, []);

  function handleTopicToggle(topic: string) {
    if (selectedTopics.includes(topic)) {
      setSelectedTopics(prev => prev.filter(t => t !== topic));
      setSymptoms(prev => prev.replace(topic + ', ', '').replace(topic, '').trim());
    } else {
      setSelectedTopics(prev => [...prev, topic]);
      const prefix = symptoms.trim() ? (symptoms.trim().endsWith(',') ? ' ' : ', ') : '';
      setSymptoms(prev => prev + prefix + topic);
    }
  }

  async function handleAnalyze() {
    if ((!symptoms.trim() && !hasMedia) || !selectedVehicleId) return;
    
    setStep('analyzing');
    try {
      const data = await createDiagnosisSession({
        vehicleId: selectedVehicleId,
        symptoms,
        attachments: hasMedia ? ['media-uploaded'] : [],
      });
      setResults(data.diagnoses);
      setLastDiagnosisSessionId(data.diagnosisSessionId);
      setStep('result');
    } catch (e) {
      console.error(e);
      setStep('input');
      alert(content.states.errorLabel);
    }
  }

  async function handleRaiseIssue(summary: string) {
    if (!selectedVehicleId) return;
    try {
      setRaisingRequest(true);
      await createIssueRequest({
        vehicleId: selectedVehicleId,
        summary,
        diagnosisSessionId: lastDiagnosisSessionId || undefined,
      });
      window.location.href = '/user/quotes-bookings';
    } catch (e) {
      console.error(e);
      alert('Unable to raise request right now');
    } finally {
      setRaisingRequest(false);
    }
  }

  function renderRiskBadge(urgency: string) {
    if (urgency === 'High' || urgency === 'Critical') {
      return <Badge variant="secondary" className="bg-destructive/15 text-destructive border-transparent animate-pulse">{urgency}</Badge>;
    }
    if (urgency === 'Medium') {
      return <Badge variant="secondary" className="bg-orange-500/15 text-orange-500 border-transparent">{urgency}</Badge>;
    }
    return <Badge variant="secondary" className="bg-emerald-500/15 text-emerald-500 border-transparent">{urgency}</Badge>;
  }

  return (
    <div className="flex h-screen bg-background">
      <SessionGuard requiredRole="user" />
      <UserSidebarMobile activeItem="ai-diagnosis" content={sidebar} />
      <div className="hidden lg:block">
        <UserSidebar activeItem="ai-diagnosis" content={sidebar} />
      </div>

      <section className="flex-1 overflow-y-auto w-full relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/5 via-background to-background -z-10 pointer-events-none" />
        
        <div className="p-4 md:p-8 xl:p-10 max-w-5xl mx-auto space-y-8 min-h-full flex flex-col">
          <UserTopLogoHeader sidebar={sidebar} />
          
          {/* Header */}
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 flex items-center justify-center rounded-xl bg-primary/10 border border-primary/20 text-primary shrink-0 relative overflow-hidden group">
              <div className="absolute inset-0 bg-primary/20 translate-y-[100%] group-hover:translate-y-0 transition-transform duration-300" />
              <Bot className="h-6 w-6 relative z-10" />
            </div>
            <div>
              <h1 className="text-2xl font-display font-bold text-foreground leading-none">{content.header.title}</h1>
              <p className="text-sm font-medium text-muted-foreground mt-1.5 tracking-wide flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-primary" /> {content.header.subtitle}
              </p>
            </div>
          </div>

          <div className="flex-1 flex flex-col justify-center gap-8 relative">
            
            {/* Step 1: Input Phase */}
            {step === 'input' && (
              <div className="animate-in fade-in zoom-in-95 duration-500 max-w-3xl w-full mx-auto">
                <Card className="border-border/40 bg-card/60 backdrop-blur-xl shadow-2xl shadow-[0_30px_60px_rgba(0,0,0,0.06)] rounded-[2rem] overflow-hidden">
                  <CardContent className="p-6 sm:p-10 space-y-8">
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                          <HelpCircle className="h-4 w-4 text-primary" /> {content.input.categoriesLabel}
                        </label>
                      </div>
                      <div className="flex flex-wrap gap-2.5">
                        {content.input.categories.map(cat => (
                          <button 
                            key={cat} 
                            onClick={() => handleTopicToggle(cat)}
                            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 border ${
                              selectedTopics.includes(cat) 
                                ? 'bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20 scale-105' 
                                : 'bg-background hover:bg-muted text-muted-foreground border-border/60 hover:border-border hover:text-foreground'
                            }`}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Vehicle
                      </label>
                      <select
                        value={selectedVehicleId}
                        onChange={(e) => setSelectedVehicleId(e.target.value)}
                        className="h-11 w-full rounded-xl border border-border/60 bg-background px-3 text-sm text-foreground"
                      >
                        <option value="">Select a vehicle</option>
                        {vehicles.map((vehicle) => (
                          <option key={vehicle.id} value={vehicle.id}>
                            {vehicle.year} {vehicle.make} {vehicle.model}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-3">
                      <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                         <Sparkles className="h-4 w-4 text-primary" /> {content.input.symptomsLabel}
                      </label>
                      <div className="relative group">
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/30 to-purple-500/30 rounded-2xl blur opacity-0 group-focus-within:opacity-100 transition duration-500" />
                        <textarea 
                          ref={textareaRef}
                          value={symptoms}
                          onChange={(e) => setSymptoms(e.target.value)}
                          placeholder={content.input.symptomsPlaceholder}
                          className="relative w-full bg-background/80 border border-border/50 focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary focus:outline-none rounded-2xl resize-none text-base min-h-[120px] p-5 shadow-inner transition-all text-foreground placeholder:text-muted-foreground"
                        />
                      </div>
                    </div>

                    <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
                      
                      {/* Media Upload */}
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        accept="image/*,video/*,audio/*" 
                        onChange={(e) => {
                          if (e.target.files && e.target.files.length > 0) {
                            setHasMedia(true);
                          }
                        }}
                      />
                      <button 
                        onClick={() => {
                          if (hasMedia) {
                             setHasMedia(false);
                             if (fileInputRef.current) fileInputRef.current.value = '';
                          } else {
                             fileInputRef.current?.click();
                          }
                        }}
                        className={`flex items-center justify-center gap-3 px-5 py-3 rounded-2xl border transition-all duration-300 w-full sm:w-auto ${
                          hasMedia ? 'bg-primary/10 border-primary/30 text-primary' : 'bg-background/50 border-dashed border-border/80 text-muted-foreground hover:bg-background hover:border-primary/40 hover:text-foreground'
                        }`}
                      >
                        {hasMedia ? (
                          <>
                            <CheckCircle2 className="h-5 w-5" />
                            <span className="text-sm font-semibold">Media Attached</span>
                          </>
                        ) : (
                          <>
                            <div className="flex -space-x-1">
                              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center border-2 border-card"><ImageIcon className="h-3.5 w-3.5" /></div>
                              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center border-2 border-card"><Video className="h-3.5 w-3.5" /></div>
                              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center border-2 border-card"><Mic className="h-3.5 w-3.5" /></div>
                            </div>
                            <span className="text-sm font-semibold">{content.input.uploadMediaLabel}</span>
                          </>
                        )}
                      </button>

                      <Button 
                        onClick={handleAnalyze} 
                        disabled={(!symptoms.trim() && !hasMedia) || !selectedVehicleId}
                        className="w-full sm:w-auto h-12 px-8 rounded-2xl bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white font-bold tracking-wide shadow-xl shadow-primary/25 hover:scale-[1.02] transition-all gap-2"
                      >
                        {content.input.analyzeButtonLabel} <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>

                  </CardContent>
                </Card>
              </div>
            )}

            {/* Step 2: Processing Phase */}
            {step === 'analyzing' && (
              <div className="flex flex-col items-center justify-center h-[50vh] animate-in fade-in duration-500">
                <div className="relative">
                  <div className="absolute inset-0 bg-primary/20 blur-[50px] rounded-full animate-pulse" />
                  <div className="w-24 h-24 rounded-full border-4 border-muted border-t-primary animate-spin relative z-10" />
                  <Bot className="h-10 w-10 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20" />
                </div>
                <h3 className="mt-8 text-2xl font-display font-bold bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/50 animate-pulse">
                  {content.input.analyzingLabel}
                </h3>
                <p className="mt-2 text-muted-foreground font-medium max-w-sm text-center">
                  Cross-referencing symptoms with technical bulletins and sensor telemetry...
                </p>
              </div>
            )}

            {/* Step 3: Result Phase */}
            {step === 'result' && (
              <div className="space-y-6 animate-in slide-in-from-bottom-8 fade-in duration-700">
                <div className="flex items-center justify-between pb-2 border-b border-border/40">
                  <h2 className="text-xl font-bold text-foreground font-display flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-emerald-500" /> {content.results.title}
                  </h2>
                  <Button variant="ghost" size="sm" onClick={() => setStep('input')} className="text-muted-foreground hover:text-foreground">
                    {content.input.addMoreSymptomsLabel}
                  </Button>
                </div>

                <div className="grid gap-6">
                  {results.map((result) => (
                    <Card key={result.id} className="border-border/40 shadow-xl overflow-hidden rounded-[24px] bg-card/60 backdrop-blur-md relative group transition-all hover:bg-card/80">
                      
                      {/* Status indicator line */}
                      <div className={`absolute top-0 bottom-0 left-0 w-1.5 transition-colors ${
                        result.urgency === 'High' || result.urgency === 'Critical' ? 'bg-destructive' :
                        result.urgency === 'Medium' ? 'bg-orange-500' : 'bg-emerald-500'
                      }`} />

                      <CardContent className="p-6 sm:p-8 pl-8 sm:pl-10 grid gap-8 md:grid-cols-[1fr_300px]">
                        
                        <div className="space-y-6">
                          <div>
                            <div className="flex items-center gap-3 mb-3">
                              {renderRiskBadge(result.urgency)}
                              {result.requiresGarage ? (
                                <Badge variant="outline" className="text-muted-foreground border-border/80 gap-1"><Wrench className="h-3 w-3" /> Garage Needed</Badge>
                              ) : (
                                <Badge variant="outline" className="text-muted-foreground border-border/80 gap-1"><Sparkles className="h-3 w-3 text-emerald-500" /> DIY Friendly</Badge>
                              )}
                            </div>
                            <h3 className="text-xl sm:text-2xl font-display font-extrabold text-foreground leading-tight">
                              {result.issue}
                            </h3>
                          </div>

                          <div className="bg-background/50 rounded-2xl p-5 border border-border/40">
                            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                              <ShieldAlert className="h-3.5 w-3.5" /> {content.results.riskLabel}
                            </p>
                            <p className="text-sm font-medium text-foreground/80 leading-relaxed">
                              {result.riskIfIgnored}
                            </p>
                          </div>
                          
                          <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                              {content.results.solutionLabel}
                            </p>
                            <p className="text-base font-semibold text-foreground leading-relaxed">
                              {result.solution}
                            </p>
                          </div>
                        </div>

                        {/* Action Box / Quoting side */}
                        <div className="flex flex-col h-full space-y-4 pt-6 md:pt-0 border-t md:border-t-0 md:border-l border-border/30 md:pl-8">
                          <div className="flex-1 space-y-4">
                            <div className="bg-primary/5 rounded-2xl p-5 border border-primary/10">
                              <p className="text-[10px] font-bold uppercase tracking-widest text-primary/80 mb-1">{content.results.partsEstimateLabel}</p>
                              <p className="text-2xl font-display font-bold text-foreground">{result.draftQuote.totalEstimate}</p>
                              <div className="mt-3 space-y-1">
                                {result.draftQuote.parts.map(p => (
                                  <div key={p} className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                                    <div className="w-1 h-1 rounded-full bg-border" /> {p}
                                  </div>
                                ))}
                              </div>
                              <p className="text-xs font-medium text-muted-foreground/60 mt-4 flex items-center gap-1.5">
                                <Clock className="h-3.5 w-3.5" /> Labor Time ~ {result.draftQuote.laborTime}
                              </p>
                            </div>
                          </div>

                          <div className="mt-auto">
                            {result.requiresGarage ? (
                              <Button
                                onClick={() => handleRaiseIssue(result.issue)}
                                disabled={raisingRequest}
                                className="w-full h-12 rounded-xl bg-foreground text-background hover:bg-foreground/90 font-bold shadow-lg gap-2"
                              >
                                {content.results.bookGarageLabel} <ArrowRight className="h-4 w-4" />
                              </Button>
                            ) : (
                              <div className="flex flex-col gap-2">
                                <Button
                                  onClick={() => handleRaiseIssue(result.issue)}
                                  disabled={raisingRequest}
                                  className="w-full h-12 rounded-xl bg-primary text-primary-foreground hover:bg-primary/95 font-bold shadow-lg gap-2"
                                >
                                  {content.results.viewDiyLabel}
                                </Button>
                                <Button variant="outline" className="w-full h-12 rounded-xl border-border/50 text-muted-foreground font-semibold">
                                  Buy Parts
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>

                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
            
          </div>
        </div>
      </section>
    </div>
  );
}
