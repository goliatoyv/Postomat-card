import {
  Boxes,
  MapPin,
  Star,
  ArrowLeft,
  Package,
  Users,
  Server,
  Activity,
} from 'lucide-react'
import { buildData } from '../data/mockData'
import { fmt, statusOf } from '../lib/format'
import {
  MonthlyBlock,
  ConcentrationBlock,
  TopClientsBlock,
  ShipmentBlock,
  FlowsBlock,
  PickupBlock,
  RedirectBlock,
  GeoTypeBlock,
  RfmBlock,
  SpecialBlock,
  HeatmapBlock,
} from '../components/blocks'

/* Повна картка поштомата — окреме вікно/вкладка.
   Компактний multi-column (masonry) розклад усіх 7 блоків. */
export default function PostomatPage({ grid, id }: { grid: number; id: number }) {
  const p = buildData(grid).postomats[id]

  if (!p) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 text-np-slate">
        <Boxes size={40} className="text-np-red" />
        <div className="text-lg font-semibold">Поштомат не знайдено</div>
        <a href="#/" className="rounded-lg bg-np-red px-4 py-2 text-sm text-white">
          ← До карти
        </a>
      </div>
    )
  }

  const st = statusOf(p.util)

  return (
    <div className="flex h-full flex-col overflow-hidden bg-np-bg">
      {/* Шапка */}
      <header className="z-10 border-b border-np-line bg-white shadow-sm">
        <div className="flex items-center gap-3 px-5 py-3">
          <a
            href="#/"
            className="flex items-center gap-1 rounded-lg border border-np-line px-3 py-1.5 text-[12px] text-np-graphite transition hover:bg-np-bg"
          >
            <ArrowLeft size={14} /> До карти
          </a>
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-np-red text-white">
            <Boxes size={16} />
          </span>
          <div>
            <h1 className="text-[16px] font-bold leading-tight text-np-ink">{p.name}</h1>
            <div className="flex items-center gap-1 text-[12px] text-np-slate">
              <MapPin size={12} />
              {p.address}
            </div>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <Stat icon={Star} value={p.rating} label="рейтинг" />
            <Stat icon={Package} value={fmt(p.totalEN)} label="ЕН/рік" />
            <Stat icon={Users} value={fmt(p.totalClients)} label="клієнтів/міс" />
            <Stat icon={Server} value={String(p.cells)} label="комірок" />
            <div className="rounded-xl border border-np-line bg-white px-3 py-1.5 text-center">
              <div className="flex items-center justify-center gap-1 text-[15px] font-bold" style={{ color: st.color }}>
                <Activity size={14} />
                {p.util}%
              </div>
              <div className="text-[10px] text-np-slate">утилізація · {st.label}</div>
            </div>
          </div>
        </div>
      </header>

      {/* Контент: masonry-колонки */}
      <main className="flex-1 overflow-y-auto p-5">
        <div className="mx-auto max-w-[1400px] [column-fill:_balance] gap-4 columns-1 md:columns-2 xl:columns-3">
          <MonthlyBlock p={p} />
          <HeatmapBlock p={p} />
          <ConcentrationBlock p={p} />
          <ShipmentBlock p={p} />
          <PickupBlock p={p} />
          <RedirectBlock p={p} />
          <GeoTypeBlock p={p} />
          <RfmBlock p={p} />
          <FlowsBlock p={p} />
          <SpecialBlock p={p} />
          <TopClientsBlock p={p} />
        </div>
        <div className="py-6 text-center text-[10px] text-np-slate">
          Джерела: Report_HeatMap_refact_WhData_v · _Rentability_and_Rent_v · _dim_bielik_dev_v ·
          _UserPoints_not_in_Buffer_v
        </div>
      </main>
    </div>
  )
}

function Stat({
  icon: Icon,
  value,
  label,
}: {
  icon: typeof Star
  value: string
  label: string
}) {
  return (
    <div className="rounded-xl border border-np-line bg-white px-3 py-1.5 text-center">
      <div className="flex items-center justify-center gap-1 text-[15px] font-bold text-np-ink">
        <Icon size={13} className="text-np-red" />
        {value}
      </div>
      <div className="text-[10px] text-np-slate">{label}</div>
    </div>
  )
}
