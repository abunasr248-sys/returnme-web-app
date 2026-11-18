import type { Config } from '@netlify/functions'
import { db, items, scans } from '../../db/index.js'
import { sampleItems } from '../../src/lib/fixtures.js'
import { requireOwner } from '../../server/auth.js'
import { fail, handle, noContent } from '../../server/http.js'
import { withFreshCodes } from '../../server/tokens.js'

// POST /api/demo/sample-items: adds the three sample items (with a few past scans) to the owner's account.
export default handle(async (req) => {
  if (req.method !== 'POST') return fail(405, 'Method not allowed.')
  const owner = await requireOwner()
  const now = Date.now()
  for (const [idx, s] of sampleItems.entries()) {
    const item = await withFreshCodes(async ({ token, shortCode }) => {
      const [r] = await db
        .insert(items)
        .values({
          ownerId: owner.id,
          name: s.name,
          category: s.category,
          finderNote: s.finder_note,
          dropoffInstructions: s.dropoff_instructions,
          token,
          shortCode,
          status: s.status,
          createdAt: new Date(now - (idx + 1) * 86400_000 * 4),
        })
        .returning({ id: items.id })
      return r
    })
    if (s.scans.length)
      await db.insert(scans).values(
        s.scans.map((sc) => ({
          itemId: item.id,
          scannedAt: new Date(now - sc.minutesAgo * 60_000),
          finderMessage: sc.finder_message,
          finderName: sc.finder_name,
          finderContact: sc.finder_contact,
          lat: sc.lat,
          lng: sc.lng,
          accuracy: sc.accuracy,
          read: sc.read,
        })),
      )
  }
  return noContent()
})

export const config: Config = { path: '/api/demo/sample-items' }
