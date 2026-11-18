/**
 * ReturnMe client API.
 *
 * PREVIEW MODE: every function below is backed by a stubbed in-browser store
 * (seeded from ./fixtures) so the whole product can be clicked through today.
 * The function signatures mirror the planned Netlify Functions endpoints
 * (see PLAN.md), so a later milestone swaps each body for a `fetch('/api/…')`
 * call with a Netlify Identity token, and nothing in the UI has to change.
 */
import { CAMPUS, fakeFinders, sampleItems, showcaseItem, showcaseOwnerName, SHOWCASE_OWNER_ID } from './fixtures'
import type { Item, ItemInput, ItemWithMeta, Profile, PublicItem, Scan, ScanInput } from './types'

const KEY = 'returnme-preview-v1'

interface Account { owner_id: string; email: string; password: string }
interface DB {
  accounts: Account[]
  profiles: Profile[]
  items: Item[]
  scans: Scan[]
  session: string | null
}

export class ApiError extends Error {
  status: number
  constructor(message: string, status = 400) {
    super(message)
    this.status = status
  }
}

function seed(): DB {
  return {
    accounts: [],
    profiles: [{ owner_id: SHOWCASE_OWNER_ID, email: 'hidden', display_name: showcaseOwnerName, notify_email: false }],
    items: [showcaseItem],
    scans: [],
    session: null,
  }
}

function load(): DB {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return JSON.parse(raw) as DB
  } catch { /* fall through */ }
  const db = seed()
  save(db)
  return db
}
function save(db: DB) { localStorage.setItem(KEY, JSON.stringify(db)) }

const wait = (ms = 220 + Math.random() * 260) => new Promise((r) => setTimeout(r, ms))

// ---------- ids & tokens ----------
const B62 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
const CODE = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // no 0/O/1/I to avoid misreads
function random(alphabet: string, len: number) {
  const bytes = crypto.getRandomValues(new Uint8Array(len))
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join('')
}
export const newToken = () => random(B62, 22)
const newShortCode = (db: DB) => {
  let c = random(CODE, 6)
  while (db.items.some((i) => i.short_code === c)) c = random(CODE, 6)
  return c
}
const uid = () => crypto.randomUUID()

// ---------- auth (Netlify Identity later) ----------
function requireOwner(db: DB) {
  if (!db.session) throw new ApiError('Please log in again.', 401)
  return db.session
}

export async function currentUser(): Promise<Profile | null> {
  const db = load()
  return db.session ? db.profiles.find((p) => p.owner_id === db.session) ?? null : null
}

export async function signUp(email: string, password: string, displayName: string) {
  await wait()
  const db = load()
  email = email.trim().toLowerCase()
  if (!/^\S+@\S+\.\S+$/.test(email)) throw new ApiError('Enter a valid email address.')
  if (password.length < 8) throw new ApiError('Use at least 8 characters for your password.')
  if (db.accounts.some((a) => a.email === email)) throw new ApiError('An account with this email already exists. Try logging in.')
  const owner_id = uid()
  db.accounts.push({ owner_id, email, password })
  db.profiles.push({ owner_id, email, display_name: displayName.trim() || email.split('@')[0], notify_email: true })
  db.session = owner_id
  save(db)
}

export async function logIn(email: string, password: string) {
  await wait()
  const db = load()
  const acc = db.accounts.find((a) => a.email === email.trim().toLowerCase())
  if (!acc || acc.password !== password) throw new ApiError('That email and password don’t match.')
  db.session = acc.owner_id
  save(db)
}

export async function logOut() {
  const db = load()
  db.session = null
  save(db)
}

// ---------- profile ----------
export async function updateProfile(patch: Partial<Pick<Profile, 'display_name' | 'notify_email'>>) {
  await wait()
  const db = load()
  const owner = requireOwner(db)
  const p = db.profiles.find((x) => x.owner_id === owner)!
  if (patch.display_name !== undefined) {
    if (!patch.display_name.trim()) throw new ApiError('Display name can’t be empty.')
    p.display_name = patch.display_name.trim()
  }
  if (patch.notify_email !== undefined) p.notify_email = patch.notify_email
  save(db)
  return p
}

// ---------- items ----------
function ownedItem(db: DB, id: string) {
  const owner = requireOwner(db)
  const item = db.items.find((i) => i.id === id && i.owner_id === owner)
  if (!item) throw new ApiError('We couldn’t find that item.', 404)
  return item
}

function withMeta(db: DB, item: Item): ItemWithMeta {
  const scans = db.scans.filter((s) => s.item_id === item.id)
  const last = scans.reduce<string | null>((m, s) => (!m || s.scanned_at > m ? s.scanned_at : m), null)
  return { ...item, last_scanned_at: last, unread_count: scans.filter((s) => !s.read).length }
}

export async function listItems(): Promise<ItemWithMeta[]> {
  await wait()
  const db = load()
  const owner = requireOwner(db)
  return db.items
    .filter((i) => i.owner_id === owner)
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .map((i) => withMeta(db, i))
}

export async function getItem(id: string): Promise<ItemWithMeta> {
  await wait()
  const db = load()
  return withMeta(db, ownedItem(db, id))
}

function validate(input: ItemInput) {
  if (!input.name.trim()) throw new ApiError('Give your item a name, like “Blue Backpack”.')
  if (input.name.length > 60) throw new ApiError('Keep the name under 60 characters.')
}

export async function createItem(input: ItemInput): Promise<Item> {
  await wait()
  validate(input)
  const db = load()
  const owner = requireOwner(db)
  const item: Item = {
    id: uid(),
    owner_id: owner,
    name: input.name.trim(),
    category: input.category,
    finder_note: input.finder_note.trim(),
    dropoff_instructions: input.dropoff_instructions.trim(),
    token: newToken(),
    short_code: newShortCode(db),
    status: 'safe',
    muted_until: null,
    created_at: new Date().toISOString(),
  }
  db.items.push(item)
  save(db)
  return item
}

export async function updateItem(id: string, input: ItemInput) {
  await wait()
  validate(input)
  const db = load()
  const item = ownedItem(db, id)
  Object.assign(item, {
    name: input.name.trim(),
    category: input.category,
    finder_note: input.finder_note.trim(),
    dropoff_instructions: input.dropoff_instructions.trim(),
  })
  save(db)
  return item
}

export async function setStatus(id: string, status: Item['status']) {
  await wait(150)
  const db = load()
  ownedItem(db, id).status = status
  save(db)
}

export async function regenerateToken(id: string) {
  await wait()
  const db = load()
  const item = ownedItem(db, id)
  item.token = newToken()
  item.short_code = newShortCode(db)
  save(db)
  return item
}

export async function muteItem(id: string, hours: number | null) {
  await wait(150)
  const db = load()
  ownedItem(db, id).muted_until = hours ? new Date(Date.now() + hours * 3600_000).toISOString() : null
  save(db)
}

export async function deleteItem(id: string) {
  await wait()
  const db = load()
  const item = ownedItem(db, id)
  db.items = db.items.filter((i) => i !== item)
  db.scans = db.scans.filter((s) => s.item_id !== id)
  save(db)
}

// ---------- scans / alerts ----------
export interface Alert extends Scan { item_name: string; item_category: Item['category'] }

export async function listAlerts(): Promise<Alert[]> {
  await wait(160)
  const db = load()
  const owner = requireOwner(db)
  const mine = new Map(db.items.filter((i) => i.owner_id === owner).map((i) => [i.id, i]))
  return db.scans
    .filter((s) => mine.has(s.item_id))
    .sort((a, b) => b.scanned_at.localeCompare(a.scanned_at))
    .map((s) => ({ ...s, item_name: mine.get(s.item_id)!.name, item_category: mine.get(s.item_id)!.category }))
}

export async function listItemScans(itemId: string): Promise<Scan[]> {
  await wait()
  const db = load()
  ownedItem(db, itemId)
  return db.scans.filter((s) => s.item_id === itemId).sort((a, b) => b.scanned_at.localeCompare(a.scanned_at))
}

export async function markRead(scanId: string) {
  const db = load()
  const owner = requireOwner(db)
  const s = db.scans.find((x) => x.id === scanId)
  if (s && db.items.some((i) => i.id === s.item_id && i.owner_id === owner)) { s.read = true; save(db) }
}

export async function markAllRead() {
  await wait(150)
  const db = load()
  const owner = requireOwner(db)
  const mine = new Set(db.items.filter((i) => i.owner_id === owner).map((i) => i.id))
  db.scans.forEach((s) => { if (mine.has(s.item_id)) s.read = true })
  save(db)
}

export async function deleteScan(scanId: string) {
  await wait(150)
  const db = load()
  const s = db.scans.find((x) => x.id === scanId)
  if (!s) return
  ownedItem(db, s.item_id)
  db.scans = db.scans.filter((x) => x.id !== scanId)
  save(db)
}

// ---------- demo helpers ----------
export async function loadSampleItems() {
  await wait(500)
  const db = load()
  const owner = requireOwner(db)
  const now = Date.now()
  sampleItems.forEach((s, idx) => {
    const item: Item = {
      id: uid(),
      owner_id: owner,
      name: s.name,
      category: s.category,
      finder_note: s.finder_note,
      dropoff_instructions: s.dropoff_instructions,
      token: newToken(),
      short_code: newShortCode(db),
      status: s.status,
      muted_until: null,
      created_at: new Date(now - (idx + 1) * 86400_000 * 4).toISOString(),
    }
    db.items.push(item)
    s.scans.forEach(({ minutesAgo, ...scan }) =>
      db.scans.push({ ...scan, id: uid(), item_id: item.id, scanned_at: new Date(now - minutesAgo * 60_000).toISOString() }),
    )
  })
  save(db)
}

export async function simulateScan(itemId: string) {
  await wait()
  const db = load()
  ownedItem(db, itemId)
  const f = fakeFinders[Math.floor(Math.random() * fakeFinders.length)]
  const shareLocation = Math.random() > 0.35
  db.scans.push({
    id: uid(),
    item_id: itemId,
    scanned_at: new Date().toISOString(),
    ...f,
    lat: shareLocation ? CAMPUS.lat + (Math.random() - 0.5) * 0.002 : null,
    lng: shareLocation ? CAMPUS.lng + (Math.random() - 0.5) * 0.002 : null,
    accuracy: shareLocation ? Math.round(10 + Math.random() * 40) : null,
    read: false,
  })
  save(db)
}

// ---------- public finder endpoints (no login) ----------
const RATE_LIMIT_PER_HOUR = 5

export async function getFound(token: string): Promise<PublicItem> {
  await wait(120)
  const db = load()
  const item = db.items.find((i) => i.token === token)
  if (!item) throw new ApiError('This QR code is not active.', 404)
  const owner = db.profiles.find((p) => p.owner_id === item.owner_id)
  // Only safe fields ever leave the server: first name, never email, phone or full name.
  return {
    name: item.name,
    category: item.category,
    owner_first_name: (owner?.display_name ?? 'a student').split(/\s+/)[0],
    finder_note: item.finder_note,
    dropoff_instructions: item.dropoff_instructions,
    status: item.status,
  }
}

export async function lookupCode(code: string): Promise<string> {
  await wait(200)
  const db = load()
  const item = db.items.find((i) => i.short_code === code.trim().toUpperCase())
  if (!item) throw new ApiError('We couldn’t find a tag with that code. Check the letters and try again.', 404)
  return item.token
}

export async function submitScan(token: string, input: ScanInput) {
  await wait(400)
  if (input.website) return // honeypot filled: pretend success, store nothing
  const db = load()
  const item = db.items.find((i) => i.token === token)
  if (!item) throw new ApiError('This QR code is not active.', 404)
  const hourAgo = new Date(Date.now() - 3600_000).toISOString()
  const recent = db.scans.filter((s) => s.item_id === item.id && s.scanned_at > hourAgo).length
  if (recent >= RATE_LIMIT_PER_HOUR)
    throw new ApiError('The owner has already been notified several times in the last hour. Please try again later.', 429)
  const muted = !!item.muted_until && item.muted_until > new Date().toISOString()
  const clip = (v?: string, n = 500) => (v?.trim() ? v.trim().slice(0, n) : null)
  db.scans.push({
    id: uid(),
    item_id: item.id,
    scanned_at: new Date().toISOString(),
    finder_message: clip(input.finder_message),
    finder_name: clip(input.finder_name, 80),
    finder_contact: clip(input.finder_contact, 120),
    lat: input.lat ?? null,
    lng: input.lng ?? null,
    accuracy: input.accuracy ?? null,
    read: muted,
  })
  save(db)
}
