import { getUser } from '@netlify/identity'
import { db, profiles } from '../db/index.js'
import { HttpError } from './http.js'

export interface Owner {
  id: string
  email: string
}

/**
 * Verifies the Netlify Identity JWT sent with the request (Authorization: Bearer or nf_jwt cookie)
 * and makes sure the owner's profiles row exists. Throws 401 when there is no valid session.
 */
export async function requireOwner(): Promise<Owner> {
  const user = await getUser()
  if (!user?.id) throw new HttpError(401, 'Please log in again.')
  const email = (user.email ?? '').trim().toLowerCase()
  const meta = (user.userMetadata ?? {}) as { full_name?: unknown }
  const fullName = typeof meta.full_name === 'string' ? meta.full_name.trim() : ''
  const displayName = (fullName || user.name?.trim() || email.split('@')[0] || 'Student').slice(0, 60)
  // First login creates the profile; later calls are a no-op.
  await db
    .insert(profiles)
    .values({ ownerId: user.id, email, displayName, notifyEmail: true })
    .onConflictDoNothing({ target: profiles.ownerId })
  return { id: user.id, email }
}
