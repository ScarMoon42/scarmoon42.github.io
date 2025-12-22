# Frontend - Полная подготовка

## ✅ Проверка соответствия стеку

### Основные зависимости
- ✅ React 18.3.1
- ✅ TypeScript 5.3.3
- ✅ React Router 7.5.0 (для управления маршрутизацией)
- ✅ Tailwind CSS 3.4.0 (стилизация)
- ✅ @shadcn/ui компоненты (Radix UI + CVA)

### Инструменты сборки
- ✅ Vite 6.3.5
- ✅ SWC для оптимальной трансформации
- ✅ PostCSS + Autoprefixer

### Тестирование
- ✅ Jest 29.7.0
- ✅ React Testing Library 14.1.2
- ✅ Jest DOM утилиты

### Безопасность
- ✅ Helmet.js 7.1.0
- ✅ Zod 3.22.4 (валидация)

---

## 🚀 Запуск проекта локально

### Установка зависимостей
```bash
cd frontend
npm install
```

### Разработка
```bash
npm run dev
```
Приложение откроется на http://localhost:3000

### Сборка для production
```bash
npm run build
```
Собранный проект будет в папке `dist/`

### Предпросмотр production версии
```bash
npm run preview
```

### Запуск тестов
```bash
npm run test
```

### Запуск тестов в режиме watch
```bash
npm run test:watch
```

---

## 📦 Развертывание на GitHub Pages

### Требования
1. GitHub репозиторий с ветками `main` или `master`
2. Включенный GitHub Pages в параметрах репозитория
3. Выбран источник развертывания: "GitHub Actions"

### Автоматическое развертывание
Workflow автоматически запускается при push в ветку `main` или `master`:

1. Проверяет код
2. Устанавливает зависимости
3. Собирает проект (`npm run build`)
4. Загружает артефакт
5. Развертывает на GitHub Pages

### Ручное развертывание (если нужно)
```bash
# Собрать проект
npm run build

# Содержимое папки dist/ загрузить на GitHub Pages
```

### Проверка развертывания
После успешного деплоя сайт будет доступен по адресу:
```
https://<username>.github.io/<repository-name>/
```

---

## 📝 Конфигурация GitHub Pages

### Параметры в vite.config.ts
```typescript
base: process.env.VITE_BASE_PATH || '/',
```

Если репозиторий имеет формат `username.github.io`, base остается `/`.
Если репозиторий имеет другое имя, установите в workflows:
```yaml
VITE_BASE_PATH: '/<repository-name>/'
```

---

## 🔧 Структура проекта

```
frontend/
├── src/
│   ├── components/        # React компоненты
│   ├── pages/            # Страницы приложения
│   ├── ui/               # @shadcn/ui компоненты
│   ├── styles/           # Глобальные стили
│   ├── types/            # TypeScript типы
│   ├── App.tsx
│   ├── main.tsx
│   └── setupTests.ts     # Конфигурация Jest
├── public/               # Статические файлы
├── vite.config.ts        # Конфигурация Vite
├── tsconfig.json         # Конфигурация TypeScript
├── tailwind.config.js    # Конфигурация Tailwind
├── jest.config.js        # Конфигурация Jest
└── package.json
```

---

## ✨ Что было обновлено

### package.json
- Добавлены: `react-router`, `zod`, `helmet`
- Добавлены devDependencies для тестирования: `jest`, `@testing-library/react`, `ts-jest`
- Добавлены скрипты: `preview`, `test`, `test:watch`

### vite.config.ts
- Добавлена опция `base` для GitHub Pages
- Оптимизирована сборка (`terser`, `sourcemap`)
- Улучшена конфигурация build

### GitHub Actions
- Создан workflow `.github/workflows/deploy.yml`
- Автоматическое тестирование и развертывание
- Поддержка кэширования npm зависимостей

### Тестирование
- Создан `jest.config.js` с поддержкой TypeScript
- Добавлен `setupTests.ts` с мокировкой `window.matchMedia`

---

## 🛠 Дополнительные команды

### Форматирование и линтинг (рекомендуется добавить)
```bash
npm install --save-dev eslint prettier eslint-config-prettier
```

### Предварительные проверки перед коммитом (husky)
```bash
npm install --save-dev husky lint-staged
```

---

## 📚 Полезные ссылки
- [Vite документация](https://vitejs.dev)
- [React документация](https://react.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [shadcn/ui](https://ui.shadcn.com)
- [GitHub Pages](https://pages.github.com)
