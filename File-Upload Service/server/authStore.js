import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const usersFilePath = path.join(__dirname, 'users.json');

function ensureUsersFile() {
  if (!fs.existsSync(usersFilePath)) {
    fs.writeFileSync(usersFilePath, JSON.stringify({ users: [] }, null, 2));
  }
}

function readUsers() {
  ensureUsersFile();
  const raw = fs.readFileSync(usersFilePath, 'utf8');
  const parsed = JSON.parse(raw);
  return Array.isArray(parsed.users) ? parsed.users : [];
}

function writeUsers(users) {
  fs.writeFileSync(usersFilePath, JSON.stringify({ users }, null, 2));
}

export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password, storedHash) {
  if (!storedHash || typeof storedHash !== 'string') {
    return false;
  }

  const [salt, hash] = storedHash.split(':');
  if (!salt || !hash) {
    return false;
  }

  const candidate = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(candidate));
}

export function getAuthStatus() {
  return { hasAccount: readUsers().length > 0 };
}

export function saveUser(email, password, username = '') {
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedUsername = (username || '').trim();
  const users = readUsers();

  const existingUser = users.find((user) => user.email === normalizedEmail);
  if (existingUser) {
    return { success: false, error: 'This email already has an account.' };
  }

  users.push({
    email: normalizedEmail,
    passwordHash: hashPassword(password),
    username: normalizedUsername,
    createdAt: new Date().toISOString(),
  });

  writeUsers(users);
  return { success: true };
}

export function authenticateUser(email, password) {
  const normalizedEmail = email.trim().toLowerCase();
  const users = readUsers();
  const user = users.find((entry) => entry.email === normalizedEmail);

  if (!user) {
    return { success: false, error: 'No account was found for that email.' };
  }

  if (!verifyPassword(password, user.passwordHash)) {
    return { success: false, error: 'The password is incorrect.' };
  }

  return { success: true, user: { email: user.email, username: user.username || '' } };
}

export function updateUserUsername(email, username) {
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedUsername = (username || '').trim();
  const users = readUsers();
  const user = users.find((entry) => entry.email === normalizedEmail);

  if (!user) {
    return { success: false, error: 'No account was found for that email.' };
  }

  user.username = normalizedUsername;
  writeUsers(users);
  return { success: true, user: { email: user.email, username: user.username } };
}

export function resetUsersForTesting() {
  writeUsers([]);
}
