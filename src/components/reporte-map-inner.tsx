"use client"

import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import type { CentroAcopio, ReporteMapa } from "@/lib/types"

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

const COLOR_URGENCIA: Record<ReporteMapa["urgencia"], string> = {
  alta: "#E24B4A",
  media: "#BA7517",
  baja: "#1D9E75",
}

const COLOR_ACOPIO = "#085041"

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

function Leyenda() {
  const item = { display: "flex", alignItems: "center", gap: 6 } as const
  return (
    <div
      style={{ display: "flex", flexWrap: "wrap", gap: "6px 16px", marginTop: 8, fontSize: 13 }}
      className="text-muted-foreground"
    >
      <span style={item}>
        <span
          style={{ width: 12, height: 12, borderRadius: 9999, background: COLOR_URGENCIA.alta }}
        />
        <span
          style={{ width: 12, height: 12, borderRadius: 9999, background: COLOR_URGENCIA.media }}
        />
        <span
          style={{ width: 12, height: 12, borderRadius: 9999, background: COLOR_URGENCIA.baja }}
        />
        Reportes (urgencia alta / media / baja)
      </span>
      <span style={item}>
        <span style={{ width: 12, height: 12, borderRadius: 3, background: COLOR_ACOPIO }} />
        Centros de acopio
      </span>
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
    <>
      <MapContainer
        center={CHETUMAL_CENTRO}
        zoom={13}
        scrollWheelZoom={false}
        style={{ height: 400, width: "100%", borderRadius: "0.75rem" }}
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
    </>
  )
}
