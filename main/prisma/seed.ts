/**
 * Seed intentionally does nothing.
 *
 * Пользователи создаются в Keycloak (см. файлы в `infra/keycloak/`),
 * а профиль в PostgreSQL создаётся автоматически при первом запросе `GET /auth/me`.
 */

console.log('Seed: skipped (Keycloak manages users; DB profile is auto-provisioned on /auth/me).');
