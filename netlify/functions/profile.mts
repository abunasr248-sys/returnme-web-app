import type { Config } from '@netlify/functions'
import { eq } from 'drizzle-orm'
import { db, profiles } from '../../db/index.js'
import { requireOwner } from '../../server/auth.js'
import { fail, handle, HttpError, json, readJson } from '../../server/http.js'
import { toProfile } from '../../server/mappers.js'

export default handle(async (req) => {
  const owner = await requireOwner()

  if (req.method === 'GET') {
    const [p] = await db.select().from(profiles).where(eq(profiles.ownerId, owner.id)).limit(1)
    return json(toProfile(p))
  }

  if (req.method === 'PATCH') {
    const body = await readJson(req)
    const patch: Partial<typeof profiles.$inferInsert> = {}
    if (body.display_name !== undefined) {
      const name = typeof body.display_name === 'string' ? body.display_name.trim() : ''
      if (!name) throw new HttpError(400, 'Display name can’t be empty.')
      if (name.length > 60) throw new HttpError(400, 'Keep your name under 60 characters.')
      patch.displayName = name
    }
    if (body.notify_email !== undefined) {
      if (typeof body.notify_email !== 'boolean') throw new HttpError(400, 'The request could not be read.')
      patch.notifyEmail = body.notify_email
    }
    const [p] = Object.keys(patch).length
      ? await db.update(profiles).set(patch).where(eq(profiles.ownerId, owner.id)).returning()
      : await db.select().from(profiles).where(eq(profiles.ownerId, owner.id)).limit(1)
    return json(toProfile(p))
  }

  return fail(405, 'Method not allowed.')
})

export const config: Config = { path: '/api/profile' }
