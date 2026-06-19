import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Move, Lasso, Eraser } from 'lucide-react'
import type { Cell, Filters, InfraKey } from '../types'
import type { GeneratedData } from '../data/mockData'
import { densityColor, statusOf, fmt, pointInPoly } from '../lib/format'
import { postomatHref } from '../lib/useHashRoute'

interface Props {
  data: GeneratedData
  filters: Filters
  onLasso: (pts: { x: number; y: number }[] | null) => void
}

// Центр Києва — на нього проєктуємо абстрактну гео-сітку
const CENTER: [number, number] = [50.4501, 30.5234]
const METERS_PER_DEG_LAT = 111320

const INFRA_DOT: Record<Exclude<InfraKey, 'postomat'>, string> = {
  cargo: '#d97706',
  branch: '#0284c7',
  pudo: '#7c3aed',
}

export default function MapLeaflet({ data, filters, onLasso }: Props) {
  const elRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const gridLayer = useRef<L.LayerGroup | null>(null)
  const markerLayer = useRef<L.LayerGroup | null>(null)
  const lassoLayer = useRef<L.LayerGroup | null>(null)
  const toolRef = useRef<'pan' | 'lasso'>('pan')
  const lastGrid = useRef<number>(0)

  // KPI overlay refs (оновлюємо без ререндеру React)
  const kpiPm = useRef<HTMLSpanElement>(null)
  const kpiSq = useRef<HTMLSpanElement>(null)
  const kpiUt = useRef<HTMLSpanElement>(null)

  // ── Ініціалізація карти (один раз) ───────────────────────────
  useEffect(() => {
    if (!elRef.current || mapRef.current) return
    const map = L.map(elRef.current, {
      center: CENTER,
      zoom: 12,
      zoomControl: true,
      scrollWheelZoom: true,
    })
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap · © CARTO',
    }).addTo(map)

    gridLayer.current = L.layerGroup().addTo(map)
    markerLayer.current = L.layerGroup().addTo(map)
    lassoLayer.current = L.layerGroup().addTo(map)
    mapRef.current = map

    // Лассо: малювання полігона при затиснутій кнопці у режимі lasso
    let drawing = false
    let pts: L.LatLng[] = []
    let preview: L.Polyline | null = null

    map.on('mousedown', (e: L.LeafletMouseEvent) => {
      if (toolRef.current !== 'lasso') return
      drawing = true
      pts = [e.latlng]
      preview = L.polyline(pts, { color: '#DA291C', weight: 2, dashArray: '5 4' }).addTo(lassoLayer.current!)
    })
    map.on('mousemove', (e: L.LeafletMouseEvent) => {
      if (!drawing || !preview) return
      pts.push(e.latlng)
      preview.setLatLngs(pts)
    })
    map.on('mouseup', () => {
      if (!drawing) return
      drawing = false
      if (pts.length > 2) onLasso(pts.map((p) => ({ x: p.lng, y: p.lat })))
    })

    setTimeout(() => map.invalidateSize(), 100)
    return () => {
      map.remove()
      mapRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Перемальовування сітки та маркерів ───────────────────────
  useEffect(() => {
    const map = mapRef.current
    if (!map || !gridLayer.current || !markerLayer.current) return
    gridLayer.current.clearLayers()
    markerLayer.current.clearLayers()

    const { cells, cols, rows, postomats } = data
    const cellM = filters.grid
    const degLat = cellM / METERS_PER_DEG_LAT
    const degLng = cellM / (METERS_PER_DEG_LAT * Math.cos((CENTER[0] * Math.PI) / 180))
    const north = CENTER[0] + (rows * degLat) / 2
    const west = CENTER[1] - (cols * degLng) / 2
    const maxClients = Math.max(...cells.map((c) => c.clients), 1)

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
        const cLat = north - (cell.gy + 0.5) * degLat
        const cLng = west + (cell.gx + 0.5) * degLng
        if (!pointInPoly(cLng, cLat, filters.lasso)) return false
      }
      return true
    }

    let shownPm = 0
    let shownSq = 0
    let utilSum = 0

    cells.forEach((cell) => {
      if (!passes(cell)) return
      shownSq++

      const cellNorth = north - cell.gy * degLat
      const cellSouth = north - (cell.gy + 1) * degLat
      const cellWest = west + cell.gx * degLng
      const cellEast = west + (cell.gx + 1) * degLng
      const cLat = (cellNorth + cellSouth) / 2
      const cLng = (cellWest + cellEast) / 2

      // Квадрат-теплокарта: прозорість росте зі щільністю; пусті майже невидимі
      const t = cell.clients / maxClients
      if (cell.clients > 12) {
        L.rectangle(
          [
            [cellSouth, cellWest],
            [cellNorth, cellEast],
          ],
          {
            stroke: true,
            color: '#ffffff',
            weight: 0.5,
            fillColor: densityColor(cell.clients, maxClients),
            fillOpacity: 0.12 + t * 0.5,
            interactive: false,
          },
        ).addTo(gridLayer.current!)
      }

      // Інфра-точки (cargo/branch/pudo)
      const extras: ('cargo' | 'branch' | 'pudo')[] = []
      if (cell.cargo && filters.infra.cargo !== 'no') extras.push('cargo')
      if (cell.branch && filters.infra.branch !== 'no') extras.push('branch')
      if (cell.pudo && filters.infra.pudo !== 'no') extras.push('pudo')
      extras.forEach((k, i) => {
        L.circleMarker([cLat - degLat * 0.28, cLng + (i - (extras.length - 1) / 2) * degLng * 0.3], {
          radius: 3,
          color: '#fff',
          weight: 1,
          fillColor: INFRA_DOT[k],
          fillOpacity: 1,
        }).addTo(markerLayer.current!)
      })

      // Маркер поштомата (колір = утилізація) + popup із кнопкою
      if (cell.postomat && filters.infra.postomat !== 'no' && cell.postomatId != null) {
        const det = postomats[cell.postomatId]
        const st = statusOf(det.util)
        shownPm++
        utilSum += det.util

        const icon = L.divIcon({
          className: 'pm-marker',
          html: `<div style="width:15px;height:15px;border-radius:4px;background:${st.color};border:2px solid #fff;box-shadow:0 1px 3px rgba(0,0,0,.4)"></div>`,
          iconSize: [15, 15],
          iconAnchor: [7, 7],
        })
        const href = postomatHref(filters.grid, det.id)
        const popup = `<div style="min-width:190px;font-family:Inter,sans-serif">
            <div style="font-weight:700;font-size:13px;color:#1E1E1E">${det.name}</div>
            <div style="color:#5A5F66;font-size:11px;margin-bottom:6px">${det.address}</div>
            <div style="display:flex;gap:10px;font-size:11px;margin-bottom:8px">
              <span>★ <b>${det.rating}</b></span>
              <span>ЕН/рік: <b>${fmt(det.totalEN)}</b></span>
              <span style="color:${st.color}">утил. <b>${det.util}%</b></span>
            </div>
            <a href="${href}" target="_blank" rel="noopener noreferrer"
               style="display:block;text-align:center;background:#DA291C;color:#fff;padding:7px;border-radius:8px;text-decoration:none;font-weight:600;font-size:12px">
               Відкрити картку ↗</a>
          </div>`

        const m = L.marker([cLat, cLng], { icon })
          .bindPopup(popup, { closeButton: true, autoPan: false })
          .addTo(markerLayer.current!)
        m.on('mouseover', () => m.openPopup())
        m.on('click', () => window.open(href, '_blank', 'noopener'))
      }
    })

    // Підгін зуму при зміні розміру сітки
    if (lastGrid.current !== filters.grid) {
      lastGrid.current = filters.grid
      const south = CENTER[0] - (rows * degLat) / 2
      const east = CENTER[1] + (cols * degLng) / 2
      map.fitBounds([
        [south, west],
        [north, east],
      ])
    }

    // Оновлення KPI-плашок
    if (kpiPm.current) kpiPm.current.textContent = fmt(shownPm)
    if (kpiSq.current) kpiSq.current.textContent = fmt(shownSq)
    if (kpiUt.current) {
      const avg = shownPm ? Math.round(utilSum / shownPm) : 0
      kpiUt.current.textContent = `${avg}%`
      kpiUt.current.style.color = statusOf(avg).color
    }
  }, [data, filters])

  const setTool = (t: 'pan' | 'lasso') => {
    toolRef.current = t
    const map = mapRef.current
    if (!map) return
    if (t === 'lasso') {
      map.dragging.disable()
      if (elRef.current) elRef.current.style.cursor = 'crosshair'
    } else {
      map.dragging.enable()
      if (elRef.current) elRef.current.style.cursor = ''
    }
  }

  return (
    <div className="relative h-full w-full">
      <div ref={elRef} className="absolute inset-0 z-0" />

      {/* Тулбар */}
      <div className="absolute left-3 top-3 z-[500] flex overflow-hidden rounded-lg border border-np-line bg-white shadow-md">
        <ToolBtn onClick={() => setTool('pan')} title="Огляд / переміщення">
          <Move size={15} />
        </ToolBtn>
        <ToolBtn onClick={() => setTool('lasso')} title="Виділити зону (ласо)" border>
          <Lasso size={15} />
        </ToolBtn>
        <ToolBtn
          onClick={() => {
            onLasso(null)
            lassoLayer.current?.clearLayers()
          }}
          title="Очистити виділення"
          border
        >
          <Eraser size={15} />
        </ToolBtn>
      </div>

      {/* KPI */}
      <div className="pointer-events-none absolute right-3 top-3 z-[500] flex gap-2">
        <Badge label="Поштоматів" valueRef={kpiPm} />
        <Badge label="Квадратів" valueRef={kpiSq} />
        <Badge label="Сер. утиліз." valueRef={kpiUt} accent />
      </div>

      {/* Легенда */}
      <div className="absolute bottom-6 left-3 z-[500] rounded-xl border border-np-line bg-white/95 px-3 py-2 shadow-md backdrop-blur">
        <div className="mb-1 text-[10px] uppercase tracking-wide text-np-slate">Щільність клієнтів</div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-np-slate">мало</span>
          <div
            className="h-2.5 w-32 rounded-full"
            style={{ background: 'linear-gradient(90deg,#16a34a,#eab308,#f97316,#DA291C)' }}
          />
          <span className="text-[10px] text-np-slate">багато</span>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-np-slate">
          <span className="font-semibold text-np-graphite">Утилізація:</span>
          <Leg c="#16a34a" t="низька" />
          <Leg c="#0284c7" t="оптим." />
          <Leg c="#f97316" t="висока" />
          <Leg c="#DA291C" t="критич." />
        </div>
      </div>
    </div>
  )
}

function ToolBtn({
  onClick,
  title,
  border,
  children,
}: {
  onClick: () => void
  title: string
  border?: boolean
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`px-3 py-2 text-np-graphite transition hover:bg-np-bg ${border ? 'border-l border-np-line' : ''}`}
    >
      {children}
    </button>
  )
}

function Badge({
  label,
  valueRef,
  accent,
}: {
  label: string
  valueRef: React.RefObject<HTMLSpanElement>
  accent?: boolean
}) {
  return (
    <div className="rounded-lg border border-np-line bg-white/95 px-3 py-1.5 text-center shadow-md backdrop-blur">
      <span ref={valueRef} className={`block text-[15px] font-bold ${accent ? '' : 'text-np-ink'}`}>
        —
      </span>
      <div className="text-[10px] text-np-slate">{label}</div>
    </div>
  )
}

function Leg({ c, t }: { c: string; t: string }) {
  return (
    <span className="flex items-center gap-1">
      <span className="inline-block h-2 w-2 rounded-sm" style={{ background: c }} />
      {t}
    </span>
  )
}
