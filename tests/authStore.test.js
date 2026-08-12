import test from 'node:test';
import assert from 'node:assert/strict';
import { resetUsersForTesting, saveUser, authenticateUser } from '../server/authStore.js';

test('saves a username with the account details and returns it during authentication', () => {
  resetUsersForTesting();

  const signupResult = saveUser('tester@example.com', 'supersecret', 'coolname');
  assert.equal(signupResult.success, true);

  const authResult = authenticateUser('tester@example.com', 'supersecret');
  assert.equal(authResult.success, true);
  assert.equal(authResult.user.username, 'coolname');
});
