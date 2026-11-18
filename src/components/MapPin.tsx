import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const pin = L.divIcon({
  className: '',
  html: '<div style="width:26px;height:26px;border-radius:50% 50% 50% 0;background:#c8412e;transform:rotate(-45deg);border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.3)"></div>',
  iconSize: [26, 26],
  iconAnchor: [13, 26],
})

export default function MapPin({ lat, lng, accuracy, className = 'h-40' }: { lat: number; lng: number; accuracy?: number | null; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!ref.current) return
    const map = L.map(ref.current, { zoomControl: false, attributionControl: true, scrollWheelZoom: false, dragging: !L.Browser.mobile })
      .setView([lat, lng], 17)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap',
    }).addTo(map)
    if (accuracy) L.circle([lat, lng], { radius: accuracy, color: '#c8412e', weight: 1, fillOpacity: 0.12 }).addTo(map)
    L.marker([lat, lng], { icon: pin }).addTo(map)
    return () => { map.remove() }
  }, [lat, lng, accuracy])
  return <div ref={ref} className={`w-full overflow-hidden rounded-2xl border border-line ${className}`} onClick={(e) => e.stopPropagation()} />
}
