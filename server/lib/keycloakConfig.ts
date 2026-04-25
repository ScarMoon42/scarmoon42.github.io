function trimSlashes(value: string): string {
  return value.replace(/^\/+|\/+$/g, '');
}

function normalizeUrl(url: string): string {
  return url.replace(/\/+$/, '');
}

function buildFromParts(prefix: 'KEYCLOAK' | 'KEYCLOAK_FRONTEND'): string {
  const scheme = process.env[`${prefix}_SCHEME`] || 'http';
  const host = process.env[`${prefix}_HOST`] || '127.0.0.1';
  const port = process.env[`${prefix}_PORT`] || '8080';
  const basePath = trimSlashes(process.env[`${prefix}_BASE_PATH`] || '');
  const pathSuffix = basePath ? `/${basePath}` : '';

  return `${scheme}://${host}:${port}${pathSuffix}`;
}

export function getKeycloakUrl(): string {
  if (process.env.KEYCLOAK_URL) {
    return normalizeUrl(process.env.KEYCLOAK_URL);
  }
  return normalizeUrl(buildFromParts('KEYCLOAK'));
}

export function getKeycloakFrontendUrl(): string {
  if (process.env.KEYCLOAK_FRONTEND_URL) {
    return normalizeUrl(process.env.KEYCLOAK_FRONTEND_URL);
  }

  const frontendHostDefined =
    process.env.KEYCLOAK_FRONTEND_HOST ||
    process.env.KEYCLOAK_FRONTEND_PORT ||
    process.env.KEYCLOAK_FRONTEND_SCHEME ||
    process.env.KEYCLOAK_FRONTEND_BASE_PATH;

  if (frontendHostDefined) {
    return normalizeUrl(buildFromParts('KEYCLOAK_FRONTEND'));
  }

  return getKeycloakUrl();
}
