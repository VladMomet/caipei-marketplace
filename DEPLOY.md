# Деплой CaiPei на Yandex Cloud (3 сайта на одной VM)

Три сайта — CaiPei Lite, CaiPei, CaiPei Prestige — запускаются на одной
виртуальной машине как 3 отдельных Next.js процесса под PM2, за реверс-прокси
Nginx. База данных одна на всех, стоит на той же VM. Один Telegram-бот с
метками сайтов в первой строке каждого уведомления.

## Итоговая архитектура

```
                         ┌──────────────────────────────────┐
                         │  Yandex Cloud VM (Ubuntu 22)     │
                         │                                  │
  caipei-lite.ru  ──┐    │  ┌────────────────────────────┐ │
   (×1.0)          ├────┼──►  Nginx :80 :443            │ │
  caipei.ru       ─┤    │  │   (SSL, revproxy by host)  │ │
   (×1.5)          │    │  └───┬────────┬───────┬───────┘ │
  caipei-premium.ru┘    │      ▼        ▼       ▼         │
   (×2.5)               │   :3000    :3001   :3002        │
                         │  PM2 lite  standard prestige    │
                         │                                 │
                         │  ┌──────────────────────────┐  │
                         │  │ PostgreSQL 16 (local)    │  │
                         │  │ localhost:5432 / caipei  │  │
                         │  └──────────────────────────┘  │
                         └──────────────────────────────────┘
                                    │
                                    ▼
                           Telegram Bot API
                        (один бот, один чат)
```

## 152-ФЗ

Yandex Cloud VM и Managed Postgres находятся в РФ. Это закрывает требование
ст. 18 ч. 5 152-ФЗ («первичное хранение ПДн на территории РФ»).

Всё равно нужно:
1. Зарегистрироваться в РКН как оператор ПДн (через Госуслуги, бесплатно, до 30 дней)
2. Актуализировать тексты `/legal/privacy`, `/legal/offer`, `/legal/terms` у юриста
3. Реквизиты в `src/lib/constants.ts → LEGAL_ENTITY` — уже заполнены ИП Оболенского

---

## Шаг 1 · Создать VM

1. Открой <https://console.cloud.yandex.ru>
2. **Compute Cloud → Виртуальные машины → Создать ВМ**
3. Настройки:
   - **Имя:** `caipei-vm`
   - **Зона доступности:** `ru-central1-a` (Москва)
   - **Образ загрузочного диска:** Ubuntu 22.04
   - **Тип диска:** SSD, **40 GB**
   - **Платформа:** Intel Ice Lake
   - **vCPU:** 2, **гарантированная доля vCPU:** 100%
   - **RAM:** 4 GB
   - **Публичный IPv4:** Автоматически
   - **SSH-ключ:** свой публичный ключ (`cat ~/.ssh/id_rsa.pub`, если нет — генерируй `ssh-keygen`)
   - **Логин:** `ubuntu`
4. **Создать ВМ**. Через 30-60 секунд появится публичный IP.

**Ориентир по цене:** ~1 800-2 200 ₽/мес.

## Шаг 2 · SSH и первичная настройка

Подключись к VM:

```bash
ssh ubuntu@ВНЕШНИЙ-IP
```

Скачай и запусти bootstrap-скрипт (создаст пользователя БД, склонирует репо,
поставит зависимости, распечатает секреты):

```bash
curl -fsSL https://raw.githubusercontent.com/VladMomet/caipei-marketplace/main/deploy/bootstrap-vm.sh | bash
```

Скрипт закончит через 5-8 минут. В конце выведет три секрета:

- `DB_PASSWORD` — пароль пользователя `caipei` в PostgreSQL
- `AUTH_SECRET` — секрет для JWT сессий
- `TELEGRAM_WEBHOOK_SECRET` — секрет для webhook

**Сохрани все три в надёжное место** (менеджер паролей).

## Шаг 3 · Создать `.env.local` для каждого инстанса

Для каждого из трёх сайтов создай файл `.env.local` в его папке.

**Для `/opt/caipei/caipei-lite/.env.local`:**

```bash
nano /opt/caipei/caipei-lite/.env.local
```

Содержимое:

```env
DATABASE_URL=postgresql://caipei:ВСТАВЬ-DB_PASSWORD@localhost:5432/caipei
AUTH_SECRET=ВСТАВЬ-AUTH_SECRET
AUTH_URL=https://caipei-lite.ru
SITE_TIER=lite
NEXT_PUBLIC_SITE_TIER=lite
TELEGRAM_BOT_TOKEN=ВСТАВЬ-ТОКЕН
TELEGRAM_MANAGER_CHAT_ID=-1003948541365
TELEGRAM_WEBHOOK_SECRET=ВСТАВЬ-TG_WEBHOOK_SECRET
NODE_ENV=production
```

Cохранить в nano: `Ctrl+O`, `Enter`, `Ctrl+X`.

**Для `/opt/caipei/caipei-standard/.env.local`:** то же самое, но:
- `AUTH_URL=https://caipei.ru`
- `SITE_TIER=standard`
- `NEXT_PUBLIC_SITE_TIER=standard`

**Для `/opt/caipei/caipei-prestige/.env.local`:**
- `AUTH_URL=https://caipei-premium.ru`
- `SITE_TIER=prestige`
- `NEXT_PUBLIC_SITE_TIER=prestige`

Все остальные поля одинаковые.

## Шаг 4 · Применить миграции БД

Один раз с любого из инстансов:

```bash
cd /opt/caipei/caipei-standard
npm run setup
```

Эта команда сделает три вещи:
- `db:push` — создаст все таблицы
- `seed:cities` — засеет 10 городов
- `seed:categories` — засеет 16 категорий
- `import:products` — импортирует ~80 SKU из `data/nap.xlsx`

Также применить миграцию 0001 (добавление колонки `site_tier`):

```bash
sudo -u postgres psql -d caipei -f /opt/caipei/caipei-standard/drizzle/0001_site_tier.sql
```

## Шаг 5 · Собрать 3 инстанса

Каждый инстанс собирается со своими env-переменными в клиентском бандле:

```bash
for tier in lite standard prestige; do
  cd /opt/caipei/caipei-$tier
  npm run build
done
```

Сборка каждого — 2-3 минуты. Итого ~10 минут.

## Шаг 6 · Запустить PM2

```bash
cd /opt/caipei/caipei-standard
pm2 start ecosystem.config.js
pm2 save
pm2 startup   # покажет команду для автостарта — скопируй и выполни
```

Проверка:

```bash
pm2 list       # должно быть 3 online процесса
pm2 logs       # смотрим логи всех
```

Проверить локально что все три отвечают:

```bash
curl http://localhost:3000  # lite
curl http://localhost:3001  # standard
curl http://localhost:3002  # prestige
```

Должен вернуться HTML с соответствующим заголовком CaiPei Lite / CaiPei / CaiPei Prestige.

## Шаг 7 · Настроить Nginx

```bash
sudo cp /opt/caipei/caipei-standard/deploy/nginx-caipei.conf /etc/nginx/sites-available/caipei
sudo ln -s /etc/nginx/sites-available/caipei /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

## Шаг 8 · Настроить DNS

Для каждого из 3 доменов у регистратора добавь A-запись:

| Домен | Тип | Значение |
|---|---|---|
| `caipei-lite.ru` | A | Внешний IP VM |
| `www.caipei-lite.ru` | A | Внешний IP VM |
| `caipei.ru` | A | Внешний IP VM |
| `www.caipei.ru` | A | Внешний IP VM |
| `caipei-premium.ru` | A | Внешний IP VM |
| `www.caipei-premium.ru` | A | Внешний IP VM |

Обновление DNS может занять 15 минут - 24 часа. Проверить готовность:

```bash
dig caipei.ru +short           # должен вернуть твой IP
dig caipei-lite.ru +short
dig caipei-premium.ru +short
```

## Шаг 9 · Получить SSL-сертификаты

Только после того, как DNS раздался на все домены:

```bash
sudo certbot --nginx -d caipei-lite.ru -d www.caipei-lite.ru
sudo certbot --nginx -d caipei.ru -d www.caipei.ru
sudo certbot --nginx -d caipei-premium.ru -d www.caipei-premium.ru
```

Certbot спросит email (для уведомлений об истечении), согласиться с условиями,
и **выбрать редирект HTTP → HTTPS: option 2 (Redirect)** для каждого.

После этого certbot автоматически:
- получит сертификаты Let's Encrypt
- допишет `listen 443 ssl; ssl_certificate ...` в `/etc/nginx/sites-enabled/caipei`
- сделает `nginx -t && systemctl reload nginx`
- добавит cron-задачу авто-обновления сертификатов каждые 90 дней

Проверка:

```bash
curl -I https://caipei.ru
# HTTP/2 200
```

## Шаг 10 · Зарегистрировать Telegram webhook

Только для основного сайта (caipei.ru), два других webhook не нужен —
уведомления они шлют исходящими запросами:

```bash
curl -F "url=https://caipei.ru/api/telegram/webhook" \
     -F "secret_token=ТВОЙ-TELEGRAM_WEBHOOK_SECRET" \
     "https://api.telegram.org/botТВОЙ-BOT_TOKEN/setWebhook"
```

Проверить:

```bash
curl "https://api.telegram.org/botТВОЙ-BOT_TOKEN/getWebhookInfo"
```

Должно быть: `"url":"https://caipei.ru/api/telegram/webhook"`, `"pending_update_count":0`.

Как работает: нажатие менеджером кнопки статуса в чате → Telegram шлёт callback
на `caipei.ru/api/telegram/webhook` → обновление статуса в БД происходит **общей**,
и все 3 сайта сразу видят новый статус (потому что БД одна).

---

## Обновление кода после первого деплоя

Когда я или ты правишь код и пушу в GitHub — на VM обновление вручную:

```bash
for tier in lite standard prestige; do
  cd /opt/caipei/caipei-$tier
  git pull
  npm ci
  npm run build
done

pm2 restart all
```

Или скрипт `deploy/update.sh` (создам отдельно, если попросишь).

---

## Мониторинг

```bash
pm2 monit           # реалтайм CPU/RAM по процессам
pm2 logs            # логи всех 3 инстансов
pm2 logs caipei-standard --lines 100   # только один
sudo systemctl status nginx
sudo systemctl status postgresql
sudo journalctl -u nginx -n 50         # логи nginx
```

Логи PM2 живут в `~/.pm2/logs/`, ротируются автоматически.

## Бэкапы

Для БД (раз в сутки cron):

```bash
sudo -u postgres pg_dump caipei | gzip > /var/backups/caipei-$(date +%F).sql.gz
```

Настроить в `sudo crontab -e`:

```
0 3 * * * sudo -u postgres pg_dump caipei | gzip > /var/backups/caipei-$(date +\%F).sql.gz
```

---

## После деплоя — чек-лист

- [ ] Все 3 домена открываются с зелёным замком (HTTPS)
- [ ] На каждом сайте видны свои цены (можно взять один товар и сверить: если базовая цена 1000 ₽, то на lite ≈ 1000, standard ≈ 1500, prestige ≈ 2500)
- [ ] В header написано «CaiPei» на standard, «CaiPei Lite» и «CaiPei Prestige» на других
- [ ] Регистрация физлица проходит на каждом сайте отдельно (куки не пересекаются)
- [ ] Тестовый заказ на CaiPei Prestige приходит в Telegram с меткой 🔴 [PRESTIGE] · CaiPei Prestige · caipei-premium.ru
- [ ] Нажатие кнопки «В работу» в Telegram обновляет статус в кабинете пользователя
- [ ] Форма подбора отправляется, приходит уведомление 🟡 с меткой сайта
- [ ] `getWebhookInfo` показывает 0 pending updates
- [ ] **Тестовый Telegram-токен заменён** на боевой через @BotFather (`/revoke`)
