import QRCode from 'qrcode'
import type { Item } from './types'

/** The one public address printed into every QR code and sticker. Never derive it from the current page. */
export const PUBLIC_BASE_URL = 'https://returnme-web-app.netlify.app'
const PUBLIC_HOST = PUBLIC_BASE_URL.replace(/^https?:\/\//, '')

/** Tokens and short codes only contain letters and digits; anything else is stripped so the URL stays clean. */
const urlSafe = (s: string) => encodeURIComponent(s.trim().replace(/[^A-Za-z0-9_-]/g, ''))

/** The exact QR payload: an absolute URL and nothing else. */
export const finderUrl = (token: string) => `${PUBLIC_BASE_URL}/f/${urlSafe(token)}`.trim()
export const codeUrl = () => `${PUBLIC_HOST}/f`

// Pure black on white, full 4-module quiet zone: the most reliable settings for phone cameras and scanner apps.
const QR_OPTS = {
  errorCorrectionLevel: 'M' as const,
  margin: 4,
  color: { dark: '#000000', light: '#FFFFFF' },
}

export function qrDataUrl(token: string, width = 512) {
  return QRCode.toDataURL(finderUrl(token), { ...QR_OPTS, width: Math.max(512, width) })
}

type StickerItem = Pick<Item, 'name' | 'token' | 'short_code'>

/** One sticker as a PNG: QR, backup code, item name and the call to action. */
export async function downloadPng(item: StickerItem) {
  const c = await renderSticker(item)
  const a = document.createElement('a')
  a.href = c.toDataURL('image/png')
  a.download = `${fileBase(item)}.png`
  a.click()
}

/** One sticker on its own as a PDF page sized to the sticker (5 cm wide, QR 4 cm). */
export async function downloadStickerPdf(item: StickerItem) {
  const { jsPDF } = await import('jspdf')
  const c = await renderSticker(item)
  const w = 50
  const h = (w * c.height) / c.width
  const doc = new jsPDF({ unit: 'mm', format: [w, h], orientation: 'portrait' })
  doc.addImage(c.toDataURL('image/png'), 'PNG', 0, 0, w, h)
  doc.save(`${fileBase(item)}.pdf`)
}

/** Draws a single sticker on a canvas. Text is wrapped and kept inside the padded sticker area. */
async function renderSticker(item: StickerItem) {
  if (document.fonts?.ready) await document.fonts.ready.catch(() => undefined)
  const W = 1000, pad = 60, qrSize = W - pad * 2
  const inner = W - pad * 2
  const qr = await loadImage(await qrDataUrl(item.token, qrSize))
  const c = document.createElement('canvas')
  const ctx = c.getContext('2d')!

  const name = 'bold 56px Figtree, sans-serif'
  const cta = '600 40px Figtree, sans-serif'
  const foot = '30px Figtree, sans-serif'
  ctx.font = name
  const allName = wrap(ctx, item.name, inner)
  const nameLines = allName.slice(0, 2)
  if (allName.length > 2) nameLines[1] = `${nameLines[1]}…`
  ctx.font = foot
  const footLines = [`No scan? Enter the code at`, `${codeUrl()}`]

  let y = pad + qrSize + 20
  const layout = {
    code: (y += 70),
    name: nameLines.map(() => (y += 70)),
    cta: (y += 62),
    foot: footLines.map((_, i) => (y += i === 0 ? 60 : 40)),
  }
  c.width = W
  c.height = y + pad

  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(0, 0, c.width, c.height)
  ctx.imageSmoothingEnabled = false
  ctx.drawImage(qr, pad, pad, qrSize, qrSize)
  ctx.textAlign = 'center'
  ctx.textBaseline = 'alphabetic'
  const cx = W / 2

  ctx.fillStyle = '#000000'
  ctx.font = 'bold 60px ui-monospace, Menlo, Consolas, monospace'
  ctx.fillText(spaced(item.short_code), cx, layout.code, inner)
  ctx.font = name
  nameLines.forEach((l, i) => ctx.fillText(l, cx, layout.name[i], inner))
  ctx.font = cta
  ctx.fillStyle = '#1f2a28'
  ctx.fillText('Found this? Scan to contact the owner', cx, layout.cta, inner)
  ctx.font = foot
  ctx.fillStyle = '#4b5755'
  footLines.forEach((l, i) => ctx.fillText(l, cx, layout.foot[i], inner))

  ctx.strokeStyle = '#d8d3c8'
  ctx.lineWidth = 4
  ctx.setLineDash([14, 10])
  ctx.strokeRect(2, 2, W - 4, c.height - 4)
  return c
}

/** Optional A4 sheet of 12 identical stickers (3 x 4) for people who want spares. */
export async function downloadStickerSheet(item: StickerItem) {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const qr = await qrDataUrl(item.token, 800)
  const cols = 3, rows = 4, margin = 10, gap = 4
  const w = (210 - margin * 2 - gap * (cols - 1)) / cols
  const h = (297 - margin * 2 - gap * (rows - 1)) / rows
  const padX = 3
  for (let r = 0; r < rows; r++) {
    for (let col = 0; col < cols; col++) {
      const x = margin + col * (w + gap)
      const y = margin + r * (h + gap)
      const cx = x + w / 2
      doc.setDrawColor(200, 195, 185)
      doc.setLineDashPattern([1.5, 1.5], 0)
      doc.roundedRect(x, y, w, h, 3, 3)
      const qs = 40 // 4 cm, well above the 2.5 cm minimum
      doc.addImage(qr, 'PNG', x + (w - qs) / 2, y + 3, qs, qs)
      doc.setTextColor(0, 0, 0)
      doc.setFont('courier', 'bold')
      doc.setFontSize(11)
      doc.text(spaced(item.short_code), cx, y + 47.5, { align: 'center' })
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(10)
      doc.text(truncate(item.name, 28), cx, y + 53, { align: 'center', maxWidth: w - padX * 2 })
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(7.5)
      doc.setTextColor(30, 40, 38)
      doc.text('Found this? Scan to contact the owner', cx, y + 57.5, { align: 'center', maxWidth: w - padX * 2 })
      doc.setFontSize(6.5)
      doc.setTextColor(75, 87, 85)
      doc.text(['No scan? Enter the code at', codeUrl()], cx, y + 61.5, { align: 'center', maxWidth: w - padX * 2 })
    }
  }
  doc.save(`returnme-${slug(item.name)}-${item.short_code}-sheet.pdf`)
}

function wrap(ctx: CanvasRenderingContext2D, text: string, max: number) {
  const words = text.trim().split(/\s+/)
  const lines: string[] = []
  let line = ''
  for (const w of words) {
    const next = line ? `${line} ${w}` : w
    if (ctx.measureText(next).width <= max || !line) line = next
    else { lines.push(line); line = w }
  }
  if (line) lines.push(line)
  return lines.length ? lines : ['']
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((res, rej) => {
    const img = new Image()
    img.onload = () => res(img)
    img.onerror = rej
    img.src = src
  })
}
const fileBase = (item: StickerItem) => `returnme-${slug(item.name)}-${item.short_code}`
const spaced = (code: string) => code.split('').join(' ')
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'item'
const truncate = (s: string, n: number) => (s.length > n ? s.slice(0, n - 1) + '…' : s)
