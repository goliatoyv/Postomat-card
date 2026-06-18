import { useState } from 'react'
import {
  Boxes,
  MapPin,
  Star,
  BarChart3,
  UsersRound,
  PackageOpen,
  Gauge,
  UserCog,
  Tags,
  CalendarRange,
  ArrowRight,
  ArrowUpFromLine,
  ArrowDownToLine,
  Moon,
  Sun,
  ShoppingCart,
  Globe,
  Banknote,
  Coins,
} from 'lucide-react'
import type { PostomatDetail } from '../types'
import { fmt, money } from '../lib/format'
import Heatmap from './Heatmap'

export default function DetailPanel({ postomat: p }: { postomat: PostomatDetail }) {
  return (
    <div className="detail-enter" key={p.id}>
      {/* Шапка картки */}
      <div className="sticky top-0 z-10 border-b border-np-line bg-white px-5 py-3.5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-np-red text-white">
                <Boxes size={15} />
              </span>
              <h2 className="text-[16px] font-bold text-np-ink">{p.name}</h2>
            </div>
            <div className="mt-1 flex items-center gap-1 text-[12px] text-np-slate">
              <MapPin size={12} />
              {p.address}
            </div>
          </div>
          <div className="shrink-0 text-right">
            <div className="text-[11px] text-np-slate">Рейтинг</div>
            <div className="flex items-center gap-1 text-lg font-bold leading-none text-np-red">
              {p.rating}
              <Star size={13} fill="currentColor" />
            </div>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2">
          <Kpi label="ЕН / рік" value={fmt(p.totalEN)} />
          <Kpi label="Клієнтів/міс" value={fmt(p.totalClients)} />
          <Kpi label="Комірок" value={String(p.cells)} />
        </div>
      </div>

      <div className="space-y-5 px-5 py-4">
        <Section n={1} title="Загальна динаміка та обсяги" icon={BarChart3} />
        <MonthlyBlock p={p} />

        <Section n={2} title="Концентрація та ТОП-клієнти" icon={UsersRound} />
        <ConcentrationBlock p={p} />
        <TopClientsBlock p={p} />

        <Section n={3} title="Профіль відправлень" icon={PackageOpen} />
        <ShipmentBlock p={p} />
        <FlowsBlock p={p} />

        <Section n={4} title="Операційна ефективність" icon={Gauge} />
        <PickupBlock p={p} />
        <RedirectBlock p={p} />

        <Section n={5} title="Профіль та поведінка клієнта" icon={UserCog} />
        <GeoTypeBlock p={p} />
        <RfmBlock p={p} />

        <Section n={6} title="Спец-вантажі та фінанси" icon={Tags} />
        <SpecialBlock p={p} />

        <Section n={7} title="Теплова карта активності" icon={CalendarRange} />
        <Card>
          <Heatmap postomat={p} />
        </Card>

        <div className="pb-6 pt-2 text-center text-[10px] text-np-slate">
          Джерела: Report_HeatMap_refact_WhData_v · _Rentability_and_Rent_v ·
          _dim_bielik_dev_v · _UserPoints_not_in_Buffer_v
        </div>
      </div>
    </div>
  )
}

/* ---------- Блок 1: помісячна динаміка + перемикач доходу ---------- */
function MonthlyBlock({ p }: { p: PostomatDetail }) {
  const [rev, setRev] = useState<'gross' | 'local'>('gross')
  const revData = p.monthly.map((m) => (rev === 'gross' ? m.grossRev : m.localRev))
  const revSum = revData.reduce((a, b) => a + b, 0)
  const enMax = Math.max(...p.monthly.map((m) => m.en), 1)
  const revMax = Math.max(...revData, 1)

  const W = 320
  const H = 130
  const bw = W / p.monthly.length

  return (
    <Card>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[12px] text-np-slate">Дохід · модель розрахунку</span>
        <Toggle
          value={rev}
          onChange={(v) => setRev(v)}
          options={[
            { key: 'gross', label: 'Валовий потік' },
            { key: 'local', label: 'Локальний дохід' },
          ]}
        />
      </div>
      <div className="mb-2 flex items-center gap-4">
        <div>
          <div className="text-[10px] text-np-slate">Сума за період</div>
          <div className="text-lg font-bold text-np-red">{money(revSum)}</div>
        </div>
        <div>
          <div className="text-[10px] text-np-slate">Сер. ЕН/міс</div>
          <div className="text-lg font-bold text-np-ink">{fmt(Math.round(p.totalEN / 12))}</div>
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
        {p.monthly.map((m, i) => {
          const h = (m.en / enMax) * (H - 24)
          return (
            <rect
              key={i}
              x={i * bw + 3}
              y={H - 16 - h}
              width={bw - 6}
              height={h}
              rx={2}
              fill="#DA291C"
            />
          )
        })}
        <polyline
          fill="none"
          stroke="#2B2B2B"
          strokeWidth={1.5}
          points={revData
            .map((v, i) => `${i * bw + bw / 2},${H - 16 - (v / revMax) * (H - 24)}`)
            .join(' ')}
        />
        {revData.map((v, i) => (
          <circle
            key={i}
            cx={i * bw + bw / 2}
            cy={H - 16 - (v / revMax) * (H - 24)}
            r={2}
            fill="#2B2B2B"
          />
        ))}
        {p.monthly.map((m, i) => (
          <text key={i} x={i * bw + bw / 2} y={H - 4} fontSize={7} textAnchor="middle" fill="#5A5F66">
            {m.m}
          </text>
        ))}
      </svg>
      <div className="mt-1 flex gap-4 text-[10px] text-np-slate">
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 bg-np-red" /> ЕН
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-0.5 w-3 bg-np-graphite" /> Дохід ₴
        </span>
      </div>
    </Card>
  )
}

/* ---------- Блок 2 ---------- */
function ConcentrationBlock({ p }: { p: PostomatDetail }) {
  const max = Math.max(...p.concentration.map((c) => c.v))
  return (
    <Card>
      <div className="mb-2 text-[12px] text-np-slate">
        Пріоритетність у портфелі клієнта (доля локації в обсязі клієнта)
      </div>
      <div className="space-y-1.5">
        {p.concentration.map((c) => (
          <div key={c.label} className="flex items-center gap-2 text-[11px]">
            <span className="w-14 text-np-slate">{c.label}</span>
            <Bar value={c.v} max={max} color="#DA291C" opacity={0.8} />
            <span className="w-8 text-right font-semibold">{c.v}</span>
          </div>
        ))}
      </div>
    </Card>
  )
}

function TopClientsBlock({ p }: { p: PostomatDetail }) {
  return (
    <Card>
      <div className="mb-2 text-[12px] text-np-slate">ТОП-20 клієнтів (за к-стю ЕН)</div>
      <div className="max-h-56 overflow-y-auto">
        <table className="w-full text-[11px]">
          <thead className="sticky top-0 bg-white text-left text-np-slate">
            <tr>
              <th className="py-1">#</th>
              <th>Клієнт</th>
              <th>Телефон</th>
              <th className="text-right">ЕН</th>
              <th className="text-right">Сума</th>
            </tr>
          </thead>
          <tbody>
            {p.top.map((t, i) => (
              <tr key={i} className="border-t border-np-line/70">
                <td className="py-1 text-np-slate">{i + 1}</td>
                <td className="font-medium">{t.name}</td>
                <td className="font-mono text-np-slate">{t.phone}</td>
                <td className="text-right font-semibold">{t.en}</td>
                <td className="text-right">{money(t.sum)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}

/* ---------- Блок 3 ---------- */
function ShipmentBlock({ p }: { p: PostomatDetail }) {
  const cols: Record<string, string> = {
    Документи: '#5A5F66',
    Маленька: '#0284c7',
    Середня: '#d97706',
    Велика: '#DA291C',
  }
  const tot = Object.values(p.dims).reduce((a, b) => a + b, 0)
  return (
    <Card>
      <div className="mb-2 text-[12px] text-np-slate">Габаритна сітка</div>
      <div className="flex h-7 overflow-hidden rounded text-[10px] font-semibold text-white">
        {Object.entries(p.dims).map(([k, v]) => (
          <div
            key={k}
            title={k}
            className="flex items-center justify-center"
            style={{ width: `${(v / tot) * 100}%`, background: cols[k] }}
          >
            {Math.round((v / tot) * 100)}%
          </div>
        ))}
      </div>
      <div className="mt-2 flex flex-wrap gap-3 text-[10px] text-np-slate">
        {Object.entries(cols).map(([k, c]) => (
          <span key={k} className="flex items-center gap-1">
            <span className="inline-block h-2 w-2" style={{ background: c }} />
            {k}
          </span>
        ))}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3">
        <div>
          <div className="mb-1 flex items-center gap-1 text-[11px] font-semibold text-np-graphite">
            <ArrowUpFromLine size={12} className="text-np-red" /> Топ — Відправки
          </div>
          <MiniProd data={p.prodSend} />
        </div>
        <div>
          <div className="mb-1 flex items-center gap-1 text-[11px] font-semibold text-np-graphite">
            <ArrowDownToLine size={12} className="text-sky-600" /> Топ — Отримання
          </div>
          <MiniProd data={p.prodRecv} />
        </div>
      </div>
    </Card>
  )
}

function FlowsBlock({ p }: { p: PostomatDetail }) {
  const max = Math.max(...Object.values(p.flows))
  return (
    <Card>
      <div className="mb-2 text-[12px] text-np-slate">Матриця потоків (Звідки → Куди)</div>
      {Object.entries(p.flows).map(([k, v]) => {
        const [from, to] = k.split(' → ')
        return (
          <div key={k} className="mb-1.5 flex items-center gap-2 text-[11px]">
            <span className="flex w-40 items-center gap-1 text-np-graphite">
              {from}
              <ArrowRight size={11} className="text-np-red" />
              {to}
            </span>
            <Bar value={v} max={max} color="#2B2B2B" opacity={0.7} />
            <span className="w-8 text-right font-semibold">{v}%</span>
          </div>
        )
      })}
    </Card>
  )
}

/* ---------- Блок 4 ---------- */
function PickupBlock({ p }: { p: PostomatDetail }) {
  const max = Math.max(...p.pickupSpeed.map((s) => s.v))
  return (
    <Card>
      <div className="mb-2 text-[12px] text-np-slate">Швидкість забору (час у комірці)</div>
      <div className="flex h-24 items-end gap-1.5">
        {p.pickupSpeed.map((s) => (
          <div key={s.label} className="flex flex-1 flex-col items-center justify-end gap-1">
            <span className="text-[10px] font-semibold">{s.v}%</span>
            <div
              className="w-full rounded-t"
              style={{ height: `${(s.v / max) * 100}%`, background: 'linear-gradient(180deg,#DA291C,#f97316)' }}
            />
            <span className="text-center text-[9px] leading-none text-np-slate">{s.label}</span>
          </div>
        ))}
      </div>
    </Card>
  )
}

function RedirectBlock({ p }: { p: PostomatDetail }) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-np-line border-l-4 border-l-np-red bg-white p-3">
      <div className="text-center">
        <div className="text-3xl font-extrabold leading-none text-np-red">{p.redirects.pct}%</div>
        <div className="mt-1 text-[10px] text-np-slate">переадресацій</div>
      </div>
      <div className="text-[12px] text-np-graphite">
        <b>{fmt(p.redirects.en)} ЕН</b> переадресовано через дефіцит вільних комірок.
        <div className="mt-1 text-[11px] text-np-slate">Індикатор перевантаження локації.</div>
      </div>
    </div>
  )
}

/* ---------- Блок 5 ---------- */
function GeoTypeBlock({ p }: { p: PostomatDetail }) {
  return (
    <Card>
      <div className="mb-2 text-[12px] text-np-slate">Гео-тип клієнта (за годинами активності)</div>
      <div className="flex h-8 overflow-hidden rounded text-[11px] font-semibold text-white">
        <div
          className="flex items-center justify-center gap-1 bg-indigo-600"
          style={{ width: `${p.nightShare}%` }}
        >
          <Moon size={11} />
          {p.nightShare}%
        </div>
        <div
          className="flex items-center justify-center gap-1 bg-amber-500"
          style={{ width: `${100 - p.nightShare}%` }}
        >
          <Sun size={11} />
          {100 - p.nightShare}%
        </div>
      </div>
      <div className="mt-1 flex justify-between text-[10px] text-np-slate">
        <span>Нічний (живе тут)</span>
        <span>Денний (працює поруч)</span>
      </div>
    </Card>
  )
}

function RfmBlock({ p }: { p: PostomatDetail }) {
  return (
    <Card>
      <div className="mb-2 text-[12px] text-np-slate">
        Маркетинговий профіль (RFM / CVO) — локація vs корпорація
      </div>
      <div className="grid grid-cols-2 gap-2">
        {p.rfm.map((s) => {
          const diff = s.loc - s.corp
          return (
            <div key={s.seg} className="rounded-lg border border-np-line p-2">
              <div className="text-[11px] font-semibold text-np-graphite">{s.seg}</div>
              <div className="mt-1 flex items-end gap-2">
                <span className="text-xl font-bold text-np-ink">{s.loc}%</span>
                <span className={`text-[11px] font-semibold ${diff >= 0 ? 'text-green-600' : 'text-np-red'}`}>
                  {diff >= 0 ? '+' : ''}
                  {diff} п.п.
                </span>
              </div>
              <div className="text-[10px] text-np-slate">корп: {s.corp}%</div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}

/* ---------- Блок 6 ---------- */
function SpecialBlock({ p }: { p: PostomatDetail }) {
  const mpMax = Math.max(...Object.values(p.marketplaces))
  const valMax = Math.max(...p.valuation.map((v) => v.v))
  return (
    <div className="grid grid-cols-2 gap-3">
      <Card>
        <div className="mb-2 flex items-center gap-1 text-[12px] text-np-slate">
          <ShoppingCart size={13} className="text-np-red" /> Маркетплейси
        </div>
        {Object.entries(p.marketplaces).map(([k, v]) => (
          <div key={k} className="mb-1 flex items-center gap-2 text-[11px]">
            <span className="w-16">{k}</span>
            <Bar value={v} max={mpMax} color="#DA291C" opacity={0.7} />
            <span className="w-7 text-right font-semibold">{v}%</span>
          </div>
        ))}
      </Card>

      <Card className="flex flex-col items-center justify-center">
        <div className="mb-1 flex items-center gap-1 text-[12px] text-np-slate">
          <Globe size={13} className="text-sky-600" /> Імпорт
        </div>
        <div className="text-3xl font-extrabold text-sky-600">{p.importPct}%</div>
        <div className="text-[10px] text-np-slate">міжнародних посилок</div>
      </Card>

      <Card className="col-span-2">
        <div className="mb-2 flex items-center gap-1 text-[12px] text-np-slate">
          <Banknote size={13} className="text-green-600" /> Післяплата (наложка)
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          <MiniStat label="Загальна сума" value={money(p.cod.totalSum)} />
          <MiniStat label="Сер.чек (відпр.)" value={money(p.cod.avgSend)} />
          <MiniStat label="Сер.чек (отрим.)" value={money(p.cod.avgRecv)} />
        </div>
        <div className="mt-2 flex justify-center gap-4 text-[10px] text-np-slate">
          <span>
            Відправка: <b>{p.cod.sendCount} ЕН</b>
          </span>
          <span>
            Отримання: <b>{p.cod.recvCount} ЕН</b>
          </span>
        </div>
      </Card>

      <Card className="col-span-2">
        <div className="mb-2 flex items-center gap-1 text-[12px] text-np-slate">
          <Coins size={13} className="text-amber-600" /> Оціночна вартість (розподіл)
        </div>
        <div className="flex h-20 items-end gap-2">
          {p.valuation.map((v) => (
            <div key={v.label} className="flex flex-1 flex-col items-center justify-end gap-1">
              <span className="text-[10px] font-semibold">{v.v}%</span>
              <div className="w-full rounded-t bg-amber-500" style={{ height: `${(v.v / valMax) * 100}%` }} />
              <span className="text-[9px] text-np-slate">{v.label}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

/* ================= Дрібні переюзні компоненти ================= */
function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-xl border border-np-line bg-white p-3 ${className}`}>{children}</div>
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-np-line bg-white px-2.5 py-2">
      <div className="text-[10px] text-np-slate">{label}</div>
      <div className="font-bold text-np-ink">{value}</div>
    </div>
  )
}

function Section({ n, title, icon: Icon }: { n: number; title: string; icon: typeof Boxes }) {
  return (
    <div className="flex items-center gap-2 pt-1">
      <span className="flex h-6 w-6 items-center justify-center rounded bg-np-graphite text-[11px] font-bold text-white">
        {n}
      </span>
      <h3 className="flex items-center gap-1 text-[13px] font-bold uppercase tracking-wide text-np-ink">
        <Icon size={14} className="text-np-red" />
        {title}
      </h3>
      <div className="h-px flex-1 bg-np-line" />
    </div>
  )
}

function Bar({ value, max, color, opacity = 1 }: { value: number; max: number; color: string; opacity?: number }) {
  return (
    <div className="h-3.5 flex-1 overflow-hidden rounded bg-np-bg">
      <div className="h-full" style={{ width: `${(value / max) * 100}%`, background: color, opacity }} />
    </div>
  )
}

function MiniProd({ data }: { data: { p: string; v: number }[] }) {
  const max = Math.max(...data.map((x) => x.v))
  return (
    <>
      {data.map((x) => (
        <div key={x.p} className="mb-1 flex items-center gap-2 text-[11px]">
          <span className="w-20 truncate text-np-slate">{x.p}</span>
          <Bar value={x.v} max={max} color="#2B2B2B" opacity={0.6} />
          <span className="w-6 text-right">{x.v}</span>
        </div>
      ))}
    </>
  )
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] text-np-slate">{label}</div>
      <div className="text-[13px] font-bold text-np-ink">{value}</div>
    </div>
  )
}

function Toggle<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T
  onChange: (v: T) => void
  options: { key: T; label: string }[]
}) {
  return (
    <div className="inline-flex rounded-lg bg-[#EEF0F2] p-0.5">
      {options.map((o) => (
        <button
          key={o.key}
          onClick={() => onChange(o.key)}
          className={`rounded-md px-2 py-1 text-[11px] transition ${
            value === o.key ? 'bg-white font-semibold text-np-ink shadow-sm' : 'text-np-slate'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
