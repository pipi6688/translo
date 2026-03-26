/**
 * Determines whether selected text should trigger translation.
 * Only translates English text; filters out passwords, tokens, URLs, etc.
 */

const URL_REGEX = /^https?:\/\/\S+$/i;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const FILE_PATH_REGEX = /^[~.]?\/[\w./-]+$|^[A-Z]:\\[\w.\\-]+$/;
const HEX_REGEX = /^(0x)?[0-9a-f]{8,}$/i;
const BASE64_REGEX = /^[A-Za-z0-9+/]{20,}={0,2}$/;
const JWT_REGEX = /^eyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/;

// Shannon entropy — high entropy strings are likely passwords/tokens
function entropy(s: string): number {
  const freq = new Map<string, number>();
  for (const c of s) {
    freq.set(c, (freq.get(c) ?? 0) + 1);
  }
  let h = 0;
  for (const count of freq.values()) {
    const p = count / s.length;
    h -= p * Math.log2(p);
  }
  return h;
}

function hasEnglishLetters(text: string): boolean {
  return /[a-zA-Z]{2,}/.test(text);
}

function isPureNumbers(text: string): boolean {
  return /^[\d\s.,;:!?]+$/.test(text.trim());
}

function isPureSymbols(text: string): boolean {
  return /^[\W\d_\s]+$/.test(text.trim());
}

function looksLikePassword(text: string): boolean {
  const trimmed = text.trim();
  // No spaces + mixed character types + high entropy → likely a password/token
  if (/\s/.test(trimmed)) return false;
  if (trimmed.length < 6) return false;

  const hasUpper = /[A-Z]/.test(trimmed);
  const hasLower = /[a-z]/.test(trimmed);
  const hasDigit = /\d/.test(trimmed);
  const hasSymbol = /[^A-Za-z0-9]/.test(trimmed);

  const typeCount = [hasUpper, hasLower, hasDigit, hasSymbol].filter(Boolean).length;

  // 3+ character types and high entropy
  if (typeCount >= 3 && entropy(trimmed) > 3.5) return true;

  return false;
}

function looksLikeCode(text: string): boolean {
  const trimmed = text.trim();
  // Single-line code-like patterns: function calls, variable assignments, etc.
  if (/^[\w.]+\(.*\);?$/.test(trimmed)) return true;
  if (/^(const|let|var|import|export|return)\s/.test(trimmed)) return true;
  return false;
}

export function shouldTranslate(text: string): boolean {
  const trimmed = text.trim();

  // Too short or too long
  if (trimmed.length < 2 || trimmed.length > 5000) return false;

  // Must contain English letters
  if (!hasEnglishLetters(trimmed)) return false;

  // Filter out pure numbers/symbols
  if (isPureNumbers(trimmed)) return false;
  if (isPureSymbols(trimmed)) return false;

  // Filter known patterns
  if (URL_REGEX.test(trimmed)) return false;
  if (EMAIL_REGEX.test(trimmed)) return false;
  if (FILE_PATH_REGEX.test(trimmed)) return false;
  if (HEX_REGEX.test(trimmed)) return false;
  if (BASE64_REGEX.test(trimmed)) return false;
  if (JWT_REGEX.test(trimmed)) return false;

  // Filter passwords/tokens
  if (looksLikePassword(trimmed)) return false;

  // Filter single-line code snippets (but allow multi-line code with English comments)
  if (!trimmed.includes('\n') && looksLikeCode(trimmed)) return false;

  return true;
}
