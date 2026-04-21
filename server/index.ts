/**
 * Монолитный бэкенд: Node 18+, TypeScript 5+, Express, Prisma 5+, zod, helmet.
 * REST API для фронтенда (React 18+, Tailwind, shadcn).
 * БД: PostgreSQL 17+, кэш: Redis 7+ (опционально).
 * Аутентификация: Keycloak (OpenID Connect).
 */

import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import path from 'path';
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import candidatesRoutes from './routes/candidates';
import filesRoutes from './routes/files';
import openClassesRoutes from './routes/open-classes';
import metadataRoutes from './routes/metadata';
import assignmentRoutes from './routes/assignments';

const app = express();
const PORT = Number(process.env.PORT) || 3001;

// CORS конфигурация с безопасностью
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map(o => o.trim())
  : '*';

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ 
  origin: allowedOrigins, 
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400,
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Статический сервис для загруженных файлов
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Эмуляция поведения Vite Proxy для продакшена (монолита)
app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) {
    req.url = req.url.replace('/api', '');
  }
  next();
});

app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/candidates', candidatesRoutes);
app.use('/files', filesRoutes);
app.use('/open-classes', openClassesRoutes);
app.use('/metadata', metadataRoutes);
app.use('/assignments', assignmentRoutes);

// Раздача статики React (SPA)
const distPath = path.join(process.cwd(), 'dist');
app.use(express.static(distPath));

// Для клиентского роутинга React: если путь не API и хочет HTML, отдаем index.html
app.get('*', (req, res, next) => {
  if (req.accepts('html')) {
    res.sendFile(path.join(distPath, 'index.html'));
  } else {
    next();
  }
});

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'api' });
});

app.get('/keycloak-status', (_req, res) => {
  const keycloakUrl = process.env.KEYCLOAK_FRONTEND_URL || process.env.KEYCLOAK_URL || 'http://127.0.0.1:8080';
  const realm = process.env.KEYCLOAK_REALM || 'app';

  res.json({
    ok: true,
    keycloak: {
      url: keycloakUrl,
      realm,
      configUrl: `${keycloakUrl}/realms/${realm}/.well-known/openid-configuration`,
    },
  });
});

app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Маршрут не найден' });
});

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error', err);
  res.status(500).json({ success: false, message: 'Внутренняя ошибка сервера' });
});

app.listen(PORT, () => {
  console.log(`API listening on http://127.0.0.1:${PORT}`);
  console.log(`Keycloak: ${process.env.KEYCLOAK_URL || 'http://127.0.0.1:8080'}`);
});
