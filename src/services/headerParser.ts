import { ParsedEmailHeaders, EmailHop } from '../types/osint';
import { sanitizePlainText } from '../utils/security';

export function parseRawEmailHeaders(rawText: string): ParsedEmailHeaders {
  // Bound input size to 100k chars to prevent memory exhaustion and ReDoS
  const safeText = (rawText || '').slice(0, 100000);
  const lines = safeText.split(/\r?\n/);
  const unfolded: string[] = [];

  // Unfold headers (RFC 822: continuation lines start with whitespace)
  for (const line of lines) {
    if (/^\s+/.test(line) && unfolded.length > 0) {
      unfolded[unfolded.length - 1] += ' ' + line.trim();
    } else if (line.trim().length > 0) {
      unfolded.push(line.trim());
    }
  }

  const headers: Record<string, string[]> = {};

  for (const line of unfolded) {
    const colonIdx = line.indexOf(':');
    if (colonIdx > 0) {
      const key = line.substring(0, colonIdx).toLowerCase().trim();
      const val = line.substring(colonIdx + 1).trim();
      if (!headers[key]) headers[key] = [];
      headers[key].push(val);
    }
  }

  const getFirst = (key: string) => headers[key]?.[0];

  const subject = getFirst('subject') ? sanitizePlainText(getFirst('subject'), 200) : undefined;
  const from = getFirst('from') ? sanitizePlainText(getFirst('from'), 200) : undefined;
  const to = getFirst('to') ? sanitizePlainText(getFirst('to'), 200) : undefined;
  const replyTo = getFirst('reply-to') ? sanitizePlainText(getFirst('reply-to'), 200) : undefined;
  const date = getFirst('date') ? sanitizePlainText(getFirst('date'), 100) : undefined;
  const messageId = getFirst('message-id') ? sanitizePlainText(getFirst('message-id'), 150) : undefined;
  const returnPath = getFirst('return-path') ? sanitizePlainText(getFirst('return-path'), 200) : undefined;
  const originatingIp = getFirst('x-originating-ip') || extractIpFromHeaders(headers);

  // Authentication results parsing
  const authResults = headers['authentication-results']?.join(' ') || '';
  let spfStatus: 'pass' | 'fail' | 'softfail' | 'neutral' | 'none' = 'none';
  let dkimStatus: 'pass' | 'fail' | 'none' = 'none';
  let dmarcStatus: 'pass' | 'fail' | 'none' = 'none';

  if (authResults.includes('spf=pass')) spfStatus = 'pass';
  else if (authResults.includes('spf=fail')) spfStatus = 'fail';
  else if (authResults.includes('spf=softfail')) spfStatus = 'softfail';
  else if (authResults.includes('spf=neutral')) spfStatus = 'neutral';

  if (authResults.includes('dkim=pass')) dkimStatus = 'pass';
  else if (authResults.includes('dkim=fail')) dkimStatus = 'fail';

  if (authResults.includes('dmarc=pass')) dmarcStatus = 'pass';
  else if (authResults.includes('dmarc=fail')) dmarcStatus = 'fail';

  // Parse Received: hops
  const receivedList = headers['received'] || [];
  const hops: EmailHop[] = [];
  // Received headers are listed from top (most recent receiver) to bottom (earliest sender)
  // Let's reverse them so hop 1 is sender
  const chronological = [...receivedList].reverse();

  let prevTime: number | null = null;

  chronological.forEach((rec, idx) => {
    const fromMatch = rec.match(/from\s+([^\s]+)/i);
    const byMatch = rec.match(/by\s+([^\s]+)/i);
    const withMatch = rec.match(/with\s+([^\s;]+)/i);
    const ipMatch = rec.match(/\[([0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3})\]/);

    // Extract date at end after semicolon
    const semiIdx = rec.lastIndexOf(';');
    const dateStr = semiIdx !== -1 ? rec.substring(semiIdx + 1).trim() : undefined;
    let delaySeconds: number | undefined;

    if (dateStr) {
      const parsedTime = Date.parse(dateStr);
      if (!isNaN(parsedTime)) {
        if (prevTime !== null) {
          delaySeconds = Math.max(0, Math.round((parsedTime - prevTime) / 1000));
        }
        prevTime = parsedTime;
      }
    }

    hops.push({
      hopNumber: idx + 1,
      from: fromMatch ? fromMatch[1] : 'Unknown host',
      by: byMatch ? byMatch[1] : 'Unknown receiver',
      with: withMatch ? withMatch[1] : 'SMTP',
      ip: ipMatch ? ipMatch[1] : undefined,
      timestamp: dateStr,
      delaySeconds,
    });
  });

  // Suspicious Signals detection
  const suspiciousSignals: string[] = [];

  if (spfStatus === 'fail') {
    suspiciousSignals.push('SPF Authentication Failed: Sending server IP is not authorized by domain');
  }
  if (dkimStatus === 'fail') {
    suspiciousSignals.push('DKIM Signature Verification Failed: Message content or headers may have been modified in transit');
  }
  if (from && returnPath) {
    const fromDomain = extractDomainFromEmail(from);
    const returnDomain = extractDomainFromEmail(returnPath);
    if (fromDomain && returnDomain && fromDomain !== returnDomain) {
      suspiciousSignals.push(`Domain Mismatch: From header (${fromDomain}) differs from Return-Path (${returnDomain})`);
    }
  }
  if (hops.some((h) => h.delaySeconds && h.delaySeconds > 180)) {
    suspiciousSignals.push('Excessive Relay Delay: A mail hop experienced unusual latency (>3 minutes)');
  }

  return {
    raw: rawText,
    subject,
    from,
    to,
    replyTo,
    date,
    messageId,
    returnPath,
    originatingIp,
    spfStatus,
    dkimStatus,
    dmarcStatus,
    hops,
    suspiciousSignals,
  };
}

function extractIpFromHeaders(headers: Record<string, string[]>): string | undefined {
  for (const key of Object.keys(headers)) {
    for (const val of headers[key]) {
      const ipMatch = val.match(/\[([0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3})\]/);
      if (ipMatch) return ipMatch[1];
    }
  }
  return undefined;
}

function extractDomainFromEmail(str: string): string | null {
  const match = str.match(/@([a-zA-Z0-9.-]+)/);
  return match ? match[1].toLowerCase().replace(/>$/, '') : null;
}

export const SAMPLE_HEADER = `Delivered-To: investigator@cyber-osint.org
Received: by 2002:a05:6402:1189:b0:538:3952:7244 with SMTP id d9csp1057403edv;
        Wed, 28 Oct 2026 14:22:15 -0700 (PDT)
X-Google-Smtp-Source: AGHT+IFo3Lkj398Kjdf83984Jksldf==
X-Received: by 2002:a17:902:f54d:b0:1f7:9c2b:d741 with SMTP id a13-20020a170902f54d00b001f79c2bd741mr14589255plb.18.1729628535182;
        Wed, 28 Oct 2026 14:22:15 -0700 (PDT)
Authentication-Results: mx.google.com;
       dkim=pass header.i=@stripe.com header.s=s1 header.b=H7bK2;
       spf=pass (google.com: domain of support@stripe.com designates 199.15.212.18 as permitted sender) smtp.mailfrom=support@stripe.com;
       dmarc=pass (p=REJECT sp=REJECT dis=NONE) header.from=stripe.com
Received: from mail-relay.stripe.com (mail-relay.stripe.com. [199.15.212.18])
        by mx.google.com with ESMTPS id o18-20020a170902a29200b001f5c6a5b6fasi5192533plg.249.2026.10.28.14.22.14
        for <investigator@cyber-osint.org>
        (version=TLS1_3 cipher=TLS_AES_256_GCM_SHA384 bits=256/256);
        Wed, 28 Oct 2026 14:22:15 -0700 (PDT)
Received: from internal-mailer-prod-12.internal.stripe.com (10.14.88.21)
        by mail-relay.stripe.com with ESMTP id 8394KDJS0923;
        Wed, 28 Oct 2026 14:22:10 -0700 (PDT)
From: "Stripe Security Operations" <support@stripe.com>
To: <investigator@cyber-osint.org>
Date: Wed, 28 Oct 2026 21:22:10 +0000
Subject: Your Stripe merchant account verification status
Message-ID: <msg-839201948201-prod@stripe.com>
Return-Path: <support@stripe.com>
X-Originating-IP: [199.15.212.18]
Content-Type: text/plain; charset=UTF-8`;
