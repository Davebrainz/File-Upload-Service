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
  return fetch(buildApiUrl(apiPath), options);
}
