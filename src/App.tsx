import { useMemo, useState } from 'react'
import { Boxes, RotateCcw, Info } from 'lucide-react'
import type { Filters } from './types'
import { buildData } from './data/mockData'
import TopBar from './components/TopBar'
import MapPanel from './components/MapPanel'
import DetailPanel from './components/DetailPanel'

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
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS)
  const [selectedId, setSelectedId] = useState<number | null>(null)

  // Дані перебудовуються лише при зміні розміру сітки (різна роздільність)
  const data = useMemo(() => buildData(filters.grid), [filters.grid])
  const selected = selectedId != null ? data.postomats[selectedId] ?? null : null

  const update = (patch: Partial<Filters>) => setFilters((f) => ({ ...f, ...patch }))

  const reset = () => {
    setFilters(DEFAULT_FILTERS)
    setSelectedId(null)
  }

  // Зміна розміру сітки міняє id поштоматів — закриваємо стару картку
  const onGridChange = (grid: number) => {
    setSelectedId(null)
    update({ grid, lasso: null })
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Верхня панель керування */}
      <header className="relative z-40 border-b border-np-line bg-np-panel shadow-sm">
        <div className="flex items-center gap-4 px-4 py-2.5">
          <div className="flex shrink-0 items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-np-red text-lg text-white shadow">
              <Boxes size={18} />
            </div>
            <div className="leading-tight">
              <div className="text-[15px] font-bold text-np-ink">Аналітика Поштоматів</div>
              <div className="text-[11px] text-np-slate">Нова Пошта · Geo-Analytics Suite</div>
            </div>
          </div>
          <button
            onClick={reset}
            className="ml-auto rounded-full border border-np-line bg-white px-3 py-1.5 text-[11px] text-np-slate transition hover:bg-np-bg"
          >
            <RotateCcw size={12} className="mr-1 inline" />
            Скинути
          </button>
        </div>
        <TopBar filters={filters} update={update} onGridChange={onGridChange} />
      </header>

      {/* Основна зона */}
      <main className="flex flex-1 overflow-hidden">
        <section className="relative" style={{ width: '60%' }}>
          <MapPanel
            data={data}
            filters={filters}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onLasso={(pts) => update({ lasso: pts })}
          />
        </section>

        <aside
          className="overflow-y-auto border-l border-np-line bg-np-panel"
          style={{ width: '40%' }}
        >
          {selected ? (
            <DetailPanel postomat={selected} />
          ) : (
            <div className="flex h-full flex-col items-center justify-center px-10 text-center text-np-slate">
              <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-np-bg text-3xl text-np-red">
                <Boxes size={34} />
              </div>
              <div className="text-lg font-semibold text-np-graphite">
                Оберіть поштомат на карті
              </div>
              <div className="mt-1 max-w-xs text-sm">
                для глибокої аналітики профілю локації, клієнтів та операційної ефективності
              </div>
              <div className="mt-4 flex items-center gap-1 text-[11px]">
                <Info size={12} className="text-np-red" />
                Клік по червоному квадрату-маркеру
              </div>
            </div>
          )}
        </aside>
      </main>
    </div>
  )
}
