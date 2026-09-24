"use client"

import { Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Reporte } from "@/lib/types"

const COLUMNAS = [
  "fecha",
  "colonia",
  "tipo_residuo",
  "urgencia",
  "desde_sitio",
  "lat",
  "lng",
  "descripcion",
  "referencia_lugar",
] as const

// Los textos vienen de reportes ciudadanos (la app acepta sesiones anónimas):
// un valor que empiece con = + - @ se ejecutaría como fórmula al abrir el CSV
// en Excel/Sheets. Se antepone ' para que se trate como texto.
function celdaTexto(valor: string | null): string {
  if (valor === null || valor === "") return ""
  const seguro = /^[=+\-@\t\r]/.test(valor) ? `'${valor}` : valor
  return /[",\n\r]/.test(seguro) ? `"${seguro.replace(/"/g, '""')}"` : seguro
}

function construirCsv(reportes: Reporte[]): string {
  const filas = reportes.map((r) =>
    [
      celdaTexto(r.created_at),
      celdaTexto(r.colonia),
      celdaTexto(r.tipo_residuo),
      celdaTexto(r.urgencia),
      String(r.desde_sitio),
      r.lat === null ? "" : String(r.lat),
      r.lng === null ? "" : String(r.lng),
      // Texto libre del ciudadano: pasa por celdaTexto (protección anti-fórmulas y comillas).
      celdaTexto(r.descripcion ?? null),
      celdaTexto(r.referencia_lugar ?? null),
    ].join(",")
  )
  return [COLUMNAS.join(","), ...filas].join("\r\n")
}

export function ExportarCsv({ reportes }: { reportes: Reporte[] }) {
  function descargar() {
    // BOM al inicio: sin él Excel abre el UTF-8 como ANSI y rompe los acentos.
    const blob = new Blob(["﻿" + construirCsv(reportes)], {
      type: "text/csv;charset=utf-8",
    })
    const url = URL.createObjectURL(blob)
    const enlace = document.createElement("a")
    enlace.href = url
    enlace.download = "reportes.csv"
    document.body.appendChild(enlace)
    enlace.click()
    enlace.remove()
    URL.revokeObjectURL(url)
  }

  return (
    <Button variant="outline" onClick={descargar} disabled={reportes.length === 0}>
      <Download />
      Exportar CSV
    </Button>
  )
}
