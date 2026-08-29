#!/usr/bin/env node
/**
 * Demo script for dsh-plugin-eval-gate
 * Uses only .example TLD fixtures
 */

const { evaluateDraft } = require('./dist/eval-gate');

console.log('=== DeepSeek Harness Eval Gate Demo ===\n');

// Fixture 1: Clean draft (should PASS)
console.log('Test 1: Clean draft');
const clean = {
  text: 'Hello! This is a normal message to discuss our project.',
  metadata: {
    to: 'user@example.com',
    from: 'sender@example.com',
    subject: 'Project Discussion',
  },
};
console.log('Result:', evaluateDraft(clean));
console.log();

// Fixture 2: Draft with inferred email (should HOLD)
console.log('Test 2: Draft with inferred email');
const inferredEmail = {
  text: 'Please contact me at john [at] example [dot] com for more details.',
  metadata: {
    to: 'recipient@example.com',
    from: 'sender@example.com',
  },
};
console.log('Result:', evaluateDraft(inferredEmail));
console.log();

// Fixture 3: Draft with price mention (should HOLD)
console.log('Test 3: Draft with price mention');
const priceStock = {
  text: 'The product costs $49.99 and is available now.',
  metadata: {
    to: 'buyer@example.com',
    from: 'sales@example.com',
  },
};
console.log('Result:', evaluateDraft(priceStock));
console.log();

// Fixture 4: Draft with tracking pixel (should HOLD)
console.log('Test 4: Draft with tracking pixel');
const trackingPixel = {
  html: '<p>Hello!</p><img src="https://track.example.com/pixel.gif" width="1" height="1" />',
  text: 'Hello!',
  metadata: {
    to: 'user@example.com',
    from: 'marketing@example.com',
  },
};
console.log('Result:', evaluateDraft(trackingPixel));
console.log();

// Fixture 5: Draft with first-touch link (should HOLD)
console.log('Test 5: Draft with first-touch link');
const firstTouch = {
  text: 'Click here to signup and get started with our platform!',
  metadata: {
    to: 'newuser@example.com',
    from: 'onboarding@example.com',
  },
};
console.log('Result:', evaluateDraft(firstTouch));
console.log();

// Fixture 6: Draft with multiple issues (should HOLD)
console.log('Test 6: Draft with multiple issues');
const multiple = {
  html: '<p>Contact me at alice (at) example (dot) com. Price: $99.99</p><img src="https://track.example.com/1x1.gif" width="1" height="1" />',
  text: 'Contact me at alice (at) example (dot) com. Price: $99.99',
  metadata: {
    to: 'user@example.com',
    from: 'sender@example.com',
  },
};
console.log('Result:', evaluateDraft(multiple));
console.log();

// Fixture 7: Draft with config override (allow price/stock)
console.log('Test 7: Draft with config override (allow price/stock)');
const allowedPrice = {
  text: 'The product costs $49.99 and is available now.',
  metadata: {
    to: 'buyer@example.com',
    from: 'sales@example.com',
  },
};
console.log('Result:', evaluateDraft(allowedPrice, { allowPriceStock: true }));
console.log();

console.log('=== Demo Complete ===');
console.log('\nNote: This plugin evaluates drafts only. It does not send mail, access mailboxes, or use GPU resources.');
