# dsh-plugin-eval-gate

DeepSeek Harness / Cordis plugin that evaluates draft messages with deterministic gates. Returns **PASS** or **HOLD**.

## What It Does

Scores drafts against deterministic rules:
- Detects inferred email addresses (`user [at] example [dot] com`)
- Flags price/stock mentions (`$49.99`, `ticker: AAPL`)
- Identifies tracking pixels in HTML
- Catches first-touch/onboarding links (signup, register, get started)
- Repairs structured metadata (converts string numbers and booleans)
- Optional LLM-as-judge gate (flag-gated, default OFF)

## What It Doesn't Do

- Does not send messages or interact with mail servers
- Does not read or store mail
- Does not require GPU (deterministic gates only, unless LLM judge is enabled)
- Tests run offline with `.example` fixtures

## Install

```bash
git clone https://github.com/RanaPriyansh/dsh-plugin-eval-gate.git
cd dsh-plugin-eval-gate
npm install
npm test
```

## Usage

Standalone API:

```javascript
const { evaluateDraft } = require('dsh-plugin-eval-gate');

const draft = {
  text: 'Hello! Contact me at user [at] example [dot] com',
  metadata: {
    to: 'recipient@example.com',
    from: 'sender@example.com',
  },
};

const result = evaluateDraft(draft);
// { result: 'HOLD', reason: 'Failed gates: inferred_email', flags: ['inferred_email'] }
```

### Cordis Integration

`@deepseek-ai/cordis` is unpublished Developer Preview. This plugin is not drop-in production.

`cordis.patch.yml` documents the intended manifest. Tests use the standalone API and do not require Cordis.

## Configuration

All gates are strict by default (violations trigger HOLD). Override per-gate:

```javascript
evaluateDraft(draft, {
  allowInferredEmails: true,
  allowPriceStock: true,
  allowTrackingPixels: true,
  allowFirstTouchLinks: true,
  enableLLMJudge: true,  // Requires external LLM
});
```

## API

### `evaluateDraft(draft, config?)`

**Parameters:**
- `draft: DraftContent`
  - `text?: string`
  - `html?: string`
  - `metadata?: DraftMetadata` (to, from, subject, etc.)
- `config?: EvalGateConfig` (optional overrides)

**Returns:** `EvalResult`
- `result: 'PASS' | 'HOLD'`
- `reason?: string`
- `flags?: string[]`

### `repairMetadata(metadata)`

Repairs structured metadata by converting string numbers and booleans to proper types.

**Parameters:**
- `metadata: DraftMetadata`

**Returns:** `DraftMetadata`

## Tests

16 tests using fake `.example` TLD fixtures. No credentials, GPU, or environment variables required.

```bash
npm test
```

Coverage:
- Clean drafts (PASS)
- Inferred email patterns (HOLD)
- Price/stock mentions (HOLD)
- Tracking pixels (HOLD)
- First-touch links (HOLD)
- Multiple violations
- Config overrides
- Metadata repair
- Edge cases

## License

MIT License - see [LICENSE](LICENSE)

Copyright (c) 2026 Priyansh Rana
