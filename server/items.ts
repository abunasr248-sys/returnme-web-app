import { and, desc, eq, sql } from 'drizzle-orm'
import { db, items, scans } from '../db/index.js'
import { HttpError, UUID_RE } from './http.js'
import { iso, toItem } from './mappers.js'

export const CATEGORY_VALUES = ['bag', 'laptop', 'keys', 'bottle', 'idcard', 'phone', 'other'] as const
const NOT_FOUND = 'We couldn’t find that item.'

/** Loads an item only if it belongs to the owner; otherwise 404 (never reveals other owners' items). */
export async function ownedItem(ownerId: string, id: string) {
  if (!UUID_RE.test(id)) throw new HttpError(404, NOT_FOUND)
  const [row] = await db.select().from(items).where(and(eq(items.id, id), eq(items.ownerId, ownerId))).limit(1)
  if (!row) throw new HttpError(404, NOT_FOUND)
  return row
}

const metaCols = {
  item: items,
  last: sql<string | null>`max(${scans.scannedAt})`,
  unread: sql<number>`(count(${scans.id}) filter (where ${scans.read} = false))::int`,
}

export async function itemsWithMeta(ownerId: string, id?: string) {
  const where = id ? and(eq(items.ownerId, ownerId), eq(items.id, id)) : eq(items.ownerId, ownerId)
  const rows = await db
    .select(metaCols)
    .from(items)
    .leftJoin(scans, eq(scans.itemId, items.id))
    .where(where)
    .groupBy(items.id)
    .orderBy(desc(items.createdAt))
  return rows.map((r) => ({ ...toItem(r.item), last_scanned_at: iso(r.last), unread_count: Number(r.unread) || 0 }))
}

export interface CleanItemInput {
  name: string
  category: string
  finderNote: string
  dropoffInstructions: string
}

export function validateItemInput(body: Record<string, unknown>): CleanItemInput {
  const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '')
  const name = str(body.name)
  if (!name) throw new HttpError(400, 'Give your item a name, like “Blue Backpack”.')
  if (name.length > 60) throw new HttpError(400, 'Keep the name under 60 characters.')
  const category = str(body.category)
  if (!(CATEGORY_VALUES as readonly string[]).includes(category)) throw new HttpError(400, 'Pick a category for your item.')
  const finderNote = str(body.finder_note)
  const dropoffInstructions = str(body.dropoff_instructions)
  if (finderNote.length > 500) throw new HttpError(400, 'Keep the note for finders under 500 characters.')
  if (dropoffInstructions.length > 500) throw new HttpError(400, 'Keep the drop-off instructions under 500 characters.')
  return { name, category, finderNote, dropoffInstructions }
}
