"use client"

import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import type { CentroAcopio, ReporteMapa } from "@/lib/types"
import { colors } from "@/lib/theme"

// El problema clásico de Leaflet + bundlers: el ícono default apunta a rutas
// relativas que no existen tras el empaquetado. Se corrige apuntando a los
// assets reales de node_modules vía import.meta.url (funciona con Turbopack).
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: new URL("leaflet/dist/images/marker-icon-2x.png", import.meta.url).href,
  iconUrl: new URL("leaflet/dist/images/marker-icon.png", import.meta.url).href,
  shadowUrl: new URL("leaflet/dist/images/marker-shadow.png", import.meta.url).href,
})

const CHETUMAL_CENTRO: [number, number] = [18.5001, -88.2963]

// Mismos colores que la leyenda de la maqueta (docs/panel-v2/2-Reportes.html).
const COLOR_URGENCIA: Record<ReporteMapa["urgencia"], string> = {
  alta: colors.rp,
  media: colors.ambarPendiente,
  baja: colors.selva,
}

const COLOR_ACOPIO = colors.manglar

const LABEL_URGENCIA: Record<ReporteMapa["urgencia"], string> = {
  alta: "Alta",
  media: "Media",
  baja: "Baja",
}

function iconoPorUrgencia(urgencia: ReporteMapa["urgencia"]) {
  const color = COLOR_URGENCIA[urgencia]
  return L.divIcon({
    className: "",
    html: `<span style="
      display:block;
      width:18px;height:18px;
      border-radius:9999px;
      background:${color};
      border:2px solid white;
      box-shadow:0 1px 4px rgba(0,0,0,.4);
    "></span>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
    popupAnchor: [0, -9],
  })
}

// Cuadrado (no círculo) para distinguirlo de los reportes de urgencia baja,
// cuyo verde (#1D9E75) es parecido al del acopio.
const iconoAcopio = L.divIcon({
  className: "",
  html: `<span style="
      display:block;
      width:18px;height:18px;
      border-radius:4px;
      background:${COLOR_ACOPIO};
      border:2px solid white;
      box-shadow:0 1px 4px rgba(0,0,0,.4);
    "></span>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
  popupAnchor: [0, -9],
})

// Leyenda DENTRO del mapa, abajo a la izquierda, en una cajita blanca con borde. z-index 1000:
// los controles de Leaflet usan hasta 1000 y, sin esto, el mapa taparía la cajita.
function Leyenda() {
  const item = { display: "flex", alignItems: "center", gap: 6 } as const
  const punto = (color: string, radio: number) => (
    <span style={{ width: 10, height: 10, borderRadius: radio, background: color }} aria-hidden="true" />
  )
  return (
    <div
      style={{
        position: "absolute",
        left: 14,
        bottom: 12,
        zIndex: 1000,
        display: "flex",
        gap: 14,
        padding: "8px 12px",
        fontSize: 12,
        color: colors.texto,
        background: "#fff",
        border: `1px solid ${colors.borde}`,
        borderRadius: 10,
      }}
    >
      <span style={item}>{punto(COLOR_URGENCIA.alta, 9999)}Alta</span>
      <span style={item}>{punto(COLOR_URGENCIA.media, 9999)}Media</span>
      <span style={item}>{punto(COLOR_URGENCIA.baja, 9999)}Baja</span>
      <span style={item}>{punto(COLOR_ACOPIO, 3)}Centro de acopio</span>
    </div>
  )
}

export function ReporteMapInner({
  reportes,
  acopios,
}: {
  reportes: ReporteMapa[]
  acopios: CentroAcopio[]
}) {
  return (
    <div
      className="relative shrink-0 overflow-hidden rounded-[16px] border"
      style={{ height: 270, borderColor: colors.borde }}
    >
      <MapContainer
        center={CHETUMAL_CENTRO}
        zoom={13}
        scrollWheelZoom={false}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {reportes.map((reporte) => (
          <Marker
            key={reporte.id}
            position={[reporte.lat, reporte.lng]}
            icon={iconoPorUrgencia(reporte.urgencia)}
          >
            <Popup>
              <div style={{ display: "flex", flexDirection: "column", gap: 2, fontSize: 13 }}>
                <strong>{reporte.colonia ?? "Colonia sin especificar"}</strong>
                <span>Tipo de residuo: {reporte.tipo_residuo ?? "—"}</span>
                <span>Urgencia: {LABEL_URGENCIA[reporte.urgencia]}</span>
                <span>
                  Fecha:{" "}
                  {new Date(reporte.created_at).toLocaleString("es-MX", {
                    dateStyle: "short",
                    timeStyle: "short",
                  })}
                </span>
              </div>
            </Popup>
          </Marker>
        ))}
        {acopios.map((acopio) => (
          <Marker key={acopio.id} position={[acopio.lat, acopio.lng]} icon={iconoAcopio}>
            <Popup>
              <div style={{ display: "flex", flexDirection: "column", gap: 2, fontSize: 13 }}>
                <strong>{acopio.nombre}</strong>
                <span>Dirección: {acopio.direccion ?? "—"}</span>
                <span>Horario: {acopio.horario ?? "—"}</span>
                <span>
                  Materiales:{" "}
                  {acopio.tipos_material?.length ? acopio.tipos_material.join(", ") : "—"}
                </span>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      <Leyenda />
    </div>
  )
}
