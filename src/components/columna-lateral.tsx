"use client"

import type { ReactNode } from "react"
import { X } from "lucide-react"
import { cn } from "cn"
import { colors } from "@/lib/theme"

// Columna de edición a la derecha: fija, de alto completo y siempre visible desde 1280 px; por
// debajo de eso es un cajón superpuesto que solo aparece cuando hay algo abierto (visibleEnCajon).
// Misma estructura que el detalle de Reportes.
export function ColumnaLateral({
  etiqueta,
  ancho,
  visibleEnCajon,
  children,
}: {
  etiqueta: string
  ancho: 420 | 440
  visibleEnCajon: boolean
  children: ReactNode
}) {
  return (
    <aside
      aria-label={etiqueta}
      className={cn(
        "fixed inset-y-0 right-0 z-40 max-w-full flex-col overflow-y-auto border-l bg-white shadow-2xl",
        "xl:static xl:z-auto xl:shrink-0 xl:shadow-none",
        ancho === 440 ? "w-[440px]" : "w-[420px]",
        visibleEnCajon ? "flex" : "hidden xl:flex"
      )}
      style={{ borderColor: colors.borde }}
    >
      {children}
    </aside>
  )
}

export function EstadoVacio({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-1 items-center justify-center p-8 text-center text-sm" style={{ color: colors.texto2 }}>
      {children}
    </div>
  )
}

export function EncabezadoColumna({ titulo, onCerrar }: { titulo: string; onCerrar: () => void }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h2 className="text-xl font-bold">{titulo}</h2>
      <button
        type="button"
        aria-label="Cerrar"
        onClick={onCerrar}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] border bg-white"
        style={{ borderColor: colors.borde, color: colors.texto2 }}
      >
        <X className="h-[18px] w-[18px]" strokeWidth={2.2} />
      </button>
    </div>
  )
}
