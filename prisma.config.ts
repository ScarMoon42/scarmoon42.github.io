import { defineConfig } from "prisma/config";

const databaseUrl = process.env["DATABASE_URL"];

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "node ./prisma/seed.ts",
  },
  // datasource.url нужен только для migrate/push/seed — не для generate
  ...(databaseUrl ? { datasource: { url: databaseUrl } } : {}),
});