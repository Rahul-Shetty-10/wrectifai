'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CalendarClock, Car, ClipboardList, MapPin, Phone, Sparkles, Upload, Wrench, X } from 'lucide-react';
import { UserThemeShell } from '@/components/dashboard/user-theme-shell';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
  fetchUserProfile,
  fetchUserVehicles,
  raiseIssueToGarage as raiseIssueToGarageApi,
  submitServiceIntake,
  type ServiceIntakePayload,
  type UserServiceIntakeContent,
  type UserSidebarContent,
  type UserVehicle,
} from '@/lib/api';

type IntakeMode = 'diagnosis' | 'direct';
type Severity = 'can_drive' | 'risky' | 'not_starting';
type RiskLevel = 'low' | 'medium' | 'high';
type SinceWhen = 'today' | 'few_days' | 'weeks';
type WhenHappens = 'starting' | 'driving' | 'idling' | 'braking';

type QuestionType = 'single_select' | 'boolean' | 'text' | 'file';
type DiagnosisQuestion = {
  id: string;
  category?: string;
  baseId?: string;
  type: QuestionType;
  label: string;
  options?: string[];
  required: boolean;
};

type ChatMessage = {
  id: string;
  sender: 'bot' | 'user';
  text: string;
};

const CATEGORY_QUESTION_BANK: Record<string, DiagnosisQuestion[]> = {
  engine: [
    { id: 'when_occurs', type: 'single_select', label: 'When does the issue occur?', options: ['Starting', 'While driving', 'Idling'], required: true },
    { id: 'noise', type: 'boolean', label: 'Do you hear unusual engine noise?', required: true },
    { id: 'smoke', type: 'single_select', label: 'Do you see smoke?', options: ['No', 'White', 'Black', 'Blue'], required: true },
    { id: 'power_loss', type: 'boolean', label: 'Do you feel loss of power while driving?', required: true },
  ],
  battery: [
    { id: 'vehicle_start', type: 'single_select', label: 'Vehicle starting status?', options: ['Starts normally', 'Slow start', 'Not starting'], required: true },
    { id: 'lights_status', type: 'single_select', label: 'Dashboard lights condition?', options: ['Normal', 'Dim', 'Not working'], required: true },
    { id: 'battery_age', type: 'single_select', label: 'Battery age?', options: ['< 1 year', '1-2 years', '2-3 years', '3+ years'], required: true },
    { id: 'recent_jumpstart', type: 'boolean', label: 'Did you recently jump-start the vehicle?', required: false },
  ],
  brake: [
    { id: 'brake_response', type: 'single_select', label: 'Brake response?', options: ['Normal', 'Soft', 'Hard', 'Not working'], required: true },
    { id: 'brake_noise', type: 'boolean', label: 'Do you hear noise while braking?', required: true },
    { id: 'vibration', type: 'boolean', label: 'Do you feel vibration while braking?', required: true },
    { id: 'brake_warning', type: 'boolean', label: 'Is brake warning light ON?', required: false },
  ],
  ac: [
    { id: 'cooling', type: 'single_select', label: 'Cooling performance?', options: ['Normal', 'Low cooling', 'No cooling'], required: true },
    { id: 'cooling_delay', type: 'boolean', label: 'Does cooling take too long?', required: true },
    { id: 'ac_noise', type: 'boolean', label: 'Any unusual noise from AC?', required: false },
    { id: 'odor', type: 'boolean', label: 'Any bad smell from AC?', required: false },
  ],
  tyre: [
    { id: 'puncture', type: 'boolean', label: 'Is it a puncture?', required: true },
    { id: 'air_loss', type: 'boolean', label: 'Is air leaking continuously?', required: true },
    { id: 'tyre_condition', type: 'single_select', label: 'Tyre condition?', options: ['Good', 'Worn out', 'Damaged'], required: true },
    { id: 'vehicle_stability', type: 'boolean', label: 'Is vehicle unstable while driving?', required: false },
  ],
  electrical: [
    { id: 'electrical_components', type: 'single_select', label: 'Which electrical item is failing?', options: ['Headlights', 'Power windows', 'Infotainment', 'Multiple items'], required: true },
    { id: 'failure_pattern', type: 'single_select', label: 'How does the failure occur?', options: ['Intermittent', 'Always off', 'Works after restart', 'Flickers'], required: true },
    { id: 'fuse_checked', type: 'boolean', label: 'Have you checked fuses recently?', required: false },
    { id: 'burn_smell', type: 'boolean', label: 'Any burnt smell near dashboard/controls?', required: false },
  ],
  other: [
    { id: 'symptom_pattern', type: 'text', label: 'What exact symptom do you notice most often?', required: true },
    { id: 'frequency', type: 'single_select', label: 'How often does this issue occur?', options: ['Always', 'Often', 'Sometimes'], required: true },
  ],
};

const CATEGORY_FALLBACKS = [
  { value: 'engine', label: 'Engine' },
  { value: 'battery', label: 'Battery' },
  { value: 'brake', label: 'Brake' },
  { value: 'ac', label: 'AC' },
  { value: 'electrical', label: 'Electrical' },
  { value: 'tyre', label: 'Tyre' },
  { value: 'other', label: 'Other' },
];

const CATEGORY_LABEL_MAP = Object.fromEntries(
  CATEGORY_FALLBACKS.map((item) => [item.value, item.label])
) as Record<string, string>;

function buildQuestionsFromCategories(categories: string[]) {
  return categories.flatMap((category) =>
    (CATEGORY_QUESTION_BANK[category] ?? CATEGORY_QUESTION_BANK.other ?? []).map((question) => ({
      ...question,
      id: `${category}__${question.id}`,
      baseId: question.id,
      category,
    }))
  );
}

function mapSeverity(value: string): Severity {
  const lower = value.toLowerCase();
  if (lower.includes('risky')) return 'risky';
  if (lower.includes('not') || lower.includes('working')) return 'not_starting';
  return 'can_drive';
}

function mapSinceWhen(value: string): SinceWhen {
  const lower = value.toLowerCase();
  if (lower.includes('week')) return 'weeks';
  if (lower.includes('few')) return 'few_days';
  return 'today';
}

function mapWhenHappens(value: string | undefined): WhenHappens | undefined {
  if (!value) return undefined;
  const lower = value.toLowerCase();
  if (lower.includes('brak')) return 'braking';
  if (lower.includes('driv')) return 'driving';
  if (lower.includes('idl')) return 'idling';
  return 'starting';
}

function inferSeverityFromAnswers(answers: Record<string, string>): Severity {
  const values = Object.values(answers).map((value) => value.toLowerCase());
  if (values.some((value) => value.includes('not working') || value.includes('not start') || value.includes('critical'))) {
    return 'not_starting';
  }
  if (values.some((value) => value.includes('risky') || value.includes('unsafe') || value.includes('danger'))) {
    return 'risky';
  }
  return mapSeverity(answers.severity ?? 'Can drive');
}

function severityToRiskLevel(severity: Severity): RiskLevel {
  if (severity === 'can_drive') return 'low';
  if (severity === 'risky') return 'medium';
  return 'high';
}

function resolveDiySteps(categoryValue: string): string[] {
  const category = categoryValue.toLowerCase();
  if (category === 'tyre') {
    return [
      'Inspect tyre sidewall and tread for cuts, nails, or visible damage.',
      'Check tyre pressure and inflate to the manufacturer-recommended PSI.',
      'If puncture is minor, use temporary repair kit and monitor pressure for 24 hours.',
      'Avoid high-speed driving until permanent repair or replacement is completed.',
    ];
  }
  if (category === 'battery') {
    return [
      'Check battery terminal tightness and remove visible corrosion safely.',
      'Measure voltage if available; recharge if low.',
      'Turn off all accessories and re-test vehicle start.',
      'If repeated no-start occurs, escalate to garage diagnosis.',
    ];
  }
  if (category === 'ac') {
    return [
      'Set AC to recirculation mode and verify blower speed levels.',
      'Check cabin filter condition and replace if clogged.',
      'Run AC for 10 minutes and observe cooling consistency.',
      'If no cooling persists, raise garage request for refrigerant/compressor checks.',
    ];
  }
  if (category === 'electrical') {
    return [
      'Check related fuse and relay for the failed electrical component.',
      'Inspect connector seating for loose plugs where accessible.',
      'Re-test after ignition restart.',
      'If failure is intermittent or repeated, escalate to garage electrical diagnosis.',
    ];
  }
  if (category === 'engine' || category === 'brake') {
    return [];
  }
  return [
    'Perform a visual check for loose parts, leaks, or unusual sounds.',
    'Reproduce the issue in a safe environment and note exact trigger conditions.',
    'Avoid hard driving until symptom stability is confirmed.',
    'Raise issue to garage if symptom repeats or worsens.',
  ];
}

function inferSinceWhenFromAnswers(answers: Record<string, string>): SinceWhen {
  if (answers.since_when) return mapSinceWhen(answers.since_when);
  const match = Object.values(answers).find((value) => {
    const lower = value.toLowerCase();
    return lower.includes('today') || lower.includes('few day') || lower.includes('week');
  });
  return mapSinceWhen(match ?? 'Today');
}

function getWhenOccursAnswer(answers: Record<string, string>) {
  if (answers.when_occurs) return answers.when_occurs;
  const match = Object.entries(answers).find(([key]) =>
    key.toLowerCase().includes('when') ||
    key.toLowerCase().includes('occur') ||
    key.toLowerCase().includes('happen')
  );
  return match?.[1];
}

function fuelLabel(value: string) {
  const normalized = value.trim().toLowerCase();
  return normalized || 'petrol';
}

function formatDateTimeLocal(date: Date) {
  const pad = (value: number) => String(value).padStart(2, '0');
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export function ServiceIntakeFlow({
  mode,
  sidebar,
  content,
}: {
  mode: IntakeMode;
  sidebar: UserSidebarContent;
  content: UserServiceIntakeContent;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [vehicles, setVehicles] = useState<UserVehicle[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [manualVehicle, setManualVehicle] = useState({
    type: 'car' as 'car' | 'bike' | 'other',
    brand: '',
    model: '',
    year: String(new Date().getFullYear()),
    fuel: 'petrol',
    variant: '',
  });
  const [useManualVehicle, setUseManualVehicle] = useState(false);

  const categoryOptions = useMemo(
    () => CATEGORY_FALLBACKS,
    []
  );

  const [problem, setProblem] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    categoryOptions[0]?.value ? [categoryOptions[0].value] : ['engine']
  );
  const [dynamicQuestions, setDynamicQuestions] = useState<DiagnosisQuestion[]>([]);
  const [dynamicQuestionsLoading, setDynamicQuestionsLoading] = useState(false);
  const [questionAnswers, setQuestionAnswers] = useState<Record<string, string>>({});
  const [questionPopupOpen, setQuestionPopupOpen] = useState(false);
  const [logisticsPopupOpen, setLogisticsPopupOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatCurrentIndex, setChatCurrentIndex] = useState<number | null>(null);
  const [chatAwaitingCategory, setChatAwaitingCategory] = useState(false);
  const [chatTextAnswer, setChatTextAnswer] = useState('');
  const [chatThinking, setChatThinking] = useState(false);
  const [diagnosisReport, setDiagnosisReport] = useState<{
    riskLevel: RiskLevel;
    severity: Severity;
    diyEligible: boolean;
    summary: string;
    recommendation: string;
    diySteps: string[];
  } | null>(null);

  const [address, setAddress] = useState('');
  const [pickup, setPickup] = useState(false);
  const [scheduleMode, setScheduleMode] = useState<'now' | 'scheduled'>('now');
  const [preferredAt, setPreferredAt] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [alternatePhone, setAlternatePhone] = useState('');
  const [lat, setLat] = useState<number | undefined>();
  const [lng, setLng] = useState<number | undefined>();
  const [media, setMedia] = useState<Array<{ type: 'image' | 'video' | 'audio'; name: string }>>([]);
  const chatTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasAutoStartedRef = useRef(false);
  const CHAT_REPLY_DELAY_MS = 260;
  const minimumScheduleTime = useMemo(() => formatDateTimeLocal(new Date()), []);

  const scheduleValidationError = useMemo(() => {
    if (scheduleMode !== 'scheduled') return null;
    if (!preferredAt) return null;
    const parsed = new Date(preferredAt);
    if (Number.isNaN(parsed.getTime())) return content.errors.invalidDateTime;
    if (parsed.getTime() < Date.now()) return content.errors.pastTime;
    return null;
  }, [content.errors.invalidDateTime, content.errors.pastTime, preferredAt, scheduleMode]);

  useEffect(() => {
    const issueFromQuery = searchParams.get('issue');
    const vehicleIdFromQuery = searchParams.get('vehicleId');
    if (issueFromQuery && issueFromQuery.trim()) {
      setProblem(issueFromQuery.trim());
    }
    if (vehicleIdFromQuery && vehicleIdFromQuery.trim()) {
      setSelectedVehicleId(vehicleIdFromQuery.trim());
    }
  }, [searchParams]);

  useEffect(() => {
    const shouldAutoStart = searchParams.get('startDiagnosis') === '1';
    if (!shouldAutoStart || hasAutoStartedRef.current) return;
    if (loading) return;
    if (!problem.trim() || !selectedVehicleId.trim()) return;
    hasAutoStartedRef.current = true;
    void handleIssueSubmit();
  }, [loading, problem, searchParams, selectedVehicleId]);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const [v, p] = await Promise.all([fetchUserVehicles(), fetchUserProfile()]);
        if (!active) return;
        setVehicles(v);
        setSelectedVehicleId(v.find((item) => item.isDefault)?.id ?? v[0]?.id ?? '');
        const selected = v.find((item) => item.isDefault) ?? v[0];
        if (selected) {
          setManualVehicle((prev) => ({
            ...prev,
            brand: selected.make,
            model: selected.model,
            year: String(selected.year),
            fuel: selected.fuelType,
            variant: selected.trim ?? '',
          }));
        }
        setName(p.fullName ?? '');
        setPhone(p.phone ?? '');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    // Do not reset flow state while user is inside chat/logistics popups.
    // Category selection in chat updates selectedCategories and should not close the dialog.
    if (questionPopupOpen || logisticsPopupOpen || chatAwaitingCategory || chatCurrentIndex !== null) {
      return;
    }
    setDynamicQuestions([]);
    setQuestionAnswers({});
    setDiagnosisReport(null);
    setChatMessages([]);
    setChatCurrentIndex(null);
    setChatAwaitingCategory(false);
    setChatTextAnswer('');
    setChatThinking(false);
    setQuestionPopupOpen(false);
    setLogisticsPopupOpen(false);
  }, [
    problem,
    selectedCategories,
    questionPopupOpen,
    logisticsPopupOpen,
    chatAwaitingCategory,
    chatCurrentIndex,
  ]);

  useEffect(() => {
    return () => {
      if (chatTimerRef.current) {
        clearTimeout(chatTimerRef.current);
      }
    };
  }, []);

  async function ensureDynamicQuestions(): Promise<DiagnosisQuestion[] | null> {
    if (dynamicQuestions.length > 0) return dynamicQuestions;
    if (selectedCategories.length === 0) {
      setError('Select at least one issue category first.');
      return null;
    }

    try {
      setDynamicQuestionsLoading(true);
      setError(null);
      const generated = buildQuestionsFromCategories(selectedCategories);
      setDynamicQuestions(generated);
      return generated;
    } catch {
      setError('Failed to load category questions.');
      return null;
    } finally {
      setDynamicQuestionsLoading(false);
    }
  }

  function onMediaChange(event: React.ChangeEvent<HTMLInputElement>) {
    const nextFiles = Array.from(event.target.files ?? []).map((file) => ({
      name: file.name,
      type: file.type.startsWith('image')
        ? 'image'
        : file.type.startsWith('video')
          ? 'video'
          : 'audio',
    })) as Array<{ type: 'image' | 'video' | 'audio'; name: string }>;
    setMedia((prev) => [...prev, ...nextFiles]);
  }

  function askGeo() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((pos) => {
      setLat(pos.coords.latitude);
      setLng(pos.coords.longitude);
    });
  }

  function answerQuestion(id: string, value: string) {
    setDiagnosisReport(null);
    setQuestionAnswers((prev) => ({ ...prev, [id]: value }));
  }

  function askChatQuestion(question: DiagnosisQuestion) {
    const prompt = question.required ? `${question.label} *` : question.label;
    setChatMessages((prev) => [
      ...prev,
      { id: `bot-${question.id}-${Date.now()}`, sender: 'bot', text: prompt },
    ]);
  }

  function startQuestionChat() {
    if (chatTimerRef.current) {
      clearTimeout(chatTimerRef.current);
    }
    setDynamicQuestions([]);
    setQuestionAnswers({});
    setChatMessages([
      {
        id: `bot-intro-${Date.now()}`,
        sender: 'bot',
        text: 'Thanks. Let us do a quick guided assessment. Please answer one question at a time.',
      },
      {
        id: `bot-category-${Date.now() + 1}`,
        sender: 'bot',
        text: 'What is the issue about?',
      },
    ]);
    setChatAwaitingCategory(true);
    setChatCurrentIndex(null);
    setChatTextAnswer('');
    setChatThinking(false);
  }

  function submitCategorySelection(categoryValue: string) {
    const label = CATEGORY_LABEL_MAP[categoryValue] ?? categoryValue;
    const generated = buildQuestionsFromCategories([categoryValue]);
    if (generated.length === 0) {
      setError('No questions found for selected category.');
      return;
    }

    setSelectedCategories([categoryValue]);
    setDynamicQuestions(generated);
    setQuestionAnswers({});
    setChatMessages((prev) => [
      ...prev,
      { id: `user-category-${Date.now()}`, sender: 'user', text: label },
    ]);
    setChatAwaitingCategory(false);
    setChatCurrentIndex(0);
    setChatThinking(true);
    chatTimerRef.current = setTimeout(() => {
      askChatQuestion(generated[0]);
      setChatThinking(false);
    }, CHAT_REPLY_DELAY_MS);
  }

  function advanceChat(fromIndex: number) {
    if (chatTimerRef.current) {
      clearTimeout(chatTimerRef.current);
    }
    const nextIndex = fromIndex + 1;
    if (nextIndex >= dynamicQuestions.length) {
      setChatCurrentIndex(null);
      setChatThinking(true);
      chatTimerRef.current = setTimeout(() => {
        setChatMessages((prev) => [
          ...prev,
          {
            id: `bot-done-${Date.now()}`,
            sender: 'bot',
            text: 'All required follow-up questions are captured. You can now generate report or raise issue.',
          },
        ]);
        setChatThinking(false);
      }, CHAT_REPLY_DELAY_MS);
      return;
    }
    setChatCurrentIndex(nextIndex);
    setChatThinking(true);
    chatTimerRef.current = setTimeout(() => {
      askChatQuestion(dynamicQuestions[nextIndex]);
      setChatThinking(false);
    }, CHAT_REPLY_DELAY_MS);
  }

  function submitChatAnswer(answerValue: string) {
    if (chatCurrentIndex === null) return;
    const question = dynamicQuestions[chatCurrentIndex];
    const normalizedAnswer = answerValue.trim();
    if (!normalizedAnswer) return;
    answerQuestion(question.id, normalizedAnswer);
    setChatMessages((prev) => [
      ...prev,
      { id: `user-${question.id}-${Date.now()}`, sender: 'user', text: normalizedAnswer },
    ]);
    setChatTextAnswer('');
    advanceChat(chatCurrentIndex);
  }

  async function handleIssueSubmit() {
    setError(null);
    if (!problem.trim()) {
      setError('Please type your issue before starting assessment.');
      return;
    }
    if (mode !== 'diagnosis' && selectedCategories.length === 0) {
      setError('Please select at least one issue category first.');
      return;
    }
    const selected = vehicles.find((item) => item.id === selectedVehicleId);
    if (!selected && !useManualVehicle) {
      setError('Please select a vehicle first.');
      return;
    }
    if (mode !== 'diagnosis') {
      const questions = await ensureDynamicQuestions();
      if (!questions) return;
    }
    setLogisticsPopupOpen(false);
    setQuestionPopupOpen(true);
    if (mode === 'diagnosis') {
      startQuestionChat();
    }
  }

  function proceedToLogisticsStep() {
    if (chatAwaitingCategory || chatCurrentIndex !== null) {
      setError('Please complete all chat questions first.');
      return;
    }
    for (const question of requiredQuestions) {
      const value = questionAnswers[question.id];
      if (!value || !value.trim()) {
        setError(`Please answer: ${question.label}`);
        return;
      }
    }
    setError(null);
    setQuestionPopupOpen(false);
    setLogisticsPopupOpen(true);
  }

  async function buildPayload() {
    const questions = await ensureDynamicQuestions();
    if (!questions) throw new Error('Unable to load follow-up questions.');

    for (const question of questions) {
      if (question.required && !questionAnswers[question.id]) {
        throw new Error(`Please answer: ${question.label}`);
      }
    }

    const selected = vehicles.find((item) => item.id === selectedVehicleId);
    if (!selected && !useManualVehicle) throw new Error('Vehicle not selected');
    if (
      useManualVehicle &&
      (!manualVehicle.brand.trim() || !manualVehicle.model.trim() || !manualVehicle.year.trim())
    ) {
      throw new Error('Enter vehicle details.');
    }
    if (!address.trim()) throw new Error('Enter address.');
    if (scheduleMode === 'scheduled' && !preferredAt) throw new Error('Choose preferred time.');
    if (scheduleValidationError) throw new Error(scheduleValidationError);
    if (!name.trim() || !phone.trim()) throw new Error('Contact name and phone are required.');

    const selectedSeverity = inferSeverityFromAnswers(questionAnswers);
    const selectedSince = inferSinceWhenFromAnswers(questionAnswers);
    const selectedWhen = mapWhenHappens(getWhenOccursAnswer(questionAnswers));

    const categorySymptoms = questions
      .map((q) =>
        questionAnswers[q.id]
          ? `${q.category ?? 'other'}:${q.baseId ?? q.id}:${questionAnswers[q.id]}`
          : ''
      )
      .filter(Boolean);
    const primaryCategory = selectedCategories[0] ?? 'other';

    const payload: ServiceIntakePayload = {
      source: mode,
      vehicle:
        useManualVehicle || !selected
          ? {
              type: manualVehicle.type,
              brand: manualVehicle.brand.trim(),
              model: manualVehicle.model.trim(),
              year: Number(manualVehicle.year),
              fuel: fuelLabel(manualVehicle.fuel),
              variant: manualVehicle.variant.trim() || undefined,
            }
          : {
              id: selected.id,
              type: 'car',
              brand: selected.make,
              model: selected.model,
              year: selected.year,
              fuel: selected.fuelType.toLowerCase(),
              variant: selected.trim ?? undefined,
            },
      issue: {
        category: primaryCategory,
        symptoms: categorySymptoms,
        severity: selectedSeverity,
        description: problem.trim() || undefined,
        sinceWhen: selectedSince,
        whenHappens: selectedWhen,
        answers: {
          ...questionAnswers,
          __selected_categories: selectedCategories.join(','),
          __primary_category: primaryCategory,
        },
      },
      media,
      location: { lat, lng, address: address.trim() },
      serviceType: pickup ? 'pickup' : 'visit',
      schedule: {
        mode: scheduleMode,
        preferredAt: scheduleMode === 'scheduled' ? preferredAt : undefined,
      },
      user: {
        name: name.trim(),
        phone: phone.trim(),
        alternatePhone: alternatePhone.trim() || undefined,
      },
    };

    return { payload, selectedSeverity };
  }

  async function generateDiagnosisReport() {
    try {
      setSubmitting(true);
      setError(null);
      const { payload, selectedSeverity } = await buildPayload();
      const riskLevel = severityToRiskLevel(selectedSeverity);
      const lowRisk = riskLevel === 'low';
      const steps = lowRisk
        ? Array.from(new Set(selectedCategories.flatMap((item) => resolveDiySteps(item))))
        : [];
      const summary = problem.trim()
        ? problem.trim()
        : `${selectedCategories.map((item) => item.toUpperCase()).join(', ')} issue reported from guided answers.`;
      const recommendation = lowRisk
        ? 'Low-risk issue detected. You can try DIY steps first.'
        : 'DIY is not recommended for this risk level. Raise issue to garage for safe handling.';

      setDiagnosisReport({
        riskLevel,
        severity: selectedSeverity,
        diyEligible: lowRisk,
        summary,
        recommendation,
        diySteps: steps,
      });
      const { issueId } = await submitServiceIntake(payload);
      setQuestionPopupOpen(false);
      router.push(`/user/quotes-bookings/${issueId}`);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Failed to generate diagnosis report.');
    } finally {
      setSubmitting(false);
    }
  }

  async function submitIssueToGarage() {
    try {
      setSubmitting(true);
      setError(null);
      const { payload } = await buildPayload();
      const { issueId } = await submitServiceIntake(payload);
      await raiseIssueToGarageApi(issueId);
      setQuestionPopupOpen(false);
      setLogisticsPopupOpen(false);
      router.push(`/user/quotes-bookings/${issueId}`);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Failed to submit request.');
    } finally {
      setSubmitting(false);
    }
  }

  const selectedVehicleLabel = useMemo(() => {
    if (useManualVehicle) {
      return `${manualVehicle.year} ${manualVehicle.brand} ${manualVehicle.model}`.trim() || 'Manual vehicle';
    }
    const selected = vehicles.find((vehicle) => vehicle.id === selectedVehicleId);
    if (!selected) return 'Not selected';
    return `${selected.year} ${selected.make} ${selected.model}`;
  }, [manualVehicle, selectedVehicleId, useManualVehicle, vehicles]);
  const requiredQuestions = useMemo(
    () => dynamicQuestions.filter((question) => question.required),
    [dynamicQuestions]
  );
  const answeredRequiredQuestions = useMemo(
    () =>
      requiredQuestions.filter((question) => {
        const value = questionAnswers[question.id];
        return typeof value === 'string' && value.trim().length > 0;
      }).length,
    [questionAnswers, requiredQuestions]
  );

  return (
    <UserThemeShell activeItem="ai-diagnosis" sidebar={sidebar}>
      <section className="overflow-y-auto">
        <div className="mx-auto max-w-7xl p-4 sm:p-6 md:p-8">
          <Card className="mt-2 overflow-hidden rounded-2xl border-[#d9e2ef] bg-white shadow-[0_8px_20px_rgba(94,126,179,0.10)]">
            <CardHeader className="border-b border-[#e7edf5] bg-[linear-gradient(135deg,#f8fbff_0%,#f3f8ff_100%)] p-5 sm:p-7">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <CardTitle className="text-xl font-bold text-slate-900 sm:text-2xl md:text-3xl">
                    {mode === 'diagnosis' ? content.header.diagnosisTitle : content.header.directTitle}
                  </CardTitle>
                  <p className="mt-1 text-xs text-slate-500 sm:text-sm">
                    {content.header.description}
                  </p>
                </div>
                <Badge variant="outline" className="w-fit border-[#b5c7e5] bg-white text-[#1f3f70]">
                  <Sparkles className="mr-1 h-3 w-3 sm:h-3.5 sm:w-3.5" />
                  {dynamicQuestions.length > 0
                    ? `${dynamicQuestions.length} ${content.header.badgeQuestionsSuffix}`
                    : content.header.badgeDefault}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-5 sm:space-y-7 p-5 sm:p-7">
              {loading ? <p className="text-sm text-slate-500">{content.labels.loading}</p> : null}

              {!loading ? (
                <SectionCard icon={Wrench} title={content.sections.categoriesTitle} subtitle={content.sections.categoriesSubtitle}>
                  <div className="rounded-xl border border-[#dbe5f3] bg-[#fbfdff] p-4">
                    <p className="mb-3 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                      Select Vehicle First
                    </p>
                    <div className="flex flex-wrap gap-2.5">
                      <Button type="button" variant={!useManualVehicle ? 'default' : 'outline'} onClick={() => setUseManualVehicle(false)}>
                        {content.labels.useSaved}
                      </Button>
                      <Button type="button" variant={useManualVehicle ? 'default' : 'outline'} onClick={() => setUseManualVehicle(true)}>
                        {content.labels.manual}
                      </Button>
                    </div>

                    {!useManualVehicle ? (
                      <select
                        value={selectedVehicleId}
                        onChange={(e) => setSelectedVehicleId(e.target.value)}
                        className="mt-3 h-11 w-full rounded-xl border border-[#d6e1ee] bg-white px-3 text-sm"
                      >
                        <option value="">{content.labels.selectVehicle}</option>
                        {vehicles.map((vehicle) => (
                          <option key={vehicle.id} value={vehicle.id}>
                            {vehicle.year} {vehicle.make} {vehicle.model}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
                        <select
                          value={manualVehicle.type}
                          onChange={(e) =>
                            setManualVehicle((prev) => ({
                              ...prev,
                              type: e.target.value as 'car' | 'bike' | 'other',
                            }))
                          }
                          className="h-11 rounded-xl border border-[#d6e1ee] px-3 text-sm"
                        >
                          <option value="car">{content.labels.car}</option>
                          <option value="bike">{content.labels.bike}</option>
                          <option value="other">{content.labels.other}</option>
                        </select>
                        <Input value={manualVehicle.brand} onChange={(e) => setManualVehicle((prev) => ({ ...prev, brand: e.target.value }))} placeholder={content.placeholders.brand} />
                        <Input value={manualVehicle.model} onChange={(e) => setManualVehicle((prev) => ({ ...prev, model: e.target.value }))} placeholder={content.placeholders.model} />
                        <Input value={manualVehicle.year} onChange={(e) => setManualVehicle((prev) => ({ ...prev, year: e.target.value }))} placeholder={content.placeholders.year} />
                        <Input value={manualVehicle.fuel} onChange={(e) => setManualVehicle((prev) => ({ ...prev, fuel: e.target.value }))} placeholder={content.placeholders.fuelType} />
                        <Input value={manualVehicle.variant} onChange={(e) => setManualVehicle((prev) => ({ ...prev, variant: e.target.value }))} placeholder={content.placeholders.variantOptional} />
                      </div>
                    )}
                  </div>
                  <div className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Issue Categories</p>
                  <MultiOptionChips
                    values={categoryOptions}
                    valuesSelected={selectedCategories}
                    onToggle={(value) =>
                      setSelectedCategories((prev) =>
                        prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]
                      )
                    }
                  />
                  </div>
                  <textarea
                    value={problem}
                    onChange={(e) => setProblem(e.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' && !event.shiftKey) {
                        event.preventDefault();
                        void handleIssueSubmit();
                      }
                    }}
                    className="min-h-28 w-full rounded-xl border border-[#d6e1ee] bg-white p-3.5 text-sm leading-6 sm:min-h-32"
                    placeholder={content.placeholders.shortDescription}
                  />
                  <div className="mt-1 flex flex-col gap-2.5 border-t border-[#e8eef7] pt-3 sm:flex-row sm:flex-wrap sm:items-center">
                    <Badge variant="outline" className="w-fit border-[#cddaf0] text-[#335889]">
                      {content.labels.selectedCategories}:{' '}
                      {selectedCategories.length > 0
                        ? selectedCategories.map((item) => item.toUpperCase()).join(', ')
                        : content.labels.none}
                    </Badge>
                    <Button
                      type="button"
                      onClick={() => void handleIssueSubmit()}
                      disabled={dynamicQuestionsLoading || selectedCategories.length === 0}
                      className="w-full px-5 sm:w-auto"
                    >
                      {dynamicQuestionsLoading ? content.labels.loadingQuestions : content.labels.continue}
                    </Button>
                  </div>
                </SectionCard>
              ) : null}

              {error ? <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p> : null}
            </CardContent>
          </Card>

          <Dialog open={questionPopupOpen} onOpenChange={setQuestionPopupOpen}>
            <DialogContent className="max-h-[92vh] max-w-[1100px] overflow-y-auto rounded-xl border-[#d9e2ef] bg-white p-0 shadow-[0_20px_52px_rgba(33,61,105,0.24)]">
              <DialogHeader className="sticky top-0 z-20 border-b border-[#e5edf8] bg-white/95 px-4 py-4 backdrop-blur-sm sm:px-6">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <DialogTitle className="flex items-center gap-2 text-[23px] font-semibold text-slate-900">
                      <Sparkles className="h-4 w-4 text-[#2f6ac6] sm:h-5 sm:w-5" />
                      Wrectfai Chat Bot
                    </DialogTitle>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                    onClick={() => setQuestionPopupOpen(false)}
                    aria-label="Close smart intake questions popup"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </DialogHeader>
              <div className="space-y-4 px-4 py-4 sm:px-6 sm:py-5">
              {chatAwaitingCategory || dynamicQuestions.length > 0 ? (
                mode === 'diagnosis' ? (
                  <div className="rounded-xl border border-[#dbe5f3] bg-[#f8fbff] p-3">
                      <div className="max-h-[320px] space-y-2 overflow-y-auto pr-1">
                        {chatMessages.map((message) => (
                          <div
                            key={message.id}
                            className={cn(
                              'max-w-[90%] rounded-2xl px-3 py-2 text-sm',
                              message.sender === 'bot'
                                ? 'bg-white text-slate-800 border border-[#dbe5f3]'
                                : 'ml-auto bg-[#1d7ff2] text-white'
                            )}
                          >
                            {message.text}
                          </div>
                        ))}
                        {chatThinking ? (
                          <div className="max-w-[90%] rounded-2xl border border-[#dbe5f3] bg-white px-3 py-2 text-xs text-slate-500">
                            Typing...
                          </div>
                        ) : null}
                      </div>

                      {chatAwaitingCategory ? (
                        <div className="mt-3 rounded-xl border border-[#dbe5f3] bg-white p-3">
                          <div className="mb-2 flex items-center justify-between">
                            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                              Current Question
                            </p>
                            <Badge variant="outline" className="border-[#d3deef] bg-[#f7fbff] text-[10px] font-medium uppercase text-[#45628b]">
                              Category
                            </Badge>
                          </div>
                          <OptionChips
                            values={categoryOptions.map((option) => ({
                              value: option.value,
                              label: option.label,
                            }))}
                            value={selectedCategories[0] ?? ''}
                            onPick={submitCategorySelection}
                          />
                        </div>
                      ) : chatCurrentIndex !== null ? (
                        <div className="mt-3 rounded-xl border border-[#dbe5f3] bg-white p-3">
                          <div className="mb-2 flex items-center justify-between">
                            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                              Current Question
                            </p>
                            <Badge variant="outline" className="border-[#d3deef] bg-[#f7fbff] text-[10px] font-medium uppercase text-[#45628b]">
                              {dynamicQuestions[chatCurrentIndex]?.category}
                            </Badge>
                          </div>
                          {dynamicQuestions[chatCurrentIndex]?.type === 'text' ? (
                            <div className="flex gap-2">
                              <Input
                                value={chatTextAnswer}
                                onChange={(e) => setChatTextAnswer(e.target.value)}
                                placeholder={content.placeholders.answer}
                                onKeyDown={(event) => {
                                  if (event.key === 'Enter') {
                                    event.preventDefault();
                                    submitChatAnswer(chatTextAnswer);
                                  }
                                }}
                              />
                              <Button type="button" onClick={() => submitChatAnswer(chatTextAnswer)} disabled={!chatTextAnswer.trim() || chatThinking}>
                                Send
                              </Button>
                            </div>
                          ) : (
                            <OptionChips
                              values={
                                dynamicQuestions[chatCurrentIndex]?.type === 'boolean'
                                  ? [
                                      { value: 'yes', label: 'Yes' },
                                      { value: 'no', label: 'No' },
                                    ]
                                  : (dynamicQuestions[chatCurrentIndex]?.options ?? []).map((option) => ({
                                      value: option,
                                      label: option,
                                    }))
                              }
                              value={questionAnswers[dynamicQuestions[chatCurrentIndex]?.id ?? ''] ?? ''}
                              onPick={(value) => submitChatAnswer(value)}
                            />
                          )}
                        </div>
                      ) : (
                        <p className="mt-3 text-sm text-emerald-700">All questions answered.</p>
                      )}
                  </div>
                ) : (
                  <SectionCard icon={ClipboardList} title={content.sections.questionsTitle} subtitle={content.sections.questionsSubtitle}>
                    <div className="grid gap-3 md:grid-cols-2">
                      {dynamicQuestions.map((question) => (
                        <div key={question.id} className="rounded-xl border border-[#dbe5f3] bg-white p-3 shadow-[0_4px_12px_rgba(94,126,179,0.08)]">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-[16px] font-medium text-slate-900">
                              {question.label} {question.required ? <span className="text-red-500">*</span> : null}
                            </p>
                            <Badge variant="outline" className="border-[#d3deef] bg-[#f7fbff] text-[10px] font-medium uppercase text-[#45628b]">
                              {question.category}
                            </Badge>
                          </div>
                          <div className="mt-2">
                            <QuestionInput
                              question={question}
                              value={questionAnswers[question.id] ?? ''}
                              onChange={(value) => answerQuestion(question.id, value)}
                              textPlaceholder={content.placeholders.answer}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </SectionCard>
                )
              ) : null}

              {mode !== 'diagnosis' ? (
                <>
                  <div className="grid gap-6 lg:grid-cols-2">
                    <SectionCard icon={Upload} title={content.sections.evidenceTitle} subtitle={content.sections.evidenceSubtitle}>
                      <input type="file" multiple accept="image/*,video/*,audio/*" onChange={onMediaChange} />
                      {media.length > 0 ? (
                        <ul className="mt-2 list-inside list-disc text-xs text-slate-600">
                          {media.slice(0, 5).map((file, index) => (
                            <li key={`${file.name}-${index}`}>{file.name}</li>
                          ))}
                        </ul>
                      ) : null}
                    </SectionCard>

                    <SectionCard icon={Car} title={content.sections.vehicleTitle} subtitle={content.sections.vehicleSubtitle}>
                      <div className="flex gap-2">
                        <Button type="button" variant={!useManualVehicle ? 'default' : 'outline'} onClick={() => setUseManualVehicle(false)}>
                          {content.labels.useSaved}
                        </Button>
                        <Button type="button" variant={useManualVehicle ? 'default' : 'outline'} onClick={() => setUseManualVehicle(true)}>
                          {content.labels.manual}
                        </Button>
                      </div>

                      {!useManualVehicle ? (
                        <select
                          value={selectedVehicleId}
                          onChange={(e) => setSelectedVehicleId(e.target.value)}
                          className="mt-2 h-11 w-full rounded-xl border border-[#d6e1ee] px-3 text-sm"
                        >
                          <option value="">{content.labels.selectVehicle}</option>
                          {vehicles.map((vehicle) => (
                            <option key={vehicle.id} value={vehicle.id}>
                              {vehicle.year} {vehicle.make} {vehicle.model}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <div className="mt-2 grid gap-2 sm:grid-cols-2">
                          <select
                            value={manualVehicle.type}
                            onChange={(e) =>
                              setManualVehicle((prev) => ({
                                ...prev,
                                type: e.target.value as 'car' | 'bike' | 'other',
                              }))
                            }
                            className="h-11 rounded-xl border border-[#d6e1ee] px-3 text-sm"
                          >
                            <option value="car">{content.labels.car}</option>
                            <option value="bike">{content.labels.bike}</option>
                            <option value="other">{content.labels.other}</option>
                          </select>
                          <Input value={manualVehicle.brand} onChange={(e) => setManualVehicle((prev) => ({ ...prev, brand: e.target.value }))} placeholder={content.placeholders.brand} />
                          <Input value={manualVehicle.model} onChange={(e) => setManualVehicle((prev) => ({ ...prev, model: e.target.value }))} placeholder={content.placeholders.model} />
                          <Input value={manualVehicle.year} onChange={(e) => setManualVehicle((prev) => ({ ...prev, year: e.target.value }))} placeholder={content.placeholders.year} />
                          <Input value={manualVehicle.fuel} onChange={(e) => setManualVehicle((prev) => ({ ...prev, fuel: e.target.value }))} placeholder={content.placeholders.fuelType} />
                          <Input value={manualVehicle.variant} onChange={(e) => setManualVehicle((prev) => ({ ...prev, variant: e.target.value }))} placeholder={content.placeholders.variantOptional} />
                        </div>
                      )}
                    </SectionCard>
                  </div>

                  <div className="grid gap-6 lg:grid-cols-2">
                    <SectionCard icon={MapPin} title={content.sections.logisticsTitle} subtitle={content.sections.logisticsSubtitle}>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Button type="button" variant="outline" onClick={askGeo}>{content.labels.useGps}</Button>
                          {lat && lng ? <Badge variant="outline">{lat.toFixed(4)}, {lng.toFixed(4)}</Badge> : null}
                        </div>
                        <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder={content.placeholders.serviceAddress} />

                        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{content.labels.pickupRequired}</p>
                        <OptionChips
                          values={[
                            { value: 'no', label: content.labels.visitGarage },
                            { value: 'yes', label: content.labels.needPickup },
                          ]}
                          value={pickup ? 'yes' : 'no'}
                          onPick={(value) => setPickup(value === 'yes')}
                        />

                        <div className="rounded-xl border border-[#dbe5f3] bg-[#fbfdff] p-3">
                          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{content.labels.schedule}</p>
                          <div className="mt-2">
                            <OptionChips
                              values={[
                                { value: 'now', label: content.labels.nowEmergency },
                                { value: 'scheduled', label: content.labels.scheduleTime },
                              ]}
                              value={scheduleMode}
                              onPick={(value) => setScheduleMode(value as 'now' | 'scheduled')}
                            />
                            {scheduleMode === 'scheduled' ? (
                              <>
                                <Input
                                  className="mt-2"
                                  type="datetime-local"
                                  min={minimumScheduleTime}
                                  value={preferredAt}
                                  onChange={(e) => setPreferredAt(e.target.value)}
                                />
                                {scheduleValidationError ? (
                                  <p className="mt-1 text-xs text-red-600">{scheduleValidationError}</p>
                                ) : null}
                              </>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    </SectionCard>

                    <SectionCard icon={Phone} title={content.sections.contactTitle} subtitle={content.sections.contactSubtitle}>
                      <div className="space-y-2">
                        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={content.placeholders.name} />
                        <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder={content.placeholders.phone} />
                        <Input value={alternatePhone} onChange={(e) => setAlternatePhone(e.target.value)} placeholder={content.placeholders.alternatePhoneOptional} />
                      </div>

                      <div className="mt-3 rounded-xl border border-[#dbe5f3] bg-[#fbfdff] p-3 text-sm">
                        <p><span className="font-semibold text-slate-900">{content.labels.vehicleLabel}</span> {selectedVehicleLabel}</p>
                        <p className="mt-1"><span className="font-semibold text-slate-900">{content.labels.serviceTypeLabel}</span> {pickup ? content.labels.pickupRequiredValue : content.labels.visitGarageValue}</p>
                        <p className="mt-1"><span className="font-semibold text-slate-900">{content.labels.scheduleLabel}</span> {scheduleMode === 'scheduled' ? preferredAt || content.labels.scheduledValue : content.labels.nowValue}</p>
                        <p className="mt-1"><span className="font-semibold text-slate-900">{content.labels.questionsAnsweredLabel}</span> {Object.keys(questionAnswers).length}</p>
                      </div>
                    </SectionCard>
                  </div>
                </>
              ) : null}

              {mode !== 'diagnosis' && diagnosisReport ? (
                <SectionCard icon={Sparkles} title={content.sections.reportTitle} subtitle={content.sections.reportSubtitle}>
                  <div className="rounded-xl border border-[#dbe5f3] bg-[#fbfdff] p-3 text-sm">
                    <p>
                      <span className="font-semibold text-slate-900">{content.labels.riskLevelLabel}</span>{' '}
                      <span className={
                        diagnosisReport.riskLevel === 'low'
                          ? 'text-emerald-700'
                          : diagnosisReport.riskLevel === 'medium'
                            ? 'text-amber-700'
                            : 'text-red-700'
                      }>
                        {diagnosisReport.riskLevel.toUpperCase()}
                      </span>
                    </p>
                    <p className="mt-1">
                      <span className="font-semibold text-slate-900">{content.labels.severityLabel}</span> {diagnosisReport.severity}
                    </p>
                    <p className="mt-1">
                      <span className="font-semibold text-slate-900">{content.labels.summaryLabel}</span> {diagnosisReport.summary}
                    </p>
                    <p className="mt-1">
                      <span className="font-semibold text-slate-900">{content.labels.recommendationLabel}</span> {diagnosisReport.recommendation}
                    </p>
                  </div>

                  {diagnosisReport.diyEligible && diagnosisReport.diySteps.length > 0 ? (
                    <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                      <p className="text-sm font-semibold text-emerald-800">{content.labels.diyStepsTitle}</p>
                      <ul className="mt-2 list-inside list-disc text-sm text-emerald-900">
                        {diagnosisReport.diySteps.map((step, index) => (
                          <li key={`${step}-${index}`}>{step}</li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                      {content.labels.diyBlocked}
                    </div>
                  )}
                </SectionCard>
              ) : null}

              {error ? <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p> : null}

              <div className="flex justify-end gap-2 border-t border-[#e7edf5] pt-4">
                <div className="flex flex-wrap items-center gap-2">
                  {mode !== 'diagnosis' ? (
                    <Button type="button" variant="outline" onClick={generateDiagnosisReport} disabled={submitting || dynamicQuestionsLoading}>
                      {submitting ? content.labels.generating : content.labels.generateReport}
                    </Button>
                  ) : null}
                  {mode === 'diagnosis' ? (
                    <Button
                      type="button"
                      onClick={proceedToLogisticsStep}
                      disabled={chatCurrentIndex !== null || dynamicQuestionsLoading || submitting}
                    >
                      Continue
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      onClick={submitIssueToGarage}
                      disabled={submitting || dynamicQuestionsLoading}
                    >
                      {submitting ? content.labels.submitting : content.labels.raiseIssue}
                    </Button>
                  )}
                </div>
              </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={logisticsPopupOpen} onOpenChange={setLogisticsPopupOpen}>
            <DialogContent className="max-h-[92vh] max-w-[760px] overflow-y-auto rounded-xl border-[#d9e2ef] bg-white p-0 shadow-[0_20px_52px_rgba(33,61,105,0.24)]">
              <DialogHeader className="sticky top-0 z-20 border-b border-[#e5edf8] bg-white/95 px-4 py-4 backdrop-blur-sm sm:px-6">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <DialogTitle className="flex items-center gap-2 text-[23px] font-semibold text-slate-900">
                      <MapPin className="h-4 w-4 text-[#2f6ac6] sm:h-5 sm:w-5" />
                      Address & Slot
                    </DialogTitle>
                    <p className="text-[13px] text-slate-500">
                      Add service address and preferred time to continue.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                    onClick={() => setLogisticsPopupOpen(false)}
                    aria-label="Close address and slot popup"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </DialogHeader>

              <div className="space-y-4 px-4 py-4 sm:px-6 sm:py-5">
                <SectionCard icon={MapPin} title={content.sections.logisticsTitle} subtitle={content.sections.logisticsSubtitle}>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Button type="button" variant="outline" onClick={askGeo}>{content.labels.useGps}</Button>
                      {lat && lng ? <Badge variant="outline">{lat.toFixed(4)}, {lng.toFixed(4)}</Badge> : null}
                    </div>
                    <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder={content.placeholders.serviceAddress} />

                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{content.labels.pickupRequired}</p>
                    <OptionChips
                      values={[
                        { value: 'no', label: content.labels.visitGarage },
                        { value: 'yes', label: content.labels.needPickup },
                      ]}
                      value={pickup ? 'yes' : 'no'}
                      onPick={(value) => setPickup(value === 'yes')}
                    />

                    <div className="rounded-xl border border-[#dbe5f3] bg-[#fbfdff] p-3">
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{content.labels.schedule}</p>
                      <div className="mt-2">
                        <OptionChips
                          values={[
                            { value: 'now', label: content.labels.nowEmergency },
                            { value: 'scheduled', label: content.labels.scheduleTime },
                          ]}
                          value={scheduleMode}
                          onPick={(value) => setScheduleMode(value as 'now' | 'scheduled')}
                        />
                        {scheduleMode === 'scheduled' ? (
                          <>
                            <Input
                              className="mt-2"
                              type="datetime-local"
                              min={minimumScheduleTime}
                              value={preferredAt}
                              onChange={(e) => setPreferredAt(e.target.value)}
                            />
                            {scheduleValidationError ? (
                              <p className="mt-1 text-xs text-red-600">{scheduleValidationError}</p>
                            ) : null}
                          </>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </SectionCard>

                {error ? <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p> : null}

                <div className="flex justify-end gap-2 border-t border-[#e7edf5] pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setLogisticsPopupOpen(false);
                      setQuestionPopupOpen(true);
                    }}
                  >
                    Back
                  </Button>
                  <Button
                    type="button"
                    onClick={submitIssueToGarage}
                    disabled={submitting || dynamicQuestionsLoading}
                  >
                    {submitting ? content.labels.submitting : 'Continue'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </section>
    </UserThemeShell>
  );
}

function SectionCard({
  icon: Icon,
  title,
  subtitle,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-[#dbe5f3] bg-[linear-gradient(180deg,#fcfdff_0%,#f7fbff_100%)] p-4 sm:p-5 shadow-[0_4px_12px_rgba(94,126,179,0.08)]">
      <div className="mb-4 flex items-start gap-3">
        <div className="rounded-xl bg-[#e9f2ff] p-2.5 text-[#2f6ac6]">
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <p className="text-[18px] font-medium text-slate-900">{title}</p>
          {subtitle ? <p className="text-xs text-slate-500">{subtitle}</p> : null}
        </div>
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function OptionChips({
  values,
  value,
  onPick,
}: {
  values: Array<{ value: string; label: string }>;
  value: string;
  onPick: (value: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {values.map((item) => (
        <Button
          key={item.value}
          type="button"
          variant="outline"
          className={cn(
            'h-9 rounded-xl border px-3.5 text-[13px] font-medium transition-all',
            value === item.value
              ? 'border-[#7bb4ff] bg-[#1d7ff2] text-white hover:bg-[#146ad4] hover:text-white'
              : 'border-[#d6e1f1] bg-[#f7faff] text-slate-700 hover:bg-white'
          )}
          onClick={() => onPick(item.value)}
        >
          {item.label}
        </Button>
      ))}
    </div>
  );
}

function MultiOptionChips({
  values,
  valuesSelected,
  onToggle,
}: {
  values: Array<{ value: string; label: string }>;
  valuesSelected: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {values.map((item) => {
        const selected = valuesSelected.includes(item.value);
        return (
          <Button
            key={item.value}
            type="button"
            variant="outline"
            className={cn(
            'h-9 rounded-xl border px-3.5 text-[13px] font-medium transition-all',
              selected
                ? 'border-[#7bb4ff] bg-[#1d7ff2] text-white hover:bg-[#146ad4] hover:text-white'
                : 'border-[#d6e1f1] bg-[#f7faff] text-slate-700 hover:bg-white'
            )}
            onClick={() => onToggle(item.value)}
          >
            {item.label}
          </Button>
        );
      })}
    </div>
  );
}

function QuestionInput({
  question,
  value,
  onChange,
  textPlaceholder,
}: {
  question: DiagnosisQuestion;
  value: string;
  onChange: (value: string) => void;
  textPlaceholder: string;
}) {
  if (question.type === 'boolean') {
    return (
      <OptionChips
        values={[
          { value: 'yes', label: 'Yes' },
          { value: 'no', label: 'No' },
        ]}
        value={value}
        onPick={onChange}
      />
    );
  }

  if (question.type === 'single_select') {
    return (
      <OptionChips
        values={(question.options ?? []).map((option) => ({ value: option, label: option }))}
        value={value}
        onPick={onChange}
      />
    );
  }

  return <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={textPlaceholder} />;
}
