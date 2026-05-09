# Nyx

Минималистичный десктопный клиент для общения с LLM через OpenRouter и совместимые API.

Дизайн — смесь Telegram (область чата) и Discord (сайдбар-кружочки). Тёмная тема, акцент на простоту и удобство.

## Стек

- **Tauri 2** — десктопная оболочка (~10-15 МБ, нативный фил)
- **React 18 + TypeScript + Vite**
- **Tailwind CSS v4** — стили
- **Framer Motion** — анимации
- **Zustand** — стейт
- **SQLite** через `tauri-plugin-sql` — локальное хранилище

## Фичи

- Множественные чаты с кружочками-аватарками (Discord-style)
- Стриминг ответов
- Регенерация / редактирование / удаление сообщений
- Стоп / продолжить генерацию
- Markdown с подсветкой кода
- OpenRouter как главный провайдер + любой OpenAI-совместимый endpoint
- Несколько API-ключей с переключением
- Настройки сэмплинга (temperature, top_p, max tokens, presence/frequency penalty)
- Системный промпт глобальный + per-chat override
- User Personas — несколько профилей пользователя
- Тоггл "Без цензуры" с настраиваемым permissive system prompt
- Token counter и индикатор контекста
- Авто-имя чатов
- Кастомный акцентный цвет
- Авто-fallback на резервную модель при ошибке
- Welcome-экран первого запуска

## Разработка

Требуется:
- Node.js 18+
- Rust 1.85+
- Tauri prerequisites (https://tauri.app/start/prerequisites/)

```bash
npm install
npm run tauri dev
```

## Сборка

```bash
npm run tauri build
```

Готовые установщики появятся в `src-tauri/target/release/bundle/`.

## Лицензия

MIT
