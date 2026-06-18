import { Grid3x3, Users, Boxes, Truck, Store, ShoppingBag } from 'lucide-react'
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

const SEG_LABELS: Record<InfraMode, string> = { all: 'Всі', yes: 'Є', no: 'Немає' }

export default function TopBar({ filters, update, onGridChange }: Props) {
  // Каскадні списки гео-ієрархії
  const rayons = filters.oblast ? Object.keys(GEO[filters.oblast].rayons) : []
  const cities = filters.oblast
    ? filters.rayon
      ? GEO[filters.oblast].rayons[filters.rayon]
      : Object.values(GEO[filters.oblast].rayons).flat()
    : []

  return (
    <div className="border-t border-np-line/70 bg-np-bg/40">
      {/* Рядок 1: гео-ієрархія */}
      <div className="flex flex-wrap items-end gap-2 px-4 pt-2.5">
        <Select
          label="Область"
          value={filters.oblast}
          onChange={(v) => update({ oblast: v, rayon: '', city: '' })}
          options={Object.keys(GEO)}
          placeholder="Усі області"
        />
        <Select
          label="Район"
          value={filters.rayon}
          onChange={(v) => update({ rayon: v, city: '' })}
          options={rayons}
          placeholder="Усі райони"
        />
        <Select
          label="Місто / НП"
          value={filters.city}
          onChange={(v) => update({ city: v })}
          options={cities}
          placeholder="Усі НП"
        />
        <Select
          label="Тип НП"
          value={filters.nptype}
          onChange={(v) => update({ nptype: v })}
          options={NP_TYPES}
          placeholder="Усі типи"
        />
      </div>

      {/* Рядок 2: сітка, слайдер клієнтів, інфра-перемикачі */}
      <div className="flex flex-wrap items-center gap-5 px-4 pb-3 pt-2.5">
        <label className="flex items-center gap-2 text-[11px] text-np-slate">
          <Grid3x3 size={13} />
          Розмір сітки
          <select
            value={filters.grid}
            onChange={(e) => onGridChange(parseInt(e.target.value))}
            className="rounded-md border border-np-line bg-white px-2 py-1 text-[12px] text-np-ink"
          >
            <option value={100}>100 м</option>
            <option value={300}>300 м</option>
            <option value={500}>500 м</option>
            <option value={1000}>1 км</option>
          </select>
        </label>

        <div className="flex items-center gap-2 text-[11px] text-np-slate">
          <Users size={13} />
          Клієнтів у квадраті
          <input
            type="number"
            min={0}
            max={500}
            value={filters.cliMin}
            onChange={(e) => update({ cliMin: parseInt(e.target.value) || 0 })}
            className="w-16 rounded-md border border-np-line bg-white px-2 py-1 text-[12px]"
          />
          <span>—</span>
          <input
            type="number"
            min={0}
            max={500}
            value={filters.cliMax}
            onChange={(e) => update({ cliMax: parseInt(e.target.value) || 500 })}
            className="w-16 rounded-md border border-np-line bg-white px-2 py-1 text-[12px]"
          />
        </div>

        <div className="h-7 w-px bg-np-line" />

        <div className="flex flex-wrap items-center gap-4">
          {INFRA_META.map(({ key, label, icon: Icon }) => (
            <div key={key} className="flex items-center gap-2">
              <span className="flex items-center gap-1 text-[11px] text-np-slate">
                <Icon size={13} className={key === 'postomat' ? 'text-np-red' : ''} />
                {label}
              </span>
              <div className="inline-flex rounded-lg bg-[#EEF0F2] p-0.5">
                {(['all', 'yes', 'no'] as InfraMode[]).map((mode) => {
                  const on = filters.infra[key] === mode
                  const color =
                    on && mode === 'yes'
                      ? 'text-green-700'
                      : on && mode === 'no'
                        ? 'text-np-red'
                        : on
                          ? 'text-np-ink'
                          : 'text-np-slate'
                  return (
                    <button
                      key={mode}
                      onClick={() => update({ infra: { ...filters.infra, [key]: mode } })}
                      className={`rounded-md px-2 py-1 text-[11px] transition ${color} ${
                        on ? 'bg-white font-semibold shadow-sm' : ''
                      }`}
                    >
                      {SEG_LABELS[mode]}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function Select({
  label,
  value,
  onChange,
  options,
  placeholder,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: string[]
  placeholder: string
}) {
  return (
    <div>
      <label className="mb-0.5 block text-[10px] uppercase tracking-wide text-np-slate">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="min-w-[120px] rounded-md border border-np-line bg-white px-2 py-1.5 text-[12px] text-np-ink"
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  )
}
