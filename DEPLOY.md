# Деплой CaiPei на Vercel + Neon

## Архитектура продакшена

- **Фронтенд + serverless API** — Vercel (регион `arn1` Стокгольм, ближе всего к RU-аудитории)
- **PostgreSQL** — Neon (регион `eu-central-1` Frankfurt)
- **Хранилище фото товаров** — `cbu*.alicdn.com` через `/api/img-proxy` (Vercel edge cache)
- **Фото-референсы из заявок на подбор** — прямо в Telegram, без промежуточного S3
- **Уведомления и управление заказами** — единый Telegram-чат менеджеров

## 152-ФЗ — внимание

Neon и Vercel хранят данные за пределами РФ (Германия / глобально). Для буквального
соответствия 152-ФЗ ст. 18 ч. 5 («первичное хранение ПДн на территории РФ») вам нужно
**до публичного запуска** одно из двух:

1. **Мигрировать БД** на российского провайдера (Selectel Managed Postgres, Yandex Cloud, etc.).
   Код переезжает без изменений — это только смена `DATABASE_URL`.
2. **Юридически оформить трансграничную передачу** — отдельная форма согласия пользователя
   при регистрации, уведомление РКН по форме приложения 1 к Приказу № 274.
   Уточните у юриста.

Для тестового / закрытого бета-запуска внутри ограниченной группы — текущая конфигурация
работает, но это не «продакшн для публичного use» в смысле 152-ФЗ. Эту задачу
закройте до перехода к публичному маркетингу.

---

## Шаг 1. Поднять Neon Postgres

1. Регистрация: <https://neon.tech>
2. Create Project → выбрать регион **AWS eu-central-1 (Frankfurt)**.
3. После создания → в Dashboard скопировать connection string из блока
   «Connection Details». Формат:
   ```
   postgresql://USER:PASS@ep-xxx-xxx.eu-central-1.aws.neon.tech/neondb?sslmode=require
   ```
4. Желательно переименовать БД с `neondb` на `caipei` (через Neon UI → Branches).

## Шаг 2. Залить проект на GitHub

```bash
cd caipei-marketplace
git init
git add -A
git commit -m "init: CaiPei MVP"
git branch -M main
# создать пустой репо в GitHub, потом:
git remote add origin git@github.com:your-org/caipei-marketplace.git
git push -u origin main
```

## Шаг 3. Vercel deploy

1. <https://vercel.com> → Add New → Import Git Repository → выбрать репо.
2. Framework Preset: **Next.js** (определится автоматически).
3. **Environment Variables** — добавить все переменные:

   | Имя | Значение |
   |---|---|
   | `DATABASE_URL` | connection string из Neon |
   | `AUTH_SECRET` | `openssl rand -base64 32` |
   | `AUTH_URL` | `https://caipei.ru` (или ваш vercel.app домен на время) |
   | `TELEGRAM_BOT_TOKEN` | токен из @BotFather |
   | `TELEGRAM_MANAGER_CHAT_ID` | id группы менеджеров (с минусом) |
   | `TELEGRAM_WEBHOOK_SECRET` | `openssl rand -hex 24` |

4. Deploy.

Vercel прицепит проект к коммитам — каждый push в `main` будет автоматически деплоиться.

## Шаг 4. Инициализировать БД (один раз)

С локальной машины, указав `DATABASE_URL` от Neon в `.env.local`:

```bash
cp .env.example .env.local
# отредактировать DATABASE_URL и другие
npm install
npm run db:push          # создать таблицы из drizzle-схемы
npm run seed:cities      # 10 городов России
npm run seed:categories  # 16 категорий украшений
npm run import:products  # импорт SKU из data/nap.xlsx
```

Или одной командой:

```bash
npm run setup
```

Проверить, что данные в Neon:

```bash
npm run db:studio
```

## Шаг 5. Зарегистрировать Telegram webhook

После того как Vercel дал вам URL продакшена (`https://caipei.vercel.app` или ваш
собственный домен), один раз:

```bash
curl -F "url=https://caipei.vercel.app/api/telegram/webhook" \
     -F "secret_token=$TELEGRAM_WEBHOOK_SECRET" \
     "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/setWebhook"
```

Проверить:

```bash
curl "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/getWebhookInfo"
```

Должно быть: `"url":"https://.../api/telegram/webhook"`, `"pending_update_count":0`.

## Шаг 6. Подключить домен

В Vercel → Settings → Domains → добавить `caipei.ru`. Vercel покажет нужные DNS-записи
(обычно один A на `76.76.21.21` или CNAME на `cname.vercel-dns.com`). Прописать в
DNS-зоне регистратора. SSL Let's Encrypt подключится автоматически.

После смены домена **перерегистрировать webhook** с новым URL.

---

## Подготовка к 152-ФЗ (до публичного запуска)

1. **Зарегистрироваться в Роскомнадзоре как оператор ПДн.**
   Заявление подаётся бесплатно через Госуслуги.
   Срок рассмотрения — до 30 дней.
   Без регистрации обработка ПДн на сайте — нарушение.

2. **Назначить ответственного за обработку ПДн** приказом
   (это может быть сам владелец ИП/ООО).

3. **Утвердить локальные акты**: положение об обработке ПДн,
   список лиц с доступом к ПДн, журнал учёта обращений субъектов ПДн.

4. **Подменить плейсхолдеры** в `src/lib/constants.ts → LEGAL_ENTITY`
   на реальные реквизиты вашего юр.лица.

5. **Проверить тексты** в `src/app/legal/{privacy,offer,terms}/page.tsx`
   с юристом.

6. **Решить вопрос с расположением БД** (см. блок «152-ФЗ — внимание»
   в начале документа).

---

## После деплоя — что проверить

- [ ] Открывается главная, видны товары и категории
- [ ] Каталог фильтруется по категориям и материалу
- [ ] Карточка товара показывает оба тарифа цены (от 10 / от 2000)
- [ ] Добавление в корзину работает с правильным шагом (±10)
- [ ] Регистрация физлица проходит, в БД появляются записи в `users` + `consents`
- [ ] Регистрация юрлица сохраняет данные в `companies`
- [ ] Оформление заказа → менеджер получает 🟢 уведомление в Telegram-чате
- [ ] Нажатие кнопки «В работу» → статус в БД меняется + сообщение редактируется
- [ ] Форма подбора → менеджер получает 🟡 уведомление + фото-референсы
- [ ] Личный кабинет показывает заказы и заявки, статус обновляется
- [ ] Сайт открывается по `https://caipei.ru` (HTTPS включён)
- [ ] `getWebhookInfo` возвращает 0 pending updates
- [ ] **Тестовый Telegram-токен заменён** на боевой через @BotFather

---

## Полезные команды

```bash
# Локальный prod-build для проверки
npm run build && npm run start

# Drizzle Studio с прод-БД (осторожно — это прод-данные)
DATABASE_URL=$PROD_DB_URL npm run db:studio

# Переимпортировать каталог после обновления nap.xlsx
npm run import:products

# Удалить webhook (отключить кнопки в TG)
curl "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/deleteWebhook"
```
