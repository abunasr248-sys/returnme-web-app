import type { Config } from '@netlify/functions'
import { and, desc, eq, inArray } from 'drizzle-orm'
import { db, items, scans } from '../../db/index.js'
import { requireOwner } from '../../server/auth.js'
import { fail, handle, json, noContent, segments, UUID_RE } from '../../server/http.js'
import { toScan } from '../../server/mappers.js'

export default handle(async (req) => {
  const owner = await requireOwner()
  const [first, second, ...rest] = segments(req, '/api/alerts')
  const ownedItemIds = db.select({ id: items.id }).from(items).where(eq(items.ownerId, owner.id))

  // GET /api/alerts
  if (!first) {
    if (req.method !== 'GET') return fail(405, 'Method not allowed.')
    const rows = await db
      .select({ scan: scans, itemName: items.name, itemCategory: items.category })
      .from(scans)
      .innerJoin(items, eq(items.id, scans.itemId))
      .where(eq(items.ownerId, owner.id))
      .orderBy(desc(scans.scannedAt))
      .limit(200)
    return json(rows.map((r) => ({ ...toScan(r.scan), item_name: r.itemName, item_category: r.itemCategory })))
  }

  if (req.method !== 'POST' || rest.length) return fail(405, 'Method not allowed.')

  // POST /api/alerts/read-all
  if (first === 'read-all' && !second) {
    await db.update(scans).set({ read: true }).where(and(eq(scans.read, false), inArray(scans.itemId, ownedItemIds)))
    return noContent()
  }

  // POST /api/alerts/:id/read
  if (second === 'read' && UUID_RE.test(first)) {
    const updated = await db
      .update(scans)
      .set({ read: true })
      .where(and(eq(scans.id, first), inArray(scans.itemId, ownedItemIds)))
      .returning({ id: scans.id })
    return updated.length ? noContent() : fail(404, 'We couldn’t find that alert.')
  }

  return fail(404, 'Not found.')
})

export const config: Config = { path: ['/api/alerts', '/api/alerts/*'] }
