#!/bin/bash
# =======================================================================
# CaiPei — первичная настройка VM в Yandex Cloud.
#
# Запуск на свежей Ubuntu 22.04 VM после SSH-подключения:
#   curl -fsSL https://raw.githubusercontent.com/VladMomet/caipei-marketplace/main/deploy/bootstrap-vm.sh | bash
#
# Или вручную скопируй в терминал VM.
#
# Что делает:
#  1. Обновляет систему
#  2. Ставит Node.js 20, PM2, Nginx, PostgreSQL 16, Certbot
#  3. Создаёт БД caipei и пользователя caipei
#  4. Создаёт папку /opt/caipei и клонирует репо в 3 подкаталога
#  5. Устанавливает зависимости и делает первую сборку
#  6. Печатает следующие шаги (env, DNS, certbot)
# =======================================================================

set -e  # Fail-fast

REPO="https://github.com/VladMomet/caipei-marketplace.git"
DB_PASSWORD=$(openssl rand -base64 24 | tr -d '/+=')
AUTH_SECRET=$(openssl rand -base64 32)
TG_WEBHOOK_SECRET=$(openssl rand -hex 24)

echo "════════════════════════════════════════════════════════════════"
echo "  Bootstrap CaiPei VM"
echo "════════════════════════════════════════════════════════════════"

# --- Пакеты системы ---
echo ""
echo "[1/6] Обновляем систему и ставим пакеты..."
sudo apt update
sudo apt install -y curl git nginx postgresql postgresql-contrib certbot python3-certbot-nginx build-essential

# --- Node.js 20 через NodeSource ---
if ! command -v node &> /dev/null; then
  echo ""
  echo "[2/6] Ставим Node.js 20..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt install -y nodejs
else
  echo ""
  echo "[2/6] Node.js уже установлен: $(node --version)"
fi

# --- PM2 глобально ---
if ! command -v pm2 &> /dev/null; then
  echo ""
  echo "[3/6] Ставим PM2..."
  sudo npm install -g pm2
else
  echo ""
  echo "[3/6] PM2 уже установлен: $(pm2 --version)"
fi

# --- PostgreSQL: создаём БД и пользователя ---
echo ""
echo "[4/6] Настраиваем PostgreSQL..."
sudo -u postgres psql -tAc "SELECT 1 FROM pg_roles WHERE rolname='caipei'" | grep -q 1 || {
  sudo -u postgres psql <<EOF
CREATE USER caipei WITH PASSWORD '$DB_PASSWORD';
CREATE DATABASE caipei OWNER caipei;
GRANT ALL PRIVILEGES ON DATABASE caipei TO caipei;
EOF
  echo "  ✓ Создан пользователь caipei и БД caipei"
  echo "  ⚠ Пароль БД: $DB_PASSWORD"
  echo "  ⚠ ЗАПИШИ его — понадобится для .env.local"
}

# --- Клонируем 3 копии репо ---
echo ""
echo "[5/6] Клонируем репо в /opt/caipei..."
sudo mkdir -p /opt/caipei
sudo chown -R $USER:$USER /opt/caipei

for tier in lite standard prestige; do
  if [ ! -d "/opt/caipei/caipei-$tier" ]; then
    git clone "$REPO" /opt/caipei/caipei-$tier
    echo "  ✓ Клонирован /opt/caipei/caipei-$tier"
  fi
done

# --- Ставим зависимости ---
echo ""
echo "[6/6] Устанавливаем npm-зависимости (может занять 2-3 минуты)..."
cd /opt/caipei/caipei-standard
npm ci --production=false

# Для остальных tier'ов ставим симлинки на node_modules и .next
# — экономим место, но каждый tier собирает свой .next при билде
for tier in lite prestige; do
  cd /opt/caipei/caipei-$tier
  if [ ! -d "node_modules" ]; then
    npm ci --production=false
  fi
done

echo ""
echo "════════════════════════════════════════════════════════════════"
echo "  ✓ Первичная настройка завершена"
echo "════════════════════════════════════════════════════════════════"
echo ""
echo "СЕКРЕТЫ (запиши в надёжное место):"
echo "  DB_PASSWORD:         $DB_PASSWORD"
echo "  AUTH_SECRET:         $AUTH_SECRET"
echo "  TELEGRAM_WEBHOOK:    $TG_WEBHOOK_SECRET"
echo ""
echo "СЛЕДУЮЩИЕ ШАГИ (см. DEPLOY.md):"
echo ""
echo "1. Создай .env.local в каждом /opt/caipei/caipei-<tier>/ с этими значениями."
echo "   Пример для caipei-standard:"
echo ""
echo "   DATABASE_URL=postgresql://caipei:$DB_PASSWORD@localhost:5432/caipei"
echo "   AUTH_SECRET=$AUTH_SECRET"
echo "   AUTH_URL=https://caipei.ru"
echo "   SITE_TIER=standard"
echo "   NEXT_PUBLIC_SITE_TIER=standard"
echo "   TELEGRAM_BOT_TOKEN=<из BotFather>"
echo "   TELEGRAM_MANAGER_CHAT_ID=-1003948541365"
echo "   TELEGRAM_WEBHOOK_SECRET=$TG_WEBHOOK_SECRET"
echo ""
echo "2. Применить миграции БД:"
echo "   cd /opt/caipei/caipei-standard && npm run setup"
echo ""
echo "3. Собрать все 3 инстанса:"
echo "   for tier in lite standard prestige; do"
echo "     cd /opt/caipei/caipei-\$tier && npm run build"
echo "   done"
echo ""
echo "4. Запустить PM2:"
echo "   pm2 start /opt/caipei/caipei-standard/ecosystem.config.js"
echo "   pm2 save && pm2 startup"
echo ""
echo "5. Установить Nginx конфиг:"
echo "   sudo cp /opt/caipei/caipei-standard/deploy/nginx-caipei.conf /etc/nginx/sites-available/caipei"
echo "   sudo ln -s /etc/nginx/sites-available/caipei /etc/nginx/sites-enabled/"
echo "   sudo rm /etc/nginx/sites-enabled/default"
echo "   sudo nginx -t && sudo systemctl reload nginx"
echo ""
echo "6. Настроить DNS каждого домена: A-запись на IP этой VM"
echo ""
echo "7. Получить SSL (после DNS):"
echo "   sudo certbot --nginx -d caipei.ru -d www.caipei.ru"
echo "   sudo certbot --nginx -d caipei-lite.ru -d www.caipei-lite.ru"
echo "   sudo certbot --nginx -d caipei-premium.ru -d www.caipei-premium.ru"
