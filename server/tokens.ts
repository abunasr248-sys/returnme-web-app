import { randomBytes } from 'node:crypto'

const B62 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
/** No 0/O/1/I so printed codes can't be misread. */
export const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

/** Uniform random string from a CSPRNG (rejection sampling avoids modulo bias). */
function random(alphabet: string, len: number) {
  const limit = 256 - (256 % alphabet.length)
  let out = ''
  while (out.length < len) {
    for (const b of randomBytes(len * 2)) {
      if (b < limit) out += alphabet[b % alphabet.length]
      if (out.length === len) break
    }
  }
  return out
}

/** 22-char base62 token (about 131 bits). */
export const newToken = () => random(B62, 22)
/** 6-char backup code. */
export const newShortCode = () => random(CODE_ALPHABET, 6)

/** True when a Postgres error is a unique-constraint violation. */
export function isUniqueViolation(e: unknown) {
  let cur: unknown = e
  for (let i = 0; i < 4 && cur; i++) {
    if ((cur as { code?: string }).code === '23505') return true
    cur = (cur as { cause?: unknown }).cause
  }
  return false
}

/** Retries an insert/update a few times if a fresh token or code happens to collide. */
export async function withFreshCodes<T>(fn: (codes: { token: string; shortCode: string }) => Promise<T>): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await fn({ token: newToken(), shortCode: newShortCode() })
    } catch (e) {
      if (attempt < 5 && isUniqueViolation(e)) continue
      throw e
    }
  }
}
