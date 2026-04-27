# Публикация в GitHub Packages

## Как работает CI/CD pipeline

Создан GitHub Actions workflow, который **автоматически собирает и публикует Docker образ** в GitHub Container Registry (GHCR).

### Когда происходит сборка

✅ При push в ветку `main`  
✅ При создании тега версии (`v*`)  
✅ При pull request (только сборка, без публикации)

### Тегирование образов

Образ получит следующие теги в зависимости от события:

| Событие | Результирующие теги |
|---------|-------------------|
| Push в main | `main`, `latest`, `sha-xxxxx` |
| Создание тага `v1.2.3` | `v1.2.3`, `1.2`, `1`, `latest`, `sha-xxxxx` |
| Pull Request | `main-sha-xxxxx` (не публикуется) |

## Как использовать

### 1. Первый push (настройка GitHub Actions)

```bash
git add .github/workflows/publish-docker.yml
git commit -m "Add Docker publish workflow"
git push origin main
```

### 2. Использование образа локально

```bash
# Скачать образ
docker pull ghcr.io/YOUR_USERNAME/scarmoon42.github.io:latest

# Запустить контейнер
docker run -p 3001:3001 ghcr.io/YOUR_USERNAME/scarmoon42.github.io:latest
```

### 3. Создание версии с тегом

```bash
# Создать тег версии
git tag v1.0.0
git push origin v1.0.0

# GitHub Actions автоматически соберет и опубликует образ
```

## Где найти опубликованные образы

1. Перейдите в репозиторий на GitHub
2. Нажмите **Packages** в правом меню
3. Найдите пакет `scarmoon42.github.io` с типом `Container`

## Проверка workflow

1. В GitHub репозитории перейдите на вкладку **Actions**
2. Найдите workflow `Publish Docker Image`
3. Смотрите логи сборки и публикации

## Требования

✅ Repository имеет доступ к GitHub Actions (обычно включено)  
✅ `GITHUB_TOKEN` автоматически создается GitHub  
✅ Нужны права `packages: write` (добавлены в workflow)

## Проблемы и решения

### Образ не публикуется
- Проверьте, что workflow находится в `.github/workflows/` в ветке `main`
- Убедитесь, что GitHub Actions включен в репозитории (Settings → Actions)

### Нужна приватная регистрация
Если образ должен быть приватным, GitHub Container Registry поддерживает приватные образы. Просто установите репозиторий как приватный.

### Нужен npm пакет вместо Docker?
Ваш проект помечен как `"private": true` в `package.json`. Если нужно публиковать npm пакет:
1. Измените `private` на `false`
2. Создайте отдельный workflow для npm публикации
3. Свяжите GitHub Packages с npm registry
