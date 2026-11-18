/**
 * Stubbed sample data for the product preview.
 * Everything here is replaced by Netlify Database rows in a later milestone (see PLAN.md).
 */
import type { Category, Item, Scan } from './types'

/** VNR VJIET campus, Bachupally, Hyderabad. */
export const CAMPUS = { lat: 17.5403, lng: 78.3866, name: 'VNR VJIET, Hyderabad' }

/** A public showcase tag so anyone can try the finder page from the landing page. */
export const SHOWCASE_OWNER_ID = 'showcase-owner'
export const SHOWCASE_TOKEN = 'rm7Qk2vXp9LbT4wZs8NdYa'
export const SHOWCASE_CODE = 'K7MPQ4'

export const showcaseItem: Item = {
  id: 'showcase-item',
  owner_id: SHOWCASE_OWNER_ID,
  name: 'Green Water Bottle',
  category: 'bottle',
  finder_note: 'Thanks for picking this up! It has my hostel room sticker on the bottom.',
  dropoff_instructions: 'Please hand it to the security desk at the main gate (Block A).',
  token: SHOWCASE_TOKEN,
  short_code: SHOWCASE_CODE,
  status: 'safe',
  muted_until: null,
  created_at: '2026-10-02T09:12:00.000Z',
}
export const showcaseOwnerName = 'Rahul Varma'

interface SampleItem {
  name: string
  category: Category
  finder_note: string
  dropoff_instructions: string
  status: 'safe' | 'lost'
  scans: Array<Omit<Scan, 'id' | 'item_id' | 'scanned_at' | 'read'> & { minutesAgo: number; read: boolean }>
}

/** Created by the "Load sample items" button. */
export const sampleItems: SampleItem[] = [
  {
    name: 'Blue Backpack',
    category: 'bag',
    finder_note: 'My lab record and calculator are inside. Please don’t leave it in the rain!',
    dropoff_instructions: 'Hand it to the library front desk (ground floor, Block C).',
    status: 'lost',
    scans: [
      {
        minutesAgo: 18,
        read: false,
        finder_message: 'Found it under a bench near the Block B canteen. Keeping it at the canteen counter.',
        finder_name: 'Sneha K.',
        finder_contact: '@sneha.reads (Instagram)',
        lat: 17.5398,
        lng: 78.3859,
        accuracy: 24,
      },
      {
        minutesAgo: 60 * 26,
        read: true,
        finder_message: 'Saw this in the CSE lab 3, left it with the lab assistant.',
        finder_name: null,
        finder_contact: null,
        lat: null,
        lng: null,
        accuracy: null,
      },
    ],
  },
  {
    name: 'Laptop',
    category: 'laptop',
    finder_note: 'Grey Lenovo with a ReturnMe sticker on the lid.',
    dropoff_instructions: 'Please give it to the HOD office, ECE department, 2nd floor.',
    status: 'safe',
    scans: [
      {
        minutesAgo: 60 * 5 + 12,
        read: false,
        finder_message: 'Charger was left plugged in at the seminar hall. I put it on the front table.',
        finder_name: 'Arjun',
        finder_contact: '98xxxx2213',
        lat: 17.5409,
        lng: 78.3875,
        accuracy: 41,
      },
    ],
  },
  {
    name: 'Hostel Keys',
    category: 'keys',
    finder_note: 'Room 214, Boys Hostel 2. Blue keychain.',
    dropoff_instructions: 'Drop them at the hostel warden’s office.',
    status: 'safe',
    scans: [
      {
        minutesAgo: 60 * 24 * 3,
        read: true,
        finder_message: 'Found near the basketball court.',
        finder_name: null,
        finder_contact: null,
        lat: 17.5392,
        lng: 78.3881,
        accuracy: 15,
      },
    ],
  },
]

/** Fake finders used by "Simulate a scan". */
export const fakeFinders = [
  { finder_message: 'Found it near the Block B canteen, keeping it safe for you.', finder_name: 'Priya', finder_contact: 'priya.s@vnrvjiet.in' },
  { finder_message: 'Picked this up in the parking lot by the main gate.', finder_name: null, finder_contact: null },
  { finder_message: 'It was in the auditorium, row F. Gave it to security.', finder_name: 'Karthik', finder_contact: '@karthik_r' },
  { finder_message: 'Left at the xerox shop near Block D.', finder_name: 'Meghana', finder_contact: null },
]
