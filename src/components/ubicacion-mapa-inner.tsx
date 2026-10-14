"use client"

import { useEffect } from "react"
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import { colors } from "@/lib/theme"
import { CENTRO_MAPA, redondear6 } from "@/lib/acopios-validacion"

// Pin propio (no el ícono por defecto de Leaflet, que se rompe con los bundlers): un círculo verde
// ReciKa con borde blanco, fácil de agarrar para arrastrarlo.
const iconoPin = L.divIcon({
  className: "",
  html: `<span style="display:block;width:24px;height:24px;border-radius:9999px;background:${colors.manglar};border:3px solid #fff;box-shadow:0 1px 6px rgba(0,0,0,.5)"></span>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
})

// Leaflet calcula su tamaño al montarse; si el contenedor aún no tenía su medida final (columna que
// se abre, cajón, cambio de tamaño de la ventana) dibuja solo una parte. Se recalcula al montar y
// cada vez que el contenedor cambia de tamaño.
function AjustarTamano() {
  const mapa = useMap()
  useEffect(() => {
    const recalcular = () => mapa.invalidateSize()
    const t = setTimeout(recalcular, 100)
    const observador = new ResizeObserver(recalcular)
    observador.observe(mapa.getContainer())
    return () => {
      clearTimeout(t)
      observador.disconnect()
    }
  }, [mapa])
  return null
}

function AlHacerClic({ onChange }: { onChange: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onChange(redondear6(e.latlng.lat), redondear6(e.latlng.lng))
    },
  })
  return null
}

export function UbicacionMapaInner({
  lat,
  lng,
  onChange,
}: {
  lat: number | null
  lng: number | null
  onChange: (lat: number, lng: number) => void
}) {
  const hayPunto = lat !== null && lng !== null
  return (
    <MapContainer
      // Centrado en el pin si ya hay uno; si no, en Chetumal. (Solo cuenta al montar: el formulario se
      // vuelve a montar al cambiar de centro.)
      center={hayPunto ? [lat, lng] : CENTRO_MAPA}
      zoom={hayPunto ? 15 : 13}
      scrollWheelZoom={false}
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <AjustarTamano />
      <AlHacerClic onChange={onChange} />
      {hayPunto ? (
        <Marker
          position={[lat, lng]}
          icon={iconoPin}
          draggable
          eventHandlers={{
            dragend(e) {
              const p = (e.target as L.Marker).getLatLng()
              onChange(redondear6(p.lat), redondear6(p.lng))
            },
          }}
        />
      ) : null}
    </MapContainer>
  )
}
