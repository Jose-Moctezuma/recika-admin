"use client"

import { useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import type { CentroAcopio, Reporte, ReporteMapa } from "@/lib/types"
import { colors, estiloEstadoReporte, estiloUrgencia } from "@/lib/theme"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ReporteMap } from "@/components/reporte-map"
import { ExportarCsv } from "@/components/exportar-csv"
import { DetalleReportePanel } from "@/components/detalle-reporte-panel"

type FiltroEstado = "todos" | "pendiente" | "atendido" | "descartado"

const PESTANAS: { valor: FiltroEstado; etiqueta: string }[] = [
  { valor: "todos", etiqueta: "Todos" },
  { valor: "pendiente", etiqueta: "Pendientes" },
  { valor: "atendido", etiqueta: "Atendidos" },
  { valor: "descartado", etiqueta: "Descartados" },
]

// Antes de la migración 0008, estado podía ser cualquier texto libre: cualquier valor que no
// sea 'atendido' ni 'descartado' se trata como 'pendiente' (es el estado de entrada normal).
function normalizarEstado(estado: string): "pendiente" | "atendido" | "descartado" {
  return estado === "atendido" || estado === "descartado" ? estado : "pendiente"
}

// "Ocultar pruebas": la descripción contiene la palabra PRUEBA (sin distinguir mayúsculas).
function esPrueba(reporte: Reporte): boolean {
  return (reporte.descripcion ?? "").toUpperCase().includes("PRUEBA")
}

export function ReportesPanel({ reportes, acopios }: { reportes: Reporte[]; acopios: CentroAcopio[] }) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>("todos")
  const [colonia, setColonia] = useState("todas")
  const [urgencia, setUrgencia] = useState("cualquiera")
  const [ocultarPruebas, setOcultarPruebas] = useState(false)
  const [seleccionId, setSeleccionId] = useState<string | null>(null)

  const colonias = useMemo(
    () => Array.from(new Set(reportes.map((r) => r.colonia).filter((c): c is string => Boolean(c)))).sort(),
    [reportes]
  )

  // Conteos de las pestañas: SIEMPRE sobre el total (no cambian con los demás filtros), igual
  // que en la maqueta (Todos/Pendientes/Atendidos/Descartados sirven para cambiar de vista, los
  // demás filtros afinan dentro de esa vista).
  const conteos = useMemo(() => {
    const c: Record<FiltroEstado, number> = { todos: reportes.length, pendiente: 0, atendido: 0, descartado: 0 }
    for (const r of reportes) c[normalizarEstado(r.estado)]++
    return c
  }, [reportes])

  const filtrados = useMemo(
    () =>
      reportes.filter((r) => {
        if (filtroEstado !== "todos" && normalizarEstado(r.estado) !== filtroEstado) return false
        if (colonia !== "todas" && r.colonia !== colonia) return false
        if (urgencia !== "cualquiera" && r.urgencia !== urgencia) return false
        if (ocultarPruebas && esPrueba(r)) return false
        return true
      }),
    [reportes, filtroEstado, colonia, urgencia, ocultarPruebas]
  )

  // El mapa muestra exactamente lo que ve la tabla (mismos filtros), no todo el histórico.
  const paraElMapa: ReporteMapa[] = useMemo(
    () =>
      filtrados
        .filter((r): r is Reporte & { lat: number; lng: number } => r.lat !== null && r.lng !== null)
        .map((r) => ({
          id: r.id,
          lat: r.lat,
          lng: r.lng,
          colonia: r.colonia,
          tipo_residuo: r.tipo_residuo,
          urgencia: r.urgencia,
          estado: r.estado,
          created_at: r.created_at,
        })),
    [filtrados]
  )

  const seleccionado = filtrados.find((r) => r.id === seleccionId) ?? null

  // Tras un cambio de estado, se refresca la página (Server Component: vuelve a leer de
  // Supabase) y se cierra el panel de detalle, ya que el reporte pudo salir del filtro activo.
  function alCambiarEstado() {
    setSeleccionId(null)
    startTransition(() => router.refresh())
  }

  return (
    <div className="flex items-start gap-6">
      <div className="flex min-w-0 flex-1 flex-col gap-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Reportes</h1>
            <p className="text-sm text-muted-foreground">
              Tiraderos clandestinos reportados por la comunidad
            </p>
          </div>
          <ExportarCsv reportes={reportes} />
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex gap-1 rounded-xl p-1" style={{ backgroundColor: colors.surface3 }}>
            {PESTANAS.map(({ valor, etiqueta }) => {
              const activo = filtroEstado === valor
              return (
                <button
                  key={valor}
                  type="button"
                  aria-pressed={activo}
                  onClick={() => setFiltroEstado(valor)}
                  className="h-9 rounded-lg px-3.5 text-sm transition-colors"
                  style={activo ? { backgroundColor: "#fff", color: colors.manglar, fontWeight: 700 } : { color: colors.texto2, fontWeight: 500 }}
                >
                  {etiqueta} · {conteos[valor]}
                </button>
              )
            })}
          </div>

          <Select value={colonia} onValueChange={setColonia}>
            <SelectTrigger aria-label="Colonia" className="h-11 w-auto">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas las colonias</SelectItem>
              {colonias.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={urgencia} onValueChange={setUrgencia}>
            <SelectTrigger aria-label="Urgencia" className="h-11 w-auto">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cualquiera">Cualquier urgencia</SelectItem>
              <SelectItem value="alta">Alta</SelectItem>
              <SelectItem value="media">Media</SelectItem>
              <SelectItem value="baja">Baja</SelectItem>
            </SelectContent>
          </Select>

          <label className="flex items-center gap-2 text-sm" style={{ color: colors.texto2 }}>
            <input
              type="checkbox"
              checked={ocultarPruebas}
              onChange={(e) => setOcultarPruebas(e.target.checked)}
              className="h-[18px] w-[18px]"
              style={{ accentColor: colors.manglar }}
            />
            Ocultar pruebas
          </label>
        </div>

        <ReporteMap reportes={paraElMapa} acopios={acopios} />

        <div className="overflow-hidden rounded-2xl border bg-white" style={{ borderColor: colors.borde }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Colonia</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Urgencia</TableHead>
                <TableHead>Origen</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtrados.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                    No hay reportes con estos filtros.
                  </TableCell>
                </TableRow>
              ) : (
                filtrados.map((reporte) => {
                  const urgenciaEstilo = estiloUrgencia[reporte.urgencia]
                  const estadoEstilo = estiloEstadoReporte[normalizarEstado(reporte.estado)]
                  const activa = seleccionId === reporte.id
                  return (
                    <TableRow
                      key={reporte.id}
                      onClick={() => setSeleccionId(reporte.id)}
                      className="cursor-pointer"
                      style={activa ? { backgroundColor: colors.palido } : undefined}
                    >
                      <TableCell>
                        {new Date(reporte.created_at).toLocaleString("es-MX", {
                          dateStyle: "short",
                          timeStyle: "short",
                          timeZone: "America/Cancun",
                        })}
                      </TableCell>
                      <TableCell>{reporte.colonia || "—"}</TableCell>
                      <TableCell>{reporte.tipo_residuo || "—"}</TableCell>
                      <TableCell>
                        <Badge style={{ backgroundColor: urgenciaEstilo.bg, color: urgenciaEstilo.fg }} className="border-transparent">
                          {urgenciaEstilo.label}
                        </Badge>
                      </TableCell>
                      <TableCell>{reporte.desde_sitio ? "En el sitio" : "Desde casa"}</TableCell>
                      <TableCell>
                        <Badge style={{ backgroundColor: estadoEstilo.bg, color: estadoEstilo.fg }} className="border-transparent">
                          {estadoEstilo.label}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
        <p className="text-xs" style={{ color: colors.texto2 }}>
          Haz clic en una fila para ver el detalle. Estados: Pendiente (gris), Atendido (verde),
          Descartado (rojo claro, con motivo).
        </p>
      </div>

      {seleccionado ? (
        <DetalleReportePanel
          reporte={seleccionado}
          onCerrar={() => setSeleccionId(null)}
          onCambiado={alCambiarEstado}
        />
      ) : null}
    </div>
  )
}
