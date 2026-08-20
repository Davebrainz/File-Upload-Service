import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Redis } from '@upstash/redis';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const usersFilePath = path.join(__dirname, 'users.json');
const usersKey = 'file-upload-service:users';
const kvRestApiUrl = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const kvRestApiToken = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const hasKvStorage = Boolean(kvRestApiUrl && kvRestApiToken);
const isVercelRuntime = Boolean(process.env.VERCEL);
const redis = hasKvStorage ? new Redis({ url: kvRestApiUrl, token: kvRestApiToken }) : null;

function ensureUsersFile() {
  if (!fs.existsSync(usersFilePath)) {
    fs.writeFileSync(usersFilePath, JSON.stringify({ users: [] }, null, 2));
  }
}

function readLocalUsers() {
  ensureUsersFile();
  const raw = fs.readFileSync(usersFilePath, 'utf8');
  const parsed = JSON.parse(raw);
  return Array.isArray(parsed.users) ? parsed.users : [];
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

async function readUsers() {
  if (hasKvStorage) {
    const users = await redis.get(usersKey);
    if (Array.isArray(users)) {
      return users;
    }

    const existingUsers = readLocalUsers();
    if (existingUsers.length > 0) {
      await redis.set(usersKey, existingUsers);
    }
    return existingUsers;
  }

  if (isVercelRuntime) {
    throw new Error('Persistent account storage is not configured.');
  }

  return readLocalUsers();
}

async function writeUsers(users) {
  if (hasKvStorage) {
    await redis.set(usersKey, users);
    return;
  }

  if (isVercelRuntime) {
    throw new Error('Persistent account storage is not configured.');
  }

  fs.writeFileSync(usersFilePath, JSON.stringify({ users }, null, 2));
}

export async function getAuthStatus() {
  return { hasAccount: (await readUsers()).length > 0 };
}

export async function saveUser(email, password, username = '') {
  const normalizedEmail = (email || '').trim().toLowerCase();
  const normalizedUsername = (username || '').trim();
  const users = await readUsers();

  const existingUser = users.find((user) => user.email === normalizedEmail);
  if (existingUser) {
    return { success: false, error: 'This email already has an account.' };
  }

  if (normalizedUsername) {
    const usernameTaken = users.some((user) => user.username && user.username.toLowerCase() === normalizedUsername.toLowerCase());
    if (usernameTaken) {
      return { success: false, error: 'This username is already taken.' };
    }
  }

  users.push({
    email: normalizedEmail,
    passwordHash: hashPassword(password),
    username: normalizedUsername,
    createdAt: new Date().toISOString(),
  });

  await writeUsers(users);
  return { success: true };
}

export async function authenticateUser(identifier, password) {
  const normalizedIdentifier = String(identifier || '').trim();
  const lookupKey = normalizedIdentifier.toLowerCase();
  const users = await readUsers();
  const user = users.find((entry) => {
    const matchesEmail = entry.email === lookupKey;
    const matchesUsername = typeof entry.username === 'string' && entry.username.trim() && entry.username.toLowerCase() === lookupKey;
    return matchesEmail || matchesUsername;
  });

  if (!user) {
    return { success: false, error: 'No account was found for that email or username.' };
  }

  if (!verifyPassword(password, user.passwordHash)) {
    return { success: false, error: 'The password is incorrect.' };
  }

  return { success: true, user: { email: user.email, username: user.username || '' } };
}

export async function updateUserUsername(email, username) {
  const normalizedEmail = (email || '').trim().toLowerCase();
  const normalizedUsername = (username || '').trim();
  const users = await readUsers();
  const user = users.find((entry) => entry.email === normalizedEmail);

  if (!user) {
    return { success: false, error: 'No account was found for that email.' };
  }

  const usernameTakenByOtherUser = users.some((entry) => {
    if (entry.email === normalizedEmail) {
      return false;
    }
    return typeof entry.username === 'string' && entry.username.trim() && entry.username.toLowerCase() === normalizedUsername.toLowerCase();
  });

  if (usernameTakenByOtherUser) {
    return { success: false, error: 'This username is already taken.' };
  }

  user.username = normalizedUsername;
  await writeUsers(users);
  return { success: true, user: { email: user.email, username: user.username } };
}

export async function resetUsersForTesting() {
  await writeUsers([]);
}
