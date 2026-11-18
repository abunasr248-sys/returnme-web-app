import type { items, profiles, scans } from '../db/schema.js'

type ItemRow = typeof items.$inferSelect
type ScanRow = typeof scans.$inferSelect
type ProfileRow = typeof profiles.$inferSelect

const iso = (d: Date | string | null) => (d == null ? null : new Date(d).toISOString())

export const toProfile = (p: ProfileRow) => ({
  owner_id: p.ownerId,
  email: p.email,
  display_name: p.displayName,
  notify_email: p.notifyEmail,
})

export const toItem = (i: ItemRow) => ({
  id: i.id,
  owner_id: i.ownerId,
  name: i.name,
  category: i.category,
  finder_note: i.finderNote,
  dropoff_instructions: i.dropoffInstructions,
  token: i.token,
  short_code: i.shortCode,
  status: i.status,
  muted_until: iso(i.mutedUntil),
  created_at: iso(i.createdAt)!,
})

/** Owner-facing scan. The IP hash never leaves the server. */
export const toScan = (s: ScanRow) => ({
  id: s.id,
  item_id: s.itemId,
  scanned_at: iso(s.scannedAt)!,
  finder_message: s.finderMessage,
  finder_name: s.finderName,
  finder_contact: s.finderContact,
  lat: s.lat,
  lng: s.lng,
  accuracy: s.accuracy,
  read: s.read,
})

export { iso }
