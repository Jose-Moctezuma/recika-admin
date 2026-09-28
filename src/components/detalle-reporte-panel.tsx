"use client"

import { useState, useTransition } from "react"
import { Check, X, RotateCcw } from "lucide-react"
import type { Reporte } from "@/lib/types"
import { colors, estiloEstadoReporte, estiloUrgencia, MOTIVO_DESCARTE_LABEL } from "@/lib/theme"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { marcarAtendido, descartarReporte, revertirAPendiente } from "@/app/reportes/actions"

function Dato({ etiqueta, valor, ancho2 }: { etiqueta: string; valor: string; ancho2?: boolean }) {
  return (
    <div className={`flex flex-col gap-0.5 ${ancho2 ? "col-span-2" : ""}`}>
      <span className="text-xs" style={{ color: colors.texto2 }}>
        {etiqueta}
      </span>
      <strong className="text-sm font-semibold">{valor}</strong>
    </div>
  )
}

export function DetalleReportePanel({
  reporte,
  onCerrar,
  onCambiado,
}: {
  reporte: Reporte
  onCerrar: () => void
  onCambiado: () => void
}) {
  const [motivo, setMotivo] = useState<string>("falso")
  const [error, setError] = useState<string | null>(null)
  const [pendiente, startTransition] = useTransition()

  const estado = (["pendiente", "atendido", "descartado"] as const).includes(
    reporte.estado as "pendiente" | "atendido" | "descartado"
  )
    ? (reporte.estado as "pendiente" | "atendido" | "descartado")
    : "pendiente"
  const estiloEstado = estiloEstadoReporte[estado]
  const urgencia = estiloUrgencia[reporte.urgencia]

  function ejecutar(accion: () => Promise<{ ok: boolean; error?: string }>) {
    setError(null)
    startTransition(async () => {
      const resultado = await accion()
      if (!resultado.ok) {
        setError(resultado.error ?? "No se pudo actualizar el reporte.")
        return
      }
      onCambiado()
    })
  }

  return (
    <aside
      aria-label="Detalle del reporte"
      className="flex w-[420px] shrink-0 flex-col gap-4 overflow-y-auto border-l bg-white p-6"
      style={{ borderColor: colors.borde }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-bold tracking-wide" style={{ color: colors.texto2 }}>
            REPORTE
          </span>
          <h2 className="text-xl font-bold">
            {reporte.tipo_residuo || "Tiradero"} · {reporte.colonia || "Sin colonia"}
          </h2>
          <span className="text-sm" style={{ color: colors.texto2 }}>
            {new Date(reporte.created_at).toLocaleString("es-MX", {
              dateStyle: "long",
              timeStyle: "short",
              timeZone: "America/Cancun",
            })}{" "}
            · anónimo
          </span>
        </div>
        <button
          type="button"
          aria-label="Cerrar detalle"
          onClick={onCerrar}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border"
          style={{ borderColor: colors.borde, color: colors.texto2 }}
        >
          <X className="h-4.5 w-4.5" />
        </button>
      </div>

      {reporte.foto_url ? (
        // eslint-disable-next-line @next/next/no-img-element -- foto en Supabase Storage, no en /public.
        <img
          src={reporte.foto_url}
          alt="Foto del reporte"
          className="h-48 w-full rounded-xl object-cover"
          style={{ backgroundColor: colors.surface3 }}
        />
      ) : (
        <div
          className="flex h-48 items-center justify-center rounded-xl text-sm"
          style={{ backgroundColor: colors.surface3, color: colors.texto2 }}
        >
          Sin foto
        </div>
      )}

      <div className="grid grid-cols-2 gap-x-4 gap-y-3">
        <Dato etiqueta="Urgencia" valor={urgencia.label} />
        <Dato etiqueta="Tiempo en el lugar" valor={reporte.tiempo_estimado || "—"} />
        <Dato etiqueta="Origen" valor={reporte.desde_sitio ? "En el sitio (GPS)" : "Desde casa"} />
        <Dato etiqueta="¿Cómo se enteró?" valor={reporte.como_se_entero || "—"} />
        <Dato
          etiqueta="Coordenadas"
          ancho2
          valor={reporte.lat !== null && reporte.lng !== null ? `${reporte.lat.toFixed(5)}, ${reporte.lng.toFixed(5)}` : "Sin GPS"}
        />
      </div>

      <div className="flex flex-col gap-1.5 rounded-xl p-3.5" style={{ backgroundColor: colors.fondo }}>
        <span className="text-xs font-bold" style={{ color: colors.texto2 }}>
          DESCRIPCIÓN Y REFERENCIA · SOLO VISIBLE EN EL PANEL
        </span>
        {/* React escapa el texto: no se interpreta como HTML. pre-wrap respeta los saltos de línea. */}
        <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
          {reporte.descripcion && reporte.descripcion.trim() !== "" ? reporte.descripcion : (
            <span style={{ color: colors.texto2 }}>Sin descripción</span>
          )}
        </p>
        {reporte.referencia_lugar ? (
          <p className="text-sm leading-relaxed whitespace-pre-wrap break-words" style={{ color: colors.texto2 }}>
            Referencia: {reporte.referencia_lugar}
          </p>
        ) : null}
      </div>

      <div className="mt-auto flex flex-col gap-3 border-t pt-4" style={{ borderColor: colors.borde }}>
        <div className="flex items-center gap-2">
          <span className="text-xs" style={{ color: colors.texto2 }}>
            Estado actual:
          </span>
          <span
            className="rounded-full px-2.5 py-1 text-xs font-bold"
            style={{ backgroundColor: estiloEstado.bg, color: estiloEstado.fg }}
          >
            {estiloEstado.label}
            {estado === "descartado" && reporte.motivo_descarte
              ? ` · ${MOTIVO_DESCARTE_LABEL[reporte.motivo_descarte]}`
              : ""}
          </span>
        </div>

        {estado === "pendiente" ? (
          <>
            <Button
              type="button"
              disabled={pendiente}
              onClick={() => ejecutar(() => marcarAtendido(reporte.id))}
              className="h-11 gap-2 text-sm font-bold text-white"
              style={{ backgroundColor: colors.manglar }}
            >
              <Check className="h-4.5 w-4.5" />
              Marcar como atendido
            </Button>
            <div className="flex gap-2">
              <Select value={motivo} onValueChange={setMotivo}>
                <SelectTrigger aria-label="Motivo de descarte" className="h-11 flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="falso">Motivo: falso</SelectItem>
                  <SelectItem value="duplicado">Duplicado</SelectItem>
                  <SelectItem value="prueba">Prueba</SelectItem>
                </SelectContent>
              </Select>
              <Button
                type="button"
                variant="outline"
                disabled={pendiente}
                onClick={() => ejecutar(() => descartarReporte(reporte.id, motivo))}
                className="h-11 border-2 text-sm font-bold"
                style={{ borderColor: colors.rp, color: colors.rp }}
              >
                Descartar
              </Button>
            </div>
            <span className="text-xs leading-relaxed" style={{ color: colors.texto2 }}>
              El reporte no se borra: sale del mapa público de la app y se conserva para las
              estadísticas del estudio.
            </span>
          </>
        ) : (
          <Button
            type="button"
            variant="outline"
            disabled={pendiente}
            onClick={() => ejecutar(() => revertirAPendiente(reporte.id))}
            className="h-11 gap-2 text-sm font-bold"
          >
            <RotateCcw className="h-4 w-4" />
            Regresar a pendiente
          </Button>
        )}

        {error ? (
          <p className="text-sm" style={{ color: colors.rp }}>
            {error}
          </p>
        ) : null}
      </div>
    </aside>
  )
}
