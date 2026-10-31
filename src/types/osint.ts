export type RiskLevel = 'clean' | 'low' | 'moderate' | 'high' | 'critical';

export interface PlatformResult {
  id: string;
  name: string;
  category: 'social' | 'developer' | 'productivity' | 'messaging' | 'multimedia' | 'gaming' | 'commerce' | 'other';
  icon: string;
  urlPattern?: string;
  profileUrl?: string;
  status: 'found' | 'not_found' | 'likely' | 'rate_limited' | 'unknown';
  username?: string;
  displayName?: string;
  avatarUrl?: string;
  bio?: string;
  details?: Record<string, string | number | boolean>;
  checkSource: 'live_api' | 'doh_verification' | 'heuristic' | 'public_index';
}

export interface GoogleFootprint {
  accountExists: boolean;
  gaiaId?: string;
  hasGoogleMapsReviews: boolean;
  reviewsCount?: number;
  mapsProfileUrl?: string;
  hasPublicPhotos: boolean;
  photosUrl?: string;
  hasCalendarScheduling: boolean;
  calendarBookingUrl?: string;
  googleMeetEnabled: boolean;
  classroomIndicator: boolean;
  accountType: 'consumer_gmail' | 'google_workspace' | 'unknown';
}

export interface BreachRecord {
  id: string;
  title: string;
  domain: string;
  breachDate: string;
  pwnCount: number;
  description: string;
  dataClasses: string[];
  isVerified: boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface DnsIntelligence {
  domain: string;
  hasMx: boolean;
  mxRecords: Array<{ host: string; priority: number }>;
  providerName: string;
  spfRecord?: string;
  spfValid: boolean;
  dmarcRecord?: string;
  dmarcPolicy?: 'none' | 'quarantine' | 'reject' | 'missing';
  isDisposable: boolean;
  isFreeMail: boolean;
  isCorporate: boolean;
  catchAllLikely: boolean;
  smtpCheck: 'deliverable' | 'undeliverable' | 'catch_all' | 'unknown';
}

export interface IdentityProfile {
  email: string;
  username: string;
  domain: string;
  probableName?: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  bio?: string;
  location?: string;
  company?: string;
  gravatarHash?: string;
  sha256Hash?: string;
  maskedEmail?: string;
  maskedUsername?: string;
  suffixIdentifier?: string;
}

export interface RiskAssessment {
  score: number; // 0 - 100
  level: RiskLevel;
  reasons: string[];
  warnings: string[];
  goodSignals: string[];
}

export interface PhoneIntelligence {
  rawInput: string;
  countryCode: string;
  countryName: string;
  countryFlag: string;
  isoCode: string;
  alpha3Code?: string;
  capitalCity?: string;
  timeZone?: string;
  telecomAuthority?: string;
  mccMnc?: string;
  nationalNumber: string;
  e164Format: string;
  internationalFormat: string;
  carrierName: string;
  lineType: 'mobile' | 'landline' | 'voip' | 'toll_free' | 'unknown';
  isDisposableVoip: boolean;
  regionCircle?: string;
  stateRegion?: string;
  circleCategory?: string;
  circleCoverage?: string;
  publicIdentifierName: string;
  publicIdentifierSource: string;
  publicDirectoryStatus: 'indexed' | 'unindexed' | 'likely_active';
  complianceNotice: string;
  isGovernmentDatabase: false;
  whatsappUrl?: string;
  telegramUrl?: string;
  viberUrl?: string;
  truecallerUrl?: string;
  syncMeUrl?: string;
}

export interface OsintScanResult {
  id: string;
  email: string;
  targetType?: 'email' | 'phone';
  scannedAt: string;
  identity: IdentityProfile;
  dns: DnsIntelligence;
  google: GoogleFootprint;
  platforms: PlatformResult[];
  breaches: BreachRecord[];
  risk: RiskAssessment;
  pivotLinks: Array<{ label: string; url: string; category: string }>;
  phone?: PhoneIntelligence;
}

export interface BulkScanItem {
  id: string;
  email: string;
  status: 'pending' | 'scanning' | 'completed' | 'error';
  result?: OsintScanResult;
  errorMessage?: string;
}

export interface EmailHop {
  hopNumber: number;
  by: string;
  from: string;
  with: string;
  id?: string;
  timestamp?: string;
  ip?: string;
  location?: string;
  delaySeconds?: number;
}

export interface ParsedEmailHeaders {
  raw: string;
  messageId?: string;
  subject?: string;
  from?: string;
  to?: string;
  replyTo?: string;
  date?: string;
  returnPath?: string;
  originatingIp?: string;
  spfStatus: 'pass' | 'fail' | 'softfail' | 'neutral' | 'none';
  dkimStatus: 'pass' | 'fail' | 'none';
  dmarcStatus: 'pass' | 'fail' | 'none';
  hops: EmailHop[];
  suspiciousSignals: string[];
}

export interface PermutationResult {
  email: string;
  pattern: string;
  domain: string;
  status?: 'unchecked' | 'testing' | 'likely_valid' | 'invalid';
}

export interface DossierRecord {
  id: string;
  email: string;
  name?: string;
  tag: string;
  caseId?: string;
  notes: string;
  savedAt: string;
  lastScore: number;
  platformsCount: number;
  breachesCount: number;
  scanData: OsintScanResult;
}
