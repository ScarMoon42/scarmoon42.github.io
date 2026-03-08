import { createRemoteJWKSet, jwtVerify } from 'jose';
import { prisma } from '../lib/prisma.js';

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
  const keycloakUrl = process.env.KEYCLOAK_URL || 'http://localhost:8080';
  const realm = process.env.KEYCLOAK_REALM || 'app';
  return `${keycloakUrl.replace(/\/+$/, '')}/realms/${realm}`;
}

function mapRole(roles: string[]): AppRole {
  if (roles.includes('secretary')) return 'Секретарь';
  if (roles.includes('external_expert')) return 'Внешний эксперт';
  if (roles.includes('expert')) return 'Эксперт';
  return 'Преподаватель';
}

const jwks = createRemoteJWKSet(new URL(`${getIssuer()}/protocol/openid-connect/certs`));

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const auth = req.headers.authorization;
    const token = auth?.replace(/^Bearer\s+/i, '');
    if (!token) return res.status(401).json({ success: false, message: 'Требуется авторизация' });

    const issuer = getIssuer();
    // Keycloak по умолчанию выставляет aud: ['account'], а не clientId.
    // Проверяем только issuer здесь; clientId валидируем через azp ниже.
    const { payload } = await jwtVerify(token, jwks, {
      issuer,
    });

    // Ручная проверка azp (authorized party) — содержит clientId в Keycloak токенах
    const expectedClient = process.env.KEYCLOAK_CLIENT_ID || 'frontend';
    const p0 = payload as unknown as KeycloakAccessToken;
    if (p0.azp && p0.azp !== expectedClient) {
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
      return res.status(401).json({ success: false, message: 'Неверный токен' });
    }

    // Find DB user to get ID
    const dbUser = await prisma.user.findFirst({
      where: { externalId: p.sub }
    });

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
    console.error('Keycloak token verify error', e);
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

