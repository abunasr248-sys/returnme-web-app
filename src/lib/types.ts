export type Category = 'bag' | 'laptop' | 'keys' | 'bottle' | 'idcard' | 'phone' | 'other'
export type ItemStatus = 'safe' | 'lost'

export interface Profile {
  owner_id: string
  email: string
  display_name: string
  notify_email: boolean
}

export interface Item {
  id: string
  owner_id: string
  name: string
  category: Category
  finder_note: string
  dropoff_instructions: string
  token: string
  short_code: string
  status: ItemStatus
  muted_until: string | null
  created_at: string
}

export interface Scan {
  id: string
  item_id: string
  scanned_at: string
  finder_message: string | null
  finder_name: string | null
  finder_contact: string | null
  lat: number | null
  lng: number | null
  accuracy: number | null
  read: boolean
}

/** Item as listed for the owner, with derived scan info. */
export interface ItemWithMeta extends Item {
  last_scanned_at: string | null
  unread_count: number
}

/** Only the safe fields a finder may ever see. */
export interface PublicItem {
  name: string
  category: Category
  owner_first_name: string
  finder_note: string
  dropoff_instructions: string
  status: ItemStatus
}

export interface ScanInput {
  finder_message?: string
  finder_name?: string
  finder_contact?: string
  lat?: number
  lng?: number
  accuracy?: number
  /** Honeypot: must stay empty. */
  website?: string
}

export interface ItemInput {
  name: string
  category: Category
  finder_note: string
  dropoff_instructions: string
}
