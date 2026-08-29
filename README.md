# dsh-plugin-eval-gate

A DeepSeek Harness / Cordis plugin that evaluates draft messages with deterministic gates and returns **PASS** or **HOLD**.

## What It Is

A pure evaluation plugin that scores drafts against deterministic rules:
- Detects inferred email addresses (e.g., `user [at] example [dot] com`)
- Flags price/stock mentions (e.g., `$49.99`, `ticker: AAPL`)
- Identifies tracking pixels in HTML
- Catches first-touch/onboarding links (signup, register, get started)
- Repairs structured metadata (converts string numbers and booleans)
- Optional LLM-as-judge gate (flag-gated, **default OFF**)

## What It Is Not

- **Not a mailbox**: Does not read or store mail
- **Not a sender**: Does not send messages or interact with SMTP/APIs
- **Not Conexus**: Pure eval logic, no CRM or contact management
- **No GPU required**: Deterministic gates only (unless LLM judge is enabled)
- **No live network**: Tests run offline with fake `.example` fixtures

## Quick Start

```bash
# Clone and install
git clone https://github.com/RanaPriyansh/dsh-plugin-eval-gate.git
cd dsh-plugin-eval-gate
npm install

# Run tests (16 tests, all offline)
npm test

# Run demo
npm run demo
```

## Usage

### Standalone

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
console.log(result);
// { result: 'HOLD', reason: 'Failed gates: inferred_email', flags: ['inferred_email'] }
```

### Cordis Plugin

**Note**: `@deepseek-ai/cordis` may be in Developer Preview. If the package is not yet published, the plugin manifest (`cordis.patch.yml`) is provided as documentation. Tests run independently of Cordis.

Add to your Cordis configuration:

```yaml
plugins:
  eval-gate:
    enableLLMJudge: false       # Default: OFF
    allowInferredEmails: false
    allowPriceStock: false
    allowTrackingPixels: false
    allowFirstTouchLinks: false
```

Use the service in your application:

```javascript
const result = ctx.evalGate.evaluate(draft);
if (result.result === 'HOLD') {
  console.log('Draft held:', result.reason);
}
```

## Configuration

All gates are **strict by default** (violations trigger HOLD). Override per-gate:

```javascript
evaluateDraft(draft, {
  allowInferredEmails: true,   // Allow inferred email patterns
  allowPriceStock: true,        // Allow price/stock mentions
  allowTrackingPixels: true,    // Allow tracking pixels
  allowFirstTouchLinks: true,   // Allow signup/onboarding links
  enableLLMJudge: true,         // Enable LLM-as-judge (requires external LLM)
});
```

## API

### `evaluateDraft(draft, config?)`

Evaluates a draft and returns `{ result, reason, flags }`.

**Parameters:**
- `draft: DraftContent` - The draft to evaluate
  - `text?: string` - Plain text content
  - `html?: string` - HTML content
  - `metadata?: DraftMetadata` - Draft metadata (to, from, subject, etc.)
- `config?: EvalGateConfig` - Optional configuration overrides

**Returns:** `EvalResult`
- `result: 'PASS' | 'HOLD'` - Evaluation result
- `reason?: string` - Human-readable reason
- `flags?: string[]` - List of triggered gates

### `repairMetadata(metadata)`

Repairs structured metadata by converting string numbers and booleans to their proper types.

**Parameters:**
- `metadata: DraftMetadata` - Metadata object to repair

**Returns:** `DraftMetadata` - Repaired metadata

## Tests

All 16 tests use fake `.example` TLD fixtures and require no credentials, GPU, or environment variables:

```bash
npm test
```

Tests cover:
- Clean drafts (PASS)
- Inferred email patterns (HOLD)
- Price/stock mentions (HOLD)
- Tracking pixels (HOLD)
- First-touch links (HOLD)
- Multiple violations
- Config overrides
- Metadata repair
- LLM judge flag
- Edge cases (empty drafts, metadata-only)

## License

MIT License - see [LICENSE](LICENSE) file

Copyright (c) 2026 Priyansh Rana

## Contributing

Pull requests welcome! Ensure all tests pass before submitting:

```bash
npm test
```

## Repository

https://github.com/RanaPriyansh/dsh-plugin-eval-gate
