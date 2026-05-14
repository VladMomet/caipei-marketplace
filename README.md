# CaiPei · 采配

> B2B-маркетплейс украшений и аксессуаров из Китая.
> Прозрачная цена сразу с доставкой, ВЭД и документами.

УТП — клиент видит итоговую стоимость с доставкой до его города в момент
просмотра карточки. Без «плюс растаможка», без «плюс посредник», без
неприятностей в момент закупки.

## Стек

- **Next.js 15** (App Router, RSC, Server Actions через API routes)
- **PostgreSQL** + **Drizzle ORM** (миграции и query API)
- **Auth.js v5** — JWT в http-only cookie, Credentials provider (телефон + пароль)
- **Tailwind 3** — собственная палитра + Google Fonts (Fraunces / Cormorant Garamond / Manrope / JetBrains Mono)
- **Telegram Bot API** — уведомления и управление статусами заказов через единый чат менеджеров
- **TypeScript**, **Zod** валидация на API

**Деплой**: Vercel (frontend + serverless API) + Neon (managed Postgres, Frankfurt).
Подробности в [`DEPLOY.md`](./DEPLOY.md).

Тонкости:

- Фото товаров проксируются через `/api/img-proxy` (edge runtime) — закрывает hotlink alicdn, кешируется на 7 дней клиент / 30 дней CDN.
- Фото-референсы из формы подбора уходят **прямо в Telegram** через multipart (без промежуточного S3).
- Город доставки умножает цену через `lib/city-pricing.ts` — сибирские города дешевле Москвы, юг России дороже (товар въезжает с Дальнего Востока).
- Тариф цены двухступенчатый: до `volumeThresholdQty` шт (2000) — базовая, от 2000 — опт (-40%).

## Быстрый старт

### 1. Установить зависимости

```bash
npm install
```

### 2. Подготовить `.env.local`

```bash
cp .env.example .env.local
```

Заполните:

- `DATABASE_URL` — строка подключения к Postgres
- `AUTH_SECRET` — `openssl rand -base64 32`
- `AUTH_URL` — обычно `http://localhost:3000`
- `TELEGRAM_BOT_TOKEN` — токен бота от [@BotFather](https://t.me/BotFather)
- `TELEGRAM_MANAGER_CHAT_ID` — ID группового чата менеджеров (с минусом, например `-1001234567890`)
- `TELEGRAM_WEBHOOK_SECRET` — `openssl rand -hex 24` (для проверки подписи webhook)

### 3. Развернуть БД + категории + товары

```bash
npm run db:push          # создаёт таблицы из drizzle-схемы
npm run seed:cities      # 10 городов России со сроками доставки и склонениями
npm run seed:categories  # 16 категорий украшений/аксессуаров
npm run import:products  # импорт 80 SKU из data/nap.xlsx
```

Или одной командой:

```bash
npm run setup
```

### 4. Запустить dev-сервер

```bash
npm run dev
```

Открыть [http://localhost:3000](http://localhost:3000).

## Telegram-бот

После деплоя зарегистрируйте webhook (один раз):

```bash
curl -F "url=https://caipei.ru/api/telegram/webhook" \
     -F "secret_token=$TELEGRAM_WEBHOOK_SECRET" \
     "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/setWebhook"
```

После этого:

- Новый заказ → 🟢 сообщение в чате с инлайн-кнопками: ▶️ В работу / ✅ Завершён / ✖️ Отменить.
- Новая заявка на подбор → 🟡 сообщение + до 3 фото-референсов + те же кнопки.
- Нажатие кнопки обновляет статус в БД и редактирует сообщение, дописывая «✓ <статус> — @manager · 14.05 17:30». Кнопки убираются.

## Структура

```
src/
├── app/                   # Next.js App Router
│   ├── api/               # API endpoints
│   │   ├── auth/          # NextAuth, register, me
│   │   ├── orders/        # POST/GET заказы
│   │   ├── products/      # каталог + детальная
│   │   ├── sourcing-requests/  # заявки на подбор (multipart с фото)
│   │   ├── telegram/webhook/   # callback от Telegram
│   │   ├── cities/, categories/, img-proxy/
│   ├── catalog/           # SSR-каталог с фильтрами и пагинацией
│   ├── product/[sku]/     # детальная карточка
│   ├── checkout/          # оформление заказа
│   ├── account/           # личный кабинет + список заказов
│   ├── sourcing/          # форма персонального подбора
│   ├── legal/             # privacy / offer / terms (152-ФЗ)
│   ├── login/, about/
│   ├── layout.tsx, page.tsx, globals.css
├── components/
│   ├── sections/          # hero / metrics / manifesto / categories / sourcing-section
│   ├── header/, footer.tsx, cart/, ui/
│   ├── cookie-banner.tsx
├── db/
│   ├── schema.ts          # Drizzle schemas — единый источник правды
│   ├── index.ts
├── hooks/
│   ├── use-cart.ts        # localStorage с tier-aware ценами
│   ├── use-city.ts        # выбранный город + custom event
├── lib/
│   ├── auth.ts            # NextAuth config
│   ├── constants.ts       # MOQ, VOLUME_THRESHOLD, LEGAL_ENTITY, BRAND
│   ├── pricing.ts         # tier-aware unit-price + breakdown
│   ├── city-pricing.ts    # модификаторы по slug города
│   ├── telegram.ts        # notify + inline keyboards + edit/answer
│   ├── validation.ts      # zod schemas для всех API
│   ├── utils.ts           # формат, плюрализация, slug, маски
│   ├── queries/
│   │   ├── catalog.ts     # queryCatalog для каталога
│   │   ├── product.ts     # getProductDetail для карточки
scripts/
├── seed-cities.ts
├── seed-categories.ts
├── import-products.ts     # ExcelJS → Postgres (мердж по SKU)
data/
└── nap.xlsx               # исходник каталога
```

## Конвенции

- **Цены** в БД — `numeric(12,2)` строкой; в UI приводим через `Number()`.
- **SKU** клиента = `offerId` в БД (мы заимствовали с источника).
- **Номера заказов** генерируются как `CP-<6 цифр>`, заявок — `PICK-<6 цифр>`.
- **Snapshot товара** в `order_items` сохраняет название/фото/SKU и source_url на момент заказа — заказы не плывут при изменении карточки.
- **152-ФЗ**: согласия логируются в `consents` с IP и user-agent на момент даты регистрации.
- **Образ цены**: «прозрачно с Китаем» означает что в карточке мы показываем декомпозицию (фабрика 55% / логистика 25% / ВЭД 3% / НДС 17%) — это образовательный жест, не точный расчёт.

## Команды

| Команда | Что делает |
|---|---|
| `npm run dev` | Запуск dev-сервера с турбопаком |
| `npm run build` | Продакшн-сборка |
| `npm run start` | Запуск продакшн-сборки |
| `npm run typecheck` | TypeScript check без эмита |
| `npm run lint` | ESLint |
| `npm run db:push` | Синхронизировать схему с БД (для dev) |
| `npm run db:generate` | Сгенерировать SQL-миграцию |
| `npm run db:migrate` | Применить миграции |
| `npm run db:studio` | Drizzle Studio (GUI для БД) |
| `npm run seed:cities` | Засеять города |
| `npm run seed:categories` | Засеять категории |
| `npm run import:products` | Импорт из data/nap.xlsx |
| `npm run setup` | db:push + всё засеять и импортировать |

## Что доделать перед продом

См. [`TASKS.md`](./TASKS.md).

## Деплой

См. [`DEPLOY.md`](./DEPLOY.md).
