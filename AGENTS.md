# Agent Guidelines

## Critical Requirements

### Tests Must Fail Closed

All gates are **strict by default**. A violation returns `HOLD`, not `PASS`. If tests pass when they should fail, the gate is broken.

### No Message Sending

This plugin evaluates drafts. It does not:
- Send messages
- Interact with SMTP servers or mail APIs
- Store or forward drafts
- Make network calls (except when LLM judge is explicitly enabled)

### No Inferred Emails

The `inferred_email` gate catches patterns like:
- `user [at] example [dot] com`
- `contact (at) domain (dot) org`
- Spaced email patterns

These must return `HOLD` unless explicitly allowed via config.

### Proving HOLD Behavior

The test suite includes explicit HOLD cases:
- `tests/eval-gate.test.js` contains 16 tests
- Tests 2-11 verify that specific violations trigger `HOLD`
- Test 11 verifies that multiple violations accumulate flags

Example test proving HOLD:

```javascript
test('Inferred email with [at] and [dot] should HOLD', () => {
  const draft = {
    text: 'Contact me at john [at] example [dot] com',
    metadata: { to: 'user@example.com' },
  };
  
  const result = evaluateDraft(draft);
  assert.strictEqual(result.result, 'HOLD');
  assert.ok(result.flags.includes('inferred_email'));
});
```

Run `npm test` to verify all gates. All tests must pass in CI before merge.

## Cordis Integration Note

The `@deepseek-ai/cordis` package is in Developer Preview and may be unpublished. The plugin provides:
- Standalone `evaluateDraft()` function that works without Cordis
- `cordis.patch.yml` manifest for reference when Cordis is available
- All tests run independently of Cordis using the standalone API

Do not claim production readiness for Cordis integration until the package is published and stable.
