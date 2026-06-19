import { useState } from 'react'
import {
  Grid3x3,
  Users,
  Boxes,
  Truck,
  Store,
  ShoppingBag,
  SlidersHorizontal,
  X,
  ChevronDown,
} from 'lucide-react'
import type { Filters, InfraKey, InfraMode } from '../types'
import { GEO, NP_TYPES } from '../data/mockData'

interface Props {
  filters: Filters
  update: (patch: Partial<Filters>) => void
  onGridChange: (grid: number) => void
}

const INFRA_META: { key: InfraKey; label: string; icon: typeof Boxes }[] = [
  { key: 'postomat', label: 'Поштомат', icon: Boxes },
  { key: 'cargo', label: 'Вантажне', icon: Truck },
  { key: 'branch', label: 'Відділення', icon: Store },
  { key: 'pudo', label: 'ПУДО', icon: ShoppingBag },
]
const SEG: Record<InfraMode, string> = { all: 'Всі', yes: 'Є', no: '✕' }

/* Компактна панель фільтрів. Гео-ієрархія схована у випадайку,
   щоб лишити максимум місця для теплової карти. */
export default function FilterBar({ filters, update, onGridChange }: Props) {
  const [geoOpen, setGeoOpen] = useState(false)
  const rayons = filters.oblast ? Object.keys(GEO[filters.oblast].rayons) : []
  const cities = filters.oblast
    ? filters.rayon
      ? GEO[filters.oblast].rayons[filters.rayon]
      : Object.values(GEO[filters.oblast].rayons).flat()
    : []
  const geoActive = filters.oblast || filters.rayon || filters.city || filters.nptype

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-3 py-2">
      {/* Гео-ієрархія у поповері */}
      <div className="relative">
        <button
          onClick={() => setGeoOpen((o) => !o)}
          className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[12px] transition ${
            geoActive ? 'border-np-red/40 bg-np-red/5 text-np-red' : 'border-np-line bg-white text-np-graphite'
          }`}
        >
          <SlidersHorizontal size={13} />
          Гео-фільтр
          {geoActive ? (
            <span className="rounded-full bg-np-red px-1.5 text-[10px] font-bold text-white">
              {[filters.oblast, filters.rayon, filters.city, filters.nptype].filter(Boolean).length}
            </span>
          ) : (
            <ChevronDown size={12} />
          )}
        </button>

        {geoOpen && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setGeoOpen(false)} />
            <div className="absolute left-0 top-full z-40 mt-1 w-64 rounded-xl border border-np-line bg-white p-3 shadow-lg">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase text-np-slate">Гео-ієрархія</span>
                <button onClick={() => setGeoOpen(false)} className="text-np-slate hover:text-np-ink">
                  <X size={14} />
                </button>
              </div>
              <div className="space-y-2">
                <Sel label="Область" value={filters.oblast} options={Object.keys(GEO)} ph="Усі області"
                  onChange={(v) => update({ oblast: v, rayon: '', city: '' })} />
                <Sel label="Район" value={filters.rayon} options={rayons} ph="Усі райони"
                  onChange={(v) => update({ rayon: v, city: '' })} />
                <Sel label="Місто / НП" value={filters.city} options={cities} ph="Усі НП"
                  onChange={(v) => update({ city: v })} />
                <Sel label="Тип НП" value={filters.nptype} options={NP_TYPES} ph="Усі типи"
                  onChange={(v) => update({ nptype: v })} />
              </div>
            </div>
          </>
        )}
      </div>

      <Divider />

      {/* Розмір сітки */}
      <label className="flex items-center gap-1.5 text-[12px] text-np-slate">
        <Grid3x3 size={13} />
        Сітка
        <select
          value={filters.grid}
          onChange={(e) => onGridChange(parseInt(e.target.value))}
          className="rounded-md border border-np-line bg-white px-1.5 py-1 text-[12px] text-np-ink"
        >
          <option value={100}>100 м</option>
          <option value={300}>300 м</option>
          <option value={500}>500 м</option>
          <option value={1000}>1 км</option>
        </select>
      </label>

      {/* Діапазон клієнтів */}
      <label className="flex items-center gap-1.5 text-[12px] text-np-slate">
        <Users size={13} />
        Клієнти
        <input
          type="number"
          min={0}
          max={500}
          value={filters.cliMin}
          onChange={(e) => update({ cliMin: parseInt(e.target.value) || 0 })}
          className="w-14 rounded-md border border-np-line bg-white px-1.5 py-1 text-[12px]"
        />
        <span>–</span>
        <input
          type="number"
          min={0}
          max={500}
          value={filters.cliMax}
          onChange={(e) => update({ cliMax: parseInt(e.target.value) || 500 })}
          className="w-14 rounded-md border border-np-line bg-white px-1.5 py-1 text-[12px]"
        />
      </label>

      <Divider />

      {/* Інфра-перемикачі */}
      <div className="flex flex-wrap items-center gap-2">
        {INFRA_META.map(({ key, label, icon: Icon }) => (
          <div key={key} className="flex items-center gap-1" title={label}>
            <Icon size={13} className={key === 'postomat' ? 'text-np-red' : 'text-np-slate'} />
            <div className="inline-flex rounded-md bg-[#EEF0F2] p-0.5">
              {(['all', 'yes', 'no'] as InfraMode[]).map((mode) => {
                const on = filters.infra[key] === mode
                const cls =
                  on && mode === 'yes' ? 'text-green-700' : on && mode === 'no' ? 'text-np-red' : on ? 'text-np-ink' : 'text-np-slate'
                return (
                  <button
                    key={mode}
                    onClick={() => update({ infra: { ...filters.infra, [key]: mode } })}
                    className={`rounded px-1.5 py-0.5 text-[10px] transition ${cls} ${on ? 'bg-white font-semibold shadow-sm' : ''}`}
                  >
                    {SEG[mode]}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function Divider() {
  return <div className="hidden h-6 w-px bg-np-line sm:block" />
}

function Sel({
  label,
  value,
  options,
  ph,
  onChange,
}: {
  label: string
  value: string
  options: string[]
  ph: string
  onChange: (v: string) => void
}) {
  return (
    <div>
      <label className="mb-0.5 block text-[10px] uppercase tracking-wide text-np-slate">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border border-np-line bg-white px-2 py-1.5 text-[12px] text-np-ink"
      >
        <option value="">{ph}</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  )
}
