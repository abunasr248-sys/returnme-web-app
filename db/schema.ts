import { sql } from 'drizzle-orm'
import { boolean, check, doublePrecision, index, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'

/** One row per Netlify Identity user, created on first login. `owner_id` is the Identity user id. */
export const profiles = pgTable('profiles', {
  ownerId: text('owner_id').primaryKey(),
  email: text('email').notNull(),
  displayName: text('display_name').notNull(),
  notifyEmail: boolean('notify_email').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const items = pgTable(
  'items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    ownerId: text('owner_id').notNull().references(() => profiles.ownerId, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    category: text('category').notNull(),
    finderNote: text('finder_note').notNull().default(''),
    dropoffInstructions: text('dropoff_instructions').notNull().default(''),
    token: text('token').notNull().unique(),
    shortCode: text('short_code').notNull().unique(),
    status: text('status').notNull().default('safe'),
    mutedUntil: timestamp('muted_until', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    check('items_status_check', sql`${t.status} in ('safe', 'lost')`),
    index('items_owner_id_idx').on(t.ownerId),
  ],
)

export const scans = pgTable(
  'scans',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    itemId: uuid('item_id').notNull().references(() => items.id, { onDelete: 'cascade' }),
    scannedAt: timestamp('scanned_at', { withTimezone: true }).notNull().defaultNow(),
    finderMessage: text('finder_message'),
    finderName: text('finder_name'),
    finderContact: text('finder_contact'),
    lat: doublePrecision('lat'),
    lng: doublePrecision('lng'),
    accuracy: doublePrecision('accuracy'),
    read: boolean('read').notNull().default(false),
    /** Salted SHA-256 of the finder's IP. The raw IP is never stored. */
    ipHash: text('ip_hash'),
  },
  (t) => [
    index('scans_item_id_scanned_at_idx').on(t.itemId, t.scannedAt.desc()),
    index('scans_rate_limit_idx').on(t.itemId, t.ipHash, t.scannedAt),
  ],
)
