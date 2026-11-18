// Decodes the QR image produced by src/lib/qr.ts and checks the payload is exactly the finder URL.
// Run with: npm run test:qr
import assert from 'node:assert/strict'
import jsQR from 'jsqr'
import { PNG } from 'pngjs'
import { PUBLIC_BASE_URL, finderUrl, qrDataUrl } from '../src/lib/qr.ts'

async function decode(dataUrl: string) {
  const png = PNG.sync.read(Buffer.from(dataUrl.split(',')[1], 'base64'))
  const res = jsQR(new Uint8ClampedArray(png.data), png.width, png.height)
  assert.ok(res, 'QR could not be decoded')
  return { text: res.data, width: png.width }
}

const cases: [string, string][] = [
  ['Ab3dEfGh5jKlMn7pQrStUv', `${PUBLIC_BASE_URL}/f/Ab3dEfGh5jKlMn7pQrStUv`],
  ['  Ab3dEfGh5jKlMn7pQrStUv\n', `${PUBLIC_BASE_URL}/f/Ab3dEfGh5jKlMn7pQrStUv`],
  ['Ab3d​EfGh5jKl\tMn7pQrStUv\r\n', `${PUBLIC_BASE_URL}/f/Ab3dEfGh5jKlMn7pQrStUv`],
  ['XU79LN', `${PUBLIC_BASE_URL}/f/XU79LN`],
]

assert.equal(PUBLIC_BASE_URL, 'https://returnme-web-app.netlify.app')
for (const [token, expected] of cases) {
  assert.equal(finderUrl(token), expected)
  const { text, width } = await decode(await qrDataUrl(token))
  assert.equal(text, expected, `decoded ${JSON.stringify(text)}`)
  assert.match(text, /^https:\/\/returnme-web-app\.netlify\.app\/f\/[A-Za-z0-9_-]+$/)
  assert.ok(width >= 512, `QR width ${width} is below 512`)
  console.log(`ok  ${JSON.stringify(token)} -> ${text} (${width}px)`)
}
console.log('All QR checks passed')
