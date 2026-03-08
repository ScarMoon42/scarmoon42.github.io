# Реализация функционала: исправления Redis и добавления расширенного функционала

## Выполненные задачи

### 1. ✅ Исправление ошибки Redis подключения (ECONNRESET)

**Проблема:** Redis соединение разрывалось и не восстанавливалось автоматически, вызывая ошибки при работе приложения.

**Решение:** Обновлен файл [server/lib/redis.ts](server/lib/redis.ts):
- Добавлена отслеживание состояния подключения (`isConnected` флаг)
- Реализована автоматическая переподключение при потере соединения
- Добавлены обработчики ошибок для каждой операции
- При потере соединения клиент автоматически восстанавливается при следующем запросе
- Добавлены логи ошибок для диагностики

**Ключевые изменения:**
```typescript
- Отслеживание состояния подключения через флаг isConnected
- Error listeners для автоматического сброса при потере conexии
- Retry логика с reconnectStrategy
- Graceful fallback к null при невозможности подключиться
```

---

### 2. ✅ Добавлен функционал для просмотра экспертами назначенных открытых занятий

**Новые маршруты в [server/routes/open-classes.ts](server/routes/open-classes.ts):**

#### GET /open-classes/expert/my-classes
Получить список открытых занятий, назначенных эксперту с текущей сессией.

**Требует:** Bearer токен в заголовке Authorization
**Ограничения:** Только для пользователей с ролью содержащей "Эксперт"

**Пример запроса:**
```bash
GET /open-classes/expert/my-classes HTTP/1.1
Authorization: Bearer <token>
```

**Пример ответа:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "date": "01.03.2026",
      "time": "10:00",
      "room": "301",
      "teacher": "Иван Петров",
      "expertAssignmentId": 5
    }
  ]
}
```

#### POST /open-classes/:id/expert-result
Отправить оценку эксперта по открытому занятию.

**Требует:** Bearer токен, только для назначенных экспертов

**Пример запроса:**
```bash
POST /open-classes/1/expert-result HTTP/1.1
Authorization: Bearer <token>
Content-Type: application/json

{
  "result": {
    "rating": 5,
    "comment": "Отличное занятие",
    "answers": { ... }
  }
}
```

**Пример ответа:**
```json
{
  "success": true
}
```

---

### 3. ✅ Реализован функционал загрузки и управления GIFT форматом

#### Что такое GIFT?
GIFT (General Import Format Technology) - текстовый формат для описания тестовых вопросов, используется в Moodle и других LMS.

**Пример GIFT файла:**
```
::Вопрос о географии:: Какая столица Франции? {=Париж ~Лондон ~Берлин}
::Логический вопрос:: 2 + 2 = 5? {F}
::Вопрос с несколькими ответами:: Какие города столицы? {=Москва =Киев ~Париж}
```

#### Новые маршруты в [server/routes/files.ts](server/routes/files.ts):

##### POST /files/gift/test/upload
Загрузить тест в GIFT формате.

**Требует:** Bearer токен

**Пример запроса:**
```bash
POST /files/gift/test/upload HTTP/1.1
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Тест по математике",
  "description": "Первоначальный тест",
  "giftContent": "::Вопрос 1:: 2+2=? {=4 ~3 ~5}\n::Вопрос 2:: Столица России? {=Москва}"
}
```

**Пример ответа:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Тест по математике",
    "questionCount": 2,
    "createdAt": "2026-03-01T12:34:56.000Z"
  }
}
```

##### POST /files/gift/form/upload
Загрузить форму в GIFT формате.

**Параметры:**
- `name` (обязательный): название формы
- `description` (опциональный): описание
- `giftContent` (обязательный): содержание в GIFT формате
- `formType` (обязательный): 'student', 'expert' или 'both'

**Пример запроса:**
```bash
POST /files/gift/form/upload HTTP/1.1
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Анкета эксперта",
  "formType": "expert",
  "giftContent": "::Вопрос 1:: Оцените качество урока {T}\n::Вопрос 2:: Замечания? {=}"
}
```

##### GET /files/gift/test/:id
Получить тест в GIFT формате.

**Пример запроса:**
```bash
GET /files/gift/test/1 HTTP/1.1
Authorization: Bearer <token>
```

**Пример ответа:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Тест по математике",
    "description": "...",
    "giftContent": "::Вопрос 1:: 2+2=? {=4 ~3 ~5}",
    "parsedData": {
      "questions": [
        {
          "title": "Вопрос 1",
          "text": "2+2=?",
          "type": "multiple_choice",
          "options": [
            { "text": "4", "isCorrect": true },
            { "text": "3", "isCorrect": false },
            { "text": "5", "isCorrect": false }
          ]
        }
      ],
      "questionCount": 1,
      "parseErrors": []
    },
    "uploadedBy": 1,
    "createdAt": "2026-03-01T12:34:56.000Z"
  }
}
```

##### GET /files/gift/form/:id
Получить форму в GIFT формате.

**Аналогично** GET /files/gift/test/:id, но для форм с дополнительным полем `formType`.

##### GET /files/gift/tests
Получить список всех тестов пользователя.

**Пример ответа:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Тест по математике",
      "description": "...",
      "createdAt": "2026-03-01T12:34:56.000Z"
    }
  ]
}
```

##### GET /files/gift/forms
Получить список всех форм пользователя.

##### DELETE /files/gift/test/:id
Удалить тест.

##### DELETE /files/gift/form/:id
Удалить форму.

---

## Технические детали реализации

### Новые модели Prisma

Добавлены две новые модели в [prisma/schema.prisma](prisma/schema.prisma):

```prisma
model GiftTest {
  id           Int      @id @default(autoincrement())
  name         String
  description  String?
  giftContent  String   // исходный GIFT файл
  parsedData   String   // JSON структура с вопросами
  fileId       Int?
  uploadedBy   Int
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  user         User     @relation("UserGiftTests", fields: [uploadedBy], references: [id], onDelete: Cascade)
  
  @@index([uploadedBy])
  @@map("gift_tests")
}

model GiftForm {
  id           Int      @id @default(autoincrement())
  name         String
  description  String?
  giftContent  String   // исходный GIFT файл
  parsedData   String   // JSON структура с вопросами
  fileId       Int?
  uploadedBy   Int
  formType     String   // 'student' | 'expert' | 'both'
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  user         User     @relation("UserGiftForms", fields: [uploadedBy], references: [id], onDelete: Cascade)
  
  @@index([uploadedBy])
  @@map("gift_forms")
}
```

### GIFT Парсер

Создан новый файл [server/lib/giftParser.ts](server/lib/giftParser.ts) с полной реализацией парсера GIFT формата.

**Поддерживаемые типы вопросов:**
- Multiple choice (множественный выбор): `{~неверно =верно ~неверно}`
- True/False: `{T}` или `{F}`
- Short answer (краткий ответ): `{ответ1 =ответ2}`
- Essay (эссе): `{}`
- Numerical (числовой): поддержка через short answer
- Matching (сопоставление): базовая поддержка

**Функции парсера:**

```typescript
parseGiftContent(content: string): ParsedGiftData
// Парсит GIFT контент и возвращает структурированные вопросы

validateGiftFormat(content: string): { isValid: boolean; errors: string[] }
// Валидирует GIFT файл перед загрузкой
```

---

## База данных

Выполнена миграция Prisma:
- Создана миграция `20260301124227_add_gift_tests_and_forms`
- Созданы таблицы `gift_tests` и `gift_forms`
- Добавлены отношения в таблицу `users`

---

## Использование

### Для клиентской части (React)

1. **Загрузить тест GIFT формата:**
```typescript
const response = await fetch('/files/gift/test/upload', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    name: 'Мой тест',
    description: 'Описание',
    giftContent: '::Q1:: Test? {=Yes ~No}'
  })
});
```

2. **Получить список тестов эксперта:**
```typescript
const response = await fetch('/open-classes/expert/my-classes', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

3. **Отправить результат эксперта:**
```typescript
const response = await fetch('/open-classes/1/expert-result', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    result: { rating: 5, comment: '...' }
  })
});
```

---

## Неисправленные проблемы / Рекомендации

1. **Масштабируемость GIFT парсера:** Текущая реализация подходит для стандартных GIFT файлов, но может потребовать расширения для более сложных случаев (вложенные структуры, специальные символы).

2. **Фронтенд компоненты:** Необходимо создать компоненты React для:
   - Загрузки GIFT файлов с валидацией
   - Отображения списка назначенных занятий для эксперта
   - Заполнения анкет эксперта

3. **Хранилище файлов:** Рекомендуется рассмотреть перемещение хранилища GIFT файлов из БД в FileSystem или CloudStorage для больших объемов.

---

## Тестирование

Для тестирования новой функциональности:

```bash
# 1. Убедиться, что Redis работает
docker ps | grep redis

# 2. Запустить сервер
npm run dev

# 3. Загрузить тест GIFT
curl -X POST http://localhost:3001/files/gift/test/upload \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your_token>" \
  -d '{
    "name":"Math Test",
    "giftContent":"::Q1:: 2+2=? {=4 ~3 ~5}"
  }'

# 4. Получить список занятий эксперта
curl http://localhost:3001/open-classes/expert/my-classes \
  -H "Authorization: Bearer <your_token>"
```

---

## Файлы, которые были изменены

1. **server/lib/redis.ts** - Исправление обработки подключения
2. **server/routes/open-classes.ts** - Добавлены эндпоинты для экспертов
3. **server/routes/files.ts** - Добавлены эндпоинты для GIFT формата
4. **server/lib/giftParser.ts** - Новый файл с парсером GIFT
5. **prisma/schema.prisma** - Добавлены модели GiftTest и GiftForm
6. **prisma/migrations/20260301124227_add_gift_tests_and_forms/** - Миграция БД
