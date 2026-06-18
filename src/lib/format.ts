/* Допоміжні функції форматування та колірна шкала щільності. */

export const fmt = (n: number) => n.toLocaleString('uk-UA')
export const money = (n: number) =>
  n.toLocaleString('uk-UA', { maximumFractionDigits: 0 }) + ' ₴'

/** Детермінований ГПВЧ — стабільні дані між перемиканнями фільтрів */
export function seeded(seed: number): () => number {
  let s = seed >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 4294967296
  }
}

export const rndInt = (r: () => number, a: number, b: number) =>
  Math.floor(r() * (b - a + 1)) + a
export const pick = <T>(r: () => number, arr: T[]): T =>
  arr[Math.floor(r() * arr.length)]

/** Колірна шкала щільності: зелений → жовтий → помаранчевий → червоний */
export function densityColor(clients: number, max: number): string {
  const t = Math.min(1, clients / (max || 1))
  const stops = [
    [22, 163, 74],
    [234, 179, 8],
    [249, 115, 22],
    [218, 41, 28],
  ]
  const seg = t * (stops.length - 1)
  const i = Math.min(stops.length - 2, Math.floor(seg))
  const f = seg - i
  const c = stops[i].map((v, k) => Math.round(v + (stops[i + 1][k] - v) * f))
  return `rgb(${c[0]},${c[1]},${c[2]})`
}

/** Точка всередині полігона (ray casting) — для лассо-фільтра */
export function pointInPoly(
  px: number,
  py: number,
  poly: { x: number; y: number }[],
): boolean {
  let inside = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i].x,
      yi = poly[i].y,
      xj = poly[j].x,
      yj = poly[j].y
    if (yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi)
      inside = !inside
  }
  return inside
}
