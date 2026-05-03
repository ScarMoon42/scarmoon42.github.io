import { defineConfig } from "prisma/config";

const databaseUrl = process.env["DATABASE_URL"];
if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL is not set. " +
    "Make sure to pass it via docker-compose environment or docker run -e DATABASE_URL=..."
  );
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "node ./prisma/seed.ts",
  },
  datasource: {
    url: databaseUrl,
  },
});