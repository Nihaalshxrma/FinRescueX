// FinRescue X — Normalization & Comparison Utilities
// Reusable deterministic functions for names, dates, addresses, identifiers & amounts.
// Used by documentVerificationService and crossDocumentVerificationService.

// ─── Name Helpers ────────────────────────────────────────────────────────────

export type NameMatchLevel = 'EXACT' | 'FUZZY' | 'PARTIAL' | 'NO_MATCH';

export interface NameComparisonResult {
  match: NameMatchLevel;
  confidence: number;
  details: string;
}

/** Strip punctuation, extra spaces, lowercase */
export function normalizeName(raw: string = ''): string {
  return raw
    .toLowerCase()
    .replace(/[^a-z\s]/g, '')      // remove non-alpha except spaces
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Compare two names with fuzzy tolerance.
 * Returns EXACT, FUZZY, PARTIAL, or NO_MATCH with a confidence score.
 */
export function compareNames(a: string, b: string): NameComparisonResult {
  const na = normalizeName(a);
  const nb = normalizeName(b);

  if (!na || !nb) {
    return { match: 'NO_MATCH', confidence: 0, details: 'One or both names are empty' };
  }

  // Exact
  if (na === nb) {
    return { match: 'EXACT', confidence: 1.0, details: 'Names are identical' };
  }

  // Tokenized comparison
  const tokensA = na.split(' ').filter(t => t.length > 0);
  const tokensB = nb.split(' ').filter(t => t.length > 0);

  // Containment check (one name inside the other — e.g. "Rahul" vs "Rahul Sharma")
  if (na.includes(nb) || nb.includes(na)) {
    return { match: 'FUZZY', confidence: 0.9, details: 'One name is a substring of the other' };
  }

  // Count shared significant tokens (length > 1 to skip initials like "A")
  const sigA = tokensA.filter(t => t.length > 1);
  const sigB = tokensB.filter(t => t.length > 1);
  const shared = sigA.filter(t => sigB.includes(t));

  const maxLen = Math.max(sigA.length, sigB.length);
  const minLen = Math.min(sigA.length, sigB.length);
  const sharedRatio = maxLen > 0 ? shared.length / maxLen : 0;

  if (sharedRatio >= 0.8 || (shared.length >= 2 && shared.length >= minLen)) {
    return {
      match: 'FUZZY',
      confidence: 0.7 + sharedRatio * 0.2,
      details: `Shared tokens: ${shared.join(', ')}`
    };
  }

  // Partial — at least one significant token matches (e.g. last name)
  if (shared.length >= 1) {
    return {
      match: 'PARTIAL',
      confidence: 0.3 + shared.length * 0.15,
      details: `Partially matching tokens: ${shared.join(', ')}`
    };
  }

  // Levenshtein on full string for very close misspellings
  const dist = levenshtein(na, nb);
  const maxStrLen = Math.max(na.length, nb.length);
  if (maxStrLen > 0 && dist / maxStrLen <= 0.25) {
    return {
      match: 'FUZZY',
      confidence: 0.6,
      details: `Close spelling (edit distance ${dist})`
    };
  }

  return { match: 'NO_MATCH', confidence: 0, details: 'Names do not match' };
}

function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }
  }
  return dp[m][n];
}

// ─── Date Helpers ────────────────────────────────────────────────────────────

/**
 * Normalize a date string to YYYY-MM-DD. Handles DD/MM/YYYY, DD-MM-YYYY, YYYY-MM-DD etc.
 */
export function normalizeDate(raw: string = ''): string {
  const s = raw.trim();
  if (!s) return '';

  // Already ISO
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;

  // DD/MM/YYYY or DD-MM-YYYY
  const m1 = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (m1) {
    const [, dd, mm, yyyy] = m1;
    return `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
  }

  // YYYY/MM/DD
  const m2 = s.match(/^(\d{4})[\/](\d{1,2})[\/](\d{1,2})$/);
  if (m2) {
    const [, yyyy, mm, dd] = m2;
    return `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
  }

  // Try Date parse
  const d = new Date(s);
  if (!isNaN(d.getTime())) {
    return d.toISOString().split('T')[0];
  }

  return s;  // Return original if unparseable
}

export function compareDates(a: string, b: string): { match: boolean; details: string } {
  const na = normalizeDate(a);
  const nb = normalizeDate(b);
  if (!na || !nb) return { match: false, details: 'One or both dates are empty' };
  if (na === nb) return { match: true, details: 'Dates match exactly' };

  // Year-only comparison
  const yearA = na.substring(0, 4);
  const yearB = nb.substring(0, 4);
  if (yearA === yearB) {
    return { match: false, details: `Same year (${yearA}) but day/month differ: ${na} vs ${nb}` };
  }

  return { match: false, details: `Dates do not match: ${na} vs ${nb}` };
}

// ─── PAN Helpers ──────────────────────────────────────────────────────────────

export function normalizePAN(raw: string = ''): string {
  return raw.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

export function validatePANFormat(pan: string): { valid: boolean; details: string } {
  const n = normalizePAN(pan);
  if (!n) return { valid: false, details: 'PAN is empty' };
  if (n.length !== 10) return { valid: false, details: `PAN must be 10 characters, got ${n.length}` };
  if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(n)) {
    return { valid: false, details: 'PAN format invalid (expected AAAAA9999A)' };
  }
  return { valid: true, details: 'Valid PAN format' };
}

// ─── GSTIN Helpers ────────────────────────────────────────────────────────────

export function normalizeGSTIN(raw: string = ''): string {
  return raw.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

export function validateGSTINFormat(gstin: string): { valid: boolean; details: string } {
  const n = normalizeGSTIN(gstin);
  if (!n) return { valid: false, details: 'GSTIN is empty' };
  if (n.length !== 15) return { valid: false, details: `GSTIN must be 15 characters, got ${n.length}` };
  if (!/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][A-Z0-9]Z[A-Z0-9]$/.test(n)) {
    return { valid: false, details: 'GSTIN format invalid' };
  }
  return { valid: true, details: 'Valid GSTIN format' };
}

// ─── Aadhaar / Account Masking ────────────────────────────────────────────────

export function maskPAN(pan: string): string {
  const n = normalizePAN(pan);
  if (n.length < 5) return 'XXXX';
  return n.substring(0, 2) + 'XXXX' + n.substring(6);
}

export function maskAadhaar(aadhaar: string): string {
  const clean = aadhaar.replace(/[^0-9]/g, '');
  if (clean.length < 4) return 'XXXX';
  return 'XXXX XXXX ' + clean.slice(-4);
}

export function maskAccountNumber(acct: string): string {
  const clean = acct.replace(/[^0-9]/g, '');
  if (clean.length <= 4) return clean;
  return 'X'.repeat(clean.length - 4) + clean.slice(-4);
}

// ─── Address Helpers ──────────────────────────────────────────────────────────

export function normalizeAddress(raw: string = ''): string {
  return raw
    .toLowerCase()
    .replace(/[,.\-\/\\#]+/g, ' ')
    .replace(/\b(road|rd|street|st|lane|ln|nagar|ngr|colony|col|market|mkt|sector|sec|phase|ph|block|blk)\b/g, (m) => {
      const abbrevs: Record<string, string> = {
        road: 'rd', rd: 'rd', street: 'st', st: 'st', lane: 'ln', ln: 'ln',
        nagar: 'nagar', ngr: 'nagar', colony: 'colony', col: 'colony',
        market: 'mkt', mkt: 'mkt', sector: 'sec', sec: 'sec',
        phase: 'ph', ph: 'ph', block: 'blk', blk: 'blk'
      };
      return abbrevs[m] || m;
    })
    .replace(/\s+/g, ' ')
    .trim();
}

export function compareAddresses(a: string, b: string): { match: boolean; confidence: number; details: string } {
  const na = normalizeAddress(a);
  const nb = normalizeAddress(b);
  if (!na || !nb) return { match: false, confidence: 0, details: 'One or both addresses are empty' };
  if (na === nb) return { match: true, confidence: 1.0, details: 'Addresses match exactly' };

  // Token overlap
  const tokA = na.split(' ').filter(t => t.length > 1);
  const tokB = nb.split(' ').filter(t => t.length > 1);
  const shared = tokA.filter(t => tokB.includes(t));
  const overlapRatio = shared.length / Math.max(tokA.length, tokB.length);

  if (overlapRatio >= 0.7) {
    return { match: true, confidence: overlapRatio, details: `High overlap: ${shared.join(', ')}` };
  }
  if (overlapRatio >= 0.4) {
    return { match: false, confidence: overlapRatio, details: `Partial overlap — needs manual review` };
  }

  return { match: false, confidence: overlapRatio, details: 'Addresses do not match' };
}

// ─── Amount Comparison ────────────────────────────────────────────────────────

/**
 * Compare two financial amounts with a percentage tolerance (default 5%).
 */
export function compareAmounts(
  a: number,
  b: number,
  tolerancePercent: number = 5
): { match: boolean; difference: number; differencePercent: number; details: string } {
  if (a === 0 && b === 0) return { match: true, difference: 0, differencePercent: 0, details: 'Both amounts are zero' };
  const diff = Math.abs(a - b);
  const base = Math.max(Math.abs(a), Math.abs(b));
  const pct = base > 0 ? (diff / base) * 100 : 100;
  const match = pct <= tolerancePercent;
  return {
    match,
    difference: diff,
    differencePercent: Math.round(pct * 100) / 100,
    details: match
      ? `Amounts within ${tolerancePercent}% tolerance (diff ${pct.toFixed(1)}%)`
      : `Amounts differ by ${pct.toFixed(1)}% which exceeds ${tolerancePercent}% tolerance`
  };
}

// ─── Udyam Number Validation ──────────────────────────────────────────────────

export function validateUdyamNumber(udyam: string): { valid: boolean; details: string } {
  const n = udyam.toUpperCase().replace(/\s+/g, '');
  if (!n) return { valid: false, details: 'Udyam number is empty' };
  // Pattern: UDYAM-XX-00-0000000
  if (/^UDYAM-[A-Z]{2}-\d{2}-\d{7}$/.test(n)) {
    return { valid: true, details: 'Valid Udyam format' };
  }
  return { valid: false, details: 'Invalid Udyam format (expected UDYAM-XX-00-0000000)' };
}
