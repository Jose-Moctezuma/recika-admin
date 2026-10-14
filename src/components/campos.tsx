"use client"

import type { ReactNode } from "react"
import { cn } from "cn"
import { colors } from "@/lib/theme"

// Piezas de formulario de las columnas de edición (Centros de acopio, Colonias y rutas), con las
// medidas de las maquetas docs/panel-v2/3-Acopios.html y 4-Colonias.html.

export const CLASE_CAMPO =
  "h-[42px] w-full rounded-[10px] border bg-white px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[#1D9E75]/40 disabled:cursor-not-allowed disabled:bg-[#F7F6F2] disabled:text-[#5F5E58]"

export const ESTILO_BORDE = { borderColor: colors.borde } as const

export function Etiqueta({ texto, children, className }: { texto: string; children: ReactNode; className?: string }) {
  return (
    <label className={cn("flex flex-col gap-1.5 text-[13px] font-semibold", className)}>
      {texto}
      {children}
    </label>
  )
}

// Pastilla de estado (Activo, Visible, Pendiente…): texto 12 px en negrita sobre fondo suave.
export function Pastilla({ bg, fg, children }: { bg: string; fg: string; children: ReactNode }) {
  return (
    <span className="rounded-full px-2.5 py-1 text-xs font-bold whitespace-nowrap" style={{ backgroundColor: bg, color: fg }}>
      {children}
    </span>
  )
}

// Encabezado y celdas de las tablas del panel (ver reportes-panel.tsx: los estilos de la tabla base
// fijan alto, relleno y color y no se pueden pisar uno por uno).
export const ESTILO_TH = {
  height: "auto",
  padding: "12px 16px",
  fontSize: 12,
  fontWeight: 700,
  letterSpacing: "0.6px",
  textTransform: "uppercase",
  color: colors.texto2,
} as const
export const ESTILO_TD = { padding: "14px 16px" } as const
