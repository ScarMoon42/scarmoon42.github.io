type KeycloakUserCreate = {
  username: string;
  enabled: boolean;
  firstName?: string;
  lastName?: string;
  email?: string;
  emailVerified?: boolean;
  credentials?: Array<{ type: 'password'; value: string; temporary: boolean }>;
};

function baseUrl() {
  return (process.env.KEYCLOAK_URL || 'http://127.0.0.1:8080').replace(/\/+$/, '');
}

function realm() {
  return process.env.KEYCLOAK_REALM || 'app';
}

function adminUser() {
  return process.env.KEYCLOAK_ADMIN || 'admin';
}

function adminPassword() {
  return process.env.KEYCLOAK_ADMIN_PASSWORD || 'admin';
}

let cachedToken: { token: string; expMs: number } | null = null;

async function getAdminToken(): Promise<string> {
  const now = Date.now();
  if (cachedToken && cachedToken.expMs > now + 30_000) return cachedToken.token;

  const params = new URLSearchParams({
    grant_type: 'password',
    client_id: 'admin-cli',
    username: adminUser(),
    password: adminPassword(),
  });

  const resp = await fetch(`${baseUrl()}/realms/master/protocol/openid-connect/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });
  if (!resp.ok) throw new Error(`Keycloak admin token failed: ${resp.status}`);
  const data = (await resp.json()) as { access_token: string; expires_in: number };
  cachedToken = { token: data.access_token, expMs: now + (data.expires_in ?? 60) * 1000 };
  return data.access_token;
}

async function kcFetch(path: string, init?: RequestInit) {
  const token = await getAdminToken();
  const resp = await fetch(`${baseUrl()}${path}`, {
    ...init,
    headers: {
      ...(init?.headers || {}),
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  return resp;
}

export async function createUserAndAssignRealmRole(input: {
  username: string;
  fullName: string;
  password: string;
  realmRole: 'secretary' | 'teacher' | 'expert' | 'external_expert';
}): Promise<{ id: string }> {
  const [firstName, ...rest] = input.fullName.trim().split(/\s+/);
  const lastName = rest.join(' ') || undefined;

  const user: KeycloakUserCreate = {
    username: input.username.trim(),
    enabled: true,
    firstName: firstName || undefined,
    lastName,
    emailVerified: true,
    credentials: [{ type: 'password', value: input.password, temporary: false }],
  };

  const createResp = await kcFetch(`/admin/realms/${realm()}/users`, {
    method: 'POST',
    body: JSON.stringify(user),
  });
  if (!createResp.ok) {
    const text = await createResp.text();
    throw new Error(`Keycloak create user failed: ${createResp.status} ${text}`);
  }

  // Location header contains .../users/{id}
  const location = createResp.headers.get('location') || '';
  const id = location.split('/').pop() || '';
  if (!id) throw new Error('Keycloak create user: missing id');

  const roleResp = await kcFetch(`/admin/realms/${realm()}/roles/${input.realmRole}`, { method: 'GET' });
  if (!roleResp.ok) throw new Error(`Keycloak role fetch failed: ${roleResp.status}`);
  const role = (await roleResp.json()) as { id: string; name: string };

  const mapResp = await kcFetch(`/admin/realms/${realm()}/users/${id}/role-mappings/realm`, {
    method: 'POST',
    body: JSON.stringify([role]),
  });
  if (!mapResp.ok) {
    const text = await mapResp.text();
    throw new Error(`Keycloak assign role failed: ${mapResp.status} ${text}`);
  }

  return { id };
}

export async function setUserRealmRole(params: {
  userId: string;
  realmRole: 'secretary' | 'teacher' | 'expert' | 'external_expert';
}) {
  const roleResp = await kcFetch(`/admin/realms/${realm()}/roles/${params.realmRole}`, { method: 'GET' });
  if (!roleResp.ok) throw new Error(`Keycloak role fetch failed: ${roleResp.status}`);
  const role = (await roleResp.json()) as { id: string; name: string };

  const mapResp = await kcFetch(`/admin/realms/${realm()}/users/${params.userId}/role-mappings/realm`, {
    method: 'POST',
    body: JSON.stringify([role]),
  });
  if (!mapResp.ok) {
    const text = await mapResp.text();
    throw new Error(`Keycloak assign role failed: ${mapResp.status} ${text}`);
  }
}

export async function deleteUser(params: { userId: string }) {
  const resp = await kcFetch(`/admin/realms/${realm()}/users/${params.userId}`, { method: 'DELETE' });
  if (!resp.ok && resp.status !== 404) {
    const text = await resp.text();
    throw new Error(`Keycloak delete user failed: ${resp.status} ${text}`);
  }
}

