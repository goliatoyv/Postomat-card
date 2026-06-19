/* ================================================================
   Типи даних дашборду. Модель імітує структуру джерел Tableau:
     • Report_HeatMap_refact_WhData_dim_bielik_dev_v   (вимірювання локацій)
     • Report_HeatMap_refact_WhData_v                  (агреговані факти ЕН)
     • Report_HeatMap_refact_WhData_Rentability_and_Rent_v (фінанси)
     • Report_HeatMap_UserPoints_not_in_Buffer_v       (щільність точок)
================================================================ */

export type InfraMode = 'all' | 'yes' | 'no'
export type InfraKey = 'postomat' | 'cargo' | 'branch' | 'pudo'

/** Клітина квадратної гео-сітки на карті */
export interface Cell {
  id: string
  gx: number
  gy: number
  oblast: string
  rayon: string
  city: string
  npType: string
  clients: number
  postomat: boolean
  cargo: boolean
  branch: boolean
  pudo: boolean
  postomatId?: number
}

export interface MonthlyPoint {
  m: string
  clients: number
  en: number
  grossRev: number
  localRev: number
}

export interface TopClient {
  name: string
  phone: string
  en: number
  sum: number
}

export interface Labeled {
  label: string
  v: number
}

export interface RfmSegment {
  seg: string
  loc: number
  corp: number
}

export interface Cod {
  sendCount: number
  recvCount: number
  totalSum: number
  avgSend: number
  avgRecv: number
}

export type HeatMode = 'all' | 'send' | 'recv'

export interface PostomatDetail {
  id: number
  cell: Cell
  name: string
  address: string
  rating: string
  cells: number
  util: number
  totalEN: number
  totalClients: number
  monthly: MonthlyPoint[]
  top: TopClient[]
  concentration: { label: string; en: number; grn: number }[]
  dims: Record<string, number>
  prodSend: { p: string; v: number }[]
  prodRecv: { p: string; v: number }[]
  flows: Record<string, number>
  pickupSpeed: Labeled[]
  redirects: { en: number; pct: string }
  nightShare: number
  rfm: RfmSegment[]
  marketplaces: Record<string, number>
  importPct: number
  cod: Cod
  valuation: Labeled[]
  heat: Record<HeatMode, number[][]>
}

/** Стан глобальних фільтрів верхньої панелі */
export interface Filters {
  oblast: string
  rayon: string
  city: string
  nptype: string
  grid: number
  cliMin: number
  cliMax: number
  infra: Record<InfraKey, InfraMode>
  lasso: { x: number; y: number }[] | null
}
