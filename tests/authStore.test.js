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

test('allows sign in by username as well as email', () => {
  resetUsersForTesting();

  const signupResult = saveUser('tester@example.com', 'supersecret', 'coolname');
  assert.equal(signupResult.success, true);

  const authByEmail = authenticateUser('tester@example.com', 'supersecret');
  const authByUsername = authenticateUser('coolname', 'supersecret');

  assert.equal(authByEmail.success, true);
  assert.equal(authByUsername.success, true);
  assert.equal(authByUsername.user.username, 'coolname');
});

test('rejects duplicate usernames during account creation', () => {
  resetUsersForTesting();

  const firstUser = saveUser('first@example.com', 'supersecret', 'sharedname');
  const secondUser = saveUser('second@example.com', 'anothersecret', 'sharedname');

  assert.equal(firstUser.success, true);
  assert.equal(secondUser.success, false);
  assert.match(secondUser.error, /username/i);
});
