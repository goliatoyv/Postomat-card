/* ================================================================
   Canvas-рендер згладженої теплової карти (gaussian heatmap).
   1) Малюємо радіальні «плями» інтенсивності в альфа-канал.
   2) Перефарбовуємо пікселі за палітрою (cool → warm) залежно
      від накопиченої інтенсивності.
================================================================ */

export interface HeatPoint {
  x: number // px
  y: number // px
  w: number // вага 0..1
}

let palette: Uint8ClampedArray | null = null

/** 256-кольорова палітра: синій → зелений → жовтий → помаранчевий → червоний */
function getPalette(): Uint8ClampedArray {
  if (palette) return palette
  const c = document.createElement('canvas')
  c.width = 256
  c.height = 1
  const ctx = c.getContext('2d')!
  const g = ctx.createLinearGradient(0, 0, 256, 0)
  g.addColorStop(0.0, '#1d4ed8')
  g.addColorStop(0.25, '#16a34a')
  g.addColorStop(0.5, '#eab308')
  g.addColorStop(0.72, '#f97316')
  g.addColorStop(1.0, '#DA291C')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 256, 1)
  palette = ctx.getImageData(0, 0, 256, 1).data
  return palette
}

/** Малює теплову карту в canvas (розміри у CSS-пікселях w×h) */
export function drawHeatmap(
  canvas: HTMLCanvasElement,
  w: number,
  h: number,
  points: HeatPoint[],
  radius: number,
): void {
  if (w <= 0 || h <= 0) return
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!
  ctx.clearRect(0, 0, w, h)

  // Прохід інтенсивності — сірі плями з накопиченням альфи
  for (const p of points) {
    const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, radius)
    const a = Math.max(0.08, Math.min(1, p.w))
    grad.addColorStop(0, `rgba(0,0,0,${a})`)
    grad.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = grad
    ctx.fillRect(p.x - radius, p.y - radius, radius * 2, radius * 2)
  }

  // Перефарбування за палітрою
  const img = ctx.getImageData(0, 0, w, h)
  const d = img.data
  const pal = getPalette()
  for (let i = 0; i < d.length; i += 4) {
    const alpha = d[i + 3]
    if (alpha === 0) continue
    const off = alpha * 4
    d[i] = pal[off]
    d[i + 1] = pal[off + 1]
    d[i + 2] = pal[off + 2]
    // Трохи піднімаємо непрозорість для насиченості, але лишаємо м'які краї
    d[i + 3] = Math.min(235, alpha + 35)
  }
  ctx.putImageData(img, 0, 0)
}
