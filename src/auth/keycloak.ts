import Keycloak from 'keycloak-js';

// We will fetch this dynamically from /keycloak-status or use import.meta.env as fallback
export let keycloak: Keycloak;

let initPromise: Promise<boolean> | null = null;

async function fetchKeycloakConfig() {
  try {
    const basePath = import.meta.env.BASE_URL.replace(/\/+$/, '');
    const res = await fetch(`${basePath}/api/keycloak-status`);
    if (res.ok) {
      const data = await res.json();
      if (data?.keycloak) {
        return {
          url: data.keycloak.url,
          realm: data.keycloak.realm,
          clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID || 'frontend',
        };
      }
    }
  } catch (error) {
    console.warn('Failed to fetch Keycloak config from backend, using fallback', error);
  }

  // Fallback to build-time vars
  return {
    url: import.meta.env.VITE_KEYCLOAK_URL || 'http://127.0.0.1:8080',
    realm: import.meta.env.VITE_KEYCLOAK_REALM || 'app',
    clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID || 'frontend',
  };
}

/**
 * Инициализация Keycloak с таймаутом
 */
async function initWithTimeout(timeoutMs = 10000): Promise<boolean> {
  const config = await fetchKeycloakConfig();
  console.log('Keycloak config:', config);
  
  keycloak = new Keycloak({
    url: config.url,
    realm: config.realm,
    clientId: config.clientId,
  });

  const basePath = import.meta.env.BASE_URL.replace(/\/+$/, '');
  return Promise.race([
    keycloak.init({
      onLoad: 'check-sso',
      pkceMethod: 'S256',
      silentCheckSsoRedirectUri: `${window.location.origin}${basePath}/silent-check-sso.html`,
      checkLoginIframe: false,
      enableLogging: true,
    }),
    new Promise<boolean>((_, reject) =>
      setTimeout(() => reject(new Error('Keycloak init timeout')), timeoutMs)
    ),
  ]);
}

export function initKeycloak(): Promise<boolean> {
  if (initPromise) return initPromise;

  initPromise = initWithTimeout(15000)
    .catch((error) => {
      console.warn('Keycloak init failed, continuing without authentication:', error);
      return false;
    });

  return initPromise;
}

export async function login() {
  try {
    await keycloak.login();
  } catch (error) {
    console.error('Login failed:', error);
    throw error;
  }
}

export async function logout() {
  try {
    const basePath = import.meta.env.BASE_URL.replace(/\/+$/, '');
    await keycloak.logout({ redirectUri: `${window.location.origin}${basePath}/` });
  } catch (error) {
    console.error('Logout failed:', error);
  }
}

export function getAccessToken(): string | null {
  return keycloak.token ?? null;
}

export async function ensureFreshToken(minValiditySeconds = 30): Promise<string | null> {
  if (!keycloak.authenticated) return null;
  try {
    const refreshed = await keycloak.updateToken(minValiditySeconds);
    if (refreshed && keycloak.token) return keycloak.token;
    return keycloak.token ?? null;
  } catch (error) {
    console.warn('Token refresh failed:', error);
    return null;
  }
}

