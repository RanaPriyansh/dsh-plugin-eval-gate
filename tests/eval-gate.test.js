/**
 * Tests for eval-gate plugin
 * All tests use fake .example TLD data
 * No credentials, GPU, or env vars required
 */

const { test } = require('node:test');
const assert = require('node:assert');
const { evaluateDraft, repairMetadata } = require('../dist/eval-gate');

// Test 1: Clean draft should PASS
test('Clean draft should PASS', () => {
  const draft = {
    text: 'Hello! This is a normal message.',
    metadata: {
      to: 'user@example.com',
      from: 'sender@example.com',
      subject: 'Normal Message',
    },
  };
  
  const result = evaluateDraft(draft);
  assert.strictEqual(result.result, 'PASS');
  assert.strictEqual(result.flags.length, 0);
});

// Test 2: Inferred email with [at] and [dot] should HOLD
test('Inferred email with [at] and [dot] should HOLD', () => {
  const draft = {
    text: 'Contact me at john [at] example [dot] com',
    metadata: { to: 'user@example.com' },
  };
  
  const result = evaluateDraft(draft);
  assert.strictEqual(result.result, 'HOLD');
  assert.ok(result.flags.includes('inferred_email'));
});

// Test 3: Inferred email with (at) and (dot) should HOLD
test('Inferred email with (at) and (dot) should HOLD', () => {
  const draft = {
    text: 'Reach out to alice (at) example (dot) com for details',
    metadata: { to: 'user@example.com' },
  };
  
  const result = evaluateDraft(draft);
  assert.strictEqual(result.result, 'HOLD');
  assert.ok(result.flags.includes('inferred_email'));
});

// Test 4: Dollar amount should HOLD
test('Dollar amount should HOLD', () => {
  const draft = {
    text: 'The price is $49.99 for this item.',
    metadata: { to: 'buyer@example.com' },
  };
  
  const result = evaluateDraft(draft);
  assert.strictEqual(result.result, 'HOLD');
  assert.ok(result.flags.includes('price_stock'));
});

// Test 5: Currency code should HOLD
test('Currency code should HOLD', () => {
  const draft = {
    text: 'Total cost: 100 USD plus shipping.',
    metadata: { to: 'buyer@example.com' },
  };
  
  const result = evaluateDraft(draft);
  assert.strictEqual(result.result, 'HOLD');
  assert.ok(result.flags.includes('price_stock'));
});

// Test 6: Stock ticker should HOLD
test('Stock ticker should HOLD', () => {
  const draft = {
    text: 'Check out ticker: AAPL for latest info.',
    metadata: { to: 'investor@example.com' },
  };
  
  const result = evaluateDraft(draft);
  assert.strictEqual(result.result, 'HOLD');
  assert.ok(result.flags.includes('price_stock'));
});

// Test 7: 1x1 tracking pixel should HOLD
test('1x1 tracking pixel should HOLD', () => {
  const draft = {
    html: '<p>Hello</p><img src="https://track.example.com/pixel.gif" width="1" height="1" />',
    text: 'Hello',
    metadata: { to: 'user@example.com' },
  };
  
  const result = evaluateDraft(draft);
  assert.strictEqual(result.result, 'HOLD');
  assert.ok(result.flags.includes('tracking_pixel'));
});

// Test 8: Tracking URL with "track" keyword should HOLD
test('Tracking URL with "track" keyword should HOLD', () => {
  const draft = {
    html: '<img src="https://example.com/track/beacon.gif" />',
    metadata: { to: 'user@example.com' },
  };
  
  const result = evaluateDraft(draft);
  assert.strictEqual(result.result, 'HOLD');
  assert.ok(result.flags.includes('tracking_pixel'));
});

// Test 9: Signup link should HOLD
test('Signup link should HOLD', () => {
  const draft = {
    text: 'Click here to signup for our service!',
    metadata: { to: 'newuser@example.com' },
  };
  
  const result = evaluateDraft(draft);
  assert.strictEqual(result.result, 'HOLD');
  assert.ok(result.flags.includes('first_touch_link'));
});

// Test 10: Onboarding link should HOLD
test('Onboarding link should HOLD', () => {
  const draft = {
    text: 'Visit /onboard to get started with your account.',
    metadata: { to: 'newuser@example.com' },
  };
  
  const result = evaluateDraft(draft);
  assert.strictEqual(result.result, 'HOLD');
  assert.ok(result.flags.includes('first_touch_link'));
});

// Test 11: Multiple violations should HOLD with multiple flags
test('Multiple violations should HOLD with multiple flags', () => {
  const draft = {
    html: '<p>Email me at bob [at] example [dot] com. Price: $99</p><img src="https://pixel.example.com/t.gif" width="1" height="1" />',
    text: 'Email me at bob [at] example [dot] com. Price: $99',
    metadata: { to: 'user@example.com' },
  };
  
  const result = evaluateDraft(draft);
  assert.strictEqual(result.result, 'HOLD');
  assert.ok(result.flags.length >= 2);
  assert.ok(result.flags.includes('inferred_email'));
  assert.ok(result.flags.includes('price_stock'));
});

// Test 12: Config override should allow specific gates
test('Config override should allow specific gates', () => {
  const draft = {
    text: 'The price is $49.99 for this item.',
    metadata: { to: 'buyer@example.com' },
  };
  
  const result = evaluateDraft(draft, { allowPriceStock: true });
  assert.strictEqual(result.result, 'PASS');
  assert.strictEqual(result.flags.length, 0);
});

// Test 13: Metadata repair should convert string numbers
test('Metadata repair should convert string numbers', () => {
  const metadata = {
    count: '42',
    price: '19.99',
    active: 'true',
    disabled: 'false',
    name: 'test',
  };
  
  const repaired = repairMetadata(metadata);
  assert.strictEqual(typeof repaired.count, 'number');
  assert.strictEqual(repaired.count, 42);
  assert.strictEqual(typeof repaired.price, 'number');
  assert.strictEqual(repaired.price, 19.99);
  assert.strictEqual(typeof repaired.active, 'boolean');
  assert.strictEqual(repaired.active, true);
  assert.strictEqual(typeof repaired.disabled, 'boolean');
  assert.strictEqual(repaired.disabled, false);
  assert.strictEqual(typeof repaired.name, 'string');
  assert.strictEqual(repaired.name, 'test');
});

// Test 14: LLM judge flag should be noted when enabled
test('LLM judge flag should be noted when enabled', () => {
  const draft = {
    text: 'Hello! This is a normal message.',
    metadata: { to: 'user@example.com' },
  };
  
  const result = evaluateDraft(draft, { enableLLMJudge: true });
  // Clean draft but LLM judge is enabled
  assert.ok(result.flags.includes('llm_judge_enabled'));
});

// Test 15: Empty draft should PASS
test('Empty draft should PASS', () => {
  const draft = {
    text: '',
    metadata: { to: 'user@example.com' },
  };
  
  const result = evaluateDraft(draft);
  assert.strictEqual(result.result, 'PASS');
});

// Test 16: Draft with only metadata should PASS
test('Draft with only metadata should PASS', () => {
  const draft = {
    metadata: {
      to: 'user@example.com',
      from: 'sender@example.com',
      subject: 'Test',
    },
  };
  
  const result = evaluateDraft(draft);
  assert.strictEqual(result.result, 'PASS');
});
