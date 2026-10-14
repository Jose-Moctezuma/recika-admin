"use client"

import { useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import type { CentroAcopio, Reporte, ReporteMapa } from "@/lib/types"
import { colors, estiloEstadoReporte, estiloUrgencia } from "@/lib/theme"
import { fechaTabla } from "@/lib/fechas"
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

// Qué reporte mostrar en el detalle cuando nadie ha elegido uno: el pendiente más reciente de la
// lista; si no hay pendientes, el primero de la lista.
function candidato(lista: Reporte[]): Reporte | null {
  let masReciente: Reporte | null = null
  for (const r of lista) {
    if (normalizarEstado(r.estado) !== "pendiente") continue
    if (masReciente === null || r.created_at > masReciente.created_at) masReciente = r
  }
  return masReciente ?? lista[0] ?? null
}

// Encabezado y celdas de la tabla según la maqueta. Estilos en línea porque los de la tabla base
// (shadcn) fijan alto, relleno y color y no hay forma limpia de pisarlos uno por uno.
const ESTILO_TH = {
  height: "auto",
  padding: "12px 16px",
  fontSize: 12,
  fontWeight: 700,
  letterSpacing: "0.6px",
  textTransform: "uppercase",
  color: colors.texto2,
} as const
const ESTILO_TD = { padding: "14px 16px" } as const

export function ReportesPanel({
  reportes,
  acopios,
  errorAcopios,
}: {
  reportes: Reporte[]
  acopios: CentroAcopio[]
  errorAcopios?: string
}) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>("todos")
  const [colonia, setColonia] = useState("todas")
  const [urgencia, setUrgencia] = useState("cualquiera")
  const [ocultarPruebas, setOcultarPruebas] = useState(false)
  // Al entrar ya hay un reporte seleccionado (el pendiente más reciente).
  const [seleccionId, setSeleccionId] = useState<string | null>(() => candidato(reportes)?.id ?? null)
  // La persona pulsó la X: se respeta la selección vacía (no se vuelve a elegir sola) hasta que
  // haga clic en otra fila.
  const [limpiadaPorUsuario, setLimpiadaPorUsuario] = useState(false)
  // Solo cuenta por debajo de 1280 px, donde el detalle es un cajón: se abre al hacer clic en una
  // fila (no por la selección automática de la entrada) y se cierra con la X.
  const [cajonAbierto, setCajonAbierto] = useState(false)

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

  // Si el reporte seleccionado ya no está en la lista (cambió un filtro, o dejó de cumplirlo tras
  // atenderlo estando en "Pendientes"), el detalle pasa al siguiente candidato en vez de quedarse
  // apuntando a una fila que no se ve; y si la lista estuvo vacía y vuelve a tener reportes, también
  // elige uno. Solo se respeta la selección vacía cuando la dejó la persona con la X.
  if (!limpiadaPorUsuario) {
    const sigueEnLista = seleccionId !== null && filtrados.some((r) => r.id === seleccionId)
    if (!sigueEnLista) {
      const siguiente = candidato(filtrados)?.id ?? null
      if (siguiente !== seleccionId) setSeleccionId(siguiente)
    }
  }

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

  function seleccionar(id: string) {
    setSeleccionId(id)
    setLimpiadaPorUsuario(false)
    setCajonAbierto(true)
  }

  // La X solo limpia la selección (la columna sigue ahí, con su estado vacío).
  function limpiarSeleccion() {
    setSeleccionId(null)
    setLimpiadaPorUsuario(true)
    setCajonAbierto(false)
  }

  // Tras un cambio de estado se vuelve a leer la página (Server Component). La selección se
  // conserva: el detalle muestra el estado nuevo (y "Regresar a pendiente"), salvo que el filtro
  // activo ya no incluya ese reporte; entonces pasa al siguiente (ver arriba).
  function alCambiarEstado() {
    startTransition(() => router.refresh())
  }

  const cajonVisible = seleccionado !== null && cajonAbierto

  // -m-8 h-screen: la pantalla ocupa todo el alto y el ancho del área de contenido (anula el relleno
  // de <main>) para que la columna de detalle quede pegada al borde derecho, de arriba a abajo.
  return (
    <div className="-m-8 flex h-screen">
      {cajonVisible ? (
        <div className="fixed inset-0 z-30 bg-black/20 xl:hidden" onClick={limpiarSeleccion} aria-hidden="true" />
      ) : null}

      {/* [&>*]:shrink-0: en una columna con scroll, sin esto los hijos (el mapa, la tabla) se
          comprimen para caber en vez de hacer scroll. */}
      <div className="flex min-w-0 flex-1 flex-col gap-5 overflow-y-auto py-8 pr-7 pl-10 [&>*]:shrink-0">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="text-[28px] font-bold tracking-tight">Reportes</h1>
            <p className="text-sm" style={{ color: colors.texto2 }}>
              Tiraderos clandestinos reportados por la comunidad
            </p>
          </div>
          <ExportarCsv reportes={reportes} />
        </div>

        {errorAcopios ? (
          <p className="text-sm" style={{ color: colors.rp }}>
            No se pudieron cargar los centros de acopio: {errorAcopios}
          </p>
        ) : null}

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
                  className="h-9 rounded-[9px] px-3.5 text-[13px] transition-colors"
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

          <label className="flex items-center gap-1.5 text-[13px]" style={{ color: colors.texto2 }}>
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

        <div className="overflow-hidden rounded-[16px] border bg-white" style={{ borderColor: colors.borde }}>
          <Table>
            <TableHeader>
              <TableRow className="border-b-0 hover:bg-transparent" style={{ backgroundColor: colors.fondo }}>
                <TableHead style={ESTILO_TH}>Fecha</TableHead>
                <TableHead style={ESTILO_TH}>Colonia</TableHead>
                <TableHead style={ESTILO_TH}>Tipo</TableHead>
                <TableHead style={ESTILO_TH}>Urgencia</TableHead>
                <TableHead style={ESTILO_TH}>Origen</TableHead>
                <TableHead style={ESTILO_TH}>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtrados.length === 0 ? (
                <TableRow className="border-t" style={{ borderColor: colors.borde }}>
                  <TableCell colSpan={6} className="text-center text-sm" style={{ ...ESTILO_TD, padding: "40px 16px", color: colors.texto2 }}>
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
                      onClick={() => seleccionar(reporte.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault()
                          seleccionar(reporte.id)
                        }
                      }}
                      tabIndex={0}
                      aria-current={activa ? "true" : undefined}
                      className="cursor-pointer border-t border-b-0"
                      style={{ borderColor: colors.borde, ...(activa ? { backgroundColor: colors.palido } : {}) }}
                    >
                      <TableCell style={{ ...ESTILO_TD, fontWeight: activa ? 600 : 400 }}>
                        {fechaTabla(reporte.created_at)}
                      </TableCell>
                      <TableCell style={ESTILO_TD}>{reporte.colonia || "—"}</TableCell>
                      <TableCell style={ESTILO_TD}>{reporte.tipo_residuo || "—"}</TableCell>
                      <TableCell style={ESTILO_TD}>
                        <span
                          className="rounded-full px-2.5 py-1 text-xs font-bold"
                          style={{ backgroundColor: urgenciaEstilo.bg, color: urgenciaEstilo.fg }}
                        >
                          {urgenciaEstilo.label}
                        </span>
                      </TableCell>
                      <TableCell style={ESTILO_TD}>{reporte.desde_sitio ? "En el sitio" : "Desde casa"}</TableCell>
                      <TableCell style={ESTILO_TD}>
                        <span
                          className="rounded-full px-2.5 py-1 text-xs font-bold"
                          style={{ backgroundColor: estadoEstilo.bg, color: estadoEstilo.fg }}
                        >
                          {estadoEstilo.label}
                        </span>
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

      <DetalleReportePanel
        reporte={seleccionado}
        visibleEnCajon={cajonVisible}
        onCerrar={limpiarSeleccion}
        onCambiado={alCambiarEstado}
      />
    </div>
  )
}
