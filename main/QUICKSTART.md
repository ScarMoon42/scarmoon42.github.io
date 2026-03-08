# Инструкция по запуску проекта с Keycloak

## Требования

- Docker & Docker Compose установлены
- Node.js 18+ (для разработки)
- npm или yarn

## Быстрый старт (3 шага)

### 1️⃣ Установка зависимостей

```bash
npm install
```

### 2️⃣ Запуск всех сервисов через Docker

```bash
docker-compose up -d
```

Это запустит:
- 🗄️ **PostgreSQL** (main database на порту 5432)
- 📊 **Redis** (кэш на порту 6379)
- 🔐 **Keycloak** (аутентификация на порту 8080)
- 🗄️ **PostgreSQL для Keycloak** (на порту 5433)
- 📈 **Prometheus** (мониторинг на порту 9090)
- 📉 **Grafana** (визуализация на порту 3002)
- 📝 **Loki** (логирование на порту 3100)

**Ожидайте 30-60 секунд для инициализации всех сервисов**

### 3️⃣ Перейти к конфигурации Keycloak

Откройте [KEYCLOAK_SETUP.md](./KEYCLOAK_SETUP.md) и выполните первоначальную настройку.

## Запуск приложения

### Терминал 1: Бэкенд API

```bash
npm run dev:server
```

Сервер запустится на **http://localhost:3001**

### Терминал 2: Фронтенд (React)

```bash
npm run dev
```

Приложение откроется на **http://localhost:3000**

## Полезные команды

```bash
# Посмотреть логи сервиса
docker-compose logs keycloak -f
docker-compose logs db -f

# Остановить все сервисы
docker-compose down

# Остановить и удалить все данные (полный reset)
docker-compose down -v

# Перезапустить конкретный сервис
docker-compose restart keycloak

# Проверить статус сервисов
docker-compose ps
```

## Доступ к сервисам

| Сервис | URL | Логин | Пароль |
|--------|-----|-------|--------|
| Keycloak Admin | http://localhost:8080 | admin | admin |
| Grafana | http://localhost:3002 | admin | admin |
| Prometheus | http://localhost:9090 | - | - |
| Loki | http://localhost:3100 | - | - |
| PostgreSQL (main) | localhost:5432 | postgres | password |
| PostgreSQL (keycloak) | localhost:5433 | keycloak | keycloak-password |
| Redis | localhost:6379 | - | - |

## Миграции базы данных

```bash
# Создать новую миграцию
npm run db:migrate

# Отправить схему в БД
npm run db:push

# Заполнить БД тестовыми данными
npm run db:seed

# Сгенерировать Prisma Client
npm run db:generate
```

## Переменные окружения

Основные переменные окружения находятся в `.env.development`:

```env
# API
PORT=3001
CORS_ORIGIN=http://localhost:3000

# Keycloak (важно!)
KEYCLOAK_URL=http://localhost:8080
KEYCLOAK_REALM=myrealm
KEYCLOAK_CLIENT_ID=my-app
KEYCLOAK_CLIENT_SECRET=<скопируйте_из_keycloak>
```

**⚠️ После первой настройки Keycloak обновите `KEYCLOAK_CLIENT_SECRET`!**

## Когда готово

Проект готов к разработке! 🚀

- Фронтенд: http://localhost:3000
- Бэкенд: http://localhost:3001
- Keycloak: http://localhost:8080
- API документация: http://localhost:3001/health

## Troubleshooting

### ❌ "docker-compose: command not found"
Используйте `docker compose` (без дефиса) в версиях Docker >= 2.0

### ❌ Порты заняты
Убедитесь, что никакие другие приложения не используют порты 5432, 6379, 8080, 3000, 3001

### ❌ Keycloak не запускается
```bash
docker-compose logs keycloak
# Проверьте, есть ли ошибки в логах
```

### ❌ "Cannot find module 'keycloak-admin-client'"
Переустановите зависимости:
```bash
rm -rf node_modules package-lock.json
npm install
```

---

**Для подробной информации о Keycloak см.** [KEYCLOAK_SETUP.md](./KEYCLOAK_SETUP.md)
