import { useMemo, useState } from 'react'
import { Boxes, RotateCcw } from 'lucide-react'
import type { Filters } from './types'
import { buildData } from './data/mockData'
import FilterBar from './components/FilterBar'
import MapHeatmap from './components/MapHeatmap'
import PostomatPage from './pages/PostomatPage'
import { useHashRoute } from './lib/useHashRoute'

const DEFAULT_FILTERS: Filters = {
  oblast: '',
  rayon: '',
  city: '',
  nptype: '',
  grid: 300,
  cliMin: 0,
  cliMax: 500,
  infra: { postomat: 'all', cargo: 'all', branch: 'all', pudo: 'all' },
  lasso: null,
}

export default function App() {
  const route = useHashRoute()

  // Окреме вікно картки поштомата (відкривається з карти)
  if (route.name === 'postomat') {
    return <PostomatPage grid={route.grid} id={route.id} />
  }
  return <Dashboard />
}

function Dashboard() {
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS)
  const data = useMemo(() => buildData(filters.grid), [filters.grid])

  const update = (patch: Partial<Filters>) => setFilters((f) => ({ ...f, ...patch }))
  const onGridChange = (grid: number) => update({ grid, lasso: null })
  const reset = () => setFilters(DEFAULT_FILTERS)

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <header className="z-40 border-b border-np-line bg-np-panel shadow-sm">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="flex shrink-0 items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-np-red text-white shadow">
              <Boxes size={16} />
            </div>
            <div className="leading-tight">
              <div className="text-[14px] font-bold text-np-ink">Аналітика Поштоматів</div>
              <div className="text-[10px] text-np-slate">Нова Пошта · Geo-Analytics</div>
            </div>
          </div>

          <div className="mx-1 h-8 w-px bg-np-line" />

          <div className="min-w-0 flex-1">
            <FilterBar filters={filters} update={update} onGridChange={onGridChange} />
          </div>

          <button
            onClick={reset}
            className="shrink-0 rounded-lg border border-np-line bg-white px-3 py-1.5 text-[12px] text-np-slate transition hover:bg-np-bg"
          >
            <RotateCcw size={13} className="mr-1 inline" />
            Скинути
          </button>
        </div>
      </header>

      <main className="relative flex-1 overflow-hidden">
        <MapHeatmap data={data} filters={filters} onLasso={(pts) => update({ lasso: pts })} />
      </main>
    </div>
  )
}
