"use client"

import dynamic from "next/dynamic"
import type { ReporteMapa } from "@/lib/types"

// Leaflet toca `window` al importarse, lo que rompe el render en servidor
// aunque este archivo sea 'use client' (Next igual lo renderiza en servidor
// la primera vez). `ssr: false` evita esa primera pasada — y solo se puede
// pasar desde un Client Component, no desde app/reportes/page.tsx.
const ReporteMapInner = dynamic(
  () => import("./reporte-map-inner").then((mod) => mod.ReporteMapInner),
  {
    ssr: false,
    loading: () => (
      <div
        style={{ height: 400 }}
        className="flex items-center justify-center rounded-xl border bg-muted/30 text-sm text-muted-foreground"
      >
        Cargando mapa…
      </div>
    ),
  }
)

export function ReporteMap({ reportes }: { reportes: ReporteMapa[] }) {
  return <ReporteMapInner reportes={reportes} />
}
