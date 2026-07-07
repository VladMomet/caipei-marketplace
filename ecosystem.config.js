/**
 * PM2 ecosystem — 3 инстанса CaiPei на одной VM.
 *
 * Разворачиваем через:
 *   pm2 start ecosystem.config.js
 *
 * Каждый инстанс — свой порт (3000/3001/3002), Nginx делает
 * реверс-прокси с публичного 443 (HTTPS) на нужный порт по имени хоста.
 *
 * Все три процесса делят одну БД (localhost:5432/caipei) и один
 * Telegram-бот. Отличаются только SITE_TIER, NEXT_PUBLIC_SITE_TIER,
 * AUTH_URL и портом.
 */

module.exports = {
  apps: [
    {
      name: 'caipei-lite',
      cwd: '/opt/caipei/caipei-lite',
      script: 'node_modules/.bin/next',
      args: 'start -p 3000',
      max_memory_restart: '600M',
      env: {
        NODE_ENV: 'production',
        SITE_TIER: 'lite',
        NEXT_PUBLIC_SITE_TIER: 'lite',
        AUTH_URL: 'https://caipei-lite.ru',
        PORT: '3000',
      },
    },
    {
      name: 'caipei-standard',
      cwd: '/opt/caipei/caipei-standard',
      script: 'node_modules/.bin/next',
      args: 'start -p 3001',
      max_memory_restart: '600M',
      env: {
        NODE_ENV: 'production',
        SITE_TIER: 'standard',
        NEXT_PUBLIC_SITE_TIER: 'standard',
        AUTH_URL: 'https://caipei.ru',
        PORT: '3001',
      },
    },
    {
      name: 'caipei-prestige',
      cwd: '/opt/caipei/caipei-prestige',
      script: 'node_modules/.bin/next',
      args: 'start -p 3002',
      max_memory_restart: '600M',
      env: {
        NODE_ENV: 'production',
        SITE_TIER: 'prestige',
        NEXT_PUBLIC_SITE_TIER: 'prestige',
        AUTH_URL: 'https://caipei-premium.ru',
        PORT: '3002',
      },
    },
  ],
}
