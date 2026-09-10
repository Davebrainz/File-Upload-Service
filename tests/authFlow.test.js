import test from 'node:test';
import assert from 'node:assert/strict';
import { submitAuthRequest } from '../src/lib/authFlow.js';

test('does not retry sign-in when signup hits an existing-account conflict', async () => {
  const originalFetch = global.fetch;
  const calls = [];

  global.fetch = async (url, options = {}) => {
    calls.push({ url, options });

    if (url === '/api/auth/signup') {
      return {
        ok: false,
        status: 409,
        json: async () => ({ error: 'This email already has an account.' }),
      };
    }

    throw new Error(`Unexpected request to ${url}`);
  };

  try {
    await assert.rejects(
      submitAuthRequest({
        mode: 'signup',
        email: 'tester@example.com',
        password: 'supersecret',
        username: 'coolname',
      }),
      /already has an account/i,
    );

    assert.deepEqual(calls.map(({ url }) => url), ['/api/auth/signup']);
  } finally {
    global.fetch = originalFetch;
  }
});

test('does not guess a backend URL when the same-origin API is unavailable', async () => {
  const originalFetch = global.fetch;
  const calls = [];

  global.fetch = async (url) => {
    calls.push(url);
    throw new Error(`API unavailable at ${url}`);
  };

  await assert.rejects(
    submitAuthRequest({
      mode: 'signup',
      email: 'tester@example.com',
      password: 'supersecret',
      username: 'tester',
    }),
    /API unavailable at \/api\/auth\/signup/,
  );

  assert.deepEqual(calls, ['/api/auth/signup']);
  global.fetch = originalFetch;
});
