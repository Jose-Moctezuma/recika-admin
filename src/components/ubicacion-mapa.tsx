"use client"

import dynamic from "next/dynamic"
import { colors } from "@/lib/theme"
import { enZona } from "@/lib/acopios-validacion"

// Leaflet toca `window` al importarse: se carga solo en el navegador (ssr: false).
const UbicacionMapaInner = dynamic(() => import("./ubicacion-mapa-inner").then((m) => m.UbicacionMapaInner), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center text-sm" style={{ color: colors.texto2 }}>
      Cargando mapa…
    </div>
  ),
})

// Mapa para ubicar un centro: un clic coloca el pin y lo arrastras para afinarlo. Debajo se leen
// lat/lng con 6 decimales y si el punto cae dentro de Chetumal y alrededores.
export function UbicacionMapa({
  lat,
  lng,
  onChange,
}: {
  lat: number | null
  lng: number | null
  onChange: (lat: number, lng: number) => void
}) {
  const hayPunto = lat !== null && lng !== null
  const dentro = hayPunto && enZona(lat, lng)
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[13px] font-semibold">Ubicación · haz clic en el mapa</span>
      <div
        className="h-[180px] overflow-hidden rounded-xl border"
        style={{ borderColor: colors.borde, backgroundColor: "#E9EFE6" }}
      >
        <UbicacionMapaInner lat={lat} lng={lng} onChange={onChange} />
      </div>
      <div className="flex flex-wrap gap-x-2 gap-y-0.5 text-xs" style={{ color: colors.texto2 }}>
        <span>Lat {hayPunto ? lat.toFixed(6) : "—"}</span>
        <span>·</span>
        <span>Lng {hayPunto ? lng.toFixed(6) : "—"}</span>
        <span className="ml-auto font-semibold" style={{ color: !hayPunto ? colors.texto2 : dentro ? colors.manglar : colors.rme }}>
          {!hayPunto
            ? "Aún sin ubicación"
            : dentro
              ? "Dentro de Chetumal y alrededores"
              : "Fuera de la zona: se pedirá confirmación"}
        </span>
      </div>
    </div>
  )
}
