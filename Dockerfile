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

# Открываем порт
EXPOSE 3001

# Команда для запуска (монолит: Express обслуживает API и статику React)
CMD ["npm", "run", "dev:server"]
