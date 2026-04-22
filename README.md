# Итоговое задание по дисциплине «Тестирование прикладного ПО»

## Описание
В репозитории представлены:
- ручные тест-кейсы;
- баг-репорты на найденные дефекты;
- автотесты на Selenium;
- настройка GitHub Actions.

## Состав репозитория
- `manual/test-cases.md` — 5 ручных тест-кейсов
- `manual/bug-reports.md` — баг-репорты
- `autotests/` — Selenium-тесты
- `.github/workflows/selenium.yml` — CI-конфигурация GitHub Actions
- `dist/` — тестируемый сервис

## Как запустить сервис локально
```bash
cd dist
python3 -m http.server 8000

## Открыть в браузере
http://localhost:8000/?balance=30000&reserved=20001