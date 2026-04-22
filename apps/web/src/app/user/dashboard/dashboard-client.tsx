'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bell,
  Car,
  CarFront,
  ChevronLeft,
  ChevronRight,
  Circle,
  Compass,
  Heart,
  History,
  Home,
  MapPin,
  Menu,
  Plus,
  Search,
  Settings,
  Sparkles,
  Wrench,
} from 'lucide-react';
import { SessionGuard } from '@/components/auth/session-guard';
import { LogoutButton } from '@/components/auth/logout-button';
import { UserSidebarMobile } from '@/components/dashboard/user-sidebar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  addUserVehicle,
  fetchIssueDetail,
  fetchIssueRequests,
  fetchIssueRequestsWithQuotes,
  fetchUserProfile,
  fetchUserVehicles,
  setDefaultUserVehicle,
  submitServiceIntake,
  uploadRcAndSuggest,
  updateUserVehicle,
  type ServiceIntakePayload,
  type IssueRequestListItem,
  type IssueDetail,
  type IssueRequestWithQuotes,
  type UserDashboardContent,
  type UserSidebarContent,
  type UserVehicle,
} from '@/lib/api';
import { cn } from '@/lib/utils';
import diagnosisQuestionBankJson from '@/data/diagnosis-question-bank.json';

type Props = {
  sidebar: UserSidebarContent;
  content: UserDashboardContent;
  appLogoUrl?: string;
};

type VehicleCard = {
  id: string;
  name: string;
  meta: string;
  image: string;
  isDefault?: boolean;
  source: UserVehicle;
};

type VehicleFormState = {
  make: string;
  model: string;
  year: string;
  fuelType: string;
  trim: string;
  mileage: string;
  engineType: string;
  vin: string;
  plateNumber: string;
  warrantyDetails: string;
};

const EMPTY_VEHICLE_FORM: VehicleFormState = {
  make: '',
  model: '',
  year: '',
  fuelType: '',
  trim: '',
  mileage: '',
  engineType: '',
  vin: '',
  plateNumber: '',
  warrantyDetails: '',
};

type GarageCard = {
  id: string;
  name: string;
  rating: string;
  reviews: string;
  distance: string;
  price: string;
  image: string;
};

type DashboardQuoteCard = {
  id: string;
  issueId: string;
  issue: string;
  garage: string;
  eta: string;
  amount: string;
  createdAt: string;
};

type DiagnosisQuestionType = 'single_select' | 'boolean' | 'text';
type DiagnosisQuestion = {
  id: string;
  label: string;
  type: DiagnosisQuestionType;
  options?: string[];
  required: boolean;
};

type DiagnosisChatMessage = {
  id: string;
  sender: 'bot' | 'user';
  text: string;
};

type DiagnosisSummary = {
  summary: string;
  probableProblem: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  risk: string;
  diySteps: string[];
  likelyCauses: string[];
  recommendedActions: string[];
  serviceSuggestion: string;
  estimatedCostRange: string;
};

type DashboardAiIssueDummy = {
  id: string;
  title: string;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  risk: string;
  bullets: string[];
  prices: {
    low: string;
    fair: string;
    high: string;
  };
};

const VEHICLE_IMAGES = [
  'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&w=800&q=80',
];

const nearbyGarages: GarageCard[] = [
  {
    id: 'g1',
    name: 'Garage A',
    rating: '4.4',
    reviews: '120 reviews',
    distance: '2.3 km',
    price: 'INR 4,300',
    image:
      'https://images.unsplash.com/photo-1487754180451-c456f719a1fc?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'g2',
    name: 'Garage B',
    rating: '4.1',
    reviews: '155 reviews',
    distance: '3.1 km',
    price: 'INR 3,000',
    image:
      'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'g3',
    name: 'Garage C',
    rating: '4.4',
    reviews: '96 reviews',
    distance: '2.7 km',
    price: 'INR 6,000',
    image:
      'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'g4',
    name: 'Garage D',
    rating: '4.2',
    reviews: '85 reviews',
    distance: '4.1 km',
    price: 'INR 6,000',
    image:
      'https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&w=400&q=80',
  },
];

const quoteCards = [
  {
    id: 'q1',
    issueId: 'sample-issue-1',
    issue: 'Brake response issue',
    garage: 'Garage A',
    eta: 'Today, 3:10 PM',
    amount: 'INR 4,200',
  },
  {
    id: 'q2',
    issueId: 'sample-issue-2',
    issue: 'Engine noise issue',
    garage: 'Garage B',
    eta: 'Today, 6:00 PM',
    amount: 'INR 3,800',
  },
];

const DASHBOARD_AI_TAGS = ['Noise', 'Vibration', 'Warning Light', 'Performance'] as const;

const DASHBOARD_AI_ISSUES: DashboardAiIssueDummy[] = [
  {
    id: 'wheel-balancing',
    title: 'Wheel Balancing',
    confidence: 'HIGH',
    risk: 'Tire wear, vibration',
    bullets: ['Risk: Tire wear, vibration', 'Risk: Safety issue'],
    prices: { low: 'INR 3,200', fair: 'INR 3,500', high: 'INR 3,900' },
  },
  {
    id: 'brake-pads-wear',
    title: 'Brake Pads Wear',
    confidence: 'MEDIUM',
    risk: 'Safety issue',
    bullets: ['Risk: Safety issue', 'Risk: Braking instability'],
    prices: { low: 'INR 1,200', fair: 'INR 2,500', high: 'INR 3,000' },
  },
];

const DIAGNOSIS_CATEGORY_OPTIONS = [
  { value: 'engine', label: 'Engine' },
  { value: 'battery', label: 'Battery' },
  { value: 'brake', label: 'Brake' },
  { value: 'ac', label: 'AC' },
  { value: 'electrical', label: 'Electrical' },
  { value: 'tyre', label: 'Tyre' },
  { value: 'other', label: 'Other' },
] as const;

const DIAGNOSIS_QUESTION_BANK = diagnosisQuestionBankJson as Record<string, DiagnosisQuestion[]>;

const navItems = [
  { href: '/user/dashboard', label: 'Home', icon: Home, active: true },
  { href: '/user/ai-diagnosis', label: 'Diagnose', icon: Sparkles },
  { href: '/user/my-garage', label: 'My Garages', icon: Car },
  { href: '/user/quotes-bookings', label: 'Quotes', icon: Menu },
  { href: '/user/payments', label: 'History', icon: History },
];

export function DashboardClient({ sidebar, content, appLogoUrl }: Props) {
  const router = useRouter();
  const [registeredVehicles, setRegisteredVehicles] = useState<UserVehicle[]>([]);
  const [showVehicleForm, setShowVehicleForm] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<UserVehicle | null>(null);
  const [form, setForm] = useState<VehicleFormState>(EMPTY_VEHICLE_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [rcText, setRcText] = useState('');
  const [processingRc, setProcessingRc] = useState(false);
  const [settingDefaultVehicleId, setSettingDefaultVehicleId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [issueDraft, setIssueDraft] = useState('');
  const [selectedDiagnosisVehicleId, setSelectedDiagnosisVehicleId] = useState('');
  const [vehiclePage, setVehiclePage] = useState(0);
  const [recentQuotes, setRecentQuotes] = useState<DashboardQuoteCard[]>([]);
  const [recentIssues, setRecentIssues] = useState<IssueRequestListItem[]>([]);
  const [intakeMode, setIntakeMode] = useState<'diagnosis' | 'direct'>('diagnosis');
  const [diagnosisChatOpen, setDiagnosisChatOpen] = useState(false);
  const [diagnosisLogisticsOpen, setDiagnosisLogisticsOpen] = useState(false);
  const [diagnosisCategory, setDiagnosisCategory] = useState('');
  const [diagnosisQuestions, setDiagnosisQuestions] = useState<DiagnosisQuestion[]>([]);
  const [diagnosisAnswers, setDiagnosisAnswers] = useState<Record<string, string>>({});
  const [diagnosisMessages, setDiagnosisMessages] = useState<DiagnosisChatMessage[]>([]);
  const [diagnosisCurrentIndex, setDiagnosisCurrentIndex] = useState<number | null>(null);
  const [diagnosisTextAnswer, setDiagnosisTextAnswer] = useState('');
  const [diagnosisThinking, setDiagnosisThinking] = useState(false);
  const [diagnosisSummary, setDiagnosisSummary] = useState<DiagnosisSummary | null>(null);
  const [diagnosisError, setDiagnosisError] = useState<string | null>(null);
  const [diagnosisAddress, setDiagnosisAddress] = useState('');
  const [diagnosisPickup, setDiagnosisPickup] = useState(false);
  const [diagnosisScheduleMode, setDiagnosisScheduleMode] = useState<'now' | 'scheduled'>('now');
  const [diagnosisPreferredAt, setDiagnosisPreferredAt] = useState('');
  const [diagnosisName, setDiagnosisName] = useState('');
  const [diagnosisPhone, setDiagnosisPhone] = useState('');
  const [diagnosisAltPhone, setDiagnosisAltPhone] = useState('');
  const [diagnosisSubmitting, setDiagnosisSubmitting] = useState(false);
  const [selectedAiTag, setSelectedAiTag] = useState<string>(DASHBOARD_AI_TAGS[0]);
  const [activeIssueDetailId, setActiveIssueDetailId] = useState<string | null>(null);
  const [activeIssueDetail, setActiveIssueDetail] = useState<IssueDetail | null>(null);
  const [activeDummyIssue, setActiveDummyIssue] = useState<DashboardAiIssueDummy | null>(null);
  const [issueDetailLoading, setIssueDetailLoading] = useState(false);
  const diagnosisChatScrollRef = useRef<HTMLDivElement | null>(null);

  const possibleIssues = useMemo(() => {
    if (recentIssues.length > 0) return recentIssues.slice(0, 2);
    return DASHBOARD_AI_ISSUES.map((issue) => ({
      id: `dummy-${issue.id}`,
      summary: issue.title,
      source: 'diagnosis' as const,
      status: 'open',
      createdAt: new Date().toISOString(),
      quoteCount: 0,
      severity: issue.confidence.toLowerCase(),
      vehicleLabel: '',
    }));
  }, [recentIssues]);

  useEffect(() => {
    async function loadVehicles() {
      try {
        const data = await fetchUserVehicles();
        setRegisteredVehicles(data);
      } catch {
        setRegisteredVehicles([]);
      }
    }
    void loadVehicles();
  }, []);

  useEffect(() => {
    async function loadProfile() {
      try {
        const profile = await fetchUserProfile();
        setDiagnosisName(profile.fullName ?? '');
        setDiagnosisPhone(profile.phone ?? '');
      } catch {
        setDiagnosisName('');
        setDiagnosisPhone('');
      }
    }
    void loadProfile();
  }, []);

  useEffect(() => {
    if (selectedDiagnosisVehicleId) return;
    const defaultVehicle =
      registeredVehicles.find((vehicle) => vehicle.isDefault)?.id ??
      registeredVehicles[0]?.id ??
      '';
    if (defaultVehicle) {
      setSelectedDiagnosisVehicleId(defaultVehicle);
    }
  }, [registeredVehicles, selectedDiagnosisVehicleId]);

  useEffect(() => {
    async function loadRecentQuotes() {
      try {
        const issues = await fetchIssueRequestsWithQuotes();
        const topQuotes = issues
          .flatMap((issue: IssueRequestWithQuotes) =>
            (issue.quotes ?? []).map((quote) => ({
              id: quote.id,
              issueId: issue.id,
              issue: issue.summary || 'Issue',
              garage: quote.garage_name || 'Garage',
              eta: formatQuoteTime(quote.created_at),
              amount: formatInr(quote.total_cost),
              createdAt: quote.created_at,
            }))
          )
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 2);
        setRecentQuotes(topQuotes);
      } catch {
        setRecentQuotes([]);
      }
    }

    void loadRecentQuotes();
  }, []);

  useEffect(() => {
    if (!diagnosisChatOpen) return;
    const el = diagnosisChatScrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [diagnosisChatOpen, diagnosisMessages, diagnosisThinking, diagnosisCurrentIndex]);

  useEffect(() => {
    async function loadRecentIssues() {
      try {
        const issues = await fetchIssueRequests();
        const latest = [...issues]
          .sort((a, b) => {
            const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return tb - ta;
          })
          .slice(0, 2);
        setRecentIssues(latest);
      } catch {
        setRecentIssues([]);
      }
    }

    void loadRecentIssues();
  }, []);

  const vehicles = useMemo<VehicleCard[]>(
    () =>
      registeredVehicles
        .filter((vehicle) => {
          const q = searchQuery.trim().toLowerCase();
          if (!q) return true;
          return `${vehicle.year} ${vehicle.make} ${vehicle.model} ${vehicle.fuelType} ${vehicle.plateNumber ?? ''}`
            .toLowerCase()
            .includes(q);
        })
        .map((vehicle, index) => ({
        id: vehicle.id,
        name: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
        meta: `${vehicle.fuelType} | ${vehicle.engineType || vehicle.trim || '-'} | ${
          vehicle.mileage != null ? `${vehicle.mileage.toLocaleString()} KM` : '-'
        }`,
        image: VEHICLE_IMAGES[index % VEHICLE_IMAGES.length],
        isDefault: vehicle.isDefault,
        source: vehicle,
      })),
    [registeredVehicles, searchQuery]
  );

  const canStartDiagnosis = issueDraft.trim().length > 0;
  const diagnosisRequiredQuestions = useMemo(
    () => diagnosisQuestions.filter((question) => question.required),
    [diagnosisQuestions]
  );
  const diagnosisAnsweredRequired = useMemo(
    () =>
      diagnosisRequiredQuestions.filter((question) => {
        const value = diagnosisAnswers[question.id];
        return typeof value === 'string' && value.trim().length > 0;
      }).length,
    [diagnosisAnswers, diagnosisRequiredQuestions]
  );

  async function pushBotMessage(text: string) {
    setDiagnosisThinking(true);
    await new Promise((resolve) => window.setTimeout(resolve, 850));
    setDiagnosisMessages((prev) => [...prev, { id: `bot-${Date.now()}-${Math.random()}`, sender: 'bot', text }]);
    setDiagnosisThinking(false);
  }

  async function classifyIssueCategory(issueText: string) {
    try {
      const response = await fetch('/api/diagnosis-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'classify', issue: issueText }),
      });
      if (!response.ok) throw new Error('Unable to classify issue');

      const data = (await response.json()) as {
        category?: string;
      };
      const category = String(data.category ?? 'other').toLowerCase();
      const known = DIAGNOSIS_CATEGORY_OPTIONS.some((item) => item.value === category);
      const nextCategory = known ? category : 'other';
      return { category: nextCategory };
    } catch {
      return { category: 'other' };
    }
  }

  async function generateDiagnosisSummary(
    category: string,
    answers: Record<string, string>
  ): Promise<DiagnosisSummary | null> {
    try {
      const response = await fetch('/api/diagnosis-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'summarize',
          issue: issueDraft.trim(),
          category,
          answers,
        }),
      });
      if (!response.ok) throw new Error('Unable to generate summary');
      const data = (await response.json()) as DiagnosisSummary;
      return data;
    } catch {
      return null;
    }
  }

  async function handleStartDiagnosis() {
    if (!canStartDiagnosis) return;
    const normalizedIssue = issueDraft.trim();
    const firstName = diagnosisName.trim().split(/\s+/)[0] || 'there';

    setIntakeMode('diagnosis');
    setDiagnosisError(null);
    setDiagnosisCategory('');
    setDiagnosisQuestions([]);
    setDiagnosisAnswers({});
    setDiagnosisMessages([]);
    setDiagnosisCurrentIndex(null);
    setDiagnosisTextAnswer('');
    setDiagnosisThinking(false);
    setDiagnosisSummary(null);
    setDiagnosisChatOpen(true);
    setDiagnosisLogisticsOpen(false);

    await pushBotMessage(`Hi ${firstName}, welcome to wrectifai.`);
    await pushBotMessage(`You reported: "${normalizedIssue}". Let me ask a few questions to diagnose this.`);

    const classified = await classifyIssueCategory(normalizedIssue);
    const category = classified.category;
    const categoryLabel =
      DIAGNOSIS_CATEGORY_OPTIONS.find((item) => item.value === category)?.label ?? 'Other';
    setDiagnosisCategory(category);

    const questions = DIAGNOSIS_QUESTION_BANK[category] ?? DIAGNOSIS_QUESTION_BANK.other;
    setDiagnosisQuestions(questions);
    setDiagnosisAnswers({});

    await pushBotMessage(`I mapped this to ${categoryLabel}. Please answer the following questions.`);
    await askNextDiagnosisQuestion(0, questions);
  }

  async function openIssueDetail(issue: IssueRequestListItem) {
    setActiveDummyIssue(null);
    setActiveIssueDetailId(issue.id);
    setIssueDetailLoading(true);
    try {
      const detail = await fetchIssueDetail(issue.id);
      setActiveIssueDetail(detail);
    } catch {
      setActiveIssueDetail(null);
    } finally {
      setIssueDetailLoading(false);
    }
  }

  function openDummyIssueDetail(issue: DashboardAiIssueDummy) {
    setActiveIssueDetailId(`dummy-${issue.id}`);
    setActiveIssueDetail(null);
    setIssueDetailLoading(false);
    setActiveDummyIssue(issue);
  }

  function handleDirectServiceRequest() {
    const params = new URLSearchParams();
    if (issueDraft.trim()) {
      params.set('issue', issueDraft.trim());
    }
    if (selectedDiagnosisVehicleId.trim()) {
      params.set('vehicleId', selectedDiagnosisVehicleId.trim());
    }
    router.push(`/user/direct-request${params.toString() ? `?${params.toString()}` : ''}`);
  }

  async function askNextDiagnosisQuestion(index: number, questions: DiagnosisQuestion[]) {
    const question = questions[index];
    await pushBotMessage(`${question.label}${question.required ? ' *' : ''}`);
    setDiagnosisCurrentIndex(index);
  }

  async function advanceDiagnosisFlow(
    fromIndex: number,
    questions = diagnosisQuestions,
    answersSnapshot = diagnosisAnswers
  ) {
    const nextIndex = fromIndex + 1;
    if (nextIndex >= questions.length) {
      setDiagnosisCurrentIndex(null);
      const summary = await generateDiagnosisSummary(diagnosisCategory || 'other', answersSnapshot);
      setDiagnosisSummary(summary);
      if (summary) {
        await pushBotMessage(`Summary: ${summary.summary}`);
        await pushBotMessage(
          `Probable problem: ${summary.probableProblem}\nSeverity: ${summary.severity} | Risk: ${summary.risk}\nLikely causes: ${summary.likelyCauses.join(', ')}`
        );
        await pushBotMessage(
          `DIY steps: ${summary.diySteps.join(' -> ')}\nRecommended actions: ${summary.recommendedActions.join(', ')}\nService: ${summary.serviceSuggestion}\nEstimated cost: ${summary.estimatedCostRange}`
        );
      }
      await pushBotMessage('All questions captured. Click Continue.');
      return;
    }
    await askNextDiagnosisQuestion(nextIndex, questions);
  }

  function submitDiagnosisAnswer(answer: string) {
    if (diagnosisCurrentIndex === null) return;
    const question = diagnosisQuestions[diagnosisCurrentIndex];
    const value = answer.trim();
    if (!value) return;
    const nextAnswers = { ...diagnosisAnswers, [question.id]: value };
    setDiagnosisAnswers(nextAnswers);
    setDiagnosisMessages((prev) => [...prev, { id: `user-${question.id}-${Date.now()}`, sender: 'user', text: value }]);
    setDiagnosisTextAnswer('');
    void advanceDiagnosisFlow(diagnosisCurrentIndex, diagnosisQuestions, nextAnswers);
  }

  function openDiagnosisLogistics() {
    if (diagnosisCurrentIndex !== null || diagnosisThinking) {
      setDiagnosisError('Please complete all chat questions first.');
      return;
    }
    if (diagnosisRequiredQuestions.length === 0 || diagnosisAnsweredRequired < diagnosisRequiredQuestions.length) {
      setDiagnosisError('Please complete all required questions first.');
      return;
    }
    setDiagnosisError(null);
    setDiagnosisChatOpen(false);
    setDiagnosisLogisticsOpen(true);
  }

  async function createDiagnosisIssue() {
    const selectedVehicle = registeredVehicles.find((vehicle) => vehicle.id === selectedDiagnosisVehicleId);
    if (!selectedVehicle) {
      setDiagnosisError('Please select a vehicle first.');
      return;
    }
    if (!diagnosisAddress.trim()) {
      setDiagnosisError('Please enter service address.');
      return;
    }
    if (!diagnosisName.trim() || !diagnosisPhone.trim()) {
      setDiagnosisError('Please enter contact name and phone.');
      return;
    }
    if (diagnosisScheduleMode === 'scheduled' && !diagnosisPreferredAt) {
      setDiagnosisError('Please select a preferred slot.');
      return;
    }
    const answerValues = Object.values(diagnosisAnswers);
    const severityFromSummary = diagnosisSummary?.severity
      ? mapAiSeverityToIssueSeverity(diagnosisSummary.severity)
      : null;
    const severity =
      intakeMode === 'direct'
        ? 'can_drive'
        : severityFromSummary ?? inferDashboardSeverity(answerValues);
    const whenHappens =
      intakeMode === 'direct'
        ? 'driving'
        : mapDashboardWhenHappens(diagnosisAnswers.when_occurs);
    const sinceWhen =
      intakeMode === 'direct'
        ? 'today'
        : inferDashboardSinceWhen(answerValues);

    const payload: ServiceIntakePayload = {
      source: intakeMode,
      vehicle: {
        id: selectedVehicle.id,
        type: 'car',
        brand: selectedVehicle.make,
        model: selectedVehicle.model,
        year: selectedVehicle.year,
        fuel: selectedVehicle.fuelType.toLowerCase(),
        variant: selectedVehicle.trim ?? undefined,
      },
      issue: {
        category: diagnosisCategory || 'other',
        symptoms: Object.entries(diagnosisAnswers).map(([key, value]) => `${key}:${value}`),
        severity,
        description: issueDraft.trim() || diagnosisSummary?.summary || diagnosisAnswers.symptom_pattern?.trim() || 'Direct service request',
        sinceWhen,
        whenHappens,
        answers: diagnosisAnswers,
      },
      media: [],
      location: { address: diagnosisAddress.trim() },
      serviceType: diagnosisPickup ? 'pickup' : 'visit',
      schedule: {
        mode: diagnosisScheduleMode,
        preferredAt: diagnosisScheduleMode === 'scheduled' ? diagnosisPreferredAt : undefined,
      },
      user: {
        name: diagnosisName.trim(),
        phone: diagnosisPhone.trim(),
        alternatePhone: diagnosisAltPhone.trim() || undefined,
      },
    };

    try {
      setDiagnosisSubmitting(true);
      setDiagnosisError(null);
      const { issueId } = await submitServiceIntake(payload);
      setDiagnosisLogisticsOpen(false);
      const issues = await fetchIssueRequests();
      const latest = [...issues]
        .sort((a, b) => {
          const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return tb - ta;
        })
        .slice(0, 2);
      setRecentIssues(latest);
      router.push(`/user/quotes-bookings/${issueId}`);
    } catch (error) {
      setDiagnosisError(error instanceof Error ? error.message : 'Failed to create issue.');
    } finally {
      setDiagnosisSubmitting(false);
    }
  }

  const VEHICLES_PER_PAGE = 2;
  const totalVehiclePages = Math.max(1, Math.ceil(vehicles.length / VEHICLES_PER_PAGE));
  const pagedVehicles = vehicles.slice(
    vehiclePage * VEHICLES_PER_PAGE,
    vehiclePage * VEHICLES_PER_PAGE + VEHICLES_PER_PAGE
  );

  useEffect(() => {
    if (vehiclePage > totalVehiclePages - 1) {
      setVehiclePage(Math.max(0, totalVehiclePages - 1));
    }
  }, [totalVehiclePages, vehiclePage]);

  function openAddVehicleModal() {
    setEditingVehicle(null);
    setForm(EMPTY_VEHICLE_FORM);
    setRcText('');
    setFormError(null);
    setShowVehicleForm(true);
  }

  function openEditVehicleModal(vehicle: UserVehicle) {
    setEditingVehicle(vehicle);
    setForm({
      make: vehicle.make,
      model: vehicle.model,
      year: String(vehicle.year),
      fuelType: vehicle.fuelType,
      trim: vehicle.trim ?? '',
      mileage: vehicle.mileage != null ? String(vehicle.mileage) : '',
      engineType: vehicle.engineType ?? '',
      vin: vehicle.vin ?? '',
      plateNumber: vehicle.plateNumber ?? '',
      warrantyDetails: '',
    });
    setRcText('');
    setFormError(null);
    setShowVehicleForm(true);
  }

  async function refreshVehicles() {
    try {
      const data = await fetchUserVehicles();
      setRegisteredVehicles(data);
    } catch {
      setRegisteredVehicles([]);
    }
  }

  async function handleSaveVehicle() {
    if (!form.make.trim() || !form.model.trim() || !form.fuelType.trim() || !form.year.trim()) {
      setFormError('Please fill all required fields.');
      return;
    }

    const yearNum = Number(form.year);
    if (!Number.isInteger(yearNum)) {
      setFormError('Year must be a valid number.');
      return;
    }

    const mileageNum = form.mileage.trim() ? Number(form.mileage) : undefined;
    if (form.mileage.trim() && !Number.isFinite(mileageNum)) {
      setFormError('Mileage must be a valid number.');
      return;
    }

    try {
      setFormSubmitting(true);
      setFormError(null);

      if (editingVehicle) {
        await updateUserVehicle(editingVehicle.id, {
          make: form.make.trim(),
          model: form.model.trim(),
          year: yearNum,
          fuelType: form.fuelType.trim(),
          trim: form.trim.trim() || undefined,
          mileage: mileageNum,
          engineType: form.engineType.trim() || undefined,
          vin: form.vin.trim() || undefined,
          plateNumber: form.plateNumber.trim() || undefined,
        });
      } else {
        await addUserVehicle({
          make: form.make.trim(),
          model: form.model.trim(),
          year: yearNum,
          fuelType: form.fuelType.trim(),
          trim: form.trim.trim() || undefined,
          mileage: mileageNum,
          engineType: form.engineType.trim() || undefined,
          vin: form.vin.trim() || undefined,
          plateNumber: form.plateNumber.trim() || undefined,
          warrantyDetails: form.warrantyDetails.trim() || undefined,
          isDefault: registeredVehicles.length === 0,
        });
      }

      await refreshVehicles();
      setShowVehicleForm(false);
      setEditingVehicle(null);
      setForm(EMPTY_VEHICLE_FORM);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Failed to save vehicle.');
    } finally {
      setFormSubmitting(false);
    }
  }

  async function handleSetDefault(vehicleId: string) {
    try {
      setSettingDefaultVehicleId(vehicleId);
      await setDefaultUserVehicle(vehicleId);
      await refreshVehicles();
    } finally {
      setSettingDefaultVehicleId(null);
    }
  }

  async function handleApplyRcSuggestion() {
    if (!rcText.trim()) return;
    try {
      setProcessingRc(true);
      const suggestion = await uploadRcAndSuggest(rcText.trim());
      setForm((prev) => ({
        ...prev,
        make: suggestion.make ?? prev.make,
        model: suggestion.model ?? prev.model,
        year: suggestion.year ? String(suggestion.year) : prev.year,
        fuelType: suggestion.fuelType ?? prev.fuelType,
        vin: suggestion.vin ?? prev.vin,
        plateNumber: suggestion.plateNumber ?? prev.plateNumber,
      }));
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Failed to apply RC suggestion.');
    } finally {
      setProcessingRc(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#dfe7f5] px-2 py-2 sm:px-3 sm:py-3 [font-family:Inter,'SF_Pro_Display',-apple-system,BlinkMacSystemFont,'Segoe_UI',Roboto,Helvetica,Arial,sans-serif]">
      <SessionGuard requiredRole="user" />
      <UserSidebarMobile activeItem="dashboard" content={sidebar} />

      <div className="mx-auto flex h-[calc(100vh-1rem)] w-full flex-col overflow-hidden rounded-xl border border-[#d4deef] bg-[#edf2fb] shadow-[0_12px_36px_rgba(38,67,122,0.14)] sm:h-[calc(100vh-1.5rem)]">
        <div className="sticky top-0 z-30 shrink-0">
        <header className="border-b border-[#dbe5f4] bg-[#f8fbff] px-2.5 py-2 sm:px-4 sm:py-2.5">
          <div className="flex items-center gap-2.5 sm:gap-4">
            <div className="hidden h-[62px] w-[320px] shrink-0 overflow-hidden rounded-xl bg-white p-0.5 shadow-sm sm:flex">
              <img
                src="/wrectifai_logo_cropped.png?v=4"
                alt={sidebar.brandName}
                className="h-full w-full object-contain"
              />
            </div>
            <div className="relative w-full max-w-[520px] flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search vehicles, garages, bookings..."
                className="h-[38px] w-full rounded-xl border border-[#d6e0f0] bg-white pl-9 pr-4 text-[13px] font-medium text-slate-700 outline-none"
              />
            </div>
            <div className="ml-auto flex items-center gap-2 sm:gap-3">
              <IconPill>
                <Bell className="h-4 w-4" />
              </IconPill>
              <IconPill>
                <Heart className="h-4 w-4" />
              </IconPill>
              <IconPill>
                <Settings className="h-4 w-4" />
              </IconPill>
              <Link href="/user/profile" className="block">
                <div className="h-9 w-9 overflow-hidden rounded-full border-2 border-[#8db4ff] bg-white shadow-sm">
                  <img
                    src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80"
                    alt="Profile"
                    className="h-full w-full object-cover"
                  />
                </div>
              </Link>
            </div>
          </div>
        </header>

        <nav className="hidden overflow-x-auto bg-[linear-gradient(180deg,#0e4ca2_0%,#0a3779_100%)] px-2 py-2 sm:block sm:px-4">
          <div className="flex min-w-max items-center gap-2.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={cn(
                    'inline-flex h-9 items-center gap-2 rounded-full px-3.5 text-[13px] font-medium text-white/90 transition',
                    item.active ? 'bg-[#1e83f6] shadow-[0_8px_20px_rgba(0,0,0,0.25)]' : 'hover:bg-white/15'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
            <LogoutButton
              withIcon
              label="Logout"
              variant="ghost"
              className="ml-auto inline-flex h-9 items-center gap-2 rounded-full px-3.5 text-[13px] font-medium text-white/90 transition hover:bg-white/15"
            />
          </div>
        </nav>
        </div>

        <section className="flex-1 overflow-y-auto px-3 py-3 sm:px-4 sm:py-4">
          <div className="mx-auto w-full max-w-[1280px]">
            <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
            <div className="space-y-5">
              <CardShell>
                <div className="flex items-center justify-between">
                  <h2 className="text-[23px] font-semibold text-slate-800">My Vehicles</h2>
                  <div className="flex items-center gap-2">
                    {vehicles.length > VEHICLES_PER_PAGE ? (
                      <>
                        <button
                          type="button"
                          onClick={() => setVehiclePage((prev) => Math.max(0, prev - 1))}
                          disabled={vehiclePage === 0}
                          className="grid h-8 w-8 place-items-center rounded-full border border-[#d5e2f3] bg-white text-slate-600 transition hover:bg-[#f4f8ff] disabled:cursor-not-allowed disabled:opacity-40"
                          aria-label="Previous vehicles"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setVehiclePage((prev) => Math.min(totalVehiclePages - 1, prev + 1))}
                          disabled={vehiclePage >= totalVehiclePages - 1}
                          className="grid h-8 w-8 place-items-center rounded-full border border-[#d5e2f3] bg-white text-slate-600 transition hover:bg-[#f4f8ff] disabled:cursor-not-allowed disabled:opacity-40"
                          aria-label="Next vehicles"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </>
                    ) : null}
                    <p className="text-xl text-slate-300">...</p>
                  </div>
                </div>

                <div className="mt-3.5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {pagedVehicles.map((vehicle) => (
                    <VehicleBlock
                      key={vehicle.id}
                      vehicle={vehicle}
                      onEdit={() => openEditVehicleModal(vehicle.source)}
                      onSetDefault={() => void handleSetDefault(vehicle.id)}
                      settingDefault={settingDefaultVehicleId === vehicle.id}
                    />
                  ))}

                  <button
                    type="button"
                    onClick={openAddVehicleModal}
                    className="flex min-h-[220px] flex-col items-center justify-center rounded-xl border border-[#dde6f3] bg-[#f6f9ff] p-4 text-center transition hover:border-[#9ec5ff] hover:bg-white"
                  >
                    <Plus className="h-8 w-8 text-[#2a82f6]" />
                    <p className="mt-1.5 text-[18px] font-medium text-slate-700">Add Vehicle</p>
                  </button>
                </div>
              </CardShell>

              <CardShell>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-[#1d7ff2]" />
                    <h3 className="text-[23px] font-semibold tracking-tight text-slate-800">AI Diagnosis</h3>
                  </div>
                  <button
                    type="button"
                    onClick={handleDirectServiceRequest}
                    className="inline-flex h-9 items-center justify-center rounded-xl bg-[#1976f2] px-3 text-[13px] font-medium text-white transition hover:bg-[#0d62d4]"
                  >
                    Raise Direct Service Request
                  </button>
                </div>
                <p className="mt-1 text-[17px] font-medium text-slate-700">What&apos;s wrong with your car?</p>

                <div className="mt-3.5 rounded-xl border border-[#dbe5f5] bg-white p-4">
                  <div className="grid gap-2.5 md:grid-cols-[minmax(0,1fr)_260px]">
                    <div className="relative">
                      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      value={issueDraft}
                      onChange={(e) => {
                        setIssueDraft(e.target.value);
                      }}
                      placeholder="Type your issue..."
                      className="h-10 w-full rounded-xl border border-[#d6e2f2] bg-[#fbfdff] pl-9 pr-3 text-[13px] text-slate-700 placeholder:text-slate-500 outline-none"
                    />
                    </div>
                    <select
                      value={selectedDiagnosisVehicleId}
                      onChange={(e) => setSelectedDiagnosisVehicleId(e.target.value)}
                      className="h-10 w-full rounded-xl border border-[#d6e2f2] bg-[#fbfdff] px-3 text-[13px] text-slate-700 outline-none"
                    >
                      <option value="">Select vehicle</option>
                      {registeredVehicles.map((vehicle) => (
                        <option key={vehicle.id} value={vehicle.id}>
                          {vehicle.year} {vehicle.make} {vehicle.model}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {DASHBOARD_AI_TAGS.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => {
                          setSelectedAiTag(tag);
                          setIssueDraft(tag);
                        }}
                        className={cn(
                          'inline-flex h-9 items-center rounded-xl border px-3 text-[13px] font-medium',
                          selectedAiTag === tag
                            ? 'border-[#7bb4ff] bg-[#1d7ff2] text-white'
                            : 'border-[#d6e2f2] bg-white text-slate-700 hover:bg-[#f6f9ff]'
                        )}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                      Possible Issues
                    </p>
                    <button
                      type="button"
                      onClick={handleStartDiagnosis}
                      disabled={!canStartDiagnosis}
                      className={cn(
                        'inline-flex h-11 items-center justify-center rounded-xl px-5 text-[14px] font-semibold transition-all',
                        canStartDiagnosis
                          ? 'bg-[linear-gradient(180deg,#2d8cff_0%,#1467d9_100%)] text-white shadow-[0_10px_24px_rgba(20,103,217,0.35)] hover:translate-y-[-1px] hover:shadow-[0_14px_28px_rgba(20,103,217,0.4)]'
                          : 'cursor-not-allowed border border-[#cfe0f8] bg-[#eaf2ff] text-[#7a93b9] opacity-100',
                      )}
                    >
                      Start Diagnosis
                    </button>
                  </div>

                  <div className="mt-3.5 space-y-2.5">
                    {possibleIssues.map((issue, index) => (
                      <button
                        key={issue.id}
                        type="button"
                        onClick={() => {
                          const matchingDummy = DASHBOARD_AI_ISSUES[index];
                          if (issue.id.startsWith('dummy-') && matchingDummy) {
                            openDummyIssueDetail(matchingDummy);
                            return;
                          }
                          void openIssueDetail(issue);
                        }}
                        className="w-full rounded-xl border border-[#dce7f5] bg-[#fbfdff] p-3 text-left transition hover:border-[#a9c9f8] hover:bg-white"
                      >
                        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_300px]">
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-[28px] leading-none text-[#1d7ff2]">•</p>
                              <p className="text-[22px] font-semibold text-slate-800">
                                {issue.summary || 'Issue'}
                              </p>
                              <span
                                className={cn(
                                  'ml-auto rounded-full px-2 py-0.5 text-[11px] font-semibold',
                                  String(issue.severity ?? '').toUpperCase() === 'HIGH'
                                    ? 'bg-[#d9f9e7] text-[#117a43]'
                                    : String(issue.severity ?? '').toUpperCase() === 'MEDIUM'
                                    ? 'bg-[#fff5dc] text-[#a76b00]'
                                    : 'bg-[#e8f2ff] text-[#0f62d6]'
                                )}
                              >
                                {String(issue.severity ?? 'LOW').toUpperCase()}
                              </span>
                            </div>
                            <p className="mt-1 text-[13px] font-medium text-slate-600">Confidence:</p>
                            <div className="mt-1 space-y-1 text-[13px] text-slate-600">
                              <p>• Source: {issue.source ?? 'diagnosis'}</p>
                              <p>• Status: {issue.status ?? 'open'}</p>
                              <p>• Vehicle: {issue.vehicleLabel || 'Vehicle unavailable'}</p>
                            </div>
                          </div>
                          <div className="rounded-xl border border-[#e0eaf8] bg-white p-3">
                            <div className="h-2 rounded-full bg-[linear-gradient(90deg,#2c8bff_0%,#64d774_50%,#f2835f_100%)]" />
                            <div className="mt-2 grid grid-cols-3 text-[13px] font-semibold text-slate-700">
                              <span>INR 3,200</span>
                              <span className="text-center">INR 3,500</span>
                              <span className="text-right">INR 3,900</span>
                            </div>
                            <div className="mt-2 flex items-center justify-between text-[12px] text-slate-500">
                              <span>
                                Confidence:{' '}
                                <span className="font-semibold text-[#117a43]">
                                  {String(issue.severity ?? 'LOW').toUpperCase()}
                                </span>
                              </span>
                              <span>
                                Market: <span className="font-semibold text-slate-700">FAIR</span>
                              </span>
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </CardShell>

              <CardShell>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-[23px] font-semibold tracking-tight text-slate-800">Nearby Garages</h3>
                  <Link href="/user/quotes-bookings" className="text-[13px] font-medium text-[#0f62d6]">
                    {content.actions.quotes.title}
                  </Link>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {nearbyGarages.map((garage) => (
                    <GarageBlock key={garage.id} garage={garage} />
                  ))}
                </div>
              </CardShell>

              <CardShell>
                <div className="flex items-center justify-between">
                  <h3 className="text-[23px] font-semibold tracking-tight text-slate-800">Quotes Received</h3>
                  <Link href="/user/quotes-bookings" className="text-[13px] font-medium text-[#0f62d6]">
                    {content.stats.pendingQuotes}
                  </Link>
                </div>

                <div className="mt-3.5 space-y-2.5">
                  {(recentQuotes.length > 0 ? recentQuotes : quoteCards).map((quote) => (
                    <div
                      key={quote.id}
                      className="flex min-h-[84px] flex-wrap items-center justify-between gap-3 rounded-xl border border-[#dbe6f5] bg-white px-4 py-3"
                    >
                      <div>
                        <p className="text-[16px] font-medium text-slate-800">{quote.garage}</p>
                        <p className="text-[13px] text-slate-600">{quote.issue}</p>
                        <p className="text-[12px] text-slate-500">{quote.eta}</p>
                      </div>
                      <div className="ml-auto text-right">
                        <p className="text-[24px] font-semibold text-slate-900">{quote.amount}</p>
                      </div>
                      <div className="flex gap-2">
                        <Link
                          href={`/user/quotes-bookings/${quote.issueId}`}
                          className="inline-flex h-9 items-center rounded-lg bg-[#16a34a] px-3 text-[13px] font-medium text-white"
                        >
                          Accept
                        </Link>
                        <Link
                          href={`/user/quotes-bookings/${quote.issueId}`}
                          className="inline-flex h-9 items-center rounded-lg bg-[#1976f2] px-3 text-[13px] font-medium text-white"
                        >
                          Reject
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </CardShell>
            </div>

            <aside className="space-y-4">
              <CardShell compact>
                <h4 className="text-[18px] font-semibold text-slate-800">Your Cards</h4>
                <div className="mt-3 space-y-2.5">
                  <StatCard label="Total Spent" value="INR 56,500" tone="blue" />
                  <StatCard label="Upcoming booking" value="Garage Monroe" sub="Apr 23, 10:00" tone="orange" />
                  <StatCard label="Active Vehicles" value="2" tone="green" />
                  <StatCard label="Favorite Garages" value="3" tone="yellow" />
                </div>
              </CardShell>

              <CardShell compact>
                <h4 className="text-[18px] font-semibold text-slate-800">Preventive Maintenance</h4>
                <div className="mt-3 overflow-hidden rounded-xl border border-[#dbe4f4] bg-white">
                  <div className="flex items-center justify-between border-b border-[#edf2fa] px-3 py-2">
                    <p className="text-[14px] font-medium text-slate-700">Oil Change</p>
                    <span className="text-[12px] text-slate-500">65,500 KM</span>
                  </div>
                  <img
                    src="https://images.unsplash.com/photo-1577086664693-894d8405334a?auto=format&fit=crop&w=1200&q=80"
                    alt="Map"
                    className="h-64 w-full object-cover"
                  />
                  <div className="grid grid-cols-4 gap-2 border-t border-[#edf2fa] p-2">
                    <button className="rounded-lg bg-[#1976f2] py-2 text-white">
                      <Compass className="mx-auto h-4 w-4" />
                    </button>
                    <button className="rounded-lg bg-[#f3f7ff] py-2 text-slate-600">
                      <MapPin className="mx-auto h-4 w-4" />
                    </button>
                    <button className="rounded-lg bg-[#f3f7ff] py-2 text-slate-600">
                      <Settings className="mx-auto h-4 w-4" />
                    </button>
                    <button className="rounded-lg bg-[#f3f7ff] py-2 text-slate-600">
                      <Wrench className="mx-auto h-4 w-4" />
                    </button>
                  </div>
                </div>
              </CardShell>

              <CardShell compact>
                <h4 className="text-[18px] font-semibold text-slate-800">Quotes Received Today</h4>
                <div className="mt-3 space-y-2">
                  <MiniQuote garage="Garage A" when="Derol · 5 KM" />
                  <MiniQuote garage="Garage C" when="April · 10 AM" />
                  <Link
                    href="/user/quotes-bookings"
                    className="inline-flex h-9 w-full items-center justify-center rounded-xl bg-[#1976f2] text-[13px] font-medium text-white"
                  >
                    Add to Favorites
                  </Link>
                </div>
              </CardShell>
            </aside>
            </div>
          </div>
        </section>
      </div>

      <Dialog open={diagnosisChatOpen} onOpenChange={setDiagnosisChatOpen}>
        <DialogContent className="flex h-[82vh] max-h-[88vh] max-w-[980px] flex-col overflow-hidden rounded-2xl border border-[#d4e0f1] bg-[#f8fbff] p-0">
          <DialogHeader className="border-b border-[#e0e9f6] px-5 py-4">
            <DialogTitle className="text-[30px] font-semibold text-slate-900">Wrectfai Chat Bot</DialogTitle>
          </DialogHeader>
          <div className="flex min-h-0 flex-1 flex-col gap-4 p-5">
            <div className="flex min-h-0 flex-1 flex-col rounded-xl border border-[#dbe5f3] bg-white p-3">
              <div ref={diagnosisChatScrollRef} className="min-h-[260px] flex-1 space-y-2 overflow-y-auto pr-1">
                {diagnosisMessages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      'max-w-[90%] rounded-2xl px-3 py-2 text-sm',
                      message.sender === 'bot'
                        ? 'border border-[#dbe5f3] bg-[#f8fbff] text-slate-800'
                        : 'ml-auto bg-[#1d7ff2] text-white'
                    )}
                  >
                    {message.text}
                  </div>
                ))}
                {diagnosisThinking ? (
                  <div className="max-w-[90%] rounded-2xl border border-[#dbe5f3] bg-white px-3 py-2">
                    <div className="flex items-center gap-1">
                      <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.25s]" />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.12s]" />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400" />
                    </div>
                  </div>
                ) : null}
              </div>

              {diagnosisCurrentIndex !== null ? (
                <div className="mt-3 rounded-xl border border-[#dbe5f3] bg-[#fbfdff] p-3">
                  {diagnosisQuestions[diagnosisCurrentIndex]?.type === 'text' ? (
                    <div className="flex gap-2">
                      <input
                        value={diagnosisTextAnswer}
                        onChange={(e) => setDiagnosisTextAnswer(e.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter') {
                            event.preventDefault();
                            submitDiagnosisAnswer(diagnosisTextAnswer);
                          }
                        }}
                        className="h-10 flex-1 rounded-xl border border-[#d6e2f2] bg-white px-3 text-sm text-slate-700 outline-none"
                        placeholder="Type answer"
                      />
                      <button
                        type="button"
                        onClick={() => submitDiagnosisAnswer(diagnosisTextAnswer)}
                        disabled={!diagnosisTextAnswer.trim()}
                        className="h-10 rounded-xl bg-[#1d7ff2] px-4 text-sm font-medium text-white disabled:opacity-50"
                      >
                        Send
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {(diagnosisQuestions[diagnosisCurrentIndex]?.type === 'boolean'
                        ? [
                            { value: 'yes', label: 'Yes' },
                            { value: 'no', label: 'No' },
                          ]
                        : (diagnosisQuestions[diagnosisCurrentIndex]?.options ?? []).map((value) => ({ value, label: value }))).map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => submitDiagnosisAnswer(option.value)}
                          className="h-9 rounded-xl border border-[#d6e3f4] bg-white px-3 text-[13px] font-medium text-slate-700 hover:bg-[#f2f7ff]"
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <p className="mt-3 text-sm text-emerald-700">All questions answered.</p>
              )}
            </div>

            {diagnosisError ? <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{diagnosisError}</p> : null}

            <div className="flex justify-end border-t border-[#e7edf5] pt-4">
              <button
                type="button"
                onClick={openDiagnosisLogistics}
                disabled={diagnosisCurrentIndex !== null || diagnosisThinking}
                className="h-10 rounded-xl bg-[#1d7ff2] px-5 text-sm font-medium text-white disabled:opacity-50"
              >
                Continue
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(activeIssueDetailId)}
        onOpenChange={(open) => {
          if (!open) {
            setActiveIssueDetailId(null);
            setActiveIssueDetail(null);
            setActiveDummyIssue(null);
          }
        }}
      >
        <DialogContent className="max-h-[88vh] max-w-4xl overflow-y-auto rounded-2xl border border-[#d4e0f1] bg-[#f8fbff] p-0">
          <DialogHeader className="border-b border-[#e0e9f6] px-5 py-4">
            <DialogTitle className="text-[30px] font-semibold text-slate-900">Issue Details</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 p-5">
            {issueDetailLoading ? <p className="text-sm text-slate-500">Loading details...</p> : null}
            {!issueDetailLoading && activeIssueDetail ? (
              <>
                <div className="rounded-xl border border-[#dbe6f5] bg-white p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Summary</p>
                      <p className="mt-1 text-[18px] font-semibold text-slate-900">
                        {activeIssueDetail.summary || '-'}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full border border-[#cfe0fb] bg-[#f2f7ff] px-2.5 py-1 text-xs font-semibold uppercase text-[#1d65d6]">
                        {activeIssueDetail.source || '-'}
                      </span>
                      <span className="rounded-full border border-[#d8e7dc] bg-[#edf9f0] px-2.5 py-1 text-xs font-semibold uppercase text-[#20844b]">
                        {activeIssueDetail.status || '-'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
                  <IssueDetailStat label="Vehicle" value={activeIssueDetail.vehicleLabel || '-'} />
                  <IssueDetailStat label="Created At" value={formatIssueDate(activeIssueDetail.createdAt)} />
                  <IssueDetailStat label="Quote Count" value={String(activeIssueDetail.quoteCount ?? 0)} />
                  <IssueDetailStat
                    label="Severity"
                    value={String(activeIssueDetail.issuePayload?.issue?.severity ?? '-')}
                  />
                </div>

                <div className="grid gap-2.5 sm:grid-cols-2">
                  <IssueDetailRow
                    label="Category"
                    value={String(activeIssueDetail.issuePayload?.issue?.category ?? '-')}
                  />
                  <IssueDetailRow
                    label="Service Type"
                    value={String(activeIssueDetail.issuePayload?.serviceType ?? '-')}
                  />
                  <IssueDetailRow
                    label="Address"
                    value={String(
                      (activeIssueDetail.issuePayload?.location as { address?: string } | undefined)?.address ?? '-'
                    )}
                  />
                  <IssueDetailRow
                    label="Schedule"
                    value={
                      String((activeIssueDetail.issuePayload?.schedule as { mode?: string } | undefined)?.mode ?? '-') +
                      (
                        (activeIssueDetail.issuePayload?.schedule as { preferredAt?: string } | undefined)?.preferredAt
                          ? ` · ${String((activeIssueDetail.issuePayload?.schedule as { preferredAt?: string }).preferredAt)}`
                          : ''
                      )
                    }
                  />
                  <div className="sm:col-span-2">
                    <IssueDetailRow
                      label="Description"
                      value={String(activeIssueDetail.issuePayload?.issue?.description ?? '-')}
                    />
                  </div>
                </div>

                <div className="rounded-xl border border-[#dbe6f5] bg-white p-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Answers</p>
                  {Object.entries(activeIssueDetail.issuePayload?.issue?.answers ?? {}).length > 0 ? (
                    <div className="mt-2 overflow-x-auto rounded-lg border border-[#e7eef8]">
                      <table className="w-full text-left text-xs text-slate-700">
                        <tbody>
                          {Object.entries(activeIssueDetail.issuePayload?.issue?.answers ?? {}).map(([key, value]) => (
                            <tr key={key} className="border-b border-[#eef3fb] last:border-b-0">
                              <td className="w-[40%] bg-[#f9fbff] px-3 py-2 font-semibold text-slate-600">{key}</td>
                              <td className="px-3 py-2">{String(value || '-')}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="mt-2 text-xs text-slate-500">No answers captured.</p>
                  )}
                </div>
              </>
            ) : null}
            {!issueDetailLoading && !activeIssueDetail && activeDummyIssue ? (
              <>
                <div className="rounded-xl border border-[#dbe6f5] bg-white p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Issue</p>
                      <p className="mt-1 text-[18px] font-semibold text-slate-900">{activeDummyIssue.title}</p>
                    </div>
                    <span
                      className={cn(
                        'rounded-full px-2.5 py-1 text-xs font-semibold',
                        activeDummyIssue.confidence === 'HIGH'
                          ? 'bg-[#d9f9e7] text-[#117a43]'
                          : activeDummyIssue.confidence === 'MEDIUM'
                          ? 'bg-[#fff5dc] text-[#a76b00]'
                          : 'bg-[#e8f2ff] text-[#0f62d6]'
                      )}
                    >
                      {activeDummyIssue.confidence}
                    </span>
                  </div>
                </div>
                <div className="grid gap-2.5 sm:grid-cols-3">
                  <IssueDetailStat label="Low Estimate" value={activeDummyIssue.prices.low} />
                  <IssueDetailStat label="Fair Estimate" value={activeDummyIssue.prices.fair} />
                  <IssueDetailStat label="High Estimate" value={activeDummyIssue.prices.high} />
                </div>
                <IssueDetailRow label="Risk" value={activeDummyIssue.risk} />
                <div className="rounded-xl border border-[#dbe6f5] bg-white p-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Potential Notes</p>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
                    {activeDummyIssue.bullets.map((bullet) => (
                      <li key={bullet}>{bullet}</li>
                    ))}
                  </ul>
                </div>
              </>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={diagnosisLogisticsOpen} onOpenChange={setDiagnosisLogisticsOpen}>
        <DialogContent className="max-h-[88vh] max-w-[760px] overflow-y-auto rounded-2xl border border-[#d4e0f1] bg-[#f8fbff] p-0">
          <DialogHeader className="border-b border-[#e0e9f6] px-5 py-4">
            <DialogTitle className="text-[28px] font-semibold text-slate-900">Address & Slot</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 p-5">
            <div className="rounded-xl border border-[#dbe5f3] bg-white p-4">
              <p className="mb-1 text-sm font-medium text-slate-700">Service Address</p>
              <input
                value={diagnosisAddress}
                onChange={(e) => setDiagnosisAddress(e.target.value)}
                className="h-10 w-full rounded-xl border border-[#d6e2f2] bg-[#fbfdff] px-3 text-sm text-slate-700 outline-none"
                placeholder="Enter service address"
              />
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setDiagnosisPickup(false)}
                  className={cn(
                    'h-9 rounded-xl border px-3 text-[13px] font-medium',
                    !diagnosisPickup ? 'border-[#7bb4ff] bg-[#1d7ff2] text-white' : 'border-[#d5e2f3] bg-white text-slate-700'
                  )}
                >
                  Visit Garage
                </button>
                <button
                  type="button"
                  onClick={() => setDiagnosisPickup(true)}
                  className={cn(
                    'h-9 rounded-xl border px-3 text-[13px] font-medium',
                    diagnosisPickup ? 'border-[#7bb4ff] bg-[#1d7ff2] text-white' : 'border-[#d5e2f3] bg-white text-slate-700'
                  )}
                >
                  Need Pickup
                </button>
              </div>
              <div className="mt-3 rounded-xl border border-[#dbe5f3] bg-[#fbfdff] p-3">
                <p className="text-xs font-medium uppercase tracking-[0.09em] text-slate-500">Schedule</p>
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setDiagnosisScheduleMode('now')}
                    className={cn(
                      'h-9 rounded-xl border px-3 text-[13px] font-medium',
                      diagnosisScheduleMode === 'now' ? 'border-[#7bb4ff] bg-[#1d7ff2] text-white' : 'border-[#d5e2f3] bg-white text-slate-700'
                    )}
                  >
                    Now
                  </button>
                  <button
                    type="button"
                    onClick={() => setDiagnosisScheduleMode('scheduled')}
                    className={cn(
                      'h-9 rounded-xl border px-3 text-[13px] font-medium',
                      diagnosisScheduleMode === 'scheduled' ? 'border-[#7bb4ff] bg-[#1d7ff2] text-white' : 'border-[#d5e2f3] bg-white text-slate-700'
                    )}
                  >
                    Schedule Time
                  </button>
                </div>
                {diagnosisScheduleMode === 'scheduled' ? (
                  <input
                    type="datetime-local"
                    value={diagnosisPreferredAt}
                    onChange={(e) => setDiagnosisPreferredAt(e.target.value)}
                    className="mt-2 h-10 w-full rounded-xl border border-[#d6e2f2] bg-white px-3 text-sm text-slate-700 outline-none"
                  />
                ) : null}
              </div>
            </div>
            <div className="rounded-xl border border-[#dbe5f3] bg-white p-4">
              <p className="mb-2 text-sm font-medium text-slate-700">Contact Details</p>
              <div className="grid gap-2 sm:grid-cols-2">
                <input value={diagnosisName} onChange={(e) => setDiagnosisName(e.target.value)} className="h-10 rounded-xl border border-[#d6e2f2] px-3 text-sm outline-none" placeholder="Name" />
                <input value={diagnosisPhone} onChange={(e) => setDiagnosisPhone(e.target.value)} className="h-10 rounded-xl border border-[#d6e2f2] px-3 text-sm outline-none" placeholder="Phone" />
                <input value={diagnosisAltPhone} onChange={(e) => setDiagnosisAltPhone(e.target.value)} className="h-10 rounded-xl border border-[#d6e2f2] px-3 text-sm outline-none sm:col-span-2" placeholder="Alternate Phone (optional)" />
              </div>
            </div>

            {diagnosisError ? <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{diagnosisError}</p> : null}

            <div className="flex justify-end gap-2 border-t border-[#e7edf5] pt-4">
              <button
                type="button"
                onClick={() => {
                  setDiagnosisLogisticsOpen(false);
                  setDiagnosisChatOpen(true);
                }}
                className="h-10 rounded-xl border border-[#d6e2f2] bg-white px-4 text-sm font-medium text-slate-700"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => void createDiagnosisIssue()}
                disabled={diagnosisSubmitting}
                className="h-10 rounded-xl bg-[#1d7ff2] px-5 text-sm font-medium text-white disabled:opacity-50"
              >
                {diagnosisSubmitting ? 'Creating...' : 'Continue'}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showVehicleForm} onOpenChange={setShowVehicleForm}>
        <DialogContent className="max-h-[92vh] overflow-y-auto rounded-2xl border border-[#cfdff6] bg-[linear-gradient(180deg,#f7fbff_0%,#f3f8ff_100%)] p-0 shadow-[0_28px_64px_rgba(26,54,101,0.26)] sm:max-w-4xl [&>button]:right-5 [&>button]:top-5 [&>button]:rounded-full [&>button]:border [&>button]:border-[#c9daf2] [&>button]:bg-white [&>button]:p-1 [&>button]:text-[#5f7598] [&>button]:opacity-100">
          <DialogHeader className="border-b border-[#d7e5f8] bg-[linear-gradient(180deg,#fafdff_0%,#edf5ff_100%)] px-6 py-5 sm:px-7">
            <DialogTitle className="flex items-center gap-3 text-[28px] font-semibold tracking-tight text-[#0f2244] sm:text-[34px]">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-[#e6f1ff] text-[#2a7cea] shadow-[inset_0_-1px_0_rgba(255,255,255,0.8)]">
                <CarFront className="h-5 w-5" />
              </span>
              {editingVehicle ? 'Edit Vehicle' : 'Add New Vehicle'}
            </DialogTitle>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-[12px] font-medium text-[#60779b]">
              <span className="rounded-full border border-[#cfe1fa] bg-white px-2.5 py-1">Smart RC Autofill</span>
              <span className="rounded-full border border-[#cfe1fa] bg-white px-2.5 py-1">
                {editingVehicle ? 'Update existing vehicle' : 'Create vehicle profile'}
              </span>
            </div>
          </DialogHeader>

          <div className="space-y-4 p-6 sm:p-7">
            <div className="rounded-2xl border border-[#c9ddfb] bg-[linear-gradient(180deg,#f2f8ff_0%,#ebf4ff_100%)] p-4 sm:p-5">
              <div className="grid gap-3 md:grid-cols-[1fr_auto]">
                <div className="space-y-2">
                  <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#4d6fa6]">
                    Upload RC Text
                  </p>
                  <Input
                    value={rcText}
                    onChange={(e) => setRcText(e.target.value)}
                    placeholder="Paste RC text here to auto-fill details..."
                    className="h-11 rounded-xl border-[#bdd3f6] bg-white text-[14px] text-[#233c60] placeholder:text-[#9aa9bf] focus-visible:ring-2 focus-visible:ring-[#78adff]"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={() => void handleApplyRcSuggestion()}
                    disabled={processingRc || !rcText.trim()}
                    className="inline-flex h-11 w-full items-center justify-center rounded-xl border border-[#bcd3f7] bg-white px-5 text-[13px] font-semibold text-[#1f6fdf] transition hover:bg-[#edf4ff] disabled:cursor-not-allowed disabled:opacity-60 md:w-auto"
                  >
                    {processingRc ? 'Applying...' : 'Apply RC Suggestion'}
                  </button>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-[#cfdef2] bg-white p-4 shadow-[0_10px_30px_rgba(80,111,160,0.08)] sm:p-5">
              <div className="mb-4 flex items-center justify-between gap-3 border-b border-[#e8f0fb] pb-3">
                <p className="text-[15px] font-semibold text-[#163153]">Vehicle Details</p>
                <p className="text-[12px] font-medium text-[#7d8fa9]">Fields marked * are required</p>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <LabeledInput id="make" label="Make" value={form.make} required onChange={(v) => setForm((p) => ({ ...p, make: v }))} placeholder="e.g., Toyota" />
                <LabeledInput id="model" label="Model" value={form.model} required onChange={(v) => setForm((p) => ({ ...p, model: v }))} placeholder="e.g., Corolla" />
                <LabeledInput id="year" label="Year" type="number" value={form.year} required onChange={(v) => setForm((p) => ({ ...p, year: v }))} placeholder="e.g., 2022" />
                <LabeledInput id="fuelType" label="Fuel Type" value={form.fuelType} required onChange={(v) => setForm((p) => ({ ...p, fuelType: v }))} placeholder="e.g., Petrol" />
                <LabeledInput id="trim" label="Trim" value={form.trim} onChange={(v) => setForm((p) => ({ ...p, trim: v }))} placeholder="e.g., ZX" />
                <LabeledInput id="mileage" label="Mileage" type="number" value={form.mileage} onChange={(v) => setForm((p) => ({ ...p, mileage: v }))} placeholder="e.g., 12000" />
                <LabeledInput id="engineType" label="Engine Type" value={form.engineType} onChange={(v) => setForm((p) => ({ ...p, engineType: v }))} placeholder="e.g., 1.5L i-VTEC" />
                <LabeledInput id="vin" label="VIN" value={form.vin} onChange={(v) => setForm((p) => ({ ...p, vin: v }))} placeholder="17-character VIN" />
                <LabeledInput id="plateNumber" label="Plate Number" value={form.plateNumber} onChange={(v) => setForm((p) => ({ ...p, plateNumber: v }))} placeholder="e.g., KA01AB1234" />
                {!editingVehicle ? (
                  <LabeledInput id="warrantyDetails" label="Warranty Details" value={form.warrantyDetails} onChange={(v) => setForm((p) => ({ ...p, warrantyDetails: v }))} placeholder="e.g., 3 years / 60,000 KM" />
                ) : null}
              </div>

              {formError ? <p className="mt-3 text-sm font-medium text-red-600">{formError}</p> : null}
            </div>

            <div className="sticky bottom-0 z-10 -mx-6 -mb-6 flex flex-wrap gap-3 border-t border-[#d8e7fb] bg-[linear-gradient(180deg,#f8fbff_0%,#f1f7ff_100%)] px-6 py-4 shadow-[0_-8px_24px_rgba(52,92,158,0.12)] sm:-mx-7 sm:-mb-7 sm:px-7">
              <button
                type="button"
                onClick={() => void handleSaveVehicle()}
                disabled={formSubmitting}
                className="inline-flex h-11 min-w-36 items-center justify-center rounded-xl bg-[linear-gradient(180deg,#2384ff_0%,#1469df_100%)] px-5 text-[13px] font-semibold text-white transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {formSubmitting ? 'Saving...' : editingVehicle ? 'Save Changes' : 'Save Vehicle'}
              </button>
              <button
                type="button"
                onClick={() => setShowVehicleForm(false)}
                className="inline-flex h-11 min-w-28 items-center justify-center rounded-xl border border-[#cfddef] bg-white px-5 text-[13px] font-semibold text-[#365179] transition hover:bg-[#edf3fb]"
              >
                Cancel
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}

function formatInr(amount: number | string) {
  const parsedAmount = Number(amount);
  if (!Number.isFinite(parsedAmount)) return 'INR 0';
  return `INR ${Math.round(parsedAmount).toLocaleString('en-IN')}`;
}

function inferDashboardSeverity(values: string[]): ServiceIntakePayload['issue']['severity'] {
  const lowered = values.map((value) => value.toLowerCase());
  if (lowered.some((value) => value.includes('not') && value.includes('start'))) return 'not_starting';
  if (lowered.some((value) => value.includes('not working'))) return 'not_starting';
  if (lowered.some((value) => value.includes('hard') || value.includes('danger') || value.includes('unsafe'))) return 'risky';
  return 'can_drive';
}

function mapAiSeverityToIssueSeverity(
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
): ServiceIntakePayload['issue']['severity'] {
  if (severity === 'CRITICAL' || severity === 'HIGH') return 'not_starting';
  if (severity === 'MEDIUM') return 'risky';
  return 'can_drive';
}

function mapDashboardWhenHappens(value?: string): ServiceIntakePayload['issue']['whenHappens'] {
  const lower = (value ?? '').toLowerCase();
  if (lower.includes('driv')) return 'driving';
  if (lower.includes('idl')) return 'idling';
  if (lower.includes('brak')) return 'braking';
  return 'starting';
}

function inferDashboardSinceWhen(values: string[]): ServiceIntakePayload['issue']['sinceWhen'] {
  const joined = values.join(' ').toLowerCase();
  if (joined.includes('week')) return 'weeks';
  if (joined.includes('few day')) return 'few_days';
  return 'today';
}

function formatQuoteTime(input: string) {
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return 'Recent';
  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();
  const timeLabel = new Intl.DateTimeFormat('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);

  if (sameDay) return `Today, ${timeLabel}`;

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return `Yesterday, ${timeLabel}`;

  const dateLabel = new Intl.DateTimeFormat('en-IN', {
    month: 'short',
    day: 'numeric',
  }).format(date);
  return `${dateLabel}, ${timeLabel}`;
}

function IconPill({ children }: { children: ReactNode }) {
  return (
    <div className="grid h-8 w-8 place-items-center rounded-full border border-[#d7e2f0] bg-white text-slate-600">
      {children}
    </div>
  );
}

function CardShell({
  children,
  compact = false,
}: {
  children: ReactNode;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        'rounded-xl border border-[#d4e0f0] bg-[#f4f8ff] shadow-[0_6px_16px_rgba(94,126,179,0.10)]',
        compact ? 'p-4' : 'p-4 md:p-[18px]'
      )}
    >
      {children}
    </div>
  );
}

function VehicleBlock({
  vehicle,
  onEdit,
  onSetDefault,
  settingDefault,
}: {
  vehicle: VehicleCard;
  onEdit: () => void;
  onSetDefault: () => void;
  settingDefault?: boolean;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-[#dbe5f2] bg-white">
      <div className="relative">
        {vehicle.isDefault ? (
          <span className="absolute left-2 top-2 rounded-full bg-[#ffe58f] px-2 py-0.5 text-xs font-semibold text-[#805b00]">
            Default
          </span>
        ) : null}
        <img src={vehicle.image} alt={vehicle.name} className="h-32 w-full object-cover" />
      </div>
      <div className="p-4">
        <p className="text-[16px] font-medium text-slate-800">{vehicle.name}</p>
        <p className="text-[12px] text-slate-500">{vehicle.meta}</p>
        <div className="mt-2 flex gap-2">
          <button
            type="button"
            onClick={onEdit}
            className="h-8 rounded-full border border-[#c8dcfb] bg-[#f5f9ff] px-3 text-[13px] font-medium text-[#0f62d6]"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={onSetDefault}
            disabled={vehicle.isDefault || settingDefault}
            className="h-8 rounded-full border border-[#d9e3f3] bg-white px-3 text-[13px] font-medium text-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {vehicle.isDefault ? 'Default' : settingDefault ? 'Setting...' : 'Set Default'}
          </button>
        </div>
      </div>
    </div>
  );
}

function LabeledInput({
  id,
  label,
  value,
  onChange,
  required,
  type = 'text',
  placeholder,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[#5d708f]">
        {label} {required ? <span className="text-red-600">*</span> : null}
      </Label>
      <Input
        id={id}
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="h-12 rounded-xl border border-[#cfdeef] bg-[#fbfdff] px-3 text-[14px] text-[#263f61] placeholder:text-[#9baabc] focus-visible:ring-2 focus-visible:ring-[#78adff]"
      />
    </div>
  );
}

function Pill({
  children,
  active = false,
  onClick,
}: {
  children: ReactNode;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'h-8 rounded-xl border px-2.5 text-[13px] font-medium',
        active ? 'border-[#7bb4ff] bg-[#1d7ff2] text-white' : 'border-[#d5e2f3] bg-white text-slate-700'
      )}
    >
      {children}
    </button>
  );
}

function IssueCard({
  title,
  risk,
  confidence,
  low,
  fair,
  high,
}: {
  title: string;
  risk: string;
  confidence: string;
  low: string;
  fair: string;
  high: string;
}) {
  return (
    <div className="rounded-xl border border-[#dce7f5] bg-[#fbfdff] p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[16px] font-medium text-slate-800">{title}</p>
        <span className="rounded-full bg-[#d9f9e7] px-2 py-0.5 text-[12px] font-medium text-[#117a43]">{confidence}</span>
      </div>
      <p className="mt-1 text-[13px] text-slate-600">Risk: {risk}</p>
      <div className="mt-2 h-2 rounded-full bg-[linear-gradient(90deg,#3d97ff_0%,#6ed777_50%,#ff8e62_100%)]" />
      <div className="mt-2 grid grid-cols-3 gap-2 text-[13px] font-medium text-slate-700">
        <span>{low}</span>
        <span className="text-center">{fair}</span>
        <span className="text-right">{high}</span>
      </div>
    </div>
  );
}

function IssueDetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[#dbe6f5] bg-white p-3">
      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">{label}</p>
      <p className="mt-1 text-sm text-slate-800">{value || '-'}</p>
    </div>
  );
}

function IssueDetailStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[#dbe6f5] bg-white p-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">{label}</p>
      <p className="mt-1 truncate text-[14px] font-semibold text-slate-900">{value || '-'}</p>
    </div>
  );
}

function formatIssueDate(input: string | Date) {
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return 'Invalid date';
  return new Intl.DateTimeFormat('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

function GarageBlock({ garage }: { garage: GarageCard }) {
  return (
    <div className="rounded-xl border border-[#dbe6f4] bg-white p-4">
      <div className="flex gap-3">
        <img src={garage.image} alt={garage.name} className="h-16 w-20 rounded-xl object-cover" />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="truncate text-[16px] font-medium text-slate-800">{garage.name}</p>
            <span className="rounded-lg bg-[#f8a401] px-2 py-1 text-[12px] font-medium text-white">{garage.price}</span>
          </div>
          <p className="text-[13px] text-slate-600">
            {garage.rating} ★ · {garage.reviews}
          </p>
          <p className="text-[12px] text-slate-500">{garage.distance}</p>
        </div>
      </div>
    </div>
  );
}

function MiniQuote({ garage, when }: { garage: string; when: string }) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-[#dbe6f4] bg-white px-3 py-2">
      <div className="grid h-8 w-8 place-items-center rounded-full bg-[#e6f1ff] text-[#1e74ea]">
        <Car className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[14px] font-medium text-slate-800">{garage}</p>
        <p className="truncate text-xs text-slate-500">{when}</p>
      </div>
      <Circle className="h-3 w-3 fill-[#8cc2ff] text-[#8cc2ff]" />
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string;
  sub?: string;
  tone: 'blue' | 'orange' | 'green' | 'yellow';
}) {
  const toneClass = {
    blue: 'bg-[#e8f2ff] text-[#1d74ea]',
    orange: 'bg-[#fff2e3] text-[#e58516]',
    green: 'bg-[#e7faef] text-[#1d9960]',
    yellow: 'bg-[#fff8df] text-[#cf980e]',
  }[tone];

  return (
    <div className="flex items-center gap-3 rounded-xl border border-[#dbe6f4] bg-white p-3">
      <div className={cn('grid h-9 w-9 place-items-center rounded-lg', toneClass)}>
        <Wrench className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-slate-500">{label}</p>
        <p className="truncate text-[20px] font-semibold leading-tight text-slate-900">{value}</p>
        {sub ? <p className="truncate text-xs text-slate-500">{sub}</p> : null}
      </div>
    </div>
  );
}
