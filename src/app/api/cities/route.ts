/**
 * GET /api/cities — список городов доставки.
 */

import { NextResponse } from 'next/server'
import { asc } from 'drizzle-orm'
import { db } from '@/db'
import { cities } from '@/db/schema'

export async function GET() {
  const list = await db.select().from(cities).orderBy(asc(cities.sortOrder))
  return NextResponse.json(list)
}
