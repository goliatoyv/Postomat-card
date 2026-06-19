import { useState } from 'react'
import type { HeatMode, PostomatDetail } from '../types'
import { densityColor } from '../lib/format'

const DAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд']
const TABS: { key: HeatMode; label: string }[] = [
  { key: 'all', label: 'Всього' },
  { key: 'send', label: 'Відправка' },
  { key: 'recv', label: 'Отримання' },
]

export default function Heatmap({ postomat }: { postomat: PostomatDetail }) {
  const [mode, setMode] = useState<HeatMode>('all')
  const grid = postomat.heat[mode]
  const max = Math.max(...grid.flat(), 1)

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[12px] text-np-slate">Логи активності · день × година</span>
        <div className="inline-flex rounded-lg bg-[#EEF0F2] p-0.5">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setMode(t.key)}
              className={`rounded-md px-2 py-1 text-[11px] transition ${
                mode === t.key ? 'bg-white font-semibold text-np-ink shadow-sm' : 'text-np-slate'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="border-collapse text-[8px]">
          <thead>
            <tr>
              <th />
              {Array.from({ length: 24 }, (_, h) => (
                <th key={h} className="px-0 font-normal text-np-slate">
                  {h % 2 ? '' : h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {grid.map((row, d) => (
              <tr key={d}>
                <td className="pr-1 font-medium text-np-slate">{DAYS[d]}</td>
                {row.map((v, h) => (
                  <td key={h}>
                    <div
                      title={`${v} логів`}
                      style={{
                        width: 13,
                        height: 13,
                        background: densityColor(v, max),
                        opacity: 0.25 + (v / max) * 0.75,
                        border: '1px solid #fff',
                      }}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
