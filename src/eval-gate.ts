/**
 * Core evaluation gates for draft scoring
 * Returns PASS or HOLD based on deterministic rules
 */

export interface DraftMetadata {
  to?: string | string[];
  from?: string;
  subject?: string;
  cc?: string | string[];
  bcc?: string | string[];
  [key: string]: any;
}

export interface DraftContent {
  html?: string;
  text?: string;
  metadata?: DraftMetadata;
}

export type GateResult = 'PASS' | 'HOLD';

export interface EvalResult {
  result: GateResult;
  reason?: string;
  flags?: string[];
}

export interface EvalGateConfig {
  enableLLMJudge?: boolean; // Default: false (OFF)
  allowInferredEmails?: boolean;
  allowPriceStock?: boolean;
  allowTrackingPixels?: boolean;
  allowFirstTouchLinks?: boolean;
}

const DEFAULT_CONFIG: EvalGateConfig = {
  enableLLMJudge: false,
  allowInferredEmails: false,
  allowPriceStock: false,
  allowTrackingPixels: false,
  allowFirstTouchLinks: false,
};

/**
 * Repair structured metadata by converting string numbers and booleans
 */
export function repairMetadata(metadata: DraftMetadata): DraftMetadata {
  const repaired: DraftMetadata = {};
  
  for (const [key, value] of Object.entries(metadata)) {
    if (typeof value === 'string') {
      // Convert string numbers to numbers
      if (/^-?\d+$/.test(value)) {
        repaired[key] = parseInt(value, 10);
        continue;
      }
      if (/^-?\d+\.\d+$/.test(value)) {
        repaired[key] = parseFloat(value);
        continue;
      }
      // Convert string booleans to booleans
      if (value === 'true') {
        repaired[key] = true;
        continue;
      }
      if (value === 'false') {
        repaired[key] = false;
        continue;
      }
    }
    repaired[key] = value;
  }
  
  return repaired;
}

/**
 * Check for inferred email patterns in text
 */
function hasInferredEmail(text: string): boolean {
  // Match common email inference patterns
  const patterns = [
    /\b[a-z0-9._%+-]+\s*@\s*[a-z0-9.-]+\.[a-z]{2,}\b/i, // Spaced email
    /\b[a-z0-9._%+-]+\s*\[\s*at\s*\]\s*[a-z0-9.-]+\s*\[\s*dot\s*\]\s*[a-z]{2,}\b/i, // user [at] domain [dot] com
    /\b[a-z0-9._%+-]+\s*\(at\)\s*[a-z0-9.-]+\s*\(dot\)\s*[a-z]{2,}\b/i, // user (at) domain (dot) com
    /contact\s+me\s+at\s*:/i, // "contact me at:" followed by potential email
  ];
  
  return patterns.some(pattern => pattern.test(text));
}

/**
 * Check for price or stock mentions
 */
function hasPriceOrStock(text: string): boolean {
  const patterns = [
    /\$\d+(?:\.\d{2})?/i, // Dollar amounts
    /\b\d+\s*(?:USD|EUR|GBP|JPY)\b/i, // Currency codes
    /\bprice[:\s]+\$?\d+/i, // Price: $X
    /\bstock\s+price\b/i, // Stock price
    /\bticker[:\s]+[A-Z]{2,5}\b/, // Ticker: AAPL
    /\bmarket\s+cap\b/i, // Market cap
  ];
  
  return patterns.some(pattern => pattern.test(text));
}

/**
 * Check for tracking pixels in HTML
 */
function hasTrackingPixels(html: string): boolean {
  const patterns = [
    /<img[^>]+width=["']1["'][^>]+height=["']1["']/i, // 1x1 images
    /<img[^>]+height=["']1["'][^>]+width=["']1["']/i,
    /<img[^>]+src=["'][^"']*track[^"']*["']/i, // URLs with 'track'
    /<img[^>]+src=["'][^"']*pixel[^"']*["']/i, // URLs with 'pixel'
    /<img[^>]+src=["'][^"']*beacon[^"']*["']/i, // URLs with 'beacon'
  ];
  
  return patterns.some(pattern => pattern.test(html));
}

/**
 * Check for first-touch links (onboarding, signup, welcome)
 */
function hasFirstTouchLinks(text: string): boolean {
  const patterns = [
    /\b(?:signup|sign-up|register|onboard|welcome|activate|verify)\b/i,
    /\/(?:signup|register|onboard|welcome|activate|verify)\b/i,
    /click\s+(?:here|below)\s+to\s+(?:start|begin|activate)/i,
    /\bget\s+started\b/i,
  ];
  
  return patterns.some(pattern => pattern.test(text));
}

/**
 * Evaluate a draft and return PASS or HOLD
 */
export function evaluateDraft(
  draft: DraftContent,
  config: EvalGateConfig = DEFAULT_CONFIG
): EvalResult {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };
  const flags: string[] = [];
  
  // Repair metadata if present
  if (draft.metadata) {
    draft.metadata = repairMetadata(draft.metadata);
  }
  
  const fullText = [draft.text || '', draft.html || ''].join(' ');
  
  // Gate 1: Inferred email addresses
  if (!mergedConfig.allowInferredEmails && hasInferredEmail(fullText)) {
    flags.push('inferred_email');
  }
  
  // Gate 2: Price or stock mentions
  if (!mergedConfig.allowPriceStock && hasPriceOrStock(fullText)) {
    flags.push('price_stock');
  }
  
  // Gate 3: Tracking pixels
  if (draft.html && !mergedConfig.allowTrackingPixels && hasTrackingPixels(draft.html)) {
    flags.push('tracking_pixel');
  }
  
  // Gate 4: First-touch links
  if (!mergedConfig.allowFirstTouchLinks && hasFirstTouchLinks(fullText)) {
    flags.push('first_touch_link');
  }
  
  // LLM judge gate (flag-gated, default OFF)
  if (mergedConfig.enableLLMJudge) {
    // Placeholder for LLM-as-judge logic
    // In real implementation, this would call an LLM API
    // For now, we just note that it's enabled
    flags.push('llm_judge_enabled');
  }
  
  // Return HOLD if any flags were raised
  if (flags.length > 0) {
    return {
      result: 'HOLD',
      reason: `Failed gates: ${flags.join(', ')}`,
      flags,
    };
  }
  
  return {
    result: 'PASS',
    reason: 'All gates passed',
    flags: [],
  };
}
