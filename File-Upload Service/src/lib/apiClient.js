const DEFAULT_API_BASE_URLS = ['http://127.0.0.1:4000', 'http://localhost:4000'];

function normalizeBaseUrl(baseUrl) {
  return (baseUrl || '').replace(/\/$/, '');
}

function getConfiguredApiBaseUrl() {
  const configuredBaseUrl = import.meta.env?.VITE_API_BASE_URL?.trim();
  return configuredBaseUrl ? normalizeBaseUrl(configuredBaseUrl) : '';
}

function toApiPath(path) {
  return path.startsWith('/') ? path : `/${path}`;
}

function isRelativeUrl(url) {
  return !/^https?:\/\//i.test(url);
}

export function buildApiUrl(path) {
  const apiPath = toApiPath(path);
  const configuredBaseUrl = getConfiguredApiBaseUrl();

  if (configuredBaseUrl) {
    return `${configuredBaseUrl}${apiPath}`;
  }

  return apiPath;
}

export async function apiFetch(path, options = {}) {
  const apiPath = toApiPath(path);
  const candidateUrls = [buildApiUrl(apiPath)];

  if (!getConfiguredApiBaseUrl()) {
    candidateUrls.push(...DEFAULT_API_BASE_URLS.map((baseUrl) => `${baseUrl}${apiPath}`));
  }

  let lastError = new Error('Request failed.');
  let lastResponse = null;

  for (const url of candidateUrls) {
    try {
      const response = await fetch(url, options);

      if (response.ok || !isRelativeUrl(url) || response.status !== 404) {
        return response;
      }

      lastResponse = response;
      lastError = new Error(`Request failed with status ${response.status}.`);
    } catch (error) {
      lastError = error;
    }
  }

  if (lastResponse) {
    return lastResponse;
  }

  throw lastError;
}
