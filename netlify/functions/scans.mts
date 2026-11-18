import type { Config } from '@netlify/functions'
import { and, eq, inArray } from 'drizzle-orm'
import { db, items, scans } from '../../db/index.js'
import { requireOwner } from '../../server/auth.js'
import { fail, handle, noContent, segments, UUID_RE } from '../../server/http.js'

// DELETE /api/scans/:id
export default handle(async (req) => {
  const owner = await requireOwner()
  if (req.method !== 'DELETE') return fail(405, 'Method not allowed.')
  const [id, ...rest] = segments(req, '/api/scans')
  if (!id || rest.length || !UUID_RE.test(id)) return fail(404, 'We couldn’t find that scan.')
  const ownedItemIds = db.select({ id: items.id }).from(items).where(eq(items.ownerId, owner.id))
  const deleted = await db
    .delete(scans)
    .where(and(eq(scans.id, id), inArray(scans.itemId, ownedItemIds)))
    .returning({ id: scans.id })
  return deleted.length ? noContent() : fail(404, 'We couldn’t find that scan.')
})

export const config: Config = { path: '/api/scans/*' }
