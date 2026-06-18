import { useMemo, useRef, useState } from 'react'
import { Move, Lasso, Eraser, Info } from 'lucide-react'
import type { Cell, Filters, InfraKey } from '../types'
import type { GeneratedData } from '../data/mockData'
import { densityColor, pointInPoly } from '../lib/format'

const SVG_W = 1000
const SVG_H = 640

interface Props {
  data: GeneratedData
  filters: Filters
  selectedId: number | null
  onSelect: (id: number) => void
  onLasso: (pts: { x: number; y: number }[] | null) => void
}

const INFRA_COLORS: Record<InfraKey, string> = {
  postomat: '#DA291C',
  cargo: '#d97706',
  branch: '#0284c7',
  pudo: '#7c3aed',
}

export default function MapPanel({ data, filters, selectedId, onSelect, onLasso }: Props) {
  const [tool, setTool] = useState<'pan' | 'lasso'>('pan')
  const [drawing, setDrawing] = useState(false)
  const [pts, setPts] = useState<{ x: number; y: number }[]>([])
  const svgRef = useRef<SVGSVGElement>(null)

  const { cells, cols, rows } = data
  const cwR = SVG_W / cols
  const chR = SVG_H / rows
  const maxClients = useMemo(() => Math.max(...cells.map((c) => c.clients), 1), [cells])

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
      if (!pointInPoly(cell.gx * cwR + cwR / 2, cell.gy * chR + chR / 2, filters.lasso)) return false
    }
    return true
  }

  const visibleCells = cells.filter(passes)
  const postomatsShown = visibleCells.filter((c) => c.postomat && filters.infra.postomat !== 'no').length

  // Перетворення координат миші у простір SVG (viewBox 1000×640)
  const toSvg = (e: React.MouseEvent): { x: number; y: number } => {
    const rect = svgRef.current!.getBoundingClientRect()
    return {
      x: ((e.clientX - rect.left) / rect.width) * SVG_W,
      y: ((e.clientY - rect.top) / rect.height) * SVG_H,
    }
  }

  const onDown = (e: React.MouseEvent) => {
    if (tool !== 'lasso') return
    setDrawing(true)
    setPts([toSvg(e)])
  }
  const onMove = (e: React.MouseEvent) => {
    if (!drawing) return
    setPts((p) => [...p, toSvg(e)])
  }
  const onUp = () => {
    if (!drawing) return
    setDrawing(false)
    if (pts.length > 2) onLasso(pts)
  }

  const sz = Math.max(4, Math.min(8, cwR / 4))

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#EAF0EC]">
      {/* Тулбар */}
      <div className="absolute left-3 top-3 z-30 flex items-center gap-2">
        <div className="flex rounded-lg border border-np-line bg-white/95 shadow-sm backdrop-blur">
          <ToolBtn active={tool === 'pan'} onClick={() => setTool('pan')} title="Переміщення">
            <Move size={14} />
          </ToolBtn>
          <ToolBtn active={tool === 'lasso'} onClick={() => setTool('lasso')} title="Виділити зону" border>
            <Lasso size={14} />
          </ToolBtn>
          <ToolBtn
            active={false}
            onClick={() => {
              onLasso(null)
              setPts([])
            }}
            title="Очистити виділення"
            border
          >
            <Eraser size={14} />
          </ToolBtn>
        </div>
        <div className="rounded-lg border border-np-line bg-white/95 px-3 py-2 text-[11px] text-np-slate shadow-sm backdrop-blur">
          <Info size={12} className="mr-1 inline text-np-red" />
          Клік по поштомату — деталізація
        </div>
      </div>

      {/* Статус */}
      <div className="absolute right-3 top-3 z-30 rounded-full border border-np-line bg-white/95 px-3 py-1.5 text-[11px] text-np-slate shadow-sm backdrop-blur">
        {visibleCells.length} квадратів · <b>{postomatsShown}</b> поштоматів
      </div>

      {/* Легенда */}
      <div className="absolute bottom-3 left-3 z-30 rounded-lg border border-np-line bg-white/95 px-3 py-2 shadow-sm backdrop-blur">
        <div className="mb-1 text-[10px] uppercase tracking-wide text-np-slate">Щільність клієнтів</div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-np-slate">мало</span>
          <div
            className="h-2.5 w-32 rounded-full"
            style={{ background: 'linear-gradient(90deg,#16a34a,#eab308,#f97316,#DA291C)' }}
          />
          <span className="text-[10px] text-np-slate">багато</span>
        </div>
        <div className="mt-2 flex items-center gap-3 text-[10px] text-np-slate">
          <Dot color={INFRA_COLORS.postomat} label="Поштомат" />
          <Dot color={INFRA_COLORS.cargo} label="Вантажне" />
          <Dot color={INFRA_COLORS.branch} label="Відділення" />
          <Dot color={INFRA_COLORS.pudo} label="ПУДО" />
        </div>
      </div>

      <svg
        ref={svgRef}
        viewBox={`0 0 ${SVG_W} ${SVG_H}`}
        className="block h-full w-full"
        style={{ cursor: tool === 'lasso' ? 'crosshair' : 'grab' }}
        onMouseDown={onDown}
        onMouseMove={onMove}
        onMouseUp={onUp}
        onMouseLeave={onUp}
      >
        {cells.map((cell) => {
          const visible = passes(cell)
          const x = cell.gx * cwR
          const y = cell.gy * chR
          return (
            <rect
              key={cell.id}
              className={`geo-cell${visible ? '' : ' dimmed'}`}
              x={x + 1}
              y={y + 1}
              width={cwR - 2}
              height={chR - 2}
              rx={3}
              fill={densityColor(cell.clients, maxClients)}
              fillOpacity={0.55}
              stroke="#fff"
              strokeWidth={0.8}
            />
          )
        })}

        {/* Маркери інфраструктури — лише видимі клітини */}
        {visibleCells.map((cell) => {
          const cx = cell.gx * cwR + cwR / 2
          const cy = cell.gy * chR + chR / 2
          const markers: { key: InfraKey; pid?: number }[] = []
          if (cell.postomat && filters.infra.postomat !== 'no')
            markers.push({ key: 'postomat', pid: cell.postomatId })
          if (cell.cargo && filters.infra.cargo !== 'no') markers.push({ key: 'cargo' })
          if (cell.branch && filters.infra.branch !== 'no') markers.push({ key: 'branch' })
          if (cell.pudo && filters.infra.pudo !== 'no') markers.push({ key: 'pudo' })

          return markers.map((mk, i) => {
            const ox = cx + (i - (markers.length - 1) / 2) * (sz + 3)
            const isSel = mk.key === 'postomat' && mk.pid === selectedId
            const common = {
              fill: INFRA_COLORS[mk.key],
              stroke: '#fff',
            }
            return mk.key === 'postomat' ? (
              <rect
                key={`${cell.id}-${i}`}
                className={`infra-marker${isSel ? ' marker-active' : ''}`}
                x={ox - sz / 2}
                y={cy - sz / 2}
                width={sz}
                height={sz}
                rx={1.5}
                strokeWidth={isSel ? 2 : 1}
                style={{ cursor: 'pointer' }}
                onClick={(e) => {
                  e.stopPropagation()
                  if (mk.pid != null) onSelect(mk.pid)
                }}
                {...common}
              />
            ) : (
              <circle
                key={`${cell.id}-${i}`}
                className="infra-marker"
                cx={ox}
                cy={cy}
                r={sz / 2}
                strokeWidth={1}
                {...common}
              />
            )
          })
        })}

        {/* Поточний контур лассо */}
        {(drawing ? pts : filters.lasso ?? []).length > 1 && (
          <path
            className="lasso-path"
            d={
              'M' +
              (drawing ? pts : filters.lasso!).map((p) => `${p.x},${p.y}`).join(' L') +
              ' Z'
            }
          />
        )}
      </svg>
    </div>
  )
}

function ToolBtn({
  active,
  onClick,
  title,
  border,
  children,
}: {
  active: boolean
  onClick: () => void
  title: string
  border?: boolean
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`px-3 py-2 ${border ? 'border-l border-np-line' : ''} ${
        active ? 'bg-np-red text-white' : 'text-np-graphite'
      }`}
    >
      {children}
    </button>
  )
}

function Dot({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1">
      <span className="inline-block h-2 w-2 rounded-full" style={{ background: color }} />
      {label}
    </span>
  )
}
