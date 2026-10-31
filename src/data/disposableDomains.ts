// Curated database of prominent temporary, burner, and disposable email domains
export const DISPOSABLE_DOMAINS: Set<string> = new Set([
  '10minutemail.com',
  '10minutemail.net',
  '10minutemail.org',
  'guerrillamail.com',
  'guerrillamail.net',
  'guerrillamail.org',
  'guerrillamailblock.com',
  'sharklasers.com',
  'grr.la',
  'mailinator.com',
  'mailinater.com',
  'mailinator2.com',
  'tempmail.com',
  'temp-mail.org',
  'tempmail.net',
  'tempail.com',
  'dispostable.com',
  'yopmail.com',
  'yopmail.net',
  'yopmail.fr',
  'nada.ltd',
  'getairmail.com',
  'throwawaymail.com',
  'burnermail.io',
  'fakemailgenerator.com',
  'mohmal.com',
  'crazymailing.com',
  'trashmail.com',
  'trashmail.net',
  'trashmail.org',
  'mytemp.email',
  'emailondeck.com',
  'maildrop.cc',
  'getnada.com',
  'inboxkitten.com',
  'generator.email',
  'spambog.com',
  'tempr.email',
  'discard.email',
  'temp-mail.io',
  'minuteinbox.com',
  'internxt.com',
  'anonaddy.me',
  'simplelogin.fr',
  'duck.com',
  'relay.firefox.com',
  'fakemail.net',
  'inboxbear.com',
  'tmail.io',
]);

// Free consumer email providers
export const FREE_MAIL_PROVIDERS: Record<string, string> = {
  'gmail.com': 'Google Consumer Gmail',
  'googlemail.com': 'Google Consumer Gmail',
  'outlook.com': 'Microsoft Outlook',
  'hotmail.com': 'Microsoft Hotmail',
  'live.com': 'Microsoft Live',
  'msn.com': 'Microsoft MSN',
  'yahoo.com': 'Yahoo Mail',
  'ymail.com': 'Yahoo Mail',
  'aol.com': 'AOL Mail',
  'icloud.com': 'Apple iCloud',
  'me.com': 'Apple iCloud',
  'mac.com': 'Apple iCloud',
  'proton.me': 'Proton Mail',
  'protonmail.com': 'Proton Mail',
  'zoho.com': 'Zoho Mail',
  'mail.com': 'Mail.com',
  'gmx.com': 'GMX Mail',
  'gmx.de': 'GMX Mail',
  'tutanota.com': 'Tuta Mail',
  'tuta.com': 'Tuta Mail',
  'fastmail.com': 'Fastmail',
  'yandex.com': 'Yandex Mail',
  'yandex.ru': 'Yandex Mail',
};

export function isDisposableDomain(domain: string): boolean {
  const clean = domain.toLowerCase().trim();
  return DISPOSABLE_DOMAINS.has(clean);
}

export function getProviderInfo(domain: string): { isFree: boolean; providerName: string; isCorporate: boolean } {
  const clean = domain.toLowerCase().trim();
  if (FREE_MAIL_PROVIDERS[clean]) {
    return {
      isFree: true,
      providerName: FREE_MAIL_PROVIDERS[clean],
      isCorporate: false,
    };
  }
  return {
    isFree: false,
    providerName: `${clean.charAt(0).toUpperCase() + clean.slice(1)} Domain Mail Server`,
    isCorporate: true,
  };
}
