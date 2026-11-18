import type { Config } from '@netlify/functions'
import { and, desc, eq } from 'drizzle-orm'
import { db, items, scans } from '../../db/index.js'
import { CAMPUS, fakeFinders } from '../../src/lib/fixtures.js'
import { requireOwner } from '../../server/auth.js'
import { fail, handle, HttpError, json, noContent, readJson, segments } from '../../server/http.js'
import { itemsWithMeta, ownedItem, validateItemInput } from '../../server/items.js'
import { toItem, toScan } from '../../server/mappers.js'
import { withFreshCodes } from '../../server/tokens.js'

const NOT_FOUND = 'We couldn’t find that item.'

export default handle(async (req) => {
  const owner = await requireOwner()
  const [id, action, ...rest] = segments(req, '/api/items')
  if (rest.length) return fail(404, 'Not found.')
  const m = req.method

  // /api/items
  if (!id) {
    if (m === 'GET') return json(await itemsWithMeta(owner.id))
    if (m === 'POST') {
      const input = validateItemInput(await readJson(req))
      const row = await withFreshCodes(async ({ token, shortCode }) => {
        const [r] = await db.insert(items).values({ ...input, ownerId: owner.id, token, shortCode, status: 'safe' }).returning()
        return r
      })
      return json(toItem(row), 201)
    }
    return fail(405, 'Method not allowed.')
  }

  const item = await ownedItem(owner.id, id)
  const scoped = and(eq(items.id, item.id), eq(items.ownerId, owner.id))

  // /api/items/:id
  if (!action) {
    if (m === 'GET') {
      const [withMeta] = await itemsWithMeta(owner.id, item.id)
      if (!withMeta) throw new HttpError(404, NOT_FOUND)
      return json(withMeta)
    }
    if (m === 'PATCH') {
      const input = validateItemInput(await readJson(req))
      const [r] = await db.update(items).set(input).where(scoped).returning()
      return json(toItem(r))
    }
    if (m === 'DELETE') {
      await db.delete(items).where(scoped) // scans cascade
      return noContent()
    }
    return fail(405, 'Method not allowed.')
  }

  if (m !== 'POST' && !(action === 'scans' && m === 'GET')) return fail(405, 'Method not allowed.')

  switch (action) {
    case 'status': {
      const { status } = await readJson(req)
      if (status !== 'safe' && status !== 'lost') throw new HttpError(400, 'Status must be Safe or Lost.')
      const [r] = await db.update(items).set({ status }).where(scoped).returning()
      return json(toItem(r))
    }
    case 'regenerate': {
      const r = await withFreshCodes(async ({ token, shortCode }) => {
        const [u] = await db.update(items).set({ token, shortCode }).where(scoped).returning()
        return u
      })
      return json(toItem(r))
    }
    case 'mute': {
      const { hours } = await readJson(req)
      if (hours != null && (typeof hours !== 'number' || !(hours > 0) || hours > 24 * 30))
        throw new HttpError(400, 'Choose how long to mute alerts.')
      const mutedUntil = hours ? new Date(Date.now() + hours * 3600_000) : null
      const [r] = await db.update(items).set({ mutedUntil }).where(scoped).returning()
      return json(toItem(r))
    }
    case 'scans': {
      const rows = await db.select().from(scans).where(eq(scans.itemId, item.id)).orderBy(desc(scans.scannedAt))
      return json(rows.map(toScan))
    }
    case 'simulate-scan': {
      const f = fakeFinders[Math.floor(Math.random() * fakeFinders.length)]
      const share = Math.random() > 0.35
      const [s] = await db
        .insert(scans)
        .values({
          itemId: item.id,
          finderMessage: f.finder_message,
          finderName: f.finder_name,
          finderContact: f.finder_contact,
          lat: share ? CAMPUS.lat + (Math.random() - 0.5) * 0.002 : null,
          lng: share ? CAMPUS.lng + (Math.random() - 0.5) * 0.002 : null,
          accuracy: share ? Math.round(10 + Math.random() * 40) : null,
          read: false,
        })
        .returning()
      return json(toScan(s), 201)
    }
  }
  return fail(404, 'Not found.')
})

export const config: Config = { path: ['/api/items', '/api/items/*'] }
