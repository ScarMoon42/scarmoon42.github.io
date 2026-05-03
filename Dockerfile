FROM node:22-alpine

WORKDIR /app

# Устанавливаем зависимости
COPY package*.json .npmrc ./
COPY prisma ./prisma
RUN npm install

# Копируем исходный код
COPY . .

# Генерируем клиент Prisma и собираем React фронтенд
RUN npm run db:generate
RUN npm run build

# Делаем entrypoint исполняемым
RUN chmod +x /app/docker-entrypoint.sh

# Открываем порт
EXPOSE 3001

# Скрипт запуска: ожидание БД → миграции → сервер
CMD ["/app/docker-entrypoint.sh"]
