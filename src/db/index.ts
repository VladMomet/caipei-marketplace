/**
 * Drizzle DB client.
 *
 * Используется во всех серверных частях приложения (API routes, server actions,
 * скрипты импорта).
 *
 * Подключение singleton-ом — глобальная переменная в dev-режиме предотвращает
 * утечку соединений при HMR.
 */

import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

const DATABASE_URL = process.env.DATABASE_URL

if (!DATABASE_URL) {
  throw new Error('DATABASE_URL is not set')
}

// В dev-режиме сохраняем клиент в globalThis, чтобы HMR не плодил коннекшены
declare global {
  // eslint-disable-next-line no-var
  var __pgClient: ReturnType<typeof postgres> | undefined
}

const client =
  globalThis.__pgClient ??
  postgres(DATABASE_URL, {
    max: 10,
    idle_timeout: 30,
    connect_timeout: 10,
  })

if (process.env.NODE_ENV !== 'production') {
  globalThis.__pgClient = client
}

export const db = drizzle(client, { schema, logger: process.env.NODE_ENV !== 'production' })

export { schema }
