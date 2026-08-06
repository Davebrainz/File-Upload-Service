import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { createApp } from '../server/server.js';

test('auth status endpoint returns a boolean account flag', async () => {
  const app = createApp();
  const server = app.listen(0);

  await once(server, 'listening');

  try {
    const address = server.address();
    const response = await fetch(`http://127.0.0.1:${address.port}/api/auth/status`);
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(typeof payload.hasAccount, 'boolean');
  } finally {
    server.close();
  }
});
