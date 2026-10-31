import React, { useState } from 'react';
import {
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ExternalLink,
  ShieldAlert,
  Server,
  Globe,
  Mail,
  User,
  Database,
  Calendar,
  MapPin,
  Download,
  BookmarkPlus,
  Compass,
  Copy,
  Check,
  RefreshCw,
  Eye,
  EyeOff,
  FileSpreadsheet,
  Phone,
  Smartphone,
  ChevronDown,
  Lock,
  Unlock,
  PhoneCall,
  Send,
  MessageSquare,
  Shield,
  Radio,
  Flag,
  Info,
  FileText,
  Printer,
} from 'lucide-react';
import { OsintScanResult, PlatformResult } from '../types/osint';
import { sanitizeCsvCell } from '../utils/security';
import { PlatformCard } from './PlatformCard';
import { COUNTRY_CODES, getCountryByCode } from '../data/countryCodes';

interface SingleLookupViewProps {
  currentScan: OsintScanResult | null;
  isLoading: boolean;
  onScanEmail: (email: string) => Promise<void>;
  onScanPhone: (countryCode: string, phoneNumber: string) => Promise<void>;
  onSaveDossier: (scan: OsintScanResult) => void;
  isSavedInDossier: boolean;
}

export const SingleLookupView: React.FC<SingleLookupViewProps> = ({
  currentScan,
  isLoading,
  onScanEmail,
  onScanPhone,
  onSaveDossier,
  isSavedInDossier,
}) => {
  const [lookupMode, setLookupMode] = useState<'email' | 'phone'>('email');
  const [inputEmail, setInputEmail] = useState('');
  const [selectedCountryCode, setSelectedCountryCode] = useState<string>('+91');
  const [inputPhone, setInputPhone] = useState('');
  const [isAvatarBlurred, setIsAvatarBlurred] = useState<boolean>(true);
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [platformCategoryFilter, setPlatformCategoryFilter] = useState<string>('all');
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'platforms' | 'google' | 'dns' | 'breaches' | 'pivots' | 'phone'>('overview');

  const currentCountry = getCountryByCode(selectedCountryCode);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (lookupMode === 'email') {
      if (!inputEmail.trim() || isLoading) return;
      onScanEmail(inputEmail.trim());
    } else {
      if (!inputPhone.trim() || isLoading) return;
      onScanPhone(selectedCountryCode, inputPhone.trim());
    }
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const handleExportMarkdown = () => {
    if (!currentScan) return;
    const mdLines = [
      `# RiasatTrace — OSINT & Digital Identity Intelligence Report`,
      `**Target Identifier:** \`${currentScan.email}\``,
      `**Investigator:** Lead Analyst (RiasatTrace Cryptographic Session)`,
      `**Report Generated:** ${new Date().toUTCString()}`,
      `**Calculated Threat & Anomaly Score:** ${currentScan.risk.score}/100 (${currentScan.risk.level.toUpperCase()})`,
      ``,
      `---`,
      ``,
      `## 1. Identity & Target Specifications`,
      `- **Type:** ${currentScan.targetType || 'email'}`,
      `- **Probable Subject:** ${currentScan.identity.probableName || 'Unknown / Unattributed'}`,
      `- **Masked Representation:** \`${currentScan.identity.maskedEmail || 'N/A'}\``,
      currentScan.identity.suffixIdentifier ? `- **Suffix Preserved Characters:** \`${currentScan.identity.suffixIdentifier}\`` : '',
      `- **Domain / Network:** \`${currentScan.identity.domain}\``,
      currentScan.identity.company ? `- **Affiliation:** ${currentScan.identity.company}` : '',
      currentScan.identity.location ? `- **Location:** ${currentScan.identity.location}` : '',
      ``,
    ];

    if (currentScan.phone) {
      mdLines.push(
        `## 2. Cellular & Telecom Intelligence`,
        `- **Country:** ${currentScan.phone.countryFlag} ${currentScan.phone.countryName} (${currentScan.phone.countryCode})`,
        `- **ISO Code:** ${currentScan.phone.isoCode} / ${currentScan.phone.alpha3Code || ''}`,
        `- **E.164 Format:** \`${currentScan.phone.e164Format}\``,
        `- **Carrier Network:** ${currentScan.phone.carrierName}`,
        `- **Telecom Circle / Region:** ${currentScan.phone.regionCircle || 'National / Centralized'}`,
        `- **Line Type:** ${currentScan.phone.lineType}`,
        `- **Public OSINT Identifier:** ${currentScan.phone.publicIdentifierName}`,
        `- **Public Source:** ${currentScan.phone.publicIdentifierSource}`,
        `- **Regulatory Body:** ${currentScan.phone.telecomAuthority || 'DoT / TRAI'}`,
        `- **MCC / MNC:** \`${currentScan.phone.mccMnc || 'N/A'}\``,
        `- **Timezone:** ${currentScan.phone.timeZone || 'UTC'}`,
        `- **Disposable / Burner VoIP:** ${currentScan.phone.isDisposableVoip ? 'YES (High Risk)' : 'NO (Legitimate Cellular)'}`,
        `- **Ethics & Protocol:** 100% Open Public OSINT (No restricted government/carrier DBs accessed)`,
        ``
      );
    } else {
      mdLines.push(
        `## 2. Domain Infrastructure & Deliverability`,
        `- **Primary Provider:** ${currentScan.dns.providerName}`,
        `- **MX Records:** ${currentScan.dns.hasMx ? 'Active (Valid Mail Routing)' : 'Missing (Undeliverable)'}`,
        `- **SPF Authentication:** ${currentScan.dns.spfValid ? 'Configured & Valid' : 'Missing / Misconfigured'}`,
        `- **DMARC Security Policy:** \`${currentScan.dns.dmarcPolicy || 'none'}\``,
        `- **Disposable Burner Domain:** ${currentScan.dns.isDisposable ? 'YES (High Risk Burner)' : 'NO (Legitimate Domain)'}`,
        ``,
        `## 3. Google Footprint & Ecosystem`,
        `- **Google Account Status:** ${currentScan.google.accountExists ? 'Active Account Registered' : 'Not Detected'}`,
        currentScan.google.gaiaId ? `- **Gaia ID:** \`${currentScan.google.gaiaId}\`` : '',
        currentScan.google.mapsProfileUrl ? `- **Maps Profile:** ${currentScan.google.mapsProfileUrl}` : '',
        `- **Google Maps Reviews:** ${currentScan.google.reviewsCount || 0}`,
        ``
      );
    }

    mdLines.push(
      `## 4. Platform & Profile Presence (${currentScan.platforms.filter((p) => p.status === 'found' || p.status === 'likely').length} Active Profiles Detected)`,
      `| Platform | Status | Category | Profile Link |`,
      `| :--- | :--- | :--- | :--- |`
    );

    currentScan.platforms.forEach((p) => {
      mdLines.push(`| **${p.name}** | \`${p.status.toUpperCase()}\` | ${p.category} | ${p.profileUrl || 'N/A'} |`);
    });

    mdLines.push(
      ``,
      `## 5. Security & Breach History (${currentScan.breaches.length} Exposures Found)`,
      currentScan.breaches.length === 0
        ? `*No known public breach records detected for this target identifier.*`
        : `| Breach Name | Date | Details | Severity |`,
      currentScan.breaches.length === 0
        ? ``
        : `| :--- | :--- | :--- | :--- |`
    );

    if (currentScan.breaches.length > 0) {
      currentScan.breaches.forEach((b) => {
        mdLines.push(`| **${b.title}** | ${b.breachDate} | ${b.pwnCount ? `${b.pwnCount.toLocaleString()} records` : b.dataClasses.slice(0, 3).join(', ')} | \`${b.severity.toUpperCase()}\` |`);
      });
    }

    mdLines.push(
      ``,
      `---`,
      `*Generated securely by RiasatTrace — Advanced OSINT & Digital Identity Intelligence Protocol.*`
    );

    const blob = new Blob([mdLines.filter(Boolean).join('\n')], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `riasattrace-dossier-${currentScan.email.replace(/[^a-zA-Z0-9_-]/g, '_')}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrintDossier = () => {
    window.print();
  };

  const handleExportJson = () => {
    if (!currentScan) return;
    const blob = new Blob([JSON.stringify(currentScan, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `riasattrace-${currentScan.email.replace(/[^a-zA-Z0-9_-]/g, '_')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportCsv = () => {
    if (!currentScan) return;
    const rows = [
      ['Category', 'Property', 'Value'],
      ['Target', 'Identifier', currentScan.email],
      ['Target', 'Type', currentScan.targetType || 'email'],
      ['Target', 'Masked Identifier', currentScan.identity.maskedEmail || ''],
      ['Target', 'Suffix Identifier', currentScan.identity.suffixIdentifier || ''],
      ['Target', 'Scanned At', currentScan.scannedAt],
      ['Identity', 'Probable Name', currentScan.identity.probableName || ''],
      ['Identity', 'Username / Number', currentScan.identity.username],
      ['Identity', 'Masked Username', currentScan.identity.maskedUsername || ''],
      ['Identity', 'Domain / Telecom', currentScan.identity.domain],
      ['Risk', 'Score', String(currentScan.risk.score)],
      ['Risk', 'Level', currentScan.risk.level],
      ['Google Footprint', 'Account Exists', String(currentScan.google.accountExists)],
      ['Google Footprint', 'Gaia ID', currentScan.google.gaiaId || ''],
      ['Google Footprint', 'Maps Reviews', String(currentScan.google.reviewsCount || 0)],
      ['DNS', 'Provider', currentScan.dns.providerName],
      ['DNS', 'Has MX', String(currentScan.dns.hasMx)],
      ['DNS', 'SPF Valid', String(currentScan.dns.spfValid)],
      ['DNS', 'DMARC Policy', currentScan.dns.dmarcPolicy || 'none'],
      ['DNS', 'Disposable', String(currentScan.dns.isDisposable)],
    ];

    if (currentScan.phone) {
      rows.push(
        ['Phone Intelligence', 'Country', currentScan.phone.countryName],
        ['Phone Intelligence', 'Country Code', currentScan.phone.countryCode],
        ['Phone Intelligence', 'ISO Code', `${currentScan.phone.isoCode} / ${currentScan.phone.alpha3Code || ''}`],
        ['Phone Intelligence', 'E.164 Format', currentScan.phone.e164Format],
        ['Phone Intelligence', 'International Format', currentScan.phone.internationalFormat],
        ['Phone Intelligence', 'Carrier Operator', currentScan.phone.carrierName],
        ['Phone Intelligence', 'Telecom Circle / Region', currentScan.phone.regionCircle || ''],
        ['Phone Intelligence', 'Line Type', currentScan.phone.lineType],
        ['Phone Intelligence', 'Public OSINT Identifier', currentScan.phone.publicIdentifierName],
        ['Phone Intelligence', 'Public Source', currentScan.phone.publicIdentifierSource],
        ['Phone Intelligence', 'Regulatory Body', currentScan.phone.telecomAuthority || ''],
        ['Phone Intelligence', 'MCC/MNC', currentScan.phone.mccMnc || ''],
        ['Phone Intelligence', 'Time Zone', currentScan.phone.timeZone || ''],
        ['Phone Intelligence', 'Disposable VoIP', String(currentScan.phone.isDisposableVoip)],
        ['Phone Intelligence', 'Government DB Access', 'FALSE - Strictly Open Public OSINT']
      );
    }

    const csvContent = rows
      .map((row) => row.map((cell) => `"${sanitizeCsvCell(cell)}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `riasattrace-${currentScan.email.replace(/[^a-zA-Z0-9_-]/g, '_')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredPlatforms = currentScan
    ? currentScan.platforms.filter((p) => {
        if (platformCategoryFilter === 'all') return true;
        if (platformCategoryFilter === 'found') return p.status === 'found' || p.status === 'likely';
        return p.category === platformCategoryFilter;
      })
    : [];

  const foundCount = currentScan?.platforms.filter((p) => p.status === 'found' || p.status === 'likely').length || 0;

  // Resolve dynamic avatar URL based on hash
  const dynamicAvatarUrl = currentScan?.identity.avatarUrl ||
    (currentScan?.identity.gravatarHash
      ? `https://www.gravatar.com/avatar/${currentScan.identity.gravatarHash}?s=256&d=identicon`
      : undefined);

  return (
    <div className="space-y-6">
      {/* Search Input Box */}
      <section className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 md:p-7 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="max-w-3xl">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white mb-2">
            Reverse Identity & Footprint Intelligence
          </h1>
          <p className="text-sm text-slate-400 mb-5 leading-relaxed">
            Query connected profiles, Google Gaia ID, mobile telecom carriers, DNS deliverability, and historical breach exposures silently in real time. Completely free with zero limits.
          </p>

          {/* Mode Switcher Tabs */}
          <div className="flex items-center gap-2 mb-4 p-1 bg-[#0b0f19] border border-slate-800 rounded-lg w-fit">
            <button
              type="button"
              onClick={() => setLookupMode('email')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                lookupMode === 'email'
                  ? 'bg-cyan-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Email & Handle OSINT</span>
            </button>
            <button
              type="button"
              onClick={() => setLookupMode('phone')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                lookupMode === 'phone'
                  ? 'bg-cyan-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Mobile Number Lookup</span>
            </button>
          </div>

          {/* Search Form */}
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2.5">
            {lookupMode === 'email' ? (
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Search className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={inputEmail}
                  onChange={(e) => setInputEmail(e.target.value)}
                  placeholder="Enter target email or username (e.g. name@domain.com or handle)..."
                  required
                  className="w-full pl-10 pr-10 py-3 bg-[#0b0f19] border border-slate-700/80 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 font-mono transition-all"
                />
                {inputEmail && (
                  <button
                    type="button"
                    onClick={() => setInputEmail('')}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300 cursor-pointer"
                  >
                    <XCircle className="w-4 h-4" />
                  </button>
                )}
              </div>
            ) : (
              <div className="flex-1 flex flex-col sm:flex-row gap-2.5">
                {/* Country Code Dropdown */}
                <div className="relative sm:w-60 shrink-0">
                  <select
                    value={selectedCountryCode}
                    onChange={(e) => setSelectedCountryCode(e.target.value)}
                    aria-label="Country Code Selection"
                    className="w-full py-3 pl-3 pr-8 bg-[#0b0f19] border border-slate-700/80 rounded-lg text-sm text-slate-100 font-mono focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 cursor-pointer appearance-none"
                  >
                    {COUNTRY_CODES.map((c) => (
                      <option key={c.code} value={c.code} className="bg-slate-900 text-slate-100 py-1 font-mono">
                        {c.flag} {c.code} ({c.name})
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400">
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </div>

                {/* Mobile Number Input */}
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Phone className="w-4 h-4" />
                  </div>
                  <input
                    type="tel"
                    value={inputPhone}
                    onChange={(e) => setInputPhone(e.target.value)}
                    placeholder="Enter mobile number..."
                    required
                    className="w-full pl-10 pr-10 py-3 bg-[#0b0f19] border border-slate-700/80 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 font-mono transition-all"
                  />
                  {inputPhone && (
                    <button
                      type="button"
                      onClick={() => setInputPhone('')}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300 cursor-pointer"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || (lookupMode === 'email' ? !inputEmail.trim() : !inputPhone.trim())}
              className="px-6 py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-sm rounded-lg shadow-sm hover:shadow-cyan-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap cursor-pointer shrink-0"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Scanning Records...</span>
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4" />
                  <span>{lookupMode === 'email' ? 'Investigate Email' : 'Analyze Number'}</span>
                </>
              )}
            </button>
          </form>
        </div>
      </section>

      {/* Loading state indicator */}
      {isLoading && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center space-y-4 animate-pulse">
          <div className="w-12 h-12 rounded-full border-2 border-cyan-500 border-t-transparent animate-spin mx-auto" />
          <div>
            <h3 className="text-base font-semibold text-white">Aggregating Open Source Intelligence</h3>
            <p className="text-xs text-slate-400 mt-1 font-mono">
              Resolving DoH DNS records · Checking Gaia & Google footprint · Querying developer profiles · Scanning breach exposures & telecom networks...
            </p>
          </div>
        </div>
      )}

      {/* Results View */}
      {currentScan && !isLoading && (
        <div className="space-y-6">
          {/* Header Card / Executive Summary */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-800">
              <div className="flex items-start gap-4">
                {/* Dynamic Avatar with explicit CSS blur(4px) and investigator toggle */}
                <div className="relative group shrink-0">
                  <div className="w-16 h-16 rounded-xl bg-slate-800 border border-slate-700 overflow-hidden flex items-center justify-center relative shadow-inner">
                    {dynamicAvatarUrl ? (
                      <img
                        src={dynamicAvatarUrl}
                        alt={currentScan.email}
                        referrerPolicy="no-referrer"
                        style={{ filter: isAvatarBlurred ? 'blur(4px)' : 'none' }}
                        className="w-full h-full object-cover transition-all duration-300 transform group-hover:scale-105"
                        onError={(e) => {
                          const fallbackUrl = `https://www.gravatar.com/avatar/${currentScan.identity.gravatarHash || '00000000000000000000000000000000'}?s=256&d=identicon`;
                          if ((e.currentTarget as HTMLImageElement).src !== fallbackUrl) {
                            (e.currentTarget as HTMLImageElement).src = fallbackUrl;
                          }
                        }}
                      />
                    ) : (
                      <User className="w-8 h-8 text-slate-400" />
                    )}

                    {/* Interactive blur overlay button */}
                    <button
                      type="button"
                      onClick={() => setIsAvatarBlurred((prev) => !prev)}
                      className="absolute inset-0 bg-slate-950/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-[10px] text-white font-mono gap-0.5 cursor-pointer backdrop-blur-[1px]"
                      title={isAvatarBlurred ? 'Click to unblur avatar' : 'Click to apply 4px privacy blur'}
                    >
                      {isAvatarBlurred ? <Eye className="w-4 h-4 text-cyan-300" /> : <EyeOff className="w-4 h-4 text-slate-300" />}
                      <span className="scale-75 origin-center font-medium">{isAvatarBlurred ? 'Unblur' : 'Blur'}</span>
                    </button>
                  </div>

                  {/* 4px Privacy Blur status pill */}
                  <button
                    type="button"
                    onClick={() => setIsAvatarBlurred((prev) => !prev)}
                    className={`absolute -bottom-2 -right-2 px-1.5 py-0.5 rounded-full text-[9px] font-mono border flex items-center gap-1 shadow-md cursor-pointer transition-colors ${
                      isAvatarBlurred
                        ? 'bg-cyan-950/90 text-cyan-300 border-cyan-500/40 hover:bg-cyan-900/90'
                        : 'bg-slate-800/90 text-slate-400 border-slate-700 hover:text-slate-200'
                    }`}
                    title={isAvatarBlurred ? 'CSS blur(4px) active. Click to reveal.' : 'Unblurred. Click to restore blur(4px).'}
                  >
                    {isAvatarBlurred ? <Lock className="w-2.5 h-2.5" /> : <Unlock className="w-2.5 h-2.5" />}
                    <span>{isAvatarBlurred ? '4px Blur' : 'Clear'}</span>
                  </button>
                </div>

                {/* Identity Metadata */}
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-xl font-bold text-white font-mono break-all">{currentScan.email}</h2>
                    <button
                      onClick={() => handleCopy(currentScan.email, 'email')}
                      className="text-slate-500 hover:text-slate-300 transition-colors p-1"
                      title="Copy target identifier"
                    >
                      {copiedText === 'email' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>

                    {/* Masked details badge for clear identification */}
                    {currentScan.identity.maskedEmail && (
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-cyan-950/60 border border-cyan-500/30 text-xs font-mono text-cyan-300 shadow-sm">
                        <span className="text-[10px] uppercase tracking-wider text-slate-400 font-sans font-semibold">Masked:</span>
                        <span className="font-semibold text-cyan-200">{currentScan.identity.maskedEmail}</span>
                        {currentScan.identity.suffixIdentifier && (
                          <span className="text-[10px] text-emerald-300 font-semibold bg-emerald-950/70 px-1.5 py-0.5 rounded border border-emerald-500/30" title="Last digits/characters preserved for identification">
                            ...{currentScan.identity.suffixIdentifier}
                          </span>
                        )}
                        <button
                          onClick={() => handleCopy(currentScan.identity.maskedEmail || '', 'masked')}
                          className="text-slate-400 hover:text-cyan-200 transition-colors ml-0.5"
                          title="Copy masked identifier"
                        >
                          {copiedText === 'masked' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    )}
                  </div>

                  {currentScan.identity.probableName && (
                    <div className="flex items-center gap-2 flex-wrap mt-1">
                      <p className="text-base font-semibold text-white">
                        {currentScan.identity.probableName}
                      </p>
                      {currentScan.phone && (
                        <span className="text-[10px] bg-cyan-950/80 text-cyan-300 border border-cyan-500/40 px-2 py-0.5 rounded-full font-mono flex items-center gap-1 font-medium">
                          <Globe className="w-3 h-3 text-cyan-400" /> Public OSINT Identifier
                        </span>
                      )}
                      {currentScan.identity.company && (
                        <span className="text-slate-400 text-sm font-normal"> · {currentScan.identity.company}</span>
                      )}
                    </div>
                  )}

                  {/* Clean metadata line */}
                  <div className="flex items-center gap-2 text-xs text-slate-400 mt-2 font-mono flex-wrap">
                    {currentScan.phone ? (
                      <>
                        <span className="text-cyan-300 font-semibold">{currentScan.phone.countryFlag} {currentScan.phone.countryName} ({currentScan.phone.countryCode})</span>
                        <span aria-hidden="true">·</span>
                        <span>Carrier: <span className="text-slate-200">{currentScan.phone.carrierName}</span></span>
                        {currentScan.phone.regionCircle && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span>Circle: <span className="text-slate-200">{currentScan.phone.regionCircle}</span></span>
                          </>
                        )}
                        <span aria-hidden="true">·</span>
                        <span className="capitalize">{currentScan.phone.lineType} Line</span>
                        <span aria-hidden="true">·</span>
                        <span className="text-emerald-400 font-medium">Public Intelligence</span>
                      </>
                    ) : (
                      <>
                        <span>{currentScan.dns.providerName}</span>
                        <span aria-hidden="true">·</span>
                        <span>MX {currentScan.dns.hasMx ? 'Active' : 'Missing'}</span>
                        <span aria-hidden="true">·</span>
                        <span>SPF {currentScan.dns.spfValid ? 'Configured' : 'Missing'}</span>
                        <span aria-hidden="true">·</span>
                        <span>DMARC {currentScan.dns.dmarcPolicy}</span>
                      </>
                    )}
                    <span aria-hidden="true">·</span>
                    <span>Scanned {new Date(currentScan.scannedAt).toLocaleTimeString()}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons & Risk Score */}
              <div className="flex items-center gap-4 flex-wrap lg:justify-end">
                {/* Risk score gauge */}
                <div className="bg-[#0b0f19] border border-slate-800 rounded-lg px-4 py-2 text-right">
                  <div className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">Calculated Risk</div>
                  <div className="flex items-baseline justify-end gap-1 font-mono">
                    <span
                      className={`text-2xl font-bold tabular-nums ${
                        currentScan.risk.score >= 50
                          ? 'text-rose-400'
                          : currentScan.risk.score >= 25
                          ? 'text-amber-400'
                          : 'text-emerald-400'
                      }`}
                    >
                      {currentScan.risk.score}
                    </span>
                    <span className="text-xs text-slate-500">/ 100</span>
                    <span
                      className={`text-xs uppercase font-semibold ml-1.5 ${
                        currentScan.risk.score >= 50
                          ? 'text-rose-400'
                          : currentScan.risk.score >= 25
                          ? 'text-amber-400'
                          : 'text-emerald-400'
                      }`}
                    >
                      ({currentScan.risk.level})
                    </span>
                  </div>
                </div>

                {/* Dossier & Export buttons */}
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => onSaveDossier(currentScan)}
                    className={`px-3 py-2 text-xs font-medium rounded-lg border transition-all flex items-center gap-1.5 cursor-pointer ${
                      isSavedInDossier
                        ? 'bg-cyan-950/60 border-cyan-500/50 text-cyan-300'
                        : 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
                    }`}
                  >
                    <BookmarkPlus className="w-3.5 h-3.5" />
                    <span>{isSavedInDossier ? 'Saved in Dossier' : 'Save Dossier'}</span>
                  </button>

                  <button
                    onClick={handleExportJson}
                    className="p-2 text-xs font-medium rounded-lg bg-slate-800 border border-slate-700 text-slate-200 hover:bg-slate-700 transition-colors cursor-pointer"
                    title="Export JSON"
                  >
                    <Download className="w-4 h-4" />
                  </button>

                  <button
                    onClick={handleExportCsv}
                    className="p-2 text-xs font-medium rounded-lg bg-slate-800 border border-slate-700 text-slate-200 hover:bg-slate-700 transition-colors cursor-pointer"
                    title="Export CSV"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                  </button>

                  <button
                    onClick={handleExportMarkdown}
                    className="p-2 text-xs font-medium rounded-lg bg-slate-800 border border-slate-700 text-cyan-300 hover:bg-slate-700 transition-colors cursor-pointer"
                    title="Export Markdown Intelligence Dossier (.md)"
                  >
                    <FileText className="w-4 h-4" />
                  </button>

                  <button
                    onClick={handlePrintDossier}
                    className="p-2 text-xs font-medium rounded-lg bg-slate-800 border border-slate-700 text-slate-200 hover:bg-slate-700 transition-colors cursor-pointer"
                    title="Print / Save Dossier to PDF"
                  >
                    <Printer className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-5">
              <div>
                <div className="text-xs text-slate-400">Platforms Detected</div>
                <div className="text-xl font-bold text-white font-mono mt-0.5 tabular-nums">
                  {foundCount} <span className="text-xs font-normal text-slate-500">/ {currentScan.platforms.length}</span>
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-400">
                  {currentScan.phone ? 'Carrier Network' : 'Google Footprint'}
                </div>
                <div className="text-xl font-bold text-white font-mono mt-0.5 truncate">
                  {currentScan.phone ? (
                    <span className="text-cyan-400 flex items-center gap-1 text-sm font-semibold">
                      <PhoneCall className="w-4 h-4 shrink-0" />
                      <span className="truncate">{currentScan.phone.carrierName}</span>
                    </span>
                  ) : currentScan.google.accountExists ? (
                    <span className="text-cyan-400 flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" /> Active
                    </span>
                  ) : (
                    <span className="text-slate-500">Not found</span>
                  )}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-400">Breach Exposures</div>
                <div className="text-xl font-bold font-mono mt-0.5 tabular-nums">
                  {currentScan.breaches.length > 0 ? (
                    <span className="text-rose-400 flex items-center gap-1">
                      <AlertTriangle className="w-4 h-4" /> {currentScan.breaches.length} leaks
                    </span>
                  ) : (
                    <span className="text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" /> None
                    </span>
                  )}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-400">
                  {currentScan.phone ? 'Line Verification' : 'Deliverability'}
                </div>
                <div className="text-xl font-bold font-mono mt-0.5">
                  {currentScan.phone ? (
                    currentScan.phone.isDisposableVoip ? (
                      <span className="text-rose-400 text-sm">VoIP Burner</span>
                    ) : (
                      <span className="text-emerald-400 text-sm">Mobile Cellular</span>
                    )
                  ) : currentScan.dns.isDisposable ? (
                    <span className="text-rose-400 text-sm">Burner</span>
                  ) : currentScan.dns.hasMx ? (
                    <span className="text-emerald-400 text-sm">Valid Mailbox</span>
                  ) : (
                    <span className="text-slate-500 text-sm">No MX</span>
                  )}
                </div>
              </div>
            </div>

            {/* Public OSINT Compliance & Transparency Notice */}
            {currentScan.phone && (
              <div className="mt-4 pt-4 border-t border-slate-800/80 flex items-start gap-3 bg-[#0b0f19]/70 p-3.5 rounded-lg border border-cyan-500/20">
                <div className="w-7 h-7 rounded-md bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Shield className="w-4 h-4" />
                </div>
                <div className="text-xs space-y-1">
                  <div className="font-semibold text-cyan-300 flex items-center gap-2 flex-wrap">
                    <span>Public OSINT Intelligence Notice</span>
                    <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full font-mono font-medium">
                      Zero Government Databases Accessed
                    </span>
                  </div>
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    {currentScan.phone.complianceNotice}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Sub Navigation Segmented Control */}
          <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-lg overflow-x-auto">
            <button
              onClick={() => setActiveSubTab('overview')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                activeSubTab === 'overview'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Overview & Signals
            </button>
            {currentScan.phone && (
              <button
                onClick={() => setActiveSubTab('phone')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                  activeSubTab === 'phone'
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Telephony & Carrier
              </button>
            )}
            <button
              onClick={() => setActiveSubTab('platforms')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                activeSubTab === 'platforms'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Platforms & Accounts ({foundCount})
            </button>
            <button
              onClick={() => setActiveSubTab('google')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                activeSubTab === 'google'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Google Ecosystem & Gaia
            </button>
            {!currentScan.phone && (
              <button
                onClick={() => setActiveSubTab('dns')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                  activeSubTab === 'dns'
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                DNS & Deliverability
              </button>
            )}
            <button
              onClick={() => setActiveSubTab('breaches')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                activeSubTab === 'breaches'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Breaches & Leaks ({currentScan.breaches.length})
            </button>
            <button
              onClick={() => setActiveSubTab('pivots')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                activeSubTab === 'pivots'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              OSINT Pivots ({currentScan.pivotLinks.length})
            </button>
          </div>

          {/* Sub Tab: Overview */}
          {activeSubTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Risk Factors */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-cyan-400" />
                    <span>Risk Factors & Security Signals</span>
                  </h3>
                  <span className="text-xs text-slate-500 font-mono">Score {currentScan.risk.score}/100</span>
                </div>

                <div className="space-y-2">
                  {currentScan.risk.reasons.map((reason, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-rose-300">
                      <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                      <span>{reason}</span>
                    </div>
                  ))}
                  {currentScan.risk.warnings.map((warn, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-amber-300">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                      <span>{warn}</span>
                    </div>
                  ))}
                  {currentScan.risk.goodSignals.map((sig, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-emerald-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{sig}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Cryptographic Hashes, Avatar Streams & Technical Identifiers */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    <Database className="w-4 h-4 text-cyan-400" />
                    <span>Cryptographic Hashes & Profile Avatar Feeds</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => setIsAvatarBlurred(!isAvatarBlurred)}
                    className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-mono"
                  >
                    {isAvatarBlurred ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                    <span>{isAvatarBlurred ? 'filter: blur(4px)' : 'filter: none'}</span>
                  </button>
                </div>

                <div className="space-y-3 font-mono text-xs">
                  {/* Masked Identifier */}
                  <div>
                    <div className="flex items-center justify-between text-slate-400 text-[11px] mb-1">
                      <span>Masked Identity Pattern (Recovery & Verification)</span>
                      {currentScan.identity.suffixIdentifier && (
                        <span className="text-emerald-400 font-medium">Revealing suffix: ...{currentScan.identity.suffixIdentifier}</span>
                      )}
                    </div>
                    <div className="p-2 bg-[#0b0f19] border border-slate-800 rounded text-cyan-300 break-all select-all flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-cyan-200">{currentScan.identity.maskedEmail}</span>
                        {currentScan.identity.suffixIdentifier && (
                          <span className="text-[10px] bg-emerald-950/80 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.5 rounded">
                            ID: {currentScan.identity.suffixIdentifier}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => handleCopy(currentScan.identity.maskedEmail || '', 'maskedCard')}
                        className="text-slate-500 hover:text-slate-300 shrink-0 cursor-pointer"
                        title="Copy masked identifier"
                      >
                        {copiedText === 'maskedCard' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* Masked Username */}
                  {currentScan.identity.maskedUsername && (
                    <div>
                      <div className="text-slate-400 text-[11px] mb-1">Masked Handle / Username</div>
                      <div className="p-2 bg-[#0b0f19] border border-slate-800 rounded text-cyan-300 break-all select-all flex items-center justify-between gap-2">
                        <span className="font-mono text-slate-300">{currentScan.identity.maskedUsername}</span>
                        <button
                          onClick={() => handleCopy(currentScan.identity.maskedUsername || '', 'maskedUser')}
                          className="text-slate-500 hover:text-slate-300 shrink-0 cursor-pointer"
                          title="Copy masked username"
                        >
                          {copiedText === 'maskedUser' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Dynamic Google / Gravatar Avatar URL */}
                  <div>
                    <div className="flex items-center justify-between text-slate-400 text-[11px] mb-1">
                      <span>Dynamic Gravatar / Google Profile Avatar Stream</span>
                      <span className="text-cyan-400 font-sans text-[10px]">Blur Filter 4px Active</span>
                    </div>
                    <div className="p-2 bg-[#0b0f19] border border-slate-800 rounded text-cyan-300 break-all select-all flex items-center justify-between gap-2">
                      <span className="truncate text-slate-300 text-[11px]">
                        {currentScan.identity.avatarUrl || `https://www.gravatar.com/avatar/${currentScan.identity.gravatarHash}?s=256&d=identicon`}
                      </span>
                      <button
                        onClick={() => handleCopy(currentScan.identity.avatarUrl || `https://www.gravatar.com/avatar/${currentScan.identity.gravatarHash}?s=256&d=identicon`, 'avatarStream')}
                        className="text-slate-500 hover:text-slate-300 shrink-0 cursor-pointer"
                        title="Copy avatar stream URL"
                      >
                        {copiedText === 'avatarStream' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* SHA-256 Digest */}
                  <div>
                    <div className="text-slate-400 text-[11px] mb-1">SHA-256 Digest (Gravatar modern hash)</div>
                    <div className="p-2 bg-[#0b0f19] border border-slate-800 rounded text-cyan-300 break-all select-all flex items-center justify-between gap-2">
                      <span className="truncate">{currentScan.identity.sha256Hash}</span>
                      <button
                        onClick={() => handleCopy(currentScan.identity.sha256Hash || '', 'sha256')}
                        className="text-slate-500 hover:text-slate-300 shrink-0 cursor-pointer"
                      >
                        {copiedText === 'sha256' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* MD5 Digest */}
                  <div>
                    <div className="text-slate-400 text-[11px] mb-1">MD5 Digest (Gravatar legacy lookup key)</div>
                    <div className="p-2 bg-[#0b0f19] border border-slate-800 rounded text-cyan-300 break-all select-all flex items-center justify-between gap-2">
                      <span className="truncate">{currentScan.identity.gravatarHash}</span>
                      <button
                        onClick={() => handleCopy(currentScan.identity.gravatarHash || '', 'md5')}
                        className="text-slate-500 hover:text-slate-300 shrink-0 cursor-pointer"
                      >
                        {copiedText === 'md5' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Sub Tab: Phone Intelligence */}
          {activeSubTab === 'phone' && currentScan.phone && (
            <div className="space-y-6">
              {/* Compliance & Transparency Guarantee Banner */}
              <div className="bg-gradient-to-r from-emerald-950/40 via-cyan-950/30 to-slate-900 border border-emerald-500/30 rounded-xl p-5 space-y-3">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                      <Shield className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <span>Public OSINT Compliance Guarantee</span>
                        <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full font-mono uppercase tracking-wider font-semibold">
                          Non-Government Data
                        </span>
                      </h3>
                      <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                        This lookup operates strictly under open-source intelligence (OSINT) standards. It queries open ITU-T E.164 allocation tables, national regulatory plans, open caller directories, and public web indexes.
                        <span className="text-emerald-300 font-medium"> No restricted government citizen databases (such as NADRA, Aadhaar, SSA), wiretaps, or confidential telecom billing records (CDR) are accessed or queried.</span>
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs font-mono">
                  <div className="p-2.5 bg-[#0b0f19]/80 border border-slate-800 rounded flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="text-slate-300">Open Public Registries</span>
                  </div>
                  <div className="p-2.5 bg-[#0b0f19]/80 border border-slate-800 rounded flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="text-slate-300">ITU-T E.164 Numbering Plan</span>
                  </div>
                  <div className="p-2.5 bg-[#0b0f19]/80 border border-slate-800 rounded flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="text-slate-300">Zero Restricted DB Access</span>
                  </div>
                </div>
              </div>

              {/* Main Phone Intelligence Container */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
                <div className="flex items-center justify-between flex-wrap gap-4 border-b border-slate-800 pb-5">
                  <div>
                    <h3 className="text-base font-semibold text-white flex items-center gap-2">
                      <Smartphone className="w-5 h-5 text-cyan-400" />
                      <span>Public Carrier & Country Code Intelligence</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Carrier allocation, geographic telecom circle, regulatory jurisdiction, and public identifier directory cross-referencing.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 font-mono text-xs">
                    <span className="text-slate-400">Target Identifier:</span>
                    <span className="px-2.5 py-1 bg-[#0b0f19] border border-slate-800 rounded text-cyan-300 font-bold">
                      {currentScan.phone.internationalFormat || currentScan.phone.e164Format}
                    </span>
                  </div>
                </div>

                {/* Section 1: Public OSINT Identifier Name Banner */}
                <div className="p-4 bg-[#0b0f19] border border-cyan-500/30 rounded-lg space-y-2">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-cyan-400" />
                      <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">Public OSINT Identifier Name</span>
                    </div>
                    <span className="text-[10px] font-mono text-cyan-300 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-500/30">
                      Crowdsourced & Public Directory Index
                    </span>
                  </div>
                  <div className="text-lg font-bold text-white flex items-center gap-2 flex-wrap">
                    <span>{currentScan.phone.publicIdentifierName}</span>
                    <span className="text-xs font-normal text-emerald-400 bg-emerald-950/70 border border-emerald-500/30 px-2 py-0.5 rounded">
                      Public Directory Listing
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1.5 flex-wrap pt-1">
                    <span className="text-slate-500">Source:</span>
                    <span className="text-slate-300">{currentScan.phone.publicIdentifierSource}</span>
                    <span aria-hidden="true" className="text-slate-600">·</span>
                    <span className="text-slate-500">Method:</span>
                    <span className="text-slate-300">Open Public Index (No restricted government databases)</span>
                  </div>
                </div>

                {/* Section 2: Public Carrier & Routing Allocation Details */}
                <div>
                  <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono mb-3 flex items-center gap-1.5">
                    <Radio className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Public Carrier Info & Regional Telecom Circle</span>
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-[#0b0f19] border border-slate-800 rounded-lg space-y-1">
                      <div className="text-xs text-slate-400 font-mono">Carrier & Network Operator</div>
                      <div className="text-base font-bold text-cyan-300 truncate">
                        {currentScan.phone.carrierName}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono">Terrestrial Cellular Allocation</div>
                    </div>

                    <div className="p-4 bg-[#0b0f19] border border-slate-800 rounded-lg space-y-1">
                      <div className="text-xs text-slate-400 font-mono">Telecom Circle / State Routing</div>
                      <div className="text-base font-bold text-white truncate" title={currentScan.phone.regionCircle}>
                        {currentScan.phone.regionCircle || 'Nationwide Central Circle'}
                      </div>
                      <div
                        className="text-[11px] text-cyan-400/90 font-mono truncate"
                        title={currentScan.phone.circleCoverage || currentScan.phone.stateRegion || 'Geographic Zone Allocation'}
                      >
                        {currentScan.phone.circleCoverage
                          ? currentScan.phone.circleCoverage
                          : currentScan.phone.stateRegion
                          ? `State: ${currentScan.phone.stateRegion}`
                          : 'Geographic Zone Allocation'}
                      </div>
                    </div>

                    <div className="p-4 bg-[#0b0f19] border border-slate-800 rounded-lg space-y-1">
                      <div className="text-xs text-slate-400 font-mono">Line Type Forensic</div>
                      <div className="text-base font-bold flex items-center gap-2">
                        {currentScan.phone.isDisposableVoip ? (
                          <span className="text-rose-400 flex items-center gap-1.5">
                            <AlertTriangle className="w-4 h-4" /> Virtual VoIP / Burner
                          </span>
                        ) : (
                          <span className="text-emerald-400 flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4" /> Cellular Mobile
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        {currentScan.phone.isDisposableVoip ? 'Disposable SMS bypass risk' : 'Standard physical SIM subscriber'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 3: Country Code & Regulatory Framework Details */}
                <div>
                  <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono mb-3 flex items-center gap-1.5">
                    <Flag className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Country Code & Numbering Plan Details</span>
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="p-3.5 bg-[#0b0f19] border border-slate-800 rounded-lg space-y-1">
                      <div className="text-[11px] text-slate-400 font-mono">Country & Dial Code</div>
                      <div className="text-sm font-bold text-white flex items-center gap-2">
                        <span className="text-lg">{currentScan.phone.countryFlag}</span>
                        <span>{currentScan.phone.countryName}</span>
                        <span className="text-cyan-400 font-mono text-xs">({currentScan.phone.countryCode})</span>
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">ISO: {currentScan.phone.isoCode} ({currentScan.phone.alpha3Code || 'INT'})</div>
                    </div>

                    <div className="p-3.5 bg-[#0b0f19] border border-slate-800 rounded-lg space-y-1">
                      <div className="text-[11px] text-slate-400 font-mono">Capital & Primary Timezone</div>
                      <div className="text-sm font-bold text-white truncate">
                        {currentScan.phone.capitalCity || 'Capital City'}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">{currentScan.phone.timeZone || 'UTC Standard'}</div>
                    </div>

                    <div className="p-3.5 bg-[#0b0f19] border border-slate-800 rounded-lg space-y-1">
                      <div className="text-[11px] text-slate-400 font-mono">Regulatory Authority</div>
                      <div className="text-sm font-bold text-slate-200 truncate">
                        {currentScan.phone.telecomAuthority || 'National Telecom Authority'}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">Numbering Plan Administrator</div>
                    </div>

                    <div className="p-3.5 bg-[#0b0f19] border border-slate-800 rounded-lg space-y-1">
                      <div className="text-[11px] text-slate-400 font-mono">ITU-T Plan & MCC</div>
                      <div className="text-sm font-bold text-cyan-300 font-mono">
                        MCC {currentScan.phone.mccMnc || 'Standard'}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">E.164 Recommendation</div>
                    </div>
                  </div>
                </div>

                {/* Section 4: Public Directory & Messaging Pivots */}
                <div className="space-y-3 pt-2">
                  <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono">
                    Public Directory, Messaging & OSINT Pivots
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {currentScan.phone.truecallerUrl && (
                      <a
                        href={currentScan.phone.truecallerUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-3.5 bg-[#0b0f19] border border-slate-800 hover:border-sky-500/50 rounded-lg flex items-center justify-between text-xs text-slate-200 hover:text-white transition-all group"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center">
                            <PhoneCall className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-semibold text-slate-100 group-hover:text-sky-300">Truecaller Web</div>
                            <div className="text-[10px] text-slate-400">Public caller ID lookup</div>
                          </div>
                        </div>
                        <ExternalLink className="w-4 h-4 text-slate-500 group-hover:text-sky-400" />
                      </a>
                    )}

                    {currentScan.phone.syncMeUrl && (
                      <a
                        href={currentScan.phone.syncMeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-3.5 bg-[#0b0f19] border border-slate-800 hover:border-indigo-500/50 rounded-lg flex items-center justify-between text-xs text-slate-200 hover:text-white transition-all group"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                            <User className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-semibold text-slate-100 group-hover:text-indigo-300">Sync.ME Directory</div>
                            <div className="text-[10px] text-slate-400">Crowdsourced caller index</div>
                          </div>
                        </div>
                        <ExternalLink className="w-4 h-4 text-slate-500 group-hover:text-indigo-400" />
                      </a>
                    )}

                    {currentScan.phone.whatsappUrl && (
                      <a
                        href={currentScan.phone.whatsappUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-3.5 bg-[#0b0f19] border border-slate-800 hover:border-emerald-500/50 rounded-lg flex items-center justify-between text-xs text-slate-200 hover:text-white transition-all group"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                            <MessageSquare className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-semibold text-slate-100 group-hover:text-emerald-300">WhatsApp API</div>
                            <div className="text-[10px] text-slate-400">wa.me Click to Chat</div>
                          </div>
                        </div>
                        <ExternalLink className="w-4 h-4 text-slate-500 group-hover:text-emerald-400" />
                      </a>
                    )}

                    {currentScan.phone.telegramUrl && (
                      <a
                        href={currentScan.phone.telegramUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-3.5 bg-[#0b0f19] border border-slate-800 hover:border-cyan-500/50 rounded-lg flex items-center justify-between text-xs text-slate-200 hover:text-white transition-all group"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
                            <Send className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-semibold text-slate-100 group-hover:text-cyan-300">Telegram Entity</div>
                            <div className="text-[10px] text-slate-400">Direct t.me link</div>
                          </div>
                        </div>
                        <ExternalLink className="w-4 h-4 text-slate-500 group-hover:text-cyan-400" />
                      </a>
                    )}

                    <a
                      href={`https://www.google.com/search?q="${encodeURIComponent(currentScan.phone.e164Format)}"+OR+"${encodeURIComponent(currentScan.phone.internationalFormat)}"`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3.5 bg-[#0b0f19] border border-slate-800 hover:border-amber-500/50 rounded-lg flex items-center justify-between text-xs text-slate-200 hover:text-white transition-all group"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
                          <Search className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-semibold text-slate-100 group-hover:text-amber-300">Google Exact Quote</div>
                          <div className="text-[10px] text-slate-400">Public web footprint dork</div>
                        </div>
                      </div>
                      <ExternalLink className="w-4 h-4 text-slate-500 group-hover:text-amber-400" />
                    </a>

                    <a
                      href={`https://www.bing.com/search?q="${encodeURIComponent(currentScan.phone.e164Format)}"`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3.5 bg-[#0b0f19] border border-slate-800 hover:border-sky-500/50 rounded-lg flex items-center justify-between text-xs text-slate-200 hover:text-white transition-all group"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center">
                          <Search className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-semibold text-slate-100 group-hover:text-sky-300">Bing Search Dork</div>
                          <div className="text-[10px] text-slate-400">Reverse exact number query</div>
                        </div>
                      </div>
                      <ExternalLink className="w-4 h-4 text-slate-500 group-hover:text-sky-400" />
                    </a>

                    <a
                      href="https://numverify.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3.5 bg-[#0b0f19] border border-slate-800 hover:border-emerald-500/50 rounded-lg flex items-center justify-between text-xs text-slate-200 hover:text-white transition-all group"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                          <Server className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-semibold text-slate-100 group-hover:text-emerald-300">Numverify Lookup</div>
                          <div className="text-[10px] text-slate-400">Public HLR & prefix info</div>
                        </div>
                      </div>
                      <ExternalLink className="w-4 h-4 text-slate-500 group-hover:text-emerald-400" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Sub Tab: Platforms */}
          {activeSubTab === 'platforms' && (
            <div className="space-y-4">
              {/* Category Filter Bar */}
              <div className="flex items-center gap-1.5 flex-wrap text-xs">
                {['all', 'found', 'social', 'developer', 'productivity', 'messaging', 'multimedia', 'gaming'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setPlatformCategoryFilter(cat)}
                    className={`px-3 py-1.5 rounded-md font-medium capitalize transition-colors cursor-pointer ${
                      platformCategoryFilter === cat
                        ? 'bg-cyan-500 text-slate-950 font-semibold'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {cat === 'all' ? `All (${currentScan?.platforms.length || 0})` : cat === 'found' ? `Confirmed / Likely (${foundCount})` : cat}
                  </button>
                ))}
              </div>

              {/* Platform Grid with Dynamic Brand Icons */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredPlatforms.map((p) => (
                  <PlatformCard key={p.id} platform={p} />
                ))}
              </div>
            </div>
          )}

          {/* Sub Tab: Google Ecosystem */}
          {activeSubTab === 'google' && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
              <div>
                <h3 className="text-base font-semibold text-white flex items-center gap-2">
                  <Mail className="w-5 h-5 text-cyan-400" />
                  <span>Google Ecosystem & Gaia ID Footprint</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  RiasatTrace maps Google's internal Gaia ID, linked public Google Maps local guide reviews, calendar scheduling availability, and public album archives.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-[#0b0f19] border border-slate-800 rounded-lg space-y-2">
                  <div className="text-xs text-slate-400 font-mono">Google Account Status</div>
                  <div className="text-sm font-semibold text-white flex items-center gap-2">
                    {currentScan.google.accountExists ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>Registered Google Identity ({currentScan.google.accountType})</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-4 h-4 text-slate-500" />
                        <span>No public consumer Google account detected</span>
                      </>
                    )}
                  </div>
                  {currentScan.google.gaiaId && (
                    <div className="text-xs font-mono text-cyan-400 pt-1">
                      Gaia ID: {currentScan.google.gaiaId}
                    </div>
                  )}
                </div>

                <div className="p-4 bg-[#0b0f19] border border-slate-800 rounded-lg space-y-2">
                  <div className="text-xs text-slate-400 font-mono">Google Maps Reviews & Local Contributions</div>
                  <div className="text-sm font-semibold text-white flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-cyan-400" />
                    <span>
                      {currentScan.google.hasGoogleMapsReviews
                        ? `${currentScan.google.reviewsCount} Public Local Guide Reviews`
                        : 'No public map reviews'}
                    </span>
                  </div>
                  {currentScan.google.mapsProfileUrl && (
                    <a
                      href={currentScan.google.mapsProfileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-cyan-400 hover:underline inline-flex items-center gap-1 font-mono pt-1"
                    >
                      <span>View Contributor Profile</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>

                <div className="p-4 bg-[#0b0f19] border border-slate-800 rounded-lg space-y-2">
                  <div className="text-xs text-slate-400 font-mono">Google Calendar Scheduling</div>
                  <div className="text-sm font-semibold text-white flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-cyan-400" />
                    <span>{currentScan.google.hasCalendarScheduling ? 'Calendar Booking Targetable' : 'Unavailable'}</span>
                  </div>
                  {currentScan.google.calendarBookingUrl && (
                    <a
                      href={currentScan.google.calendarBookingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-cyan-400 hover:underline inline-flex items-center gap-1 font-mono pt-1"
                    >
                      <span>Check Free/Busy Availability</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>

                <div className="p-4 bg-[#0b0f19] border border-slate-800 rounded-lg space-y-2">
                  <div className="text-xs text-slate-400 font-mono">Google Photos & Albums</div>
                  <div className="text-sm font-semibold text-white flex items-center gap-2">
                    <Globe className="w-4 h-4 text-cyan-400" />
                    <span>{currentScan.google.hasPublicPhotos ? 'Public Albums Available' : 'No Public Albums'}</span>
                  </div>
                  {currentScan.google.photosUrl && (
                    <a
                      href={currentScan.google.photosUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-cyan-400 hover:underline inline-flex items-center gap-1 font-mono pt-1"
                    >
                      <span>Inspect Album Archive</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Sub Tab: DNS & Deliverability */}
          {activeSubTab === 'dns' && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h3 className="text-base font-semibold text-white flex items-center gap-2">
                    <Server className="w-5 h-5 text-cyan-400" />
                    <span>Domain, DNS & Deliverability Health</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Live DNS-over-HTTPS inspection for domain <span className="font-mono text-cyan-300">{currentScan.dns.domain}</span>
                  </p>
                </div>
                <span className="text-xs font-mono text-slate-400">
                  Provider: <span className="text-white font-medium">{currentScan.dns.providerName}</span>
                </span>
              </div>

              {/* MX Table */}
              <div>
                <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono mb-2">
                  Mail Exchange (MX) Servers
                </h4>
                {currentScan.dns.mxRecords.length > 0 ? (
                  <div className="border border-slate-800 rounded-lg overflow-hidden">
                    <table className="w-full text-left text-xs font-mono">
                      <thead className="bg-[#0b0f19] text-slate-400 border-b border-slate-800">
                        <tr>
                          <th className="px-4 py-2.5">Priority</th>
                          <th className="px-4 py-2.5">Mail Server Hostname</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800 bg-slate-900">
                        {currentScan.dns.mxRecords.map((mx, idx) => (
                          <tr key={idx} className="hover:bg-slate-800/40">
                            <td className="px-4 py-2 text-cyan-400 font-bold tabular-nums">{mx.priority}</td>
                            <td className="px-4 py-2 text-slate-200">{mx.host}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-4 bg-rose-950/20 border border-rose-900/40 rounded-lg text-xs text-rose-300">
                    No MX records discovered for this domain. Email cannot be delivered.
                  </div>
                )}
              </div>

              {/* SPF & DMARC Details */}
              <div className="space-y-3">
                <div className="p-4 bg-[#0b0f19] border border-slate-800 rounded-lg">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-semibold text-slate-200">Sender Policy Framework (SPF)</span>
                    <span className={currentScan.dns.spfValid ? 'text-emerald-400 font-mono' : 'text-amber-400 font-mono'}>
                      {currentScan.dns.spfValid ? 'Valid Record' : 'Missing / Invalid'}
                    </span>
                  </div>
                  <div className="text-xs font-mono text-slate-400 break-all bg-slate-900 p-2 rounded border border-slate-800 mt-2">
                    {currentScan.dns.spfRecord || 'No v=spf1 TXT record declared on domain.'}
                  </div>
                </div>

                <div className="p-4 bg-[#0b0f19] border border-slate-800 rounded-lg">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-semibold text-slate-200">DMARC Policy Enforcement</span>
                    <span className="text-cyan-400 font-mono uppercase font-bold">
                      Policy: {currentScan.dns.dmarcPolicy}
                    </span>
                  </div>
                  <div className="text-xs font-mono text-slate-400 break-all bg-slate-900 p-2 rounded border border-slate-800 mt-2">
                    {currentScan.dns.dmarcRecord || 'No _dmarc TXT record detected for domain.'}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Sub Tab: Breaches */}
          {activeSubTab === 'breaches' && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold text-white flex items-center gap-2">
                    <Database className="w-5 h-5 text-rose-400" />
                    <span>Historical Breach Exposures & Leaks</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Known commercial and forum data leaks containing records matching this identity
                  </p>
                </div>
                <span className="text-xs font-mono text-rose-400 font-bold">
                  {currentScan.breaches.length} Exposures Found
                </span>
              </div>

              {currentScan.breaches.length > 0 ? (
                <div className="space-y-3">
                  {currentScan.breaches.map((b) => (
                    <div key={b.id} className="p-4 bg-[#0b0f19] border border-slate-800 rounded-lg space-y-2">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="text-sm font-bold text-white">{b.title}</div>
                          <div className="flex items-center gap-2 text-xs text-slate-400 font-mono mt-0.5">
                            <span>{b.domain}</span>
                            <span aria-hidden="true">·</span>
                            <span>Breach Date: {b.breachDate}</span>
                            <span aria-hidden="true">·</span>
                            <span>{b.pwnCount.toLocaleString()} Accounts Pwned</span>
                          </div>
                        </div>
                        <span className="text-xs uppercase font-mono font-bold text-rose-400">{b.severity} Risk</span>
                      </div>

                      <p className="text-xs text-slate-300 leading-relaxed">{b.description}</p>

                      <div className="pt-2 border-t border-slate-800/80 flex items-center gap-2 flex-wrap text-xs font-mono">
                        <span className="text-slate-500">Exposed Data:</span>
                        {b.dataClasses.map((dc, i) => (
                          <span key={i} className="text-rose-300">
                            {dc}
                            {i < b.dataClasses.length - 1 && <span className="text-slate-600 ml-1">·</span>}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 bg-[#0b0f19] border border-slate-800 rounded-lg text-center space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                  <div className="text-sm font-semibold text-white">Clean Breach Record</div>
                  <p className="text-xs text-slate-400">
                    No publicly cataloged data breaches or credential leaks found for this email address.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Sub Tab: Pivots */}
          {activeSubTab === 'pivots' && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
              <div>
                <h3 className="text-base font-semibold text-white flex items-center gap-2">
                  <Compass className="w-5 h-5 text-cyan-400" />
                  <span>External OSINT Pivots & Deep Dorks</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Pre-configured investigative queries to pivot this target into public intelligence databases and search operators.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {currentScan.pivotLinks.map((p, idx) => (
                  <a
                    key={idx}
                    href={p.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3.5 bg-[#0b0f19] border border-slate-800 hover:border-cyan-500/50 rounded-lg flex items-center justify-between text-xs text-slate-200 hover:text-white transition-all group"
                  >
                    <div>
                      <span className="text-slate-500 text-[10px] uppercase font-mono block">{p.category}</span>
                      <span className="font-semibold text-sm group-hover:text-cyan-300 transition-colors">
                        {p.label}
                      </span>
                    </div>
                    <ExternalLink className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 transition-colors" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Empty State / Welcome Feature Pillars */}
      {!currentScan && !isLoading && (
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-3">
            <div className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <User className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-white">Full Digital Footprint</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Scans 60+ social platforms, GitHub commit history, Gravatar profiles, and Google Gaia ID infrastructure without alerting the subject.
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Server className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-white">DNS & Deliverability</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Queries live DNS-over-HTTPS records to verify active MX mail servers, SPF authentication records, and DMARC enforcement policies.
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-3">
            <div className="w-9 h-9 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <Database className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-white">Breach & Threat Scoring</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Cross-references against major breach archives and calculates a transparent 0-100 fraud and disposable email risk score.
            </p>
          </div>
        </section>
      )}
    </div>
  );
};
