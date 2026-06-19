/* ================================================================
   Генерація mock-даних: гео-сітка, інфраструктура та повні профілі
   поштоматів. Логіка перенесена з автономного прототипу й
   типізована під TypeScript.
================================================================ */
import type { Cell, PostomatDetail, HeatMode } from '../types'
import { seeded, rndInt, pick } from '../lib/format'

/** Довідник гео-ієрархії (dim_bielik_dev_v) */
export const GEO: Record<string, { rayons: Record<string, string[]> }> = {
  Київська: {
    rayons: {
      'Києво-Святошинський': ['Київ', 'Вишневе', 'Боярка'],
      Бориспільський: ['Бориспіль', 'Щасливе'],
    },
  },
  Львівська: {
    rayons: {
      Львівський: ['Львів', 'Винники', 'Брюховичі'],
      Стрийський: ['Стрий', 'Моршин'],
    },
  },
  Одеська: {
    rayons: {
      Одеський: ['Одеса', 'Чорноморськ'],
      Ізмаїльський: ['Ізмаїл'],
    },
  },
  Харківська: {
    rayons: {
      Харківський: ['Харків', 'Люботин'],
      Чугуївський: ['Чугуїв'],
    },
  },
  'Дніпро.': {
    rayons: {
      Дніпровський: ['Дніпро', 'Підгородне'],
      'Кам.': ["Кам'янське"],
    },
  },
}

export const NP_TYPES = ['Місто', 'Селище міського типу', 'Село']

/** Розмір гео-сітки (м) → роздільність полотна (к-сть клітин) */
export const GRID_DIMS: Record<number, { cols: number; rows: number }> = {
  1000: { cols: 12, rows: 8 },
  500: { cols: 16, rows: 10 },
  300: { cols: 22, rows: 14 },
  100: { cols: 34, rows: 22 },
}

const FIRST_NAMES = [
  'Олександр', 'Марія', 'Іван', 'Олена', 'Андрій', 'Наталія',
  'Сергій', 'Тетяна', 'Дмитро', 'Юлія', 'Віктор', 'Ірина',
]

export interface GeneratedData {
  cells: Cell[]
  postomats: Record<number, PostomatDetail>
  cols: number
  rows: number
}

/** Будує сітку + профілі поштоматів для заданого розміру квадрата */
export function buildData(grid: number): GeneratedData {
  const dim = GRID_DIMS[grid] ?? GRID_DIMS[300]
  const cols = dim.cols
  const rows = dim.rows
  const r = seeded(20240618 + grid) // сід прив'язаний до роздільності
  const oblasts = Object.keys(GEO)
  const cells: Cell[] = []
  const postomats: Record<number, PostomatDetail> = {}
  let pmId = 1000

  for (let gy = 0; gy < rows; gy++) {
    for (let gx = 0; gx < cols; gx++) {
      const oblast = pick(r, oblasts)
      const rayon = pick(r, Object.keys(GEO[oblast].rayons))
      const city = pick(r, GEO[oblast].rayons[rayon])
      const npType = pick(r, NP_TYPES)

      // Щільність клієнтів — центр карти щільніший (імітація міст)
      const cx = cols / 2
      const cy = rows / 2
      const dist = Math.hypot(gx - cx, gy - cy) / Math.hypot(cx, cy)
      // Підлога щільності (+40..160), щоб майже всі клітини мали клієнтів
      // і карта виглядала заповненою; центр лишається найгарячішим.
      const clients = Math.round((1 - dist) * 320 + (r() * 120 + 40))

      const cell: Cell = {
        id: `${gx}-${gy}`,
        gx,
        gy,
        oblast,
        rayon,
        city,
        npType,
        clients,
        postomat: r() < 0.35 + (1 - dist) * 0.45,
        cargo: r() < 0.22,
        branch: r() < 0.3 + (1 - dist) * 0.25,
        pudo: r() < 0.3,
      }

      if (cell.postomat) {
        cell.postomatId = pmId
        postomats[pmId] = makePostomatDetail(pmId, cell)
        pmId++
      }
      cells.push(cell)
    }
  }

  return { cells, postomats, cols, rows }
}

/** Повний профіль одного поштомата (усі 7 блоків деталізації) */
function makePostomatDetail(id: number, cell: Cell): PostomatDetail {
  const r = seeded(id * 7919) // власний сід — стабільні дані для поштомата
  const months = ['Лип', 'Сер', 'Вер', 'Жов', 'Лис', 'Гру', 'Січ', 'Лют', 'Бер', 'Кві', 'Тра', 'Чер']

  const monthly = months.map((m) => {
    const clients = rndInt(r, 120, 900)
    const en = Math.round(clients * (1.1 + r() * 0.6))
    const grossRev = Math.round(en * (38 + r() * 22))
    const localRev = Math.round(grossRev * (0.45 + r() * 0.3))
    return { m, clients, en, grossRev, localRev }
  })

  const top = Array.from({ length: 20 }, (_, i) => {
    const en = Math.max(5, rndInt(r, 12, 480) - i * 4)
    return {
      name: `${pick(r, FIRST_NAMES)} ${String.fromCharCode(1040 + rndInt(r, 0, 31))}.`,
      phone: `+38067${rndInt(r, 100, 999)}***${rndInt(r, 1000, 9999)}`,
      en,
      sum: en * (30 + rndInt(r, 5, 40)),
    }
  }).sort((a, b) => b.en - a.en)

  // Концентрація: доля локації в обсязі клієнта — окремо за ЕН та за грн
  const concentration = [
    { label: '100%', en: rndInt(r, 4, 12), grn: rndInt(r, 3, 14) },
    { label: '90-99%', en: rndInt(r, 8, 18), grn: rndInt(r, 7, 20) },
    { label: '75-89%', en: rndInt(r, 12, 24), grn: rndInt(r, 10, 26) },
    { label: '50-74%', en: rndInt(r, 18, 30), grn: rndInt(r, 16, 32) },
    { label: '<50%', en: rndInt(r, 20, 40), grn: rndInt(r, 18, 42) },
  ]

  const dims: Record<string, number> = {
    Документи: rndInt(r, 15, 35),
    Маленька: rndInt(r, 25, 40),
    Середня: rndInt(r, 15, 30),
    Велика: rndInt(r, 5, 18),
  }
  const prodSend = ['Одяг', 'Електроніка', 'Косметика', 'Запчастини', 'Аксесуари'].map((p) => ({ p, v: rndInt(r, 5, 40) }))
  const prodRecv = ['Косметика', 'Одяг', 'Книги', 'Іграшки', 'Гаджети'].map((p) => ({ p, v: rndInt(r, 5, 40) }))
  const flows: Record<string, number> = {
    'Поштомат → Відділення': rndInt(r, 15, 35),
    'Поштомат → Поштомат': rndInt(r, 25, 45),
    'Поштомат → Адреса/ПУДО': rndInt(r, 10, 30),
  }

  const pickupSpeed = [
    { label: '0-2 год', v: rndInt(r, 8, 20) },
    { label: '2-6 год', v: rndInt(r, 15, 28) },
    { label: '6-12 год', v: rndInt(r, 18, 30) },
    { label: '12-24 год', v: rndInt(r, 12, 22) },
    { label: '1-2 дні', v: rndInt(r, 6, 14) },
    { label: '>2 днів', v: rndInt(r, 2, 8) },
  ]
  const redirects = { en: rndInt(r, 30, 260), pct: (r() * 9 + 1).toFixed(1) }

  const nightShare = rndInt(r, 35, 72)
  const rfm = [
    { seg: 'Нові', loc: rndInt(r, 8, 20), corp: 14 },
    { seg: 'Активні', loc: rndInt(r, 30, 55), corp: 42 },
    { seg: 'Під загрозою', loc: rndInt(r, 8, 22), corp: 18 },
    { seg: 'Сплячі', loc: rndInt(r, 10, 28), corp: 26 },
  ]

  const marketplaces: Record<string, number> = {
    Prom: rndInt(r, 10, 40),
    Rozetka: rndInt(r, 15, 45),
    OLX: rndInt(r, 8, 30),
  }
  const cod = {
    sendCount: rndInt(r, 40, 200),
    recvCount: rndInt(r, 50, 260),
    totalSum: rndInt(r, 80, 400) * 1000,
    avgSend: rndInt(r, 450, 1800),
    avgRecv: rndInt(r, 500, 2100),
  }
  const valuation = [
    { label: 'до 500', v: rndInt(r, 20, 40) },
    { label: '500-1500', v: rndInt(r, 25, 40) },
    { label: '1500-5000', v: rndInt(r, 15, 28) },
    { label: '>5000', v: rndInt(r, 5, 15) },
  ]

  const makeHeat = (scale: number): number[][] =>
    Array.from({ length: 7 }, (_, d) =>
      Array.from({ length: 24 }, (_, h) => {
        const dayFactor = h >= 8 && h <= 21 ? 1 : 0.25
        const weekend = d >= 5 ? 0.7 : 1
        return Math.round((r() * 0.5 + 0.5) * dayFactor * weekend * scale * 100)
      }),
    )
  const heat: Record<HeatMode, number[][]> = {
    all: makeHeat(1),
    send: makeHeat(0.55),
    recv: makeHeat(0.6),
  }

  // Гео-розміщення аудиторії: «домашній» кластер біля поштомата +
  // «робочий» кластер зі зсувом + розсіяний фон (у метрах від точки).
  const gauss = (mean: number, sd: number) => {
    const u = Math.max(1e-9, r())
    return mean + sd * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * r())
  }
  const audience: { dx: number; dy: number; w: number; kind: 'home' | 'work' }[] = []
  const workAngle = r() * Math.PI * 2
  const workDist = 800 + r() * 1000
  const wx = Math.cos(workAngle) * workDist
  const wy = Math.sin(workAngle) * workDist
  for (let i = 0; i < 120 + rndInt(r, 0, 70); i++)
    audience.push({ dx: gauss(0, 320), dy: gauss(0, 320), w: 0.6 + r() * 0.4, kind: 'home' })
  for (let i = 0; i < 80 + rndInt(r, 0, 60); i++)
    audience.push({ dx: gauss(wx, 420), dy: gauss(wy, 420), w: 0.5 + r() * 0.4, kind: 'work' })
  for (let i = 0; i < 40; i++)
    audience.push({ dx: gauss(0, 1500), dy: gauss(0, 1500), w: 0.3 + r() * 0.3, kind: r() < 0.5 ? 'home' : 'work' })

  const totalEN = monthly.reduce((s, m) => s + m.en, 0)
  const totalClients = Math.round(monthly.reduce((s, m) => s + m.clients, 0) / 12)
  const cellsCount = rndInt(r, 30, 108)
  // Утилізація = місячний потік ЕН відносно ємності комірок (≈28 оборотів/міс)
  const util = Math.min(120, Math.round((totalEN / 12 / (cellsCount * 28)) * 100))

  return {
    id,
    cell,
    name: `Поштомат №${id} (${cell.city})`,
    address: `${cell.city}, вул. ${pick(r, ['Соборна', 'Шевченка', 'Хрещатик', 'Перемоги', 'Незалежності'])}, ${rndInt(r, 1, 120)}`,
    rating: (r() * 1.4 + 3.5).toFixed(1),
    cells: cellsCount,
    util,
    totalEN,
    totalClients,
    monthly,
    top,
    concentration,
    dims,
    prodSend,
    prodRecv,
    flows,
    pickupSpeed,
    redirects,
    nightShare,
    rfm,
    marketplaces,
    importPct: rndInt(r, 3, 18),
    cod,
    valuation,
    heat,
    audience,
  }
}
