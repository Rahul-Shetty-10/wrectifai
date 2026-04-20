export type UIContentQueryInput = {
  tenantId?: string;
  module: string;
  page: string;
  locale?: string;
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
  quickScanLabel: string;
  nav: {
    dashboard: string;
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

export type UserServiceIntakeContent = {
  header: {
    diagnosisTitle: string;
    directTitle: string;
    description: string;
    badgeDefault: string;
    badgeQuestionsSuffix: string;
  };
  sections: {
    categoriesTitle: string;
    categoriesSubtitle: string;
    questionsTitle: string;
    questionsSubtitle: string;
    evidenceTitle: string;
    evidenceSubtitle: string;
    vehicleTitle: string;
    vehicleSubtitle: string;
    logisticsTitle: string;
    logisticsSubtitle: string;
    contactTitle: string;
    contactSubtitle: string;
    reportTitle: string;
    reportSubtitle: string;
  };
  labels: {
    loading: string;
    continue: string;
    loadingQuestions: string;
    selectedCategories: string;
    none: string;
    smartQuestionsTitle: string;
    smartQuestionsSubtitle: string;
    useSaved: string;
    manual: string;
    selectVehicle: string;
    car: string;
    bike: string;
    other: string;
    useGps: string;
    pickupRequired: string;
    visitGarage: string;
    needPickup: string;
    schedule: string;
    nowEmergency: string;
    scheduleTime: string;
    vehicleLabel: string;
    serviceTypeLabel: string;
    scheduleLabel: string;
    questionsAnsweredLabel: string;
    pickupRequiredValue: string;
    visitGarageValue: string;
    scheduledValue: string;
    nowValue: string;
    riskLevelLabel: string;
    severityLabel: string;
    summaryLabel: string;
    recommendationLabel: string;
    diyStepsTitle: string;
    diyBlocked: string;
    diagnosisHint: string;
    directHint: string;
    generateReport: string;
    generating: string;
    raiseIssue: string;
    submitting: string;
  };
  placeholders: {
    shortDescription: string;
    brand: string;
    model: string;
    year: string;
    fuelType: string;
    variantOptional: string;
    serviceAddress: string;
    name: string;
    phone: string;
    alternatePhoneOptional: string;
    answer: string;
  };
  errors: {
    invalidDateTime: string;
    pastTime: string;
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

export type UserSettingsContent = {
  title: string;
  loadingLabel: string;
  bookingUpdatesLabel: string;
  appointmentRemindersLabel: string;
  offersLabel: string;
  preferredCheckinModeLabel: string;
  selfCheckinLabel: string;
  homePickupLabel: string;
  saveButtonLabel: string;
  savingLabel: string;
  savedMessage: string;
  loadErrorLabel: string;
  saveErrorLabel: string;
};

export type UserSupportContent = {
  createTicketTitle: string;
  subjectPlaceholder: string;
  descriptionPlaceholder: string;
  submitLabel: string;
  submittingLabel: string;
  myTicketsTitle: string;
  loadingTicketsLabel: string;
  noTicketsLabel: string;
  loadTicketsErrorLabel: string;
  createTicketErrorLabel: string;
};

export type UserSparePartsContent = {
  catalogTitle: string;
  loadingPartsLabel: string;
  orderingLabel: string;
  orderLabel: string;
  outOfStockLabel: string;
  myOrdersTitle: string;
  noOrdersLabel: string;
  loadErrorLabel: string;
  orderErrorLabel: string;
  qtyLabel: string;
  totalLabel: string;
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
  };
};

export type UserPage =
  | 'dashboard'
  | 'my-garage'
  | 'ai-diagnosis'
  | 'service-intake'
  | 'quotes-bookings'
  | 'spare-parts'
  | 'payments'
  | 'settings'
  | 'support';
