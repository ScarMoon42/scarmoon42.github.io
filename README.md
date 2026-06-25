# Информационная система поддержки принятия управленческих решений в области кадровой политики

Полнофункциональное веб-приложение для управления кадровой политикой с поддержкой различных ролей (администратор, учитель, ученик, эксперт и др.).

## 🏗️ Архитектура

Проект состоит из:
- **Фронтенд**: React 18 + TypeScript + Vite + Tailwind CSS
- **Бэкенд**: Node.js + Express + TypeScript
- **База данных**: PostgreSQL + Prisma ORM
- **Аутентификация**: Keycloak
- **Кеш**: Redis
- **Деплой**: Docker + Docker Compose

## 📁 Структура проекта

```
├── /src                 # Фронтенд на React
│   ├── /components      # React компоненты
│   ├── /pages           # Страницы приложения
│   ├── /services        # API клиент и бизнес-логика
│   ├── /auth            # Keycloak конфигурация
│   ├── /lib             # Утилиты и помощники
│   └── /styles          # CSS стили и конфигурация Tailwind
├── /server              # REST API бэкенд
│   ├── /routes          # API маршруты
│   ├── /middleware      # Express middleware (auth, validation)
│   └── /lib             # Вспомогательные функции
├── /prisma              # Схема БД и миграции
├── /infra               # Конфигурация инфраструктуры (Keycloak, Prometheus, Loki)
├── /public              # Статические файлы
├── Dockerfile           # Docker образ приложения
├── docker-compose.yml   # Оркестрация сервисов
└── vite.config.ts       # Конфигурация Vite
```

## 🚀 Требования

- **Node.js**: 18+ версия
- **npm**: 9+ версия
- **Docker** и **Docker Compose** (для полного окружения)
- **PostgreSQL**: 14+ версия (или в Docker контейнере)
- **Redis** (для кеширования)
- **Keycloak**: для аутентификации

## ⚙️ Локальная разработка

### Быстрый старт с Docker

Убедитесь, что у вас есть все необходимые файлы конфигурации:
- `/infra/loki-config.yml` - конфигурация логирования
- `/infra/prometheus.yml` - конфигурация метрик
- `/infra/keycloak/realm-app.json` - конфигурация Keycloak

```bash
# Запустить все сервисы (PostgreSQL, Redis, Keycloak, приложение)
docker-compose up -d

# Приложение будет доступно на http://localhost:3000
# Keycloak на http://localhost:8080
# PostgreSQL на localhost:5432
# Redis на localhost:6379
```

### Разработка без Docker

1. **Установка зависимостей**:
   ```bash
   npm install
   ```

2. **Настройка переменных окружения**:
   Создайте файл `.env` в корне проекта:
   ```bash
   # PostgreSQL
   DATABASE_URL="postgresql://user:password@localhost:5432/app_db"
   
   # Keycloak
   KEYCLOAK_URL="http://127.0.0.1:8080"
   KEYCLOAK_REALM="app"
   KEYCLOAK_CLIENT_ID="app-client"
   
   # API
   VITE_API_URL="http://localhost:3001"
   
   # Redis (опционально)
   REDIS_URL="redis://localhost:6379"
   ```

3. **Инициализация БД**:
   ```bash
   npm run db:push        # Синхронизировать схему
   npm run db:seed        # Заполнить тестовыми данными (если есть seed)
   ```

4. **Запуск приложения** (два терминала):
   
   **Терминал 1 - Фронтенд**:
   ```bash
   npm run dev           # Vite на http://localhost:3000
   ```
   
   **Терминал 2 - Бэкенд**:
   ```bash
   npm run dev:server    # Express на http://localhost:3001
   ```

## 🛠️ Доступные команды

```bash
# Развитие
npm run dev              # Запуск Vite (фронтенд)
npm run dev:server       # Запуск Express (бэкенд)

# Сборка
npm run build            # Production сборка фронтенда
npm run build:server     # Production сборка бэкенда

# Тестирование
npm test                 # Запуск Jest тестов
npm run test:watch      # Режим watch

# База данных
npm run db:push         # Синхронизировать схему с БД
npm run db:migrate      # Запустить миграции
npm run db:studio       # Открыть Prisma Studio

# Линтинг и форматирование
npm run lint            # Проверить код
npm run format          # Форматировать код
```

## 🔐 Аутентификация (Keycloak)

Проект использует Keycloak для управления пользователями и ролями. 

**Роли в системе**:
- `admin` - Администратор системы
- `secretary` - Секретарь
- `teacher` - Учитель
- `student` - Ученик
- `expert` - Эксперт

Конфигурация Keycloak находится в `/infra/keycloak/`.

## 📦 Деплой в Production

### С использованием Docker

```bash
docker-compose -f docker-compose.yml up -d --build
```

### На сервер (вручную)

1. Собрать фронтенд:
   ```bash
   npm run build
   ```

2. Собрать бэкенд и запустить:
   ```bash
   npm run build:server
   npm start
   ```

3. Статику фронтенда (`dist/`) раздавать через nginx или другой веб-сервер.

## 📊 Мониторинг и логи

Проект включает:
- **Prometheus** для метрик (`/infra/prometheus.yml`)
- **Loki** для логов (`/infra/loki-config.yml`)
- Доступны через Docker Compose

## 🤝 Разработка

### Структура компонентов

- `/src/components/ui` - переиспользуемые UI компоненты (Radix UI + Tailwind)
- `/src/components/*.tsx` - страничные компоненты (Expert, Secretary, Teacher, Student, Admin)

### API маршруты

- `/server/routes/auth.ts` - аутентификация
- `/server/routes/users.ts` - управление пользователями
- `/server/routes/assignments.ts` - назначения
- `/server/routes/candidates.ts` - кандидаты
- `/server/routes/files.ts` - загрузка файлов
- `/server/routes/metadata.ts` - метаданные

## 📝 Лицензия

Проект создан для нужд управления кадровой политикой.
