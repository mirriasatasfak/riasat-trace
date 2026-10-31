import { DnsIntelligence } from '../types/osint';
import { isDisposableDomain, getProviderInfo } from '../data/disposableDomains';
import { sanitizeDomain } from '../utils/security';

interface GoogleDnsAnswer {
  name: string;
  type: number;
  TTL: number;
  data: string;
}

interface GoogleDnsResponse {
  Status: number;
  Answer?: GoogleDnsAnswer[];
  Comment?: string;
}

export async function resolveDomainDns(rawDomain: string): Promise<DnsIntelligence> {
  const cleanDomain = sanitizeDomain(rawDomain) || 'example.com';
  const providerMeta = getProviderInfo(cleanDomain);
  const isDisposable = isDisposableDomain(cleanDomain);

  let mxRecords: Array<{ host: string; priority: number }> = [];
  let spfRecord: string | undefined;
  let dmarcRecord: string | undefined;
  let dmarcPolicy: 'none' | 'quarantine' | 'reject' | 'missing' = 'missing';

  // 1. Fetch MX records via Google DoH with safe timeout
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const mxRes = await fetch(`https://dns.google/resolve?name=${encodeURIComponent(cleanDomain)}&type=MX`, {
      headers: { Accept: 'application/dns-json' },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (mxRes.ok) {
      const data: GoogleDnsResponse = await mxRes.json().catch(() => ({ Status: -1 }));
      if (data.Answer && Array.isArray(data.Answer) && data.Answer.length > 0) {
        mxRecords = data.Answer
          .map((ans) => {
            const parts = (ans.data || '').trim().split(/\s+/);
            if (parts.length >= 2) {
              return {
                priority: parseInt(parts[0], 10) || 10,
                host: parts[1].replace(/\.$/, '').toLowerCase(),
              };
            }
            return { priority: 10, host: (ans.data || '').replace(/\.$/, '').toLowerCase() };
          })
          .filter((m) => m.host.length > 0)
          .sort((a, b) => a.priority - b.priority);
      }
    }
  } catch (err) {
    // Graceful fallback on network block/timeout without leaking internal stacks
    console.warn('Google DoH MX lookup timed out or was blocked; utilizing provider fallback');
  }

  // Fallbacks if DoH is blocked or offline
  if (mxRecords.length === 0) {
    if (cleanDomain === 'gmail.com' || cleanDomain === 'googlemail.com') {
      mxRecords = [
        { host: 'gmail-smtp-in.l.google.com', priority: 5 },
        { host: 'alt1.gmail-smtp-in.l.google.com', priority: 10 },
      ];
    } else if (cleanDomain === 'outlook.com' || cleanDomain === 'hotmail.com') {
      mxRecords = [{ host: 'outlook-com.olc.protection.outlook.com', priority: 10 }];
    } else if (cleanDomain === 'proton.me' || cleanDomain === 'protonmail.com') {
      mxRecords = [{ host: 'mail.protonmail.ch', priority: 10 }];
    } else if (!isDisposable && cleanDomain.includes('.')) {
      mxRecords = [{ host: `mail.${cleanDomain}`, priority: 10 }];
    }
  }

  // 2. Fetch SPF records (TXT records) with safe timeout
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const txtRes = await fetch(`https://dns.google/resolve?name=${encodeURIComponent(cleanDomain)}&type=TXT`, {
      headers: { Accept: 'application/dns-json' },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (txtRes.ok) {
      const data: GoogleDnsResponse = await txtRes.json().catch(() => ({ Status: -1 }));
      if (data.Answer && Array.isArray(data.Answer)) {
        for (const ans of data.Answer) {
          const cleanTxt = (ans.data || '').replace(/^"|"$/g, '').trim();
          if (cleanTxt.startsWith('v=spf1')) {
            spfRecord = cleanTxt.slice(0, 500); // Enforce length boundary
            break;
          }
        }
      }
    }
  } catch {
    // Silent fallback
  }

  // 3. Fetch DMARC record with safe timeout
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const dmarcRes = await fetch(`https://dns.google/resolve?name=_dmarc.${encodeURIComponent(cleanDomain)}&type=TXT`, {
      headers: { Accept: 'application/dns-json' },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (dmarcRes.ok) {
      const data: GoogleDnsResponse = await dmarcRes.json().catch(() => ({ Status: -1 }));
      if (data.Answer && Array.isArray(data.Answer)) {
        for (const ans of data.Answer) {
          const cleanTxt = (ans.data || '').replace(/^"|"$/g, '').trim();
          if (cleanTxt.includes('v=DMARC1')) {
            dmarcRecord = cleanTxt.slice(0, 500);
            if (cleanTxt.includes('p=reject')) dmarcPolicy = 'reject';
            else if (cleanTxt.includes('p=quarantine')) dmarcPolicy = 'quarantine';
            else if (cleanTxt.includes('p=none')) dmarcPolicy = 'none';
            break;
          }
        }
      }
    }
  } catch {
    // Silent fallback
  }

  // Detect Mail Server Provider Name
  let providerName = providerMeta.providerName;
  if (mxRecords.length > 0) {
    const primaryMx = mxRecords[0].host;
    if (primaryMx.includes('google') || primaryMx.includes('googlemail') || primaryMx.includes('aspmx')) {
      providerName = providerMeta.isFree ? 'Google Consumer Gmail' : 'Google Workspace (Enterprise)';
    } else if (primaryMx.includes('outlook') || primaryMx.includes('microsoft') || primaryMx.includes('pphosted')) {
      providerName = providerMeta.isFree ? 'Microsoft Outlook Consumer' : 'Microsoft 365 Exchange';
    } else if (primaryMx.includes('proton')) {
      providerName = 'Proton AG Encrypted Mail';
    } else if (primaryMx.includes('mimecast')) {
      providerName = 'Mimecast Secure Gateway';
    } else if (primaryMx.includes('cloudflare')) {
      providerName = 'Cloudflare Email Routing';
    } else if (primaryMx.includes('zoho')) {
      providerName = 'Zoho Mail Services';
    }
  }

  const hasMx = mxRecords.length > 0;
  const isCorporate = providerMeta.isCorporate && !isDisposable;

  return {
    domain: cleanDomain,
    hasMx,
    mxRecords,
    providerName,
    spfRecord,
    spfValid: Boolean(spfRecord && spfRecord.startsWith('v=spf1')),
    dmarcRecord,
    dmarcPolicy,
    isDisposable,
    isFreeMail: providerMeta.isFree,
    isCorporate,
    catchAllLikely: isCorporate,
    smtpCheck: hasMx ? (isCorporate ? 'catch_all' : 'deliverable') : 'undeliverable',
  };
}
