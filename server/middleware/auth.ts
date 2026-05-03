import type { NextFunction, Request, Response } from 'express';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import { prisma } from '../lib/prisma.js';
import { configureKeycloakTls } from '../lib/keycloakTls.js';
import { getKeycloakFrontendUrl, getKeycloakUrl } from '../lib/keycloakConfig.js';

export type AppRole = 'Секретарь' | 'Преподаватель' | 'Эксперт' | 'Внешний эксперт';

type KeycloakAccessToken = {
  sub: string;
  preferred_username?: string;
  email?: string;
  name?: string;
  given_name?: string;
  family_name?: string;
  realm_access?: { roles?: string[] };
  azp?: string; // authorized party — клиентский id в Keycloak
  aud?: string | string[];
};

declare global {
  namespace Express {
    interface Request {
      auth?: {
        id: number;
        sub: string;
        username: string;
        email?: string;
        fullName: string;
        roles: string[];
        appRole: AppRole;
      };
      validated?: unknown;
      authUser?: {
        id: number;
        externalId: string;
        login: string;
        role: string;
      };
    }
  }
}

function getIssuer(): string {
  const keycloakUrl = getKeycloakUrl();
  const realm = process.env.KEYCLOAK_REALM || 'app';
  return `${keycloakUrl.replace(/\/+$/, '')}/realms/${realm}`;
}

function getValidIssuers(): string[] {
  const realm = process.env.KEYCLOAK_REALM || 'app';
  const frontendUrl = getKeycloakFrontendUrl().replace(/\/+$/, '');
  const rawAliases = process.env.KEYCLOAK_ISSUER_ALIASES || '';
  const aliases = rawAliases
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)
    .map((value) => value.replace(/\/+$/, ''));

  const issuers = [getIssuer()];

  issuers.push(`${frontendUrl}/realms/${realm}`);

  for (const alias of aliases) {
    issuers.push(`${alias}/realms/${realm}`);
  }

  return Array.from(new Set(issuers));
}

function mapRole(roles: string[]): AppRole {
  if (roles.includes('secretary')) return 'Секретарь';
  if (roles.includes('external_expert')) return 'Внешний эксперт';
  if (roles.includes('expert')) return 'Эксперт';
  return 'Преподаватель';
}

configureKeycloakTls();

const jwks = createRemoteJWKSet(new URL(`${getIssuer()}/protocol/openid-connect/certs`));

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const auth = req.headers.authorization;
    const token = auth?.replace(/^Bearer\s+/i, '');
    if (!token) return res.status(401).json({ success: false, message: 'Требуется авторизация' });

    // Keycloak по умолчанию выставляет aud: ['account'], а не clientId.
    // Проверяем только issuer здесь; clientId валидируем через azp ниже.
    const validIssuers = getValidIssuers();
    const DEBUG = process.env.DEBUG === 'true';
    if (DEBUG) console.log('[AUTH] Attempting JWT verification with issuers:', validIssuers);
    
    const { payload } = await jwtVerify(token, jwks, {
      issuer: getValidIssuers(),
    });

    // Ручная проверка azp (authorized party) — содержит clientId в Keycloak токенах
    const expectedClient = process.env.KEYCLOAK_CLIENT_ID || 'frontend';
    const p0 = payload as unknown as KeycloakAccessToken;
    
    if (DEBUG) {
      console.log('[AUTH] Token payload:', {
        sub: p0.sub,
        preferred_username: p0.preferred_username,
        azp: p0.azp,
        expected_client: expectedClient,
        aud: p0.aud,
        issuer: payload.iss,
      });
    }
    
    if (p0.azp && p0.azp !== expectedClient) {
      console.error('[AUTH] Client mismatch:', { provided: p0.azp, expected: expectedClient });
      return res.status(401).json({ success: false, message: 'Неверный клиент токена' });
    }

    const p = p0;
    const roles = (p.realm_access?.roles ?? []).filter(Boolean) as string[];
    const username = p.preferred_username ?? '';
    const fullName =
      p.name ??
      [p.given_name, p.family_name].filter(Boolean).join(' ') ??
      username ??
      'Пользователь';

    if (!p.sub || !username) {
      console.error('[AUTH] Missing required fields:', { sub: p.sub, username });
      return res.status(401).json({ success: false, message: 'Неверный токен' });
    }

    // Find DB user to get ID
    const dbUser = await prisma.user.findFirst({
      where: { externalId: p.sub }
    });

    if (DEBUG) console.log('[AUTH] User authenticated:', { sub: p.sub, username, dbUserId: dbUser?.id });

    req.auth = {
      id: dbUser?.id ?? 0,
      sub: p.sub,
      username,
      email: p.email,
      fullName,
      roles,
      appRole: mapRole(roles),
    };

    next();
  } catch (e) {
    const DEBUG = process.env.DEBUG === 'true';
    if (DEBUG) console.error('[AUTH] Token verify error:', e instanceof Error ? e.message : e);
    return res.status(401).json({ success: false, message: 'Неверный токен' });
  }
}

export function requireAppRole(allowed: AppRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.auth) return res.status(401).json({ success: false, message: 'Требуется авторизация' });
    if (!allowed.includes(req.auth.appRole)) {
      return res.status(403).json({ success: false, message: 'Недостаточно прав' });
    }
    next();
  };
}

