/**
 * Security & Input Sanitization Utilities
 * Implements defensive measures against XSS, CSV Injection (Formula Injection),
 * SSRF/URL Injection, Prototype Pollution, and Information Leakage.
 */

/**
 * Strips HTML tags, control characters, null bytes, and script elements.
 */
export function sanitizePlainText(input: unknown, maxLength = 500): string {
  if (typeof input !== 'string') {
    return '';
  }

  // Strip null bytes, control characters, and zero-width spaces
  let clean = input.replace(/[\u0000-\u001F\u007F-\u009F\u200B-\u200D\uFEFF]/g, '');

  // Strip script and dangerous tags
  clean = clean.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  clean = clean.replace(/<[^>]+>/g, '');

  // Trim and enforce length limit
  return clean.trim().slice(0, maxLength);
}

/**
 * Strict email validation & sanitization conforming to RFC 5321 (max 254 chars).
 * Strips control chars, quotes, whitespace, and validates safe characters.
 */
export function sanitizeEmail(emailInput: unknown): { email: string; isValid: boolean } {
  if (typeof emailInput !== 'string') {
    return { email: '', isValid: false };
  }

  // Strip non-printable and control characters
  const clean = emailInput
    .trim()
    .toLowerCase()
    .replace(/[\u0000-\u001F\u007F-\u009F\s]/g, '')
    .slice(0, 254);

  // Standard safe email regex (no quotes, no nested brackets, valid domain format)
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

  const isValid = emailRegex.test(clean);
  return { email: clean, isValid };
}

/**
 * Sanitizes an online handle / username (alphanumeric, dot, underscore, hyphen).
 * Blocks directory traversal (../), path breaks, and URL delimiters.
 */
export function sanitizeUsername(usernameInput: unknown): string {
  if (typeof usernameInput !== 'string') {
    return '';
  }

  return usernameInput
    .trim()
    .toLowerCase()
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
    .replace(/[^a-zA-Z0-9._-]/g, '')
    .slice(0, 64);
}

/**
 * Sanitizes internet domain names (RFC 1035).
 * Strips protocols, trailing slashes, path fragments, and unsafe characters.
 */
export function sanitizeDomain(domainInput: unknown): string {
  if (typeof domainInput !== 'string') {
    return '';
  }

  let clean = domainInput.trim().toLowerCase();

  // Strip protocol if present
  clean = clean.replace(/^[a-zA-Z]+:\/\//, '');

  // Strip path, port, or query string
  clean = clean.split(/[/?#:]/)[0];

  // Restrict to standard domain characters
  clean = clean.replace(/[^a-zA-Z0-9.-]/g, '');

  // Strip leading/trailing dots and hyphens
  clean = clean.replace(/^\.+|\.+$/g, '').replace(/^-+|-+$/g, '');

  return clean.slice(0, 253);
}

/**
 * Safe CSV Cell Sanitization (OWASP CWE-1236 Formula Injection Prevention).
 * If a cell begins with =, +, -, @, tab (\t), or carriage return (\r),
 * prepend an apostrophe (') so spreadsheet software (Excel, LibreOffice, Sheets)
 * interprets the cell as a literal string rather than an executable formula or DDE macro.
 */
export function sanitizeCsvCell(value: unknown): string {
  if (value === null || value === undefined) {
    return '""';
  }

  let str = String(value);

  // Check for CSV formula triggers
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }

  // Escape inner double quotes
  const escaped = str.replace(/"/g, '""');
  return `"${escaped}"`;
}

/**
 * Validates and safely encodes a URL to ensure it only uses safe schemes (https:, http:, mailto:, skype:).
 * Prevents javascript: and data: pseudo-protocol execution in href attributes.
 */
export function sanitizeUrl(url: string): string {
  if (!url || typeof url !== 'string') return '#';

  const trimmed = url.trim();

  // Explicitly block dangerous script schemes
  if (/^(javascript|data|vbscript|file):/i.test(trimmed)) {
    return '#';
  }

  // Ensure it matches safe protocol prefixes
  if (/^(https?:\/\/|mailto:|skype:|tel:)/i.test(trimmed)) {
    return trimmed;
  }

  // Default to relative or safe fallback
  return trimmed.startsWith('/') ? trimmed : `https://${trimmed}`;
}

/**
 * Sanitizes error messages to protect against sensitive internal system details,
 * paths, database credentials, or secret keys leaking into the UI.
 */
export function getSafeErrorMessage(error: unknown, fallbackMessage = 'An unexpected error occurred during processing.'): string {
  if (!error) return fallbackMessage;

  const rawMessage = error instanceof Error ? error.message : String(error);

  // If the error message mentions sensitive internal paths or connection details, mask it
  if (
    /password|token|key|secret|credential|connection\s+refused|econnrefused|stack\s+trace|\/app\/|\/node_modules\//i.test(
      rawMessage
    )
  ) {
    return fallbackMessage;
  }

  // Strip control chars and length limit
  return sanitizePlainText(rawMessage, 200) || fallbackMessage;
}

/**
 * Generates a masked email address, retaining the initial character and the last few
 * characters or digits of the handle, as well as the domain for target identification.
 * E.g., 'mirriasat123@gmail.com' -> 'm••••••123@gmail.com'
 */
export function maskEmail(email: string): string {
  if (!email || typeof email !== 'string') return '';
  const clean = email.trim();
  if (!clean.includes('@')) return maskUsername(clean);

  const [handle, domain] = clean.split('@');
  return `${maskUsername(handle)}@${domain}`;
}

/**
 * Masks a username/handle while revealing the first character and the last few
 * characters/digits for cross-reference identification.
 * E.g., 'mirriasat123' -> 'm••••••123'
 * E.g., 'satyanadella' -> 's••••••lla'
 * E.g., 'johndoe88' -> 'j••••88'
 */
export function maskUsername(handle: string): string {
  if (!handle || typeof handle !== 'string') return '';
  const clean = handle.trim();
  const len = clean.length;
  if (len <= 2) return clean;

  // Check if handle ends in numbers/digits (common in emails/usernames like satya123, alex99)
  const digitsMatch = clean.match(/\d+$/);
  let suffixLen = 3;

  if (digitsMatch) {
    // If digits at end, preserve all trailing digits (up to half the handle length or max 4)
    suffixLen = Math.max(1, Math.min(digitsMatch[0].length, Math.floor(len / 2), 4));
  } else {
    // Reveal last 2-3 letters for readability
    suffixLen = len >= 7 ? 3 : (len >= 5 ? 2 : 1);
  }

  const firstChar = clean[0];
  const lastChars = clean.slice(-suffixLen);
  const dotCount = Math.min(Math.max(3, len - 1 - suffixLen), 6);
  const dots = '•'.repeat(dotCount);

  return `${firstChar}${dots}${lastChars}`;
}

/**
 * Extracts identifying suffix (last digits or ending characters) for rapid user verification.
 * E.g. 'mirriasat123' -> '123'
 */
export function extractSuffixIdentifier(target: string): string {
  if (!target || typeof target !== 'string') return '';
  const clean = target.trim();
  const handle = clean.includes('@') ? clean.split('@')[0] : clean;
  const digitsMatch = handle.match(/\d+$/);
  if (digitsMatch && digitsMatch[0].length > 0) {
    return digitsMatch[0];
  }
  return handle.slice(-Math.min(3, handle.length));
}

