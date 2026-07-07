#!/bin/bash
# =======================================================================
# CaiPei — Обновление всех 3 инстансов из GitHub.
#
# Запуск:
#   bash /opt/caipei/caipei-standard/deploy/update.sh
#
# Что делает:
#   1. Для каждого tier: git pull → npm ci → npm run build
#   2. Перезапускает все 3 PM2-процесса
#
# Если что-то пошло не так — PM2 не рестартанёт с несобранной сборкой
# (Next.js упадёт при старте, увидишь в pm2 logs).
# =======================================================================

set -e

echo "════════════════════════════════════════════════════════"
echo "  CaiPei update — pull, build, restart"
echo "════════════════════════════════════════════════════════"

for tier in lite standard prestige; do
  echo ""
  echo "── caipei-$tier ──"
  cd /opt/caipei/caipei-$tier
  git pull
  npm ci --production=false
  npm run build
done

echo ""
echo "── Restart PM2 ──"
pm2 restart all
pm2 save

echo ""
echo "✓ Обновление завершено"
pm2 list
