# Keycloak Integration Guide

Этот проект теперь использует **Keycloak** для управления аутентификацией и авторизацией.

## Быстрый старт

### 1. Запуск Docker контейнеров

```bash
docker-compose up -d
```

Keycloak будет доступен по адресу: **http://localhost:8080**

### 2. Первоначальная настройка Keycloak

1. Откройте **http://localhost:8080** в браузере
2. Нажмите на **"Administration Console"** 
3. Введите учетные данные администратора:
   - Username: `admin`
   - Password: `admin`

### 3. Создание Realm

Realm — это отдельное пространство для управления пользователями и приложениями.

1. Нажмите на dropdown слева вверху (где написано "Keycloak")
2. Нажмите **"Create Realm"**
3. Введите имя realm: **`app`** (совпадает с `KEYCLOAK_REALM` в `.env`)
4. Нажмите **"Create"**

### 4. Создание Client Application

1. В левом меню перейдите в **Clients**
2. Нажмите **"Create client"**
3. Введите ID клиента: **`frontend`** (совпадает с `KEYCLOAK_CLIENT_ID` в `.env`)
4. Нажмите **"Next"**

#### Настройка Client (страница 1):
- **Client authentication**: ВКЛ (On)
- **Authorization**: Можно оставить как есть
- Нажмите **"Next"**

#### Настройка Client (страница 2 - Login settings):
- **Valid redirect URIs**: 
  ```
  http://localhost:3000/*
  http://localhost:8080/*
  ```
- **Web origins**:
  ```
  http://localhost:3000
  http://localhost:3001
  http://localhost:8080
  ```
- Нажмите **"Save"**

#### Получение Client Secret:

5. Перейдите на вкладку **"Credentials"**
6. Скопируйте значение из поля **"Client secret"**
7. Обновите значение в `.env.development`:
   ```
   KEYCLOAK_CLIENT_SECRET=<скопированное_значение>
   ```

### 5. Создание тестового пользователя

1. В левом меню перейдите в **Users**
2. Нажмите **"Create new user"**
3. Введите данные:
   - **Username**: `testuser`
   - **Email**: `test@example.com`
   - **Enabled**: ВКЛ (On)
4. Нажмите **"Create"**

#### Установка пароля:

5. Перейдите на вкладку **"Credentials"**
6. Нажмите **"Set password"**
7. Введите пароль: `testpass123`
8. Отключите **"Temporary"**
9. Нажмите **"Set Password"**

### 6. Создание Roles (опционально)

1. В левом меню перейдите в **Roles**
2. Нажмите **"Create role"**
3. Создайте роли:
   - `admin`
   - `teacher`
   - `student`
   - `secretary`

#### Назначение ролей пользователю:

1. Перейдите в **Users**
2. Откройте пользователя `testuser`
3. Перейдите на вкладку **"Role mapping"**
4. Нажмите **"Assign role"**
5. Выберите нужные роли

## Использование API

### Вход через Keycloak

```bash
curl -X POST http://localhost:3001/auth/keycloak-login \
  -H "Content-Type: application/json" \
  -d '{
    "login": "testuser",
    "password": "testpass123"
  }'
```

**Ответ:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IkpidXZ...",
    "type": "bearer",
    "message": "Вход успешен. Используйте этот токен в заголовке Authorization: Bearer <token>"
  }
}
```

### Использование токена

Используйте полученный токен во всех последующих запросах:

```bash
curl -X GET http://localhost:3001/auth/me \
  -H "Authorization: Bearer <token>"
```

## Переменные окружения

```dotenv
# Keycloak Server
KEYCLOAK_URL=http://localhost:8080

# Realm и Client
KEYCLOAK_REALM=app
KEYCLOAK_CLIENT_ID=frontend
KEYCLOAK_CLIENT_SECRET=<скопируйте_из_keycloak>

# Admin credentials
KEYCLOAK_ADMIN=admin
KEYCLOAK_ADMIN_PASSWORD=admin

# Frontend (Vite)
VITE_KEYCLOAK_URL=http://localhost:8080
VITE_KEYCLOAK_REALM=app
VITE_KEYCLOAK_CLIENT_ID=frontend
```

## Защита маршрутов с помощью Middleware

В ваших express маршрутах можете использовать middleware для защиты эндпоинтов:

```typescript
import { verifyKeycloakToken, requireRole } from '../middleware/keycloak';

// Защита маршрута
router.get('/protected', verifyKeycloakToken, (req, res) => {
  res.json({
    userId: req.userId,
    email: req.userEmail,
    roles: req.userRoles,
  });
});

// Защита маршрута с проверкой роли
router.get('/admin', 
  verifyKeycloakToken, 
  requireRole(['admin']), 
  (req, res) => {
    res.json({ message: 'Это админ-панель' });
  }
);
```

## Использование Keycloak Admin Client

Для управления пользователями программно используйте `keycloak-admin-client`:

```typescript
import KcAdminClient from 'keycloak-admin-client';

const kcAdminClient = new KcAdminClient({
  baseUrl: process.env.KEYCLOAK_URL,
  realmName: process.env.KEYCLOAK_REALM,
});

// Аутентификация как администратор
await kcAdminClient.auth({
  username: process.env.KEYCLOAK_ADMIN,
  password: process.env.KEYCLOAK_ADMIN_PASSWORD,
  grantType: 'password',
  clientId: 'admin-cli',
});

// Создание пользователя
const user = await kcAdminClient.users.create({
  realm: process.env.KEYCLOAK_REALM,
  username: 'newuser',
  email: 'newuser@example.com',
  enabled: true,
});
```

## Полезные ссылки

- **Keycloak Documentation**: https://www.keycloak.org/documentation.html
- **OpenID Connect Discovery**: http://localhost:8080/realms/app/.well-known/openid-configuration
- **JWKS Endpoint**: http://localhost:8080/realms/app/protocol/openid-connect/certs

## Troubleshooting

### Keycloak не запускается

Проверьте логи:
```bash
docker-compose logs keycloak
```

### "Invalid client credentials" при входе

- Убедитесь, что `KEYCLOAK_CLIENT_SECRET` правильно скопирован из Admin Console
- Проверьте, что Client включен в Keycloak Admin Console

### CORS ошибки

Проверьте настройки **Web origins** для Client в Keycloak Admin Console

### Токен невалидный

- Убедитесь, что `KEYCLOAK_REALM` и `KEYCLOAK_CLIENT_ID` совпадают в коде и `.env`
- Токен может истечь — используйте refresh token для получения нового
