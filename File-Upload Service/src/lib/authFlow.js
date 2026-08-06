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

  if (mode === 'signup' && response.status === 409) {
    const fallbackResponse = await apiFetch('/api/auth/signin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const fallbackPayload = await fallbackResponse.json().catch(() => ({}));
    if (!fallbackResponse.ok) {
      throw new Error(fallbackPayload.error || 'Authentication failed.');
    }

    return { success: true, payload: fallbackPayload, usedFallback: true };
  }

  throw new Error(payload.error || 'Authentication failed.');
}
