/**
 * Cordis plugin entry point for dsh-plugin-eval-gate
 */

import { evaluateDraft, EvalGateConfig, DraftContent, EvalResult } from './eval-gate';

export { evaluateDraft, repairMetadata } from './eval-gate';
export type { DraftContent, EvalResult, EvalGateConfig, GateResult, DraftMetadata } from './eval-gate';

export const name = 'eval-gate';

export interface Config extends EvalGateConfig {
  // Additional Cordis-specific config can go here
}

// Cordis plugin apply function
// Note: @deepseek-ai/cordis may be in Developer Preview
export function apply(ctx: any, config: Config) {
  // Register the evaluation service
  if (ctx.provide && typeof ctx.provide === 'function') {
    ctx.provide('evalGate', {
      evaluate: (draft: DraftContent): EvalResult => {
        return evaluateDraft(draft, config);
      },
    });
  }

  // Log plugin initialization
  if (ctx.on && ctx.logger) {
    ctx.on('ready', () => {
      ctx.logger('eval-gate').info('Eval gate plugin loaded', {
        enableLLMJudge: config.enableLLMJudge,
        allowInferredEmails: config.allowInferredEmails,
        allowPriceStock: config.allowPriceStock,
        allowTrackingPixels: config.allowTrackingPixels,
        allowFirstTouchLinks: config.allowFirstTouchLinks,
      });
    });
  }
}

// Schema definition for Cordis (when available)
export const Config = {
  enableLLMJudge: { type: 'boolean', default: false, description: 'Enable LLM-as-judge evaluation (default: OFF)' },
  allowInferredEmails: { type: 'boolean', default: false, description: 'Allow inferred email addresses' },
  allowPriceStock: { type: 'boolean', default: false, description: 'Allow price/stock mentions' },
  allowTrackingPixels: { type: 'boolean', default: false, description: 'Allow tracking pixels in HTML' },
  allowFirstTouchLinks: { type: 'boolean', default: false, description: 'Allow first-touch/onboarding links' },
};
