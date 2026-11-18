import type { Context } from '@netlify/functions'

export const GENERIC_ERROR = 'Something went wrong, please try again.'

export class HttpError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

const NO_STORE = { 'Cache-Control': 'no-store' }

export function json(data: unknown, status = 200, headers: Record<string, string> = NO_STORE) {
  return Response.json(data, { status, headers })
}

export const noContent = () => new Response(null, { status: 204, headers: NO_STORE })

export function fail(status: number, message: string) {
  return json({ error: message }, status)
}

/** Parses a JSON body with a size cap. Bad or oversized bodies become a 400. */
export async function readJson<T = Record<string, unknown>>(req: Request, maxBytes = 16_384): Promise<T> {
  const text = await req.text()
  if (text.length > maxBytes) throw new HttpError(413, 'That message is too long.')
  if (!text.trim()) return {} as T
  try {
    const data = JSON.parse(text)
    if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('not an object')
    return data as T
  } catch {
    throw new HttpError(400, 'The request could not be read.')
  }
}

/** Splits the pathname after a prefix, e.g. segments('/api/items/abc/status', '/api/items') => ['abc', 'status']. */
export function segments(req: Request, prefix: string) {
  const path = new URL(req.url).pathname.replace(/\/+$/, '')
  if (!path.startsWith(prefix)) return []
  return path
    .slice(prefix.length)
    .split('/')
    .filter(Boolean)
    .map((s) => decodeURIComponent(s))
}

type Handler = (req: Request, context: Context) => Promise<Response>

/** Wraps a handler so thrown HttpErrors become JSON errors and anything else is logged and hidden. */
export function handle(fn: Handler): Handler {
  return async (req, context) => {
    try {
      return await fn(req, context)
    } catch (e) {
      if (e instanceof HttpError) return fail(e.status, e.message)
      console.error('[api]', req.method, new URL(req.url).pathname, e)
      return fail(500, GENERIC_ERROR)
    }
  }
}

export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
