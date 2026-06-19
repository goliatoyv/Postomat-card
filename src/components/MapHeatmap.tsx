import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Move, Lasso, Eraser, Star, ExternalLink, Activity } from 'lucide-react'
import type { Cell, Filters, InfraKey } from '../types'
import type { GeneratedData } from '../data/mockData'
import { drawHeatmap, type HeatPoint } from '../lib/heatmap'
import { fmt, statusOf, pointInPoly } from '../lib/format'
import { postomatHref } from '../lib/useHashRoute'

interface Props {
  data: GeneratedData
  filters: Filters
  onLasso: (pts: { x: number; y: number }[] | null) => void
}

const INFRA_DOT: Record<Exclude<InfraKey, 'postomat'>, string> = {
  cargo: '#d97706',
  branch: '#0284c7',
  pudo: '#7c3aed',
}

interface Hover {
  id: number
  px: number
  py: number
}

export default function MapHeatmap({ data, filters, onLasso }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [size, setSize] = useState({ w: 0, h: 0 })
  const [tool, setTool] = useState<'pan' | 'lasso'>('pan')
  const [drawing, setDrawing] = useState(false)
  const [pts, setPts] = useState<{ x: number; y: number }[]>([]) // нормалізовані 0..1
  const [hover, setHover] = useState<Hover | null>(null)
  const hideTimer = useRef<number | null>(null)

  const { cells, cols, rows, postomats } = data
  const { w, h } = size

  // Розмір контейнера
  useLayoutEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const ro = new ResizeObserver(() => {
      const r = el.getBoundingClientRect()
      setSize({ w: Math.round(r.width), h: Math.round(r.height) })
    })
    ro.observe(el)
    const r = el.getBoundingClientRect()
    setSize({ w: Math.round(r.width), h: Math.round(r.height) })
    return () => ro.disconnect()
  }, [])

  // Предикат видимості клітини (AND-логіка)
  const passes = (cell: Cell): boolean => {
    if (filters.oblast && cell.oblast !== filters.oblast) return false
    if (filters.rayon && cell.rayon !== filters.rayon) return false
    if (filters.city && cell.city !== filters.city) return false
    if (filters.nptype && cell.npType !== filters.nptype) return false
    if (cell.clients < filters.cliMin || cell.clients > filters.cliMax) return false
    for (const key of ['postomat', 'cargo', 'branch', 'pudo'] as InfraKey[]) {
      const mode = filters.infra[key]
      if (mode === 'yes' && !cell[key]) return false
      if (mode === 'no' && cell[key]) return false
    }
    if (filters.lasso && filters.lasso.length > 2) {
      if (!pointInPoly((cell.gx + 0.5) / cols, (cell.gy + 0.5) / rows, filters.lasso)) return false
    }
    return true
  }

  const visible = cells.filter(passes)
  const maxClients = Math.max(...cells.map((c) => c.clients), 1)

  // Перемальовування теплової карти
  useEffect(() => {
    const cv = canvasRef.current
    if (!cv || w === 0 || h === 0) return
    const points: HeatPoint[] = visible.map((c) => ({
      x: ((c.gx + 0.5) / cols) * w,
      y: ((c.gy + 0.5) / rows) * h,
      w: Math.pow(c.clients / maxClients, 0.75),
    }))
    const radius = Math.max(w / cols, h / rows) * 1.7
    drawHeatmap(cv, w, h, points, radius)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [w, h, cols, rows, maxClients, JSON.stringify(filters)])

  // Координати миші → нормалізовані
  const norm = (e: React.MouseEvent) => {
    const r = wrapRef.current!.getBoundingClientRect()
    return { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height }
  }

  const onDown = (e: React.MouseEvent) => {
    if (tool !== 'lasso') return
    setDrawing(true)
    setPts([norm(e)])
  }
  const onMove = (e: React.MouseEvent) => {
    if (!drawing) return
    setPts((p) => [...p, norm(e)])
  }
  const onUp = () => {
    if (!drawing) return
    setDrawing(false)
    if (pts.length > 2) onLasso(pts)
  }

  const showHover = (id: number, px: number, py: number) => {
    if (hideTimer.current) window.clearTimeout(hideTimer.current)
    setHover({ id, px, py })
  }
  const scheduleHide = () => {
    hideTimer.current = window.setTimeout(() => setHover(null), 120)
  }

  const sz = Math.max(7, Math.min(13, w / cols / 2.2))
  const lassoPts = drawing ? pts : filters.lasso ?? []

  // Зведення по видимих поштоматах
  const shownPostomats = visible.filter((c) => c.postomat && filters.infra.postomat !== 'no')
  const avgUtil =
    shownPostomats.length > 0
      ? Math.round(
          shownPostomats.reduce((s, c) => s + (postomats[c.postomatId!]?.util ?? 0), 0) / shownPostomats.length,
        )
      : 0

  const hovered = hover ? postomats[hover.id] : null

  return (
    <div
      ref={wrapRef}
      className="relative h-full w-full overflow-hidden"
      style={{
        background:
          'radial-gradient(circle at 30% 20%, #11161d 0%, #0b0f14 55%, #070a0e 100%)',
        cursor: tool === 'lasso' ? 'crosshair' : 'default',
      }}
    >
      {/* Декоративна гео-сітка-підкладка */}
      <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.07]">
        <defs>
          <pattern id="grid" width="48" height="48" patternUnits="userSpaceOnUse">
            <path d="M48 0H0V48" fill="none" stroke="#fff" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>

      {/* Теплова карта (canvas) */}
      <canvas ref={canvasRef} className="pointer-events-none absolute inset-0" style={{ width: w, height: h }} />

      {/* Інтерактивний шар маркерів + лассо */}
      <svg
        viewBox={`0 0 ${w || 1} ${h || 1}`}
        className="absolute inset-0 h-full w-full"
        onMouseDown={onDown}
        onMouseMove={onMove}
        onMouseUp={onUp}
        onMouseLeave={onUp}
      >
        {visible.map((cell) => {
          const cx = ((cell.gx + 0.5) / cols) * w
          const cy = ((cell.gy + 0.5) / rows) * h
          const extras: { key: 'cargo' | 'branch' | 'pudo' }[] = []
          if (cell.cargo && filters.infra.cargo !== 'no') extras.push({ key: 'cargo' })
          if (cell.branch && filters.infra.branch !== 'no') extras.push({ key: 'branch' })
          if (cell.pudo && filters.infra.pudo !== 'no') extras.push({ key: 'pudo' })

          return (
            <g key={cell.id}>
              {/* Дрібні інфра-точки */}
              {extras.map((ex, i) => (
                <circle
                  key={ex.key}
                  cx={cx + (i - (extras.length - 1) / 2) * 6}
                  cy={cy + sz * 0.9}
                  r={2}
                  fill={INFRA_DOT[ex.key]}
                  stroke="#0b0f14"
                  strokeWidth={0.6}
                />
              ))}

              {/* Маркер поштомата (колір = утилізація) */}
              {cell.postomat && filters.infra.postomat !== 'no' && cell.postomatId != null && (() => {
                const det = postomats[cell.postomatId]
                const st = statusOf(det.util)
                const isHover = hover?.id === cell.postomatId
                return (
                  <rect
                    className="infra-marker"
                    x={cx - sz / 2}
                    y={cy - sz / 2}
                    width={sz}
                    height={sz}
                    rx={sz * 0.28}
                    fill={st.color}
                    stroke="#fff"
                    strokeWidth={isHover ? 2 : 1}
                    style={{ cursor: 'pointer', filter: isHover ? 'drop-shadow(0 0 6px rgba(255,255,255,.6))' : 'none' }}
                    onMouseEnter={() => showHover(cell.postomatId!, cx, cy)}
                    onMouseLeave={scheduleHide}
                    onClick={(e) => {
                      e.stopPropagation()
                      window.open(postomatHref(filters.grid, cell.postomatId!), '_blank', 'noopener')
                    }}
                  />
                )
              })()}
            </g>
          )
        })}

        {/* Контур лассо */}
        {lassoPts.length > 1 && (
          <path
            className="lasso-path"
            d={'M' + lassoPts.map((p) => `${p.x * w},${p.y * h}`).join(' L') + ' Z'}
          />
        )}
      </svg>

      {/* Tooltip поштомата */}
      {hovered && hover && (
        <div
          className="absolute z-40 w-60 -translate-x-1/2 -translate-y-full rounded-xl border border-np-line bg-white p-3 shadow-2xl"
          style={{ left: hover.px, top: hover.py - 12 }}
          onMouseEnter={() => {
            if (hideTimer.current) window.clearTimeout(hideTimer.current)
          }}
          onMouseLeave={scheduleHide}
        >
          <div className="text-[13px] font-bold text-np-ink">{hovered.name}</div>
          <div className="mb-2 text-[11px] text-np-slate">{hovered.address}</div>
          <div className="mb-2 grid grid-cols-3 gap-1 text-center">
            <Mini label="рейтинг" value={hovered.rating} icon={<Star size={11} className="text-np-red" />} />
            <Mini label="ЕН/рік" value={fmt(hovered.totalEN)} />
            <Mini
              label="утиліз."
              value={`${hovered.util}%`}
              color={statusOf(hovered.util).color}
              icon={<Activity size={11} style={{ color: statusOf(hovered.util).color }} />}
            />
          </div>
          <a
            href={postomatHref(filters.grid, hovered.id)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 rounded-lg bg-np-red py-1.5 text-[12px] font-semibold text-white transition hover:bg-np-red2"
          >
            Відкрити картку <ExternalLink size={13} />
          </a>
          {/* Хвостик */}
          <div className="absolute left-1/2 top-full h-2 w-2 -translate-x-1/2 -translate-y-1 rotate-45 border-b border-r border-np-line bg-white" />
        </div>
      )}

      {/* Тулбар */}
      <div className="absolute left-3 top-3 z-30 flex overflow-hidden rounded-lg border border-white/10 bg-black/40 backdrop-blur">
        <ToolBtn active={tool === 'pan'} onClick={() => setTool('pan')} title="Огляд">
          <Move size={14} />
        </ToolBtn>
        <ToolBtn active={tool === 'lasso'} onClick={() => setTool('lasso')} title="Виділити зону">
          <Lasso size={14} />
        </ToolBtn>
        <ToolBtn
          active={false}
          onClick={() => {
            onLasso(null)
            setPts([])
          }}
          title="Очистити виділення"
        >
          <Eraser size={14} />
        </ToolBtn>
      </div>

      {/* KPI-зведення */}
      <div className="absolute right-3 top-3 z-30 flex gap-2">
        <Badge label="Поштоматів" value={fmt(shownPostomats.length)} />
        <Badge label="Квадратів" value={fmt(visible.length)} />
        <Badge label="Сер. утиліз." value={`${avgUtil}%`} accent={statusOf(avgUtil).color} />
      </div>

      {/* Легенда */}
      <div className="absolute bottom-3 left-3 z-30 rounded-xl border border-white/10 bg-black/45 px-3 py-2 text-white backdrop-blur">
        <div className="mb-1 text-[10px] uppercase tracking-wide text-white/60">Щільність клієнтів</div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-white/60">мало</span>
          <div
            className="h-2.5 w-36 rounded-full"
            style={{ background: 'linear-gradient(90deg,#1d4ed8,#16a34a,#eab308,#f97316,#DA291C)' }}
          />
          <span className="text-[10px] text-white/60">багато</span>
        </div>
        <div className="mt-2 flex items-center gap-3 text-[10px] text-white/70">
          <span className="font-semibold text-white/80">Утилізація:</span>
          <Leg color="#16a34a" t="низька" />
          <Leg color="#0284c7" t="оптим." />
          <Leg color="#f97316" t="висока" />
          <Leg color="#DA291C" t="критич." />
        </div>
      </div>

      {/* Підказка про взаємодію */}
      <div className="absolute bottom-3 right-3 z-30 rounded-lg border border-white/10 bg-black/40 px-3 py-1.5 text-[11px] text-white/70 backdrop-blur">
        Наведи на <span className="font-semibold text-white">■</span> поштомат → «Відкрити картку»
      </div>
    </div>
  )
}

function ToolBtn({
  active,
  onClick,
  title,
  children,
}: {
  active: boolean
  onClick: () => void
  title: string
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`px-3 py-2 transition ${active ? 'bg-np-red text-white' : 'text-white/80 hover:bg-white/10'}`}
    >
      {children}
    </button>
  )
}

function Badge({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-black/40 px-3 py-1.5 text-center backdrop-blur">
      <div className="text-[14px] font-bold" style={{ color: accent ?? '#fff' }}>
        {value}
      </div>
      <div className="text-[10px] text-white/60">{label}</div>
    </div>
  )
}

function Mini({
  label,
  value,
  icon,
  color,
}: {
  label: string
  value: string
  icon?: React.ReactNode
  color?: string
}) {
  return (
    <div className="rounded-md bg-np-bg px-1 py-1">
      <div className="flex items-center justify-center gap-0.5 text-[12px] font-bold" style={{ color: color ?? '#1E1E1E' }}>
        {icon}
        {value}
      </div>
      <div className="text-[9px] text-np-slate">{label}</div>
    </div>
  )
}

function Leg({ color, t }: { color: string; t: string }) {
  return (
    <span className="flex items-center gap-1">
      <span className="inline-block h-2 w-2 rounded-sm" style={{ background: color }} />
      {t}
    </span>
  )
}
