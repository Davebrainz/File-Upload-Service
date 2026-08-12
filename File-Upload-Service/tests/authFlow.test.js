import test from 'node:test';
import assert from 'node:assert/strict';
import { submitAuthRequest } from '../src/lib/authFlow.js';

test('falls back to sign-in when signup hits an existing-account conflict', async () => {
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

    if (url === '/api/auth/signin') {
      return {
        ok: true,
        status: 200,
        json: async () => ({
          message: 'Signed in successfully.',
          user: { email: 'tester@example.com', username: 'coolname' },
        }),
      };
    }

    throw new Error(`Unexpected request to ${url}`);
  };

  try {
    const result = await submitAuthRequest({
      mode: 'signup',
      email: 'tester@example.com',
      password: 'supersecret',
      username: 'coolname',
    });

    assert.equal(result.usedFallback, true);
    assert.equal(result.payload.message, 'Signed in successfully.');
    assert.deepEqual(calls.map(({ url }) => url), ['/api/auth/signup', '/api/auth/signin']);
  } finally {
    global.fetch = originalFetch;
  }
});

test('uses the backend fallback URL when the browser is not using a Vite proxy', async () => {
  const originalFetch = global.fetch;
  const calls = [];

  global.fetch = async (url) => {
    calls.push(url);

    if (url === '/api/auth/signup') {
      throw new Error('Proxy unavailable');
    }

    if (url === 'http://127.0.0.1:4000/api/auth/signup') {
      return {
        ok: true,
        status: 200,
        json: async () => ({ message: 'Account created successfully.', user: { email: 'tester@example.com', username: 'tester' } }),
      };
    }

    throw new Error(`Unexpected request to ${url}`);
  };

  try {
    const result = await submitAuthRequest({
      mode: 'signup',
      email: 'tester@example.com',
      password: 'supersecret',
      username: 'tester',
    });

    assert.equal(result.success, true);
    assert.equal(calls.includes('http://127.0.0.1:4000/api/auth/signup'), true);
  } finally {
    global.fetch = originalFetch;
  }
});
