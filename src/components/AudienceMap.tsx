import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet.heat'
import { Home, Briefcase, Users } from 'lucide-react'
import type { PostomatDetail } from '../types'
import { GRID_DIMS } from '../data/mockData'

const CENTER: [number, number] = [50.4501, 30.5234]
const MPDL = 111320

type Mode = 'all' | 'home' | 'work'

/** Гео-теплокарта розміщення аудиторії (клієнтів) поштомата */
export default function AudienceMap({ postomat, grid }: { postomat: PostomatDetail; grid: number }) {
  const elRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const heatRef = useRef<L.Layer | null>(null)
  const [mode, setMode] = useState<Mode>('all')

  // Центр поштомата (та сама проєкція, що й на головній карті)
  const dim = GRID_DIMS[grid] ?? GRID_DIMS[300]
  const degLat = grid / MPDL
  const degLng = grid / (MPDL * Math.cos((CENTER[0] * Math.PI) / 180))
  const north = CENTER[0] + (dim.rows * degLat) / 2
  const west = CENTER[1] - (dim.cols * degLng) / 2
  const cLat = north - (postomat.cell.gy + 0.5) * degLat
  const cLng = west + (postomat.cell.gx + 0.5) * degLng

  // Ініціалізація карти (один раз)
  useEffect(() => {
    if (!elRef.current || mapRef.current) return
    const map = L.map(elRef.current, {
      center: [cLat, cLng],
      zoom: 14,
      scrollWheelZoom: false,
      zoomControl: true,
    })
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap · © CARTO',
    }).addTo(map)

    // Маркер самого поштомата
    L.marker([cLat, cLng], {
      icon: L.divIcon({
        className: '',
        html: `<svg viewBox="0 0 24 24" width="22" height="22"><rect x="4" y="2" width="16" height="20" rx="2.5" fill="#DA291C" stroke="#fff" stroke-width="1.6"/><line x1="4" y1="9" x2="20" y2="9" stroke="#fff" stroke-width="1.2"/><line x1="4" y1="15" x2="20" y2="15" stroke="#fff" stroke-width="1.2"/></svg>`,
        iconSize: [22, 22],
        iconAnchor: [11, 11],
      }),
      zIndexOffset: 1000,
    }).addTo(map)

    mapRef.current = map
    setTimeout(() => map.invalidateSize(), 80)
    return () => {
      map.remove()
      mapRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Оновлення теплового шару при зміні режиму
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    if (heatRef.current) {
      map.removeLayer(heatRef.current)
      heatRef.current = null
    }
    const pts = postomat.audience
      .filter((a) => mode === 'all' || a.kind === mode)
      .map((a) => {
        const lat = cLat + a.dy / MPDL
        const lng = cLng + a.dx / (MPDL * Math.cos((lat * Math.PI) / 180))
        return [lat, lng, a.w] as [number, number, number]
      })
    heatRef.current = L.heatLayer(pts, {
      radius: 22,
      blur: 18,
      maxZoom: 17,
      max: 1,
      gradient: { 0.2: '#1d4ed8', 0.4: '#16a34a', 0.6: '#eab308', 0.8: '#f97316', 1: '#DA291C' },
    }).addTo(map)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, postomat.id])

  const TABS: { key: Mode; label: string; icon: typeof Users }[] = [
    { key: 'all', label: 'Уся аудиторія', icon: Users },
    { key: 'home', label: 'Нічні (дім)', icon: Home },
    { key: 'work', label: 'Денні (робота)', icon: Briefcase },
  ]

  return (
    <div className="mb-4 break-inside-avoid rounded-xl border border-np-line bg-white p-3 shadow-sm">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="h-3 w-1 rounded-full bg-np-red" />
          <h3 className="text-[12px] font-bold uppercase tracking-wide text-np-ink">
            Гео-розміщення аудиторії
          </h3>
        </div>
        <div className="inline-flex rounded-lg bg-[#EEF0F2] p-0.5">
          {TABS.map((t) => {
            const Icon = t.icon
            return (
              <button
                key={t.key}
                onClick={() => setMode(t.key)}
                className={`flex items-center gap-1 rounded-md px-2 py-1 text-[11px] transition ${
                  mode === t.key ? 'bg-white font-semibold text-np-ink shadow-sm' : 'text-np-slate'
                }`}
              >
                <Icon size={12} />
                {t.label}
              </button>
            )
          })}
        </div>
      </div>
      <div ref={elRef} className="h-[320px] w-full overflow-hidden rounded-lg" />
      <div className="mt-2 text-[10px] text-np-slate">
        Щільність проживання/перебування клієнтів поштомата. «Дім» — нічна активність (де клієнт
        живе), «Робота» — денна (де працює поруч). Джерело: <span className="font-mono">UserPoints_not_in_Buffer_v</span>.
      </div>
    </div>
  )
}
