import { apiFetch } from './apiClient.js';

export async function submitAuthRequest({ mode, email, password, username }) {
  const endpoint = mode === 'signup' ? '/api/auth/signup' : '/api/auth/signin';
  const response = await apiFetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, username }),
  });

  const payload = await response.json().catch(() => ({}));

  if (response.ok) {
    return { success: true, payload, usedFallback: false };
  }

  throw new Error(payload.error || 'Authentication failed.');
}
