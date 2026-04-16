function resolveApiBaseUrl() {
  const configured = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
  if (configured) return configured;
  if (process.env.NODE_ENV !== 'production') return 'http://localhost:3000/api';
  if (typeof window !== 'undefined') return '/api';
  const vercelUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL;
  if (vercelUrl) return `https://${vercelUrl}/api`;
  return '/api';
}

export const API_BASE_URL = resolveApiBaseUrl();

const TENANT_ID = process.env.NEXT_PUBLIC_TENANT_ID ?? 'default';

export type AppIdentityConfig = {
  name: string;
  tagline: string;
  logoUrl: string;
};

export type AuthLoginPageContent = {
  appName: string;
  authModeLabel: string;
  hero: {
    kicker: string;
    title: string;
    body: string;
  };
  links: {
    needAccountPrefix: string;
    needAccountCta: string;
  };
  form: {
    title: string;
    subtitle: string;
    phoneLabel: string;
    phonePlaceholder: string;
    sendOtpLabel: string;
    sendingOtpLabel: string;
    socialDividerLabel: string;
    continueWithGoogleLabel: string;
    continueWithAppleLabel: string;
  };
  errors: {
    phoneInvalid: string;
    sendOtpFailed: string;
    unexpected: string;
  };
};

export type AuthRegisterPageContent = {
  appName: string;
  authModeLabel: string;
  hero: {
    kicker: string;
    title: string;
    body: string;
  };
  links: {
    haveAccountPrefix: string;
    haveAccountCta: string;
  };
  form: {
    title: string;
    subtitle: string;
    fullNameLabel: string;
    fullNamePlaceholder: string;
    phoneLabel: string;
    phonePlaceholder: string;
    termsLabel: string;
    createAccountLabel: string;
    sendingOtpLabel: string;
    socialDividerLabel: string;
    continueWithGoogleLabel: string;
    continueWithAppleLabel: string;
  };
  errors: {
    fullNameRequired: string;
    phoneInvalid: string;
    termsRequired: string;
    sendOtpFailed: string;
    unexpected: string;
  };
};

export type AuthVerifyPageContent = {
  appName: string;
  authModeLabel: string;
  hero: {
    kicker: string;
    title: string;
    body: string;
  };
  links: {
    backToPrefix: string;
    backToRegisterCta: string;
    backToLoginCta: string;
  };
  form: {
    title: string;
    subtitleTemplate: string;
    otpLabel: string;
    otpPlaceholder: string;
    ctaLabel: string;
    ctaLoadingLabel: string;
  };
  errors: {
    otpInvalid: string;
    verifyFailed: string;
    unexpected: string;
  };
};

export type AuthPageContentMap = {
  login: AuthLoginPageContent;
  register: AuthRegisterPageContent;
  verify: AuthVerifyPageContent;
};

export type AuthPage = keyof AuthPageContentMap;

export type UserSidebarContent = {
  brandName: string;
  brandTagline: string;
  logoUrl?: string;
  quickScanLabel: string;
  nav: {
    dashboard: string;
    profile: string;
    'my-garage': string;
    'ai-diagnosis': string;
    'quotes-bookings': string;
    'spare-parts': string;
    payments: string;
    settings: string;
    support: string;
  };
};

export type UserPageContent = {
  kicker: string;
  title: string;
  description: string;
  emptyStateTitle: string;
  emptyStateBody: string;
};

export type UserMyGarageContent = {
  topBar: {
    sectionLabel: string;
    searchPlaceholder: string;
    bookAppointmentLabel: string;
  };
  header: {
    title: string;
    description: string;
    uploadRcLabel: string;
    addVehicleLabel: string;
    activeFleetLabel: string;
    serviceHistoryLabel: string;
    viewAllHistoryLabel: string;
    registerVehicleLabel: string;
  };
  fleetCards: Array<{
    statusLabel: string;
    vehicleName: string;
    vehicleMeta: string;
    completionPercentLabel: string;
  }>;
  hero: {
    title: string;
    subtitle: string;
    odometerLabel: string;
    odometerValue: string;
  };
  serviceHistory: Array<{
    title: string;
    subtitle: string;
    dateLabel: string;
    statusLabel: string;
  }>;
  promotion: {
    title: string;
    description: string;
    ctaLabel: string;
  };
  states: {
    loadingVehiclesLabel: string;
    noVehiclesLabel: string;
    loadingHistoryLabel: string;
    noHistoryLabel: string;
  };
  forms: {
    addVehicleTitle: string;
    rcInputLabel: string;
    rcInputPlaceholder: string;
    applyRcSuggestionLabel: string;
    makeLabel: string;
    modelLabel: string;
    yearLabel: string;
    fuelTypeLabel: string;
    trimLabel: string;
    mileageLabel: string;
    engineTypeLabel: string;
    vinLabel: string;
    plateLabel: string;
    saveVehicleLabel: string;
    cancelLabel: string;
    selectVehicleLabel: string;
    addVehicleSuccessLabel: string;
    requiredFieldsErrorLabel: string;
    loadVehiclesErrorLabel: string;
    loadHistoryErrorLabel: string;
    processRcErrorLabel: string;
    addVehicleErrorLabel: string;
    editVehicleLabel: string;
    deleteVehicleLabel: string;
    setDefaultLabel: string;
    warrantyLabel: string;
    warrantyPlaceholder: string;
  };
  maintenance: {
    title: string;
    description: string;
    emptyLabel: string;
    urgencyLow: string;
    urgencyMedium: string;
    urgencyHigh: string;
  };
};

export type UserAiDiagnosisContent = {
  header: {
    title: string;
    description: string;
    subtitle: string;
  };
  input: {
    symptomsLabel: string;
    symptomsPlaceholder: string;
    uploadMediaLabel: string;
    categoriesLabel: string;
    categories: string[];
    analyzeButtonLabel: string;
    analyzingLabel: string;
    addMoreSymptomsLabel: string;
  };
  results: {
    title: string;
    urgencyLabel: string;
    riskLabel: string;
    issueLabel: string;
    solutionLabel: string;
    partsEstimateLabel: string;
    diyLabel: string;
    garageLabel: string;
    bookGarageLabel: string;
    viewDiyLabel: string;
  };
  states: {
    errorLabel: string;
  };
};

export type UserQuotesBookingsContent = {
  header: {
    title: string;
    description: string;
    tabs: {
      quotes: string;
      bookings: string;
    };
  };
  quotes: {
    emptyStateTitle: string;
    emptyStateDescription: string;
    requestSummaryLabel: string;
    quoteCountPrefix: string;
    compareLabel: string;
    partsLabel: string;
    laborLabel: string;
    totalLabel: string;
    distanceSuffix: string;
    bookNowLabel: string;
    bestMatchBadge: string;
    fairPriceBadge: string;
    aboveMarketBadge: string;
  };
  bookings: {
    emptyStateTitle: string;
    emptyStateDescription: string;
    appointmentLabel: string;
    checkInLabel: string;
    statusBooked: string;
    statusInService: string;
    statusCompleted: string;
    getDirectionsLabel: string;
    cancelBookingLabel: string;
  };
};

export type UserPaymentsContent = {
  header: {
    title: string;
    description: string;
  };
  stats: {
    totalSpentLabel: string;
    outstandingLabel: string;
    creditsLabel: string;
  };
  transactions: {
    title: string;
    description: string;
    table: {
      date: string;
      service: string;
      amount: string;
      status: string;
    };
  };
  methods: {
    title: string;
    addMethodLabel: string;
    expiryLabel: string;
  };
};

export type UserDashboardContent = {
  hero: {
    welcomePrefix: string;
    userNameDefault: string;
    description: string;
  };
  stats: {
    activeVehicles: string;
    pendingQuotes: string;
    upcomingBookings: string;
  };
  actions: {
    title: string;
    diagnosis: {
      title: string;
      description: string;
    };
    garage: {
      title: string;
      description: string;
    };
    quotes: {
      title: string;
      description: string;
    };
  };
};

export type UserPage =
  | 'dashboard'
  | 'profile'
  | 'my-garage'
  | 'ai-diagnosis'
  | 'quotes-bookings'
  | 'spare-parts'
  | 'payments'
  | 'settings'
  | 'support';

async function getUIContent<T>(params: {
  module: string;
  page: string;
  locale?: string;
  tenantId?: string;
  fallback: T;
}): Promise<T> {
  const query = new URLSearchParams({
    module: params.module,
    page: params.page,
    locale: params.locale ?? 'en-US',
    tenant_id: params.tenantId ?? TENANT_ID,
  });

  try {
    const response = await fetch(`${API_BASE_URL}/ui-content?${query.toString()}`, {
      cache: 'no-store',
    });
    if (!response.ok) {
      throw new Error(`Failed to load UI content (${response.status})`);
    }
    return (await response.json()) as T;
  } catch (error) {
    console.warn('[web] using fallback ui content:', error);
    return params.fallback;
  }
}

const AUTH_DEFAULTS: AuthPageContentMap = {
  login: {
    appName: 'WrectifAI',
    authModeLabel: 'Phone + OTP authentication',
    hero: {
      kicker: 'AUTOMOTIVE INTELLIGENCE',
      title: 'Experience Surgical Precision in Car Care.',
      body: 'Join the elite ecosystem of automotive specialists and enthusiasts.',
    },
    links: {
      needAccountPrefix: 'Need an account?',
      needAccountCta: 'Register',
    },
    form: {
      title: 'Welcome Back',
      subtitle: 'Login with your 10-digit phone number.',
      phoneLabel: 'Phone Number *',
      phonePlaceholder: '9876543210',
      sendOtpLabel: 'Send OTP',
      sendingOtpLabel: 'Sending OTP...',
      socialDividerLabel: 'or continue with',
      continueWithGoogleLabel: 'Continue with Google',
      continueWithAppleLabel: 'Continue with Apple',
    },
    errors: {
      phoneInvalid: 'Phone number must be 10 digits',
      sendOtpFailed: 'Unable to send OTP',
      unexpected: 'Unexpected error',
    },
  },
  register: {
    appName: 'WrectifAI',
    authModeLabel: 'Phone + OTP authentication',
    hero: {
      kicker: 'AUTOMOTIVE INTELLIGENCE',
      title: 'Experience Surgical Precision in Car Care.',
      body: 'Join the elite ecosystem of automotive specialists and enthusiasts.',
    },
    links: {
      haveAccountPrefix: 'Already have an account?',
      haveAccountCta: 'Login',
    },
    form: {
      title: 'Create Account',
      subtitle: 'Start your journey with WrectifAI precision today.',
      fullNameLabel: 'Full Name *',
      fullNamePlaceholder: 'John Doe',
      phoneLabel: 'Phone Number *',
      phonePlaceholder: '9876543210',
      termsLabel: 'I agree to the Terms and Privacy Policy *',
      createAccountLabel: 'Create Account',
      sendingOtpLabel: 'Sending OTP...',
      socialDividerLabel: 'or continue with',
      continueWithGoogleLabel: 'Continue with Google',
      continueWithAppleLabel: 'Continue with Apple',
    },
    errors: {
      fullNameRequired: 'Full name is required',
      phoneInvalid: 'Phone number must be 10 digits',
      termsRequired: 'Please accept terms to continue',
      sendOtpFailed: 'Unable to send OTP',
      unexpected: 'Unexpected error',
    },
  },
  verify: {
    appName: 'WrectifAI',
    authModeLabel: 'Phone + OTP authentication',
    hero: {
      kicker: 'AUTOMOTIVE INTELLIGENCE',
      title: 'Verify Your Secure Access.',
      body: 'Security check for your account session.',
    },
    links: {
      backToPrefix: 'Back to',
      backToRegisterCta: 'Register',
      backToLoginCta: 'Login',
    },
    form: {
      title: 'Verify OTP',
      subtitleTemplate: 'Please enter 6 digit OTP sent to {phone}.',
      otpLabel: 'OTP',
      otpPlaceholder: 'Please enter 6 digit OTP',
      ctaLabel: 'Verify and Continue',
      ctaLoadingLabel: 'Verifying...',
    },
    errors: {
      otpInvalid: 'OTP must be 6 digits',
      verifyFailed: 'Unable to verify OTP',
      unexpected: 'Unexpected error',
    },
  },
};

const USER_SIDEBAR_DEFAULT: UserSidebarContent = {
  brandName: 'PrecisionCurator',
  brandTagline: 'MASTER TECHNICIAN',
  logoUrl: 'https://wrectifai.s3.ap-south-1.amazonaws.com/Assests+/Logo.jpeg',
  quickScanLabel: 'Quick Scan',
  nav: {
    dashboard: 'Dashboard',
    profile: 'Profile',
    'my-garage': 'My Garage',
    'ai-diagnosis': 'AI Diagnosis',
    'quotes-bookings': 'Quotes & Bookings',
    'spare-parts': 'Spare Parts',
    payments: 'Payments',
    settings: 'Settings',
    support: 'Support',
  },
};

const USER_PAGE_DEFAULTS: Record<UserPage, UserPageContent> = {
  dashboard: {
    kicker: 'Service Hub',
    title: 'Dashboard',
    description: 'Track your complete service experience across diagnostics, bookings, and payments.',
    emptyStateTitle: 'Dashboard Insights Coming Soon',
    emptyStateBody: 'This section will show summary cards, pending tasks, and activity feed.',
  },
  profile: {
    kicker: 'Service Hub',
    title: 'Profile',
    description: 'Manage your personal details used across diagnostics, booking, and checkout.',
    emptyStateTitle: 'Profile Details',
    emptyStateBody: 'Update your profile information and keep your account up to date.',
  },
  'my-garage': {
    kicker: 'Service Hub',
    title: 'My Garage',
    description: 'Manage your vehicles and preventive maintenance from one workspace.',
    emptyStateTitle: 'Garage Overview Coming Soon',
    emptyStateBody: 'Vehicle cards, history, and smart recommendations will be displayed here.',
  },
  'ai-diagnosis': {
    kicker: 'Service Hub',
    title: 'AI Diagnosis',
    description: 'Describe issues and get guided, AI-powered diagnosis recommendations.',
    emptyStateTitle: 'AI Diagnosis Coming Soon',
    emptyStateBody: 'Symptom input, media upload, and guided checks will appear here.',
  },
  'quotes-bookings': {
    kicker: 'Service Hub',
    title: 'Quotes & Bookings',
    description: 'Compare garage quotations and manage your appointments in one place.',
    emptyStateTitle: 'Quotes & Bookings Coming Soon',
    emptyStateBody: 'Quote comparison and booking timeline modules will be added here.',
  },
  'spare-parts': {
    kicker: 'Service Hub',
    title: 'Spare Parts',
    description: 'Browse recommended parts and track part requests from your service flow.',
    emptyStateTitle: 'Spare Parts Marketplace Coming Soon',
    emptyStateBody: 'Parts catalog, filters, and order status components will be added here.',
  },
  payments: {
    kicker: 'Service Hub',
    title: 'Payments',
    description: 'View invoices, receipts, and payment status for all your service orders.',
    emptyStateTitle: 'Payments Center Coming Soon',
    emptyStateBody: 'Invoice history, payment methods, and transaction details will be shown here.',
  },
  settings: {
    kicker: 'Service Hub',
    title: 'Settings',
    description: 'Manage profile preferences, notifications, and app-level configurations.',
    emptyStateTitle: 'Settings Panel Coming Soon',
    emptyStateBody: 'Account and preference controls will be available in this section.',
  },
  support: {
    kicker: 'Service Hub',
    title: 'Support',
    description: 'Get help, raise issues, and connect with service support quickly.',
    emptyStateTitle: 'Support Center Coming Soon',
    emptyStateBody: 'Help topics, ticket tracking, and support contact options will be available here.',
  },
};

const USER_MY_GARAGE_DEFAULT: UserMyGarageContent = {
  topBar: {
    sectionLabel: 'Service Hub',
    searchPlaceholder: 'Search components, VINs or fleet...',
    bookAppointmentLabel: 'Book Appointment',
  },
  header: {
    title: 'My Garage',
    description: 'Manage your fleet and track precision maintenance schedules with AI-driven insights.',
    uploadRcLabel: 'Upload RC',
    addVehicleLabel: 'Add New Vehicle',
    activeFleetLabel: 'Active Fleet',
    serviceHistoryLabel: 'Service History',
    viewAllHistoryLabel: 'View All History',
    registerVehicleLabel: 'Register Vehicle',
  },
  fleetCards: [
    {
      statusLabel: 'Optimal',
      vehicleName: '2022 BMW M3',
      vehicleMeta: 'Sedan - Alpine White',
      completionPercentLabel: '98%',
    },
    {
      statusLabel: 'Service Due',
      vehicleName: '2018 Toyota RAV4',
      vehicleMeta: 'SUV - Magnetic Gray',
      completionPercentLabel: '62%',
    },
  ],
  hero: {
    title: '2022 BMW M3',
    subtitle: 'Competition Package - xDrive',
    odometerLabel: 'Current Odometer',
    odometerValue: '12,482 mi',
  },
  serviceHistory: [
    {
      title: 'Routine Oil Change',
      subtitle: 'Synthetic 0W-30 - BMW Service Center',
      dateLabel: 'Oct 12, 2023',
      statusLabel: 'Completed',
    },
    {
      title: 'Brake Pad Replacement',
      subtitle: 'Ceramic Front Pads - Specialized Auto',
      dateLabel: 'Aug 04, 2023',
      statusLabel: 'Completed',
    },
    {
      title: 'Tire Rotation & Balancing',
      subtitle: 'All 4 Wheels - Michelin Certified Service',
      dateLabel: 'Jun 15, 2023',
      statusLabel: 'Completed',
    },
  ],
  promotion: {
    title: 'Extended Protection',
    description:
      'Upgrade your drivetrain warranty for another 24 months with exclusive partner rates and peace of mind coverage.',
    ctaLabel: 'Explore Extensions',
  },
  states: {
    loadingVehiclesLabel: 'Loading vehicles...',
    noVehiclesLabel: 'No vehicles found. Add your first vehicle.',
    loadingHistoryLabel: 'Loading service history...',
    noHistoryLabel: 'No service history yet for this vehicle.',
  },
  forms: {
    addVehicleTitle: 'Add New Vehicle',
    rcInputLabel: 'Upload RC Text',
    rcInputPlaceholder: 'Paste RC text here to auto-fill details...',
    applyRcSuggestionLabel: 'Apply RC Suggestion',
    makeLabel: 'Make *',
    modelLabel: 'Model *',
    yearLabel: 'Year *',
    fuelTypeLabel: 'Fuel Type *',
    trimLabel: 'Trim',
    mileageLabel: 'Mileage',
    engineTypeLabel: 'Engine Type',
    vinLabel: 'VIN',
    plateLabel: 'Plate Number',
    saveVehicleLabel: 'Save Vehicle',
    cancelLabel: 'Cancel',
    selectVehicleLabel: 'Select',
    addVehicleSuccessLabel: 'Vehicle added successfully.',
    requiredFieldsErrorLabel: 'Make, model, year, and fuel type are required.',
    loadVehiclesErrorLabel: 'Failed to load vehicles.',
    loadHistoryErrorLabel: 'Failed to load service history.',
    processRcErrorLabel: 'Failed to process RC.',
    addVehicleErrorLabel: 'Failed to add vehicle.',
    editVehicleLabel: 'Edit Vehicle',
    deleteVehicleLabel: 'Delete Vehicle',
    setDefaultLabel: 'Set as Default',
    warrantyLabel: 'Warranty Details',
    warrantyPlaceholder: 'e.g., 3 yrs / 36,000 mi comprehensive',
  },
  maintenance: {
    title: 'Preventive Maintenance',
    description: 'AI-driven suggestions based on your vehicle profile and history.',
    emptyLabel: 'Your vehicle is in peak condition. No maintenance due.',
    urgencyLow: 'Upcoming',
    urgencyMedium: 'Due Soon',
    urgencyHigh: 'Immediate Action',
  },
};

export const USER_AI_DIAGNOSIS_DEFAULT: UserAiDiagnosisContent = {
  header: {
    title: 'AI Diagnostics',
    description: 'Describe the symptoms, add media if necessary, and our AI will formulate a preliminary diagnosis.',
    subtitle: 'Upload engine sounds, warning lights, or describe the issue below.'
  },
  input: {
    symptomsLabel: 'Describe Symptoms',
    symptomsPlaceholder: 'e.g., Car shakes at high speeds and steering wheel vibrates...',
    uploadMediaLabel: 'Upload Media (Image / Video / Audio)',
    categoriesLabel: 'Common Symptoms',
    categories: ['Engine Noise', 'Vibration', 'Brake Squeak', 'Warning Light', 'Strange Smell', 'Fluid Leak'],
    analyzeButtonLabel: 'Analyze Symptoms',
    analyzingLabel: 'AI is analyzing your symptoms...',
    addMoreSymptomsLabel: '+ Add More Context'
  },
  results: {
    title: 'Diagnosis Report',
    urgencyLabel: 'Urgency',
    riskLabel: 'Risk if Ignored',
    issueLabel: 'Identified Issue',
    solutionLabel: 'Recommended Solution',
    partsEstimateLabel: 'Estimated Parts & Labor',
    diyLabel: 'DIY Friendly',
    garageLabel: 'Requires Garage',
    bookGarageLabel: 'Book Garage Now',
    viewDiyLabel: 'View DIY Steps'
  },
  states: {
    errorLabel: 'Something went wrong during analysis.'
  }
};

export const USER_QUOTES_BOOKINGS_DEFAULT: UserQuotesBookingsContent = {
  header: {
    title: 'Marketplace',
    description: 'Compare mechanic quotes for your requested issues and tracking your active bookings.',
    tabs: {
      quotes: 'Active Quotes',
      bookings: 'My Bookings',
    }
  },
  quotes: {
    emptyStateTitle: 'No Active Requests',
    emptyStateDescription: 'Submit an issue in the AI Diagnosis or Garage tab to receive mechanic quotations.',
    requestSummaryLabel: 'Issue Summary:',
    quoteCountPrefix: 'Quotations received:',
    compareLabel: 'Compare Pricing',
    partsLabel: 'Parts',
    laborLabel: 'Labor',
    totalLabel: 'Total',
    distanceSuffix: 'miles away',
    bookNowLabel: 'Accept & Book',
    bestMatchBadge: 'Best Match',
    fairPriceBadge: 'Fair Market Price',
    aboveMarketBadge: 'Above Market'
  },
  bookings: {
    emptyStateTitle: 'No Active Bookings',
    emptyStateDescription: 'Accepted quotes will appear here as tracked service appointments.',
    appointmentLabel: 'Appointment:',
    checkInLabel: 'Check-in:',
    statusBooked: 'Confirmed',
    statusInService: 'In Service',
    statusCompleted: 'Completed',
    getDirectionsLabel: 'Get Directions',
    cancelBookingLabel: 'Cancel Appointment',
  }
};

export async function getAuthPageContent<TPage extends AuthPage>(
  page: TPage,
  options?: { locale?: string; tenantId?: string }
): Promise<AuthPageContentMap[TPage]> {
  const content = await getUIContent<unknown>({
    module: 'auth',
    page,
    locale: options?.locale,
    tenantId: options?.tenantId,
    fallback: AUTH_DEFAULTS[page] as unknown,
  });
  return mergeWithFallback(AUTH_DEFAULTS[page], content) as AuthPageContentMap[TPage];
}

function mergeWithFallback<T>(fallback: T, value: unknown): T {
  if (Array.isArray(fallback)) {
    return (Array.isArray(value) ? value : fallback) as T;
  }

  if (isRecord(fallback)) {
    if (!isRecord(value)) {
      return fallback;
    }
    const merged: Record<string, unknown> = {};
    for (const key of Object.keys(fallback)) {
      merged[key] = mergeWithFallback(
        (fallback as Record<string, unknown>)[key],
        value[key]
      );
    }
    return merged as T;
  }

  if (typeof fallback === 'string') {
    return (typeof value === 'string' ? value : fallback) as T;
  }
  if (typeof fallback === 'number') {
    return (typeof value === 'number' ? value : fallback) as T;
  }
  if (typeof fallback === 'boolean') {
    return (typeof value === 'boolean' ? value : fallback) as T;
  }

  return (value ?? fallback) as T;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export async function getUserSidebarContent(options?: {
  locale?: string;
  tenantId?: string;
}) {
  const [sidebar, appIdentity] = await Promise.all([
    getUIContent<UserSidebarContent>({
      module: 'user',
      page: 'sidebar',
      locale: options?.locale,
      tenantId: options?.tenantId,
      fallback: USER_SIDEBAR_DEFAULT,
    }),
    getAppIdentityConfig(),
  ]);

  return {
    ...sidebar,
    brandName: sidebar.brandName || appIdentity.name,
    logoUrl: appIdentity.logoUrl || sidebar.logoUrl,
  };
}

export async function getUserPageContent(
  page: UserPage,
  options?: { locale?: string; tenantId?: string }
) {
  return getUIContent<UserPageContent>({
    module: 'user',
    page,
    locale: options?.locale,
    tenantId: options?.tenantId,
    fallback: USER_PAGE_DEFAULTS[page],
  });
}

export async function getUserMyGarageContent(options?: {
  locale?: string;
  tenantId?: string;
}) {
  return getUIContent<UserMyGarageContent>({
    module: 'user',
    page: 'my-garage',
    locale: options?.locale,
    tenantId: options?.tenantId,
    fallback: USER_MY_GARAGE_DEFAULT,
  });
}

export async function getAiDiagnosisContent(options?: {
  locale?: string;
  tenantId?: string;
}) {
  return getUIContent<UserAiDiagnosisContent>({
    module: 'user',
    page: 'ai-diagnosis',
    locale: options?.locale,
    tenantId: options?.tenantId,
    fallback: USER_AI_DIAGNOSIS_DEFAULT,
  });
}

export type UserVehicle = {
  id: string;
  make: string;
  model: string;
  year: number;
  fuelType: string;
  mileage: number | null;
  trim: string | null;
  engineType: string | null;
  vin: string | null;
  plateNumber: string | null;
  isDefault: boolean;
  historyCount: number;
};

export type VehicleHistoryEntry = {
  id: string;
  title: string;
  subtitle: string;
  date: string;
  status: string;
};

export async function fetchUserVehicles(search = '') {
  const query = new URLSearchParams();
  if (search.trim()) query.set('search', search.trim());
  const response = await fetch(`${API_BASE_URL}/vehicles?${query.toString()}`, {
    credentials: 'include',
    cache: 'no-store',
  });
  if (!response.ok) throw new Error('Failed to fetch vehicles');
  const data = (await response.json()) as { vehicles: UserVehicle[] };
  return data.vehicles;
}

export async function addUserVehicle(input: {
  make: string;
  model: string;
  year: number;
  fuelType: string;
  mileage?: number;
  trim?: string;
  engineType?: string;
  vin?: string;
  plateNumber?: string;
  isDefault?: boolean;
  warrantyDetails?: string;
}) {
  const response = await fetch(`${API_BASE_URL}/vehicles`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  const data = (await response.json()) as { message?: string; vehicleId?: string };
  if (!response.ok) throw new Error(data.message ?? 'Failed to add vehicle');
  return data;
}

export async function updateUserVehicle(
  vehicleId: string,
  input: Partial<{
    make: string;
    model: string;
    year: number;
    fuelType: string;
    mileage: number;
    trim: string;
    engineType: string;
    vin: string;
    plateNumber: string;
  }>
) {
  const response = await fetch(`${API_BASE_URL}/vehicles/${encodeURIComponent(vehicleId)}`, {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  const data = (await response.json()) as { message?: string };
  if (!response.ok) throw new Error(data.message ?? 'Failed to update vehicle');
  return data;
}

export async function setDefaultUserVehicle(vehicleId: string) {
  const response = await fetch(`${API_BASE_URL}/vehicles/${encodeURIComponent(vehicleId)}/set-default`, {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  });
  const data = (await response.json()) as { message?: string };
  if (!response.ok) throw new Error(data.message ?? 'Failed to set default vehicle');
  return data;
}

export async function deleteUserVehicle(vehicleId: string) {
  const response = await fetch(`${API_BASE_URL}/vehicles/${encodeURIComponent(vehicleId)}`, {
    method: 'DELETE',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  });
  const data = (await response.json()) as { message?: string };
  if (!response.ok) throw new Error(data.message ?? 'Failed to delete vehicle');
  return data;
}

export async function uploadRcAndSuggest(rcText: string) {
  const response = await fetch(`${API_BASE_URL}/vehicles/upload-rc`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rcText }),
  });
  const data = (await response.json()) as {
    message?: string;
    suggestion?: {
      make?: string;
      model?: string;
      year?: number;
      fuelType?: string;
      vin?: string;
      plateNumber?: string;
    };
  };
  if (!response.ok) throw new Error(data.message ?? 'Failed to process RC');
  return data.suggestion ?? {};
}

export async function fetchVehicleHistory(vehicleId: string, search = '') {
  const query = new URLSearchParams();
  if (search.trim()) query.set('search', search.trim());
  const response = await fetch(
    `${API_BASE_URL}/vehicles/${encodeURIComponent(vehicleId)}/history?${query.toString()}`,
    {
      credentials: 'include',
      cache: 'no-store',
    }
  );
  if (!response.ok) throw new Error('Failed to fetch service history');
  const data = (await response.json()) as { history: VehicleHistoryEntry[] };
  return data.history;
}

export type AiDiagnosisMockResult = {
  id: string;
  issue: string;
  solution: string;
  urgency: 'Low' | 'Medium' | 'High' | 'Critical';
  riskIfIgnored: string;
  requiresGarage: boolean;
  draftQuote: {
    totalEstimate: string;
    parts: string[];
    laborTime: string;
  };
};

export async function createDiagnosisSession(input: {
  vehicleId: string;
  symptoms: string;
  attachments?: string[];
}): Promise<{ diagnosisSessionId: string; diagnoses: AiDiagnosisMockResult[] }> {
  const response = await fetch(`${API_BASE_URL}/diagnosis/sessions`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  const data = (await response.json()) as {
    message?: string;
    diagnosisSessionId?: string;
    diagnoses?: AiDiagnosisMockResult[];
  };
  if (!response.ok) throw new Error(data.message ?? 'Failed to analyze symptoms');
  return {
    diagnosisSessionId: data.diagnosisSessionId ?? '',
    diagnoses: data.diagnoses ?? [],
  };
}

export type ServiceIntakePayload = {
  source: 'diagnosis' | 'direct';
  diagnosisSessionId?: string;
  vehicle: {
    id?: string;
    type: 'car' | 'bike' | 'other';
    brand: string;
    model: string;
    year: number;
    fuel: string;
    variant?: string;
  };
  issue: {
    category: string;
    symptoms: string[];
    severity: 'can_drive' | 'risky' | 'not_starting';
    description?: string;
    sinceWhen?: 'today' | 'few_days' | 'weeks';
    whenHappens?: 'starting' | 'driving' | 'idling' | 'braking';
    answers?: Record<string, string>;
  };
  media: Array<{
    type: 'image' | 'video' | 'audio';
    name: string;
  }>;
  location: {
    lat?: number;
    lng?: number;
    address: string;
  };
  serviceType: 'pickup' | 'visit';
  schedule: {
    mode: 'now' | 'scheduled';
    preferredAt?: string;
  };
  user: {
    name: string;
    phone: string;
    alternatePhone?: string;
  };
};

export type DynamicDiagnosisQuestion = {
  id: string;
  type: 'single_select' | 'boolean' | 'text' | 'file';
  label: string;
  options?: string[];
  required: boolean;
};

export async function fetchDynamicDiagnosisQuestions(input: {
  prompt: string;
  firstAnswer: string;
  category?: string;
  mode?: 'diagnosis' | 'direct';
  maxQuestions?: number;
}): Promise<DynamicDiagnosisQuestion[]> {
  const response = await fetch(`${API_BASE_URL}/diagnosis/dynamic-questions`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  const data = (await response.json()) as {
    message?: string;
    questions?: DynamicDiagnosisQuestion[];
  };
  if (!response.ok) throw new Error(data.message ?? 'Failed to generate dynamic questions');
  return data.questions ?? [];
}

export async function submitServiceIntake(input: ServiceIntakePayload): Promise<{ issueId: string }> {
  const response = await withSessionRefreshRetry(() =>
    fetch(`${API_BASE_URL}/marketplace/intake`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    })
  );
  const data = (await response.json()) as { message?: string; issueId?: string };
  if (!response.ok) throw new Error(data.message ?? 'Failed to submit service request');
  if (!data.issueId) throw new Error('Issue ID was not returned');
  return { issueId: data.issueId };
}

export async function getQuotesBookingsContent(options?: {
  locale?: string;
  tenantId?: string;
}) {
  return getUIContent<UserQuotesBookingsContent>({
    module: 'user',
    page: 'quotes-bookings',
    locale: options?.locale,
    tenantId: options?.tenantId,
    fallback: USER_QUOTES_BOOKINGS_DEFAULT,
  });
}

export type MockIssueRequest = {
  id: string;
  summary: string;
  quotes: MockQuote[];
  status?: string;
  createdAt?: string | Date;
  source?: 'diagnosis' | 'direct';
  severity?: string;
  vehicleLabel?: string;
};

export type MockQuote = {
  id: string;
  garageName: string;
  garageRating: string;
  distance: number;
  partsCost: number;
  laborCost: number;
  totalCost: number;
  comparisonLabel: 'below_market' | 'fair' | 'above_market';
  isBestMatch: boolean;
  status?: 'submitted' | 'selected' | 'rejected' | string;
};

export type MockBooking = {
  id: string;
  vehicleStr: string;
  garageName: string;
  appointmentTime: string | Date;
  checkInMode: string;
  status: 'booked' | 'in_service' | 'completed' | 'cancelled' | 'confirmed';
  totalCost: string;
  paymentStatus?: 'paid' | 'unpaid' | 'failed' | 'pending';
};

export async function createIssueRequest(input: {
  vehicleId: string;
  summary: string;
  diagnosisSessionId?: string;
}) {
  const response = await fetch(`${API_BASE_URL}/marketplace/issues`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  const data = (await response.json()) as { message?: string; issueId?: string };
  if (!response.ok) throw new Error(data.message ?? 'Failed to raise issue request');
  return data;
}

export type IssueRequestListItem = {
  id: string;
  summary: string;
  quoteCount: number;
  status?: string;
  createdAt?: string | Date;
  source?: 'diagnosis' | 'direct';
  severity?: string;
  vehicleLabel?: string;
};

export async function fetchIssueRequests(): Promise<IssueRequestListItem[]> {
  const response = await fetch(`${API_BASE_URL}/marketplace/issues`, {
    credentials: 'include',
    cache: 'no-store',
  });
  const data = (await response.json()) as {
    message?: string;
    issues?: IssueRequestListItem[];
  };
  if (!response.ok) throw new Error(data.message ?? 'Failed to load issue requests');
  return data.issues ?? [];
}

export type IssueDetail = {
  id: string;
  summary: string;
  status: string;
  source: 'diagnosis' | 'direct';
  quoteCount: number;
  createdAt: string | Date;
  vehicleLabel: string;
  issuePayload?: {
    issue?: {
      category?: string;
      severity?: string;
      description?: string;
      answers?: Record<string, string>;
    };
  };
};

export async function fetchIssueDetail(issueId: string): Promise<IssueDetail> {
  const response = await fetch(`${API_BASE_URL}/marketplace/issues/${encodeURIComponent(issueId)}`, {
    credentials: 'include',
    cache: 'no-store',
  });
  const data = (await response.json()) as { message?: string; issue?: IssueDetail };
  if (!response.ok) throw new Error(data.message ?? 'Failed to load issue details');
  if (!data.issue) throw new Error('Issue details were not returned');
  return data.issue;
}

export async function raiseIssueToGarage(issueId: string): Promise<{ message?: string }> {
  const response = await withSessionRefreshRetry(() =>
    fetch(`${API_BASE_URL}/marketplace/issues/${encodeURIComponent(issueId)}/raise-to-garage`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    })
  );
  const data = (await response.json()) as { message?: string };
  if (!response.ok) throw new Error(data.message ?? 'Failed to raise issue to garage');
  return data;
}

export async function fetchIssueQuotes(issueId: string): Promise<MockQuote[]> {
  const response = await fetch(`${API_BASE_URL}/marketplace/issues/${encodeURIComponent(issueId)}/quotes`, {
    credentials: 'include',
    cache: 'no-store',
  });
  const data = (await response.json()) as {
    message?: string;
    quotes?: MockQuote[];
  };
  if (!response.ok) throw new Error(data.message ?? 'Failed to load quotes');
  return data.quotes ?? [];
}

async function withSessionRefreshRetry(
  request: () => Promise<Response>
): Promise<Response> {
  let response = await request();
  if (response.status !== 401) return response;

  const refreshResponse = await fetch(`${API_BASE_URL}/auth/sessions/refresh`, {
    method: 'POST',
    credentials: 'include',
    cache: 'no-store',
  });
  if (!refreshResponse.ok) return response;

  response = await request();
  return response;
}

export async function selectQuote(quoteId: string): Promise<{ bookingId?: string }> {
  const response = await withSessionRefreshRetry(() =>
    fetch(`${API_BASE_URL}/marketplace/quotes/${encodeURIComponent(quoteId)}/select`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    })
  );
  const data = (await response.json()) as { message?: string; bookingId?: string };
  if (!response.ok) throw new Error(data.message ?? 'Failed to select quote');
  return { bookingId: data.bookingId };
}

export async function fetchUserBookings(): Promise<MockBooking[]> {
  const response = await fetch(`${API_BASE_URL}/marketplace/bookings`, {
    credentials: 'include',
    cache: 'no-store',
  });
  const data = (await response.json()) as {
    message?: string;
    bookings?: MockBooking[];
  };
  if (!response.ok) throw new Error(data.message ?? 'Failed to load bookings');
  return data.bookings ?? [];
}

export async function updateBooking(
  bookingId: string,
  input: { status?: 'cancelled' | 'booked' | 'in_service' | 'completed'; appointmentTime?: string }
) {
  const response = await fetch(`${API_BASE_URL}/marketplace/bookings/${encodeURIComponent(bookingId)}`, {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  const data = (await response.json()) as { message?: string };
  if (!response.ok) throw new Error(data.message ?? 'Failed to update booking');
  return data;
}

export type PaymentMethod = 'card' | 'apple_pay' | 'google_pay';

export type PaymentIntent = {
  id: string;
  bookingId: string;
  amount: number;
  currency: string;
  method: PaymentMethod;
  status: 'created' | 'confirmed' | 'expired' | 'cancelled';
  garageName: string;
  vehicleStr: string;
};

export async function createPaymentIntent(
  bookingId: string,
  method: PaymentMethod = 'card'
): Promise<{
  intentId: string;
  clientSecret: string;
  bookingId: string;
  amount: number;
  currency: string;
  method: PaymentMethod;
  garageName: string;
  vehicleStr: string;
}> {
  const response = await fetch(`${API_BASE_URL}/payments/intent`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ bookingId, method }),
  });
  const data = (await response.json()) as {
    message?: string;
    intentId?: string;
    clientSecret?: string;
    bookingId?: string;
    amount?: number;
    currency?: string;
    method?: PaymentMethod;
    garageName?: string;
    vehicleStr?: string;
  };
  if (!response.ok) throw new Error(data.message ?? 'Failed to create payment intent');
  if (
    !data.intentId ||
    !data.clientSecret ||
    !data.bookingId ||
    typeof data.amount !== 'number' ||
    !data.currency ||
    !data.method ||
    !data.garageName ||
    !data.vehicleStr
  ) {
    throw new Error('Invalid payment intent response');
  }
  return {
    intentId: data.intentId,
    clientSecret: data.clientSecret,
    bookingId: data.bookingId,
    amount: data.amount,
    currency: data.currency,
    method: data.method,
    garageName: data.garageName,
    vehicleStr: data.vehicleStr,
  };
}

export async function fetchPaymentIntent(intentId: string): Promise<PaymentIntent> {
  const response = await fetch(`${API_BASE_URL}/payments/intents/${encodeURIComponent(intentId)}`, {
    credentials: 'include',
    cache: 'no-store',
  });
  const data = (await response.json()) as { message?: string; intent?: PaymentIntent };
  if (!response.ok) throw new Error(data.message ?? 'Failed to load payment intent');
  if (!data.intent) throw new Error('Payment intent not found');
  return data.intent;
}

export async function confirmPaymentIntent(intentId: string): Promise<{ paymentId?: string; bookingId?: string }> {
  const response = await fetch(`${API_BASE_URL}/payments/confirm`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ intentId }),
  });
  const data = (await response.json()) as { message?: string; paymentId?: string; bookingId?: string };
  if (!response.ok) throw new Error(data.message ?? 'Failed to confirm payment');
  return { paymentId: data.paymentId, bookingId: data.bookingId };
}

export const USER_DASHBOARD_DEFAULT: UserDashboardContent = {
  hero: {
    welcomePrefix: 'Welcome back,',
    userNameDefault: 'Precision Driver',
    description: 'Monitor your fleet and manage your automotive service journey with WrectifAI.',
  },
  stats: {
    activeVehicles: 'Active Vehicles',
    pendingQuotes: 'Pending Quotes',
    upcomingBookings: 'Upcoming Bookings',
  },
  actions: {
    title: 'Precision Operations',
    diagnosis: {
      title: 'Guided Issue Assessment',
      description: 'Analyze symptoms first and decide if it is DIY-safe or needs a garage.',
    },
    garage: {
      title: 'Direct Service Request',
      description: 'Skip analysis and raise a direct service request when you already know the issue.',
    },
    quotes: {
      title: 'Quotes Hub',
      description: 'Review and accept service offers.',
    },
  },
};

export const USER_PAYMENTS_DEFAULT: UserPaymentsContent = {
  header: {
    title: 'Payments & Billings',
    description: 'Review your complete service financial history and manage precision payment methods.',
  },
  stats: {
    totalSpentLabel: 'Lifetime Spent',
    outstandingLabel: 'Outstanding Balance',
    creditsLabel: 'Available Credits',
  },
  transactions: {
    title: 'Transaction History',
    description: 'A detailed log of all service payments and part acquisitions.',
    table: {
      date: 'Date',
      service: 'Service / Item',
      amount: 'Amount',
      status: 'Status',
    },
  },
  methods: {
    title: 'Payment Methods',
    addMethodLabel: 'Add New Method',
    expiryLabel: 'Expires',
  },
};

export async function getUserPaymentsContent(options?: {
  locale?: string;
  tenantId?: string;
}) {
  const raw = await getUIContent<unknown>({
    module: 'user',
    page: 'payments',
    locale: options?.locale,
    tenantId: options?.tenantId,
    fallback: USER_PAYMENTS_DEFAULT,
  });

  return normalizeUserPaymentsContent(raw);
}

function normalizeUserPaymentsContent(input: unknown): UserPaymentsContent {
  if (!input || typeof input !== 'object') return USER_PAYMENTS_DEFAULT;

  const value = input as Record<string, unknown>;
  const header = value.header as Record<string, unknown> | undefined;
  const stats = value.stats as Record<string, unknown> | undefined;
  const transactions = value.transactions as Record<string, unknown> | undefined;
  const methods = value.methods as Record<string, unknown> | undefined;
  const table = transactions?.table as Record<string, unknown> | undefined;

  const legacyTitle =
    typeof value.title === 'string' ? value.title : USER_PAYMENTS_DEFAULT.header.title;
  const legacyDescription =
    typeof value.description === 'string'
      ? value.description
      : USER_PAYMENTS_DEFAULT.header.description;

  return {
    header: {
      title:
        typeof header?.title === 'string'
          ? header.title
          : legacyTitle,
      description:
        typeof header?.description === 'string'
          ? header.description
          : legacyDescription,
    },
    stats: {
      totalSpentLabel:
        typeof stats?.totalSpentLabel === 'string'
          ? stats.totalSpentLabel
          : USER_PAYMENTS_DEFAULT.stats.totalSpentLabel,
      outstandingLabel:
        typeof stats?.outstandingLabel === 'string'
          ? stats.outstandingLabel
          : USER_PAYMENTS_DEFAULT.stats.outstandingLabel,
      creditsLabel:
        typeof stats?.creditsLabel === 'string'
          ? stats.creditsLabel
          : USER_PAYMENTS_DEFAULT.stats.creditsLabel,
    },
    transactions: {
      title:
        typeof transactions?.title === 'string'
          ? transactions.title
          : USER_PAYMENTS_DEFAULT.transactions.title,
      description:
        typeof transactions?.description === 'string'
          ? transactions.description
          : USER_PAYMENTS_DEFAULT.transactions.description,
      table: {
        date:
          typeof table?.date === 'string'
            ? table.date
            : USER_PAYMENTS_DEFAULT.transactions.table.date,
        service:
          typeof table?.service === 'string'
            ? table.service
            : USER_PAYMENTS_DEFAULT.transactions.table.service,
        amount:
          typeof table?.amount === 'string'
            ? table.amount
            : USER_PAYMENTS_DEFAULT.transactions.table.amount,
        status:
          typeof table?.status === 'string'
            ? table.status
            : USER_PAYMENTS_DEFAULT.transactions.table.status,
      },
    },
    methods: {
      title:
        typeof methods?.title === 'string'
          ? methods.title
          : USER_PAYMENTS_DEFAULT.methods.title,
      addMethodLabel:
        typeof methods?.addMethodLabel === 'string'
          ? methods.addMethodLabel
          : USER_PAYMENTS_DEFAULT.methods.addMethodLabel,
      expiryLabel:
        typeof methods?.expiryLabel === 'string'
          ? methods.expiryLabel
          : USER_PAYMENTS_DEFAULT.methods.expiryLabel,
    },
  };
}

export async function getDashboardContent(options?: {
  locale?: string;
  tenantId?: string;
}) {
  return getUIContent<UserDashboardContent>({
    module: 'user',
    page: 'dashboard',
    locale: options?.locale,
    tenantId: options?.tenantId,
    fallback: USER_DASHBOARD_DEFAULT,
  });
}

export type DashboardStats = {
  activeVehicles: number;
  pendingQuotes: number;
  upcomingBookings: number;
};

export async function fetchDashboardStats(): Promise<DashboardStats> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 800));
  return {
    activeVehicles: 3,
    pendingQuotes: 2,
    upcomingBookings: 1,
  };
}

export type PaymentTransaction = {
  id: string;
  date: string;
  service: string;
  amount: number;
  status: 'paid' | 'pending' | 'failed' | 'refunded';
  method?: string;
};

export async function getAppIdentityConfig(): Promise<AppIdentityConfig> {
  try {
    const response = await fetch(`${API_BASE_URL}/app-config/app-identity`, {
      cache: 'no-store',
    });
    if (!response.ok) throw new Error(`Failed to load app identity (${response.status})`);
    const data = (await response.json()) as Partial<AppIdentityConfig>;
    return {
      name: data.name ?? 'WrectifAI',
      tagline: data.tagline ?? 'Service. Quotes. Simplified.',
      logoUrl:
        data.logoUrl ??
        'https://wrectifai.s3.ap-south-1.amazonaws.com/Assests+/Logo.jpeg',
    };
  } catch {
    return {
      name: 'WrectifAI',
      tagline: 'Service. Quotes. Simplified.',
      logoUrl: 'https://wrectifai.s3.ap-south-1.amazonaws.com/Assests+/Logo.jpeg',
    };
  }
}

export async function fetchPaymentTransactions(): Promise<PaymentTransaction[]> {
  const response = await fetch(`${API_BASE_URL}/payments/transactions`, {
    credentials: 'include',
    cache: 'no-store',
  });
  const data = (await response.json()) as {
    message?: string;
    transactions?: PaymentTransaction[];
  };
  if (!response.ok) throw new Error(data.message ?? 'Failed to load transactions');
  return data.transactions ?? [];
}

export async function fetchPaymentSummary(): Promise<{ totalSpent: number; paidCount: number }> {
  const response = await fetch(`${API_BASE_URL}/payments/summary`, {
    credentials: 'include',
    cache: 'no-store',
  });
  const data = (await response.json()) as {
    message?: string;
    summary?: { totalSpent: number; paidCount: number };
  };
  if (!response.ok) throw new Error(data.message ?? 'Failed to load payment summary');
  return data.summary ?? { totalSpent: 0, paidCount: 0 };
}

export type UserProfile = {
  fullName: string;
  email: string;
  phone: string;
  avatarUrl: string;
  bio: string;
  addressLine: string;
  city: string;
  state: string;
  postalCode: string;
  notificationPreferences?: {
    bookings?: boolean;
    reminders?: boolean;
    offers?: boolean;
    preferredCheckinMode?: 'self_checkin' | 'home_pickup';
  };
};

export async function fetchUserProfile(): Promise<UserProfile> {
  const response = await fetch(`${API_BASE_URL}/users/profile`, {
    credentials: 'include',
    cache: 'no-store',
  });
  const data = (await response.json()) as { message?: string; profile?: UserProfile };
  if (!response.ok) throw new Error(data.message ?? 'Failed to load profile');
  return (
    data.profile ?? {
      fullName: '',
      email: '',
      phone: '',
      avatarUrl: '',
      bio: '',
      addressLine: '',
      city: '',
      state: '',
      postalCode: '',
    }
  );
}

export async function saveUserProfile(input: Omit<UserProfile, 'phone'>) {
  const response = await fetch(`${API_BASE_URL}/users/profile`, {
    method: 'PUT',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  const data = (await response.json()) as { message?: string };
  if (!response.ok) throw new Error(data.message ?? 'Failed to save profile');
  return data;
}

export type UserSettings = {
  bookings: boolean;
  reminders: boolean;
  offers: boolean;
  preferredCheckinMode: 'self_checkin' | 'home_pickup';
};

export async function fetchUserSettings(): Promise<UserSettings> {
  const response = await fetch(`${API_BASE_URL}/users/settings`, {
    credentials: 'include',
    cache: 'no-store',
  });
  const data = (await response.json()) as { message?: string; settings?: UserSettings };
  if (!response.ok) throw new Error(data.message ?? 'Failed to load settings');
  return (
    data.settings ?? {
      bookings: true,
      reminders: true,
      offers: true,
      preferredCheckinMode: 'self_checkin',
    }
  );
}

export async function saveUserSettings(settings: UserSettings) {
  const response = await fetch(`${API_BASE_URL}/users/settings`, {
    method: 'PUT',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ settings }),
  });
  const data = (await response.json()) as { message?: string };
  if (!response.ok) throw new Error(data.message ?? 'Failed to save settings');
  return data;
}

export type SupportTicket = {
  id: string;
  subject: string;
  description: string;
  status: string;
  createdAt: string | Date;
};

export async function fetchSupportTickets(): Promise<SupportTicket[]> {
  const response = await fetch(`${API_BASE_URL}/users/support-tickets`, {
    credentials: 'include',
    cache: 'no-store',
  });
  const data = (await response.json()) as { message?: string; tickets?: SupportTicket[] };
  if (!response.ok) throw new Error(data.message ?? 'Failed to load support tickets');
  return data.tickets ?? [];
}

export async function createSupportTicket(input: { subject: string; description: string }) {
  const response = await fetch(`${API_BASE_URL}/users/support-tickets`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  const data = (await response.json()) as { message?: string; ticketId?: string };
  if (!response.ok) throw new Error(data.message ?? 'Failed to create support ticket');
  return data;
}

export type SparePartItem = {
  id: string;
  name: string;
  category: string;
  price: number;
  currency: string;
  supplier: string;
  inStock: boolean;
};

export type PartOrder = {
  id: string;
  partName: string;
  qty: number;
  totalAmount: number;
  status: string;
  createdAt: string | Date;
};

export async function fetchSpareParts(): Promise<SparePartItem[]> {
  const response = await fetch(`${API_BASE_URL}/marketplace/parts`, {
    credentials: 'include',
    cache: 'no-store',
  });
  const data = (await response.json()) as { message?: string; parts?: SparePartItem[] };
  if (!response.ok) throw new Error(data.message ?? 'Failed to load parts');
  return data.parts ?? [];
}

export async function fetchPartOrders(): Promise<PartOrder[]> {
  const response = await fetch(`${API_BASE_URL}/marketplace/parts/orders`, {
    credentials: 'include',
    cache: 'no-store',
  });
  const data = (await response.json()) as { message?: string; orders?: PartOrder[] };
  if (!response.ok) throw new Error(data.message ?? 'Failed to load part orders');
  return data.orders ?? [];
}

export async function placePartOrder(partId: string, qty = 1) {
  const response = await fetch(`${API_BASE_URL}/marketplace/parts/${encodeURIComponent(partId)}/order`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ qty }),
  });
  const data = (await response.json()) as { message?: string; orderId?: string };
  if (!response.ok) throw new Error(data.message ?? 'Failed to place order');
  return data;
}

// Admin API functions
export type AdminUser = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  status: string;
  joined: string;
  location: string;
};

export type AdminBooking = {
  id: string;
  customer: string;
  vehicle: string;
  garage: string;
  service: string;
  date: string;
  time: string;
  status: string;
  amount: string;
  location: string;
};

export type AdminQuote = {
  id: string;
  customer: string;
  vehicle: string;
  garage: string;
  service: string;
  amount: string;
  fairPrice: string;
  comparison: string;
  status: string;
  submitted: string;
};

export type AdminPayment = {
  id: string;
  customer: string;
  bookingId: string;
  garage: string;
  amount: string;
  commission: string;
  status: string;
  date: string;
  method: string;
};

export type AdminComplaint = {
  id: string;
  customer: string;
  garage: string;
  type: string;
  description: string;
  status: string;
  submitted: string;
  bookingId: string;
};

export type AdminApproval = {
  id: string;
  name: string;
  location: string;
  phone: string;
  specializations?: string[];
  inventory?: string[];
  status: string;
  submittedAt: string;
  documents: string[];
};

export type AdminApprovalsData = {
  garages: AdminApproval[];
  vendors: AdminApproval[];
};

export async function fetchAdminUsers(): Promise<AdminUser[]> {
  const response = await fetch(`${API_BASE_URL}/admin/users`, {
    credentials: 'include',
    cache: 'no-store',
  });
  const data = (await response.json()) as { message?: string; users?: AdminUser[] };
  if (!response.ok) throw new Error(data.message ?? 'Failed to load users');
  return data.users ?? [];
}

export async function updateUserStatus(userId: string, status: 'Active' | 'Suspended'): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/status`, {
    method: 'PATCH',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ status }),
  });
  const data = (await response.json()) as { message?: string };
  if (!response.ok) throw new Error(data.message ?? 'Failed to update user status');
}

export async function fetchAdminBookings(): Promise<AdminBooking[]> {
  const response = await fetch(`${API_BASE_URL}/admin/bookings`, {
    credentials: 'include',
    cache: 'no-store',
  });
  const data = (await response.json()) as { message?: string; bookings?: AdminBooking[] };
  if (!response.ok) throw new Error(data.message ?? 'Failed to load bookings');
  return data.bookings ?? [];
}

export async function fetchAdminQuotes(): Promise<AdminQuote[]> {
  const response = await fetch(`${API_BASE_URL}/admin/quotes`, {
    credentials: 'include',
    cache: 'no-store',
  });
  const data = (await response.json()) as { message?: string; quotes?: AdminQuote[] };
  if (!response.ok) throw new Error(data.message ?? 'Failed to load quotes');
  return data.quotes ?? [];
}

export async function fetchAdminPayments(): Promise<AdminPayment[]> {
  const response = await fetch(`${API_BASE_URL}/admin/payments`, {
    credentials: 'include',
    cache: 'no-store',
  });
  const data = (await response.json()) as { message?: string; payments?: AdminPayment[] };
  if (!response.ok) throw new Error(data.message ?? 'Failed to load payments');
  return data.payments ?? [];
}

export async function fetchAdminComplaints(): Promise<AdminComplaint[]> {
  const response = await fetch(`${API_BASE_URL}/admin/complaints`, {
    credentials: 'include',
    cache: 'no-store',
  });
  const data = (await response.json()) as { message?: string; complaints?: AdminComplaint[] };
  if (!response.ok) throw new Error(data.message ?? 'Failed to load complaints');
  return data.complaints ?? [];
}

export async function fetchAdminApprovals(): Promise<AdminApprovalsData> {
  const response = await fetch(`${API_BASE_URL}/admin/approvals`, {
    credentials: 'include',
    cache: 'no-store',
  });
  const data = (await response.json()) as { message?: string; garages?: AdminApproval[]; vendors?: AdminApproval[] };
  if (!response.ok) throw new Error(data.message ?? 'Failed to load approvals');
  return {
    garages: data.garages ?? [],
    vendors: data.vendors ?? [],
  };
}
