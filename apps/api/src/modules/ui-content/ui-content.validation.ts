import type {
  AuthLoginPageContent,
  AuthPage,
  AuthRegisterPageContent,
  AuthVerifyPageContent,
  UserAiDiagnosisContent,
  UserDashboardContent,
  UserMyGarageContent,
  UserPage,
  UserPageContent,
  UserPaymentsContent,
  UserQuotesBookingsContent,
  UserSidebarContent,
} from './ui-content.types';

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(isString);
}

function isAuthLoginPageContent(value: unknown): value is AuthLoginPageContent {
  if (!isObject(value)) return false;
  if (!isString(value.appName) || !isString(value.authModeLabel)) return false;

  const hero = value.hero;
  const links = value.links;
  const form = value.form;
  const errors = value.errors;

  return (
    isObject(hero) &&
    isString(hero.kicker) &&
    isString(hero.title) &&
    isString(hero.body) &&
    isObject(links) &&
    isString(links.needAccountPrefix) &&
    isString(links.needAccountCta) &&
    isObject(form) &&
    isString(form.title) &&
    isString(form.subtitle) &&
    isString(form.phoneLabel) &&
    isString(form.phonePlaceholder) &&
    isString(form.sendOtpLabel) &&
    isString(form.sendingOtpLabel) &&
    isObject(errors) &&
    isString(errors.phoneInvalid) &&
    isString(errors.sendOtpFailed) &&
    isString(errors.unexpected)
  );
}

function isAuthRegisterPageContent(value: unknown): value is AuthRegisterPageContent {
  if (!isObject(value)) return false;
  if (!isString(value.appName) || !isString(value.authModeLabel)) return false;

  const hero = value.hero;
  const links = value.links;
  const form = value.form;
  const errors = value.errors;

  return (
    isObject(hero) &&
    isString(hero.kicker) &&
    isString(hero.title) &&
    isString(hero.body) &&
    isObject(links) &&
    isString(links.haveAccountPrefix) &&
    isString(links.haveAccountCta) &&
    isObject(form) &&
    isString(form.title) &&
    isString(form.subtitle) &&
    isString(form.fullNameLabel) &&
    isString(form.fullNamePlaceholder) &&
    isString(form.phoneLabel) &&
    isString(form.phonePlaceholder) &&
    isString(form.termsLabel) &&
    isString(form.createAccountLabel) &&
    isString(form.sendingOtpLabel) &&
    isObject(errors) &&
    isString(errors.fullNameRequired) &&
    isString(errors.phoneInvalid) &&
    isString(errors.termsRequired) &&
    isString(errors.sendOtpFailed) &&
    isString(errors.unexpected)
  );
}

function isAuthVerifyPageContent(value: unknown): value is AuthVerifyPageContent {
  if (!isObject(value)) return false;
  if (!isString(value.appName) || !isString(value.authModeLabel)) return false;

  const hero = value.hero;
  const links = value.links;
  const form = value.form;
  const errors = value.errors;

  return (
    isObject(hero) &&
    isString(hero.kicker) &&
    isString(hero.title) &&
    isString(hero.body) &&
    isObject(links) &&
    isString(links.backToPrefix) &&
    isString(links.backToRegisterCta) &&
    isString(links.backToLoginCta) &&
    isObject(form) &&
    isString(form.title) &&
    isString(form.subtitleTemplate) &&
    isString(form.otpLabel) &&
    isString(form.otpPlaceholder) &&
    isString(form.ctaLabel) &&
    isString(form.ctaLoadingLabel) &&
    isObject(errors) &&
    isString(errors.otpInvalid) &&
    isString(errors.verifyFailed) &&
    isString(errors.unexpected)
  );
}

export function validateAuthPageContent(page: AuthPage, content: unknown) {
  if (page === 'login') return isAuthLoginPageContent(content);
  if (page === 'register') return isAuthRegisterPageContent(content);
  return isAuthVerifyPageContent(content);
}

function isUserSidebarContent(value: unknown): value is UserSidebarContent {
  if (!isObject(value)) return false;
  const nav = value.nav;
  return (
    isString(value.brandName) &&
    isString(value.brandTagline) &&
    isString(value.quickScanLabel) &&
    isObject(nav) &&
    isString(nav.dashboard) &&
    isString(nav['my-garage']) &&
    isString(nav['ai-diagnosis']) &&
    isString(nav['quotes-bookings']) &&
    isString(nav['spare-parts']) &&
    isString(nav.payments) &&
    isString(nav.settings) &&
    isString(nav.support)
  );
}

function isUserPageContent(value: unknown): value is UserPageContent {
  if (!isObject(value)) return false;
  return (
    isString(value.kicker) &&
    isString(value.title) &&
    isString(value.description) &&
    isString(value.emptyStateTitle) &&
    isString(value.emptyStateBody)
  );
}

function isUserDashboardContent(value: unknown): value is UserDashboardContent {
  if (!isObject(value)) return false;
  const hero = value.hero;
  const stats = value.stats;
  const actions = value.actions;

  return (
    isObject(hero) &&
    isString(hero.welcomePrefix) &&
    isString(hero.userNameDefault) &&
    isString(hero.description) &&
    isObject(stats) &&
    isString(stats.activeVehicles) &&
    isString(stats.pendingQuotes) &&
    isString(stats.upcomingBookings) &&
    isObject(actions) &&
    isString(actions.title) &&
    isObject(actions.diagnosis) &&
    isString(actions.diagnosis.title) &&
    isString(actions.diagnosis.description) &&
    isObject(actions.garage) &&
    isString(actions.garage.title) &&
    isString(actions.garage.description) &&
    isObject(actions.quotes) &&
    isString(actions.quotes.title) &&
    isString(actions.quotes.description)
  );
}

function isUserAiDiagnosisContent(value: unknown): value is UserAiDiagnosisContent {
  if (!isObject(value)) return false;
  const header = value.header;
  const input = value.input;
  const results = value.results;
  const states = value.states;

  return (
    isObject(header) &&
    isString(header.title) &&
    isString(header.description) &&
    isString(header.subtitle) &&
    isObject(input) &&
    isString(input.symptomsLabel) &&
    isString(input.symptomsPlaceholder) &&
    isString(input.uploadMediaLabel) &&
    isString(input.categoriesLabel) &&
    isStringArray(input.categories) &&
    isString(input.analyzeButtonLabel) &&
    isString(input.analyzingLabel) &&
    isString(input.addMoreSymptomsLabel) &&
    isObject(results) &&
    isString(results.title) &&
    isString(results.urgencyLabel) &&
    isString(results.riskLabel) &&
    isString(results.issueLabel) &&
    isString(results.solutionLabel) &&
    isString(results.partsEstimateLabel) &&
    isString(results.diyLabel) &&
    isString(results.garageLabel) &&
    isString(results.bookGarageLabel) &&
    isString(results.viewDiyLabel) &&
    isObject(states) &&
    isString(states.errorLabel)
  );
}

function isUserQuotesBookingsContent(value: unknown): value is UserQuotesBookingsContent {
  if (!isObject(value)) return false;
  const header = value.header;
  const quotes = value.quotes;
  const bookings = value.bookings;
  const tabs = isObject(header) ? header.tabs : undefined;

  return (
    isObject(header) &&
    isString(header.title) &&
    isString(header.description) &&
    isObject(tabs) &&
    isString(tabs.quotes) &&
    isString(tabs.bookings) &&
    isObject(quotes) &&
    isString(quotes.emptyStateTitle) &&
    isString(quotes.emptyStateDescription) &&
    isString(quotes.requestSummaryLabel) &&
    isString(quotes.quoteCountPrefix) &&
    isString(quotes.compareLabel) &&
    isString(quotes.partsLabel) &&
    isString(quotes.laborLabel) &&
    isString(quotes.totalLabel) &&
    isString(quotes.distanceSuffix) &&
    isString(quotes.bookNowLabel) &&
    isString(quotes.bestMatchBadge) &&
    isString(quotes.fairPriceBadge) &&
    isString(quotes.aboveMarketBadge) &&
    isObject(bookings) &&
    isString(bookings.emptyStateTitle) &&
    isString(bookings.emptyStateDescription) &&
    isString(bookings.appointmentLabel) &&
    isString(bookings.checkInLabel) &&
    isString(bookings.statusBooked) &&
    isString(bookings.statusInService) &&
    isString(bookings.statusCompleted) &&
    isString(bookings.getDirectionsLabel) &&
    isString(bookings.cancelBookingLabel)
  );
}

function isUserPaymentsContent(value: unknown): value is UserPaymentsContent {
  if (!isObject(value)) return false;
  const header = value.header;
  const stats = value.stats;
  const transactions = value.transactions;
  const methods = value.methods;
  const table = isObject(transactions) ? transactions.table : undefined;

  return (
    isObject(header) &&
    isString(header.title) &&
    isString(header.description) &&
    isObject(stats) &&
    isString(stats.totalSpentLabel) &&
    isString(stats.outstandingLabel) &&
    isString(stats.creditsLabel) &&
    isObject(transactions) &&
    isString(transactions.title) &&
    isString(transactions.description) &&
    isObject(table) &&
    isString(table.date) &&
    isString(table.service) &&
    isString(table.amount) &&
    isString(table.status) &&
    isObject(methods) &&
    isString(methods.title) &&
    isString(methods.addMethodLabel) &&
    isString(methods.expiryLabel)
  );
}

function isUserMyGarageContent(value: unknown): value is UserMyGarageContent {
  if (!isObject(value)) return false;
  const topBar = value.topBar;
  const header = value.header;
  const fleetCards = value.fleetCards;
  const hero = value.hero;
  const serviceHistory = value.serviceHistory;
  const promotion = value.promotion;
  const states = value.states;
  const forms = value.forms;

  return (
    isObject(topBar) &&
    isString(topBar.sectionLabel) &&
    isString(topBar.searchPlaceholder) &&
    isString(topBar.bookAppointmentLabel) &&
    isObject(header) &&
    isString(header.title) &&
    isString(header.description) &&
    isString(header.uploadRcLabel) &&
    isString(header.addVehicleLabel) &&
    isString(header.activeFleetLabel) &&
    isString(header.serviceHistoryLabel) &&
    isString(header.viewAllHistoryLabel) &&
    isString(header.registerVehicleLabel) &&
    Array.isArray(fleetCards) &&
    fleetCards.every(
      (card) =>
        isObject(card) &&
        isString(card.statusLabel) &&
        isString(card.vehicleName) &&
        isString(card.vehicleMeta) &&
        isString(card.completionPercentLabel)
    ) &&
    isObject(hero) &&
    isString(hero.title) &&
    isString(hero.subtitle) &&
    isString(hero.odometerLabel) &&
    isString(hero.odometerValue) &&
    Array.isArray(serviceHistory) &&
    serviceHistory.every(
      (entry) =>
        isObject(entry) &&
        isString(entry.title) &&
        isString(entry.subtitle) &&
        isString(entry.dateLabel) &&
        isString(entry.statusLabel)
    ) &&
    isObject(promotion) &&
    isString(promotion.title) &&
    isString(promotion.description) &&
    isString(promotion.ctaLabel) &&
    isObject(states) &&
    isString(states.loadingVehiclesLabel) &&
    isString(states.noVehiclesLabel) &&
    isString(states.loadingHistoryLabel) &&
    isString(states.noHistoryLabel) &&
    isObject(forms) &&
    isString(forms.addVehicleTitle) &&
    isString(forms.rcInputLabel) &&
    isString(forms.rcInputPlaceholder) &&
    isString(forms.applyRcSuggestionLabel) &&
    isString(forms.makeLabel) &&
    isString(forms.modelLabel) &&
    isString(forms.yearLabel) &&
    isString(forms.fuelTypeLabel) &&
    isString(forms.trimLabel) &&
    isString(forms.mileageLabel) &&
    isString(forms.engineTypeLabel) &&
    isString(forms.vinLabel) &&
    isString(forms.plateLabel) &&
    isString(forms.saveVehicleLabel) &&
    isString(forms.cancelLabel) &&
    isString(forms.selectVehicleLabel) &&
    isString(forms.addVehicleSuccessLabel) &&
    isString(forms.requiredFieldsErrorLabel) &&
    isString(forms.loadVehiclesErrorLabel) &&
    isString(forms.loadHistoryErrorLabel) &&
    isString(forms.processRcErrorLabel) &&
    isString(forms.addVehicleErrorLabel)
  );
}

export function validateUserContent(page: string, content: unknown) {
  if (page === 'sidebar') return isUserSidebarContent(content);
  if (page === 'my-garage') return isUserMyGarageContent(content);
  if (page === 'dashboard') {
    return isUserPageContent(content) || isUserDashboardContent(content);
  }
  if (page === 'ai-diagnosis') {
    return isUserPageContent(content) || isUserAiDiagnosisContent(content);
  }
  if (page === 'quotes-bookings') {
    return isUserPageContent(content) || isUserQuotesBookingsContent(content);
  }
  if (page === 'payments') {
    return isUserPageContent(content) || isUserPaymentsContent(content);
  }
  const allowedPages: UserPage[] = [
    'spare-parts',
    'settings',
    'support',
  ];
  if (!allowedPages.includes(page as UserPage)) return false;
  return isUserPageContent(content);
}
