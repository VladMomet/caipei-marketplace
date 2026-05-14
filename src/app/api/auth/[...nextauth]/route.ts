/**
 * Auth.js v5 — обязательный route handler.
 * Все internal-эндпойнты (csrf, session, callbacks) живут под /api/auth/.
 */

import { handlers } from '@/lib/auth'

export const { GET, POST } = handlers
