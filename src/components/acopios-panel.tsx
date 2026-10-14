"use client"

import { useCallback, useEffect, useRef, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Plus } from "lucide-react"
import type { CentroAcopio } from "@/lib/types"
import { colors, estiloEstadoAcopio } from "@/lib/theme"
import { fechaSoloDia } from "@/lib/fechas"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ESTILO_TD, ESTILO_TH, Pastilla } from "@/components/campos"
import { ColumnaLateral, EstadoVacio } from "@/components/columna-lateral"
import { AcopioForm } from "@/components/acopio-form"

type Filtro = "todos" | "activo" | "sin_servicio" | "inactivo"

const PESTANAS: { valor: Filtro; etiqueta: string }[] = [
  { valor: "todos", etiqueta: "Todos" },
  { valor: "activo", etiqueta: "Activos" },
  { valor: "sin_servicio", etiqueta: "Sin servicio" },
  { valor: "inactivo", etiqueta: "Inactivos" },
]

// Valor de seleccionId cuando se está creando un centro nuevo.
const NUEVO = "__nuevo__"

function estadoConocido(estado: string): "activo" | "sin_servicio" | "inactivo" {
  return estado === "sin_servicio" || estado === "inactivo" ? estado : "activo"
}

const capitalizar = (texto: string) => (texto ? texto.charAt(0).toUpperCase() + texto.slice(1) : texto)

// Cambia cuando cambia cualquier dato del centro: así el formulario se vuelve a montar con lo guardado.
function versionDe(c: CentroAcopio): string {
  return JSON.stringify([c.id, c.nombre, c.direccion, c.tipos_material, c.horario, c.estado, c.lat, c.lng, c.verificado_en_campo, c.notas_verificacion])
}

export function AcopiosPanel({ centros, error }: { centros: CentroAcopio[]; error?: string }) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [filtro, setFiltro] = useState<Filtro>("todos")
  // Al entrar ya hay un centro abierto (el primero).
  const [seleccionId, setSeleccionId] = useState<string | null>(() => centros[0]?.id ?? null)
  const [limpiadaPorUsuario, setLimpiadaPorUsuario] = useState(false)
  // Solo cuenta por debajo de 1280 px, donde la edición es un cajón.
  const [cajonAbierto, setCajonAbierto] = useState(false)
  const [aviso, setAviso] = useState<string | null>(null)
  // ¿El formulario abierto tiene cambios sin guardar? (lo reporta el propio formulario)
  const sucioRef = useRef(false)
  const marcarSucio = useCallback((sucio: boolean) => {
    sucioRef.current = sucio
  }, [])

  useEffect(() => {
    if (!aviso) return
    const t = setTimeout(() => setAviso(null), 4000)
    return () => clearTimeout(t)
  }, [aviso])

  const conteos: Record<Filtro, number> = { todos: centros.length, activo: 0, sin_servicio: 0, inactivo: 0 }
  for (const c of centros) conteos[estadoConocido(c.estado)]++
  const filtrados = filtro === "todos" ? centros : centros.filter((c) => estadoConocido(c.estado) === filtro)

  // Si el centro abierto deja de verse en la lista (cambió el filtro, o se desactivó estando en
  // "Activos"), se abre el siguiente; y si la lista estuvo vacía y vuelve a tener centros, también.
  // Solo se respeta la selección vacía cuando la dejó la persona con la X. Un centro recién creado
  // que aún no llega del servidor (no está en `centros`) no se toca.
  if (!limpiadaPorUsuario && seleccionId !== NUEVO) {
    const enCentros = seleccionId !== null && centros.some((c) => c.id === seleccionId)
    const enLista = seleccionId !== null && filtrados.some((c) => c.id === seleccionId)
    if (seleccionId === null || (enCentros && !enLista)) {
      const siguiente = filtrados[0]?.id ?? null
      if (siguiente !== seleccionId) setSeleccionId(siguiente)
    }
  }

  const seleccionado = seleccionId && seleccionId !== NUEVO ? (centros.find((c) => c.id === seleccionId) ?? null) : null
  const haySeleccion = seleccionId === NUEVO || seleccionado !== null
  const cajonVisible = haySeleccion && cajonAbierto

  function confirmarDescarte(): boolean {
    return !sucioRef.current || window.confirm("Hay cambios sin guardar. ¿Descartarlos?")
  }
  function abrir(id: string) {
    if (id === seleccionId && cajonAbierto) return
    if (id !== seleccionId && !confirmarDescarte()) return
    setSeleccionId(id)
    setLimpiadaPorUsuario(false)
    setCajonAbierto(true)
  }
  function cerrar() {
    if (!confirmarDescarte()) return
    setSeleccionId(null)
    setLimpiadaPorUsuario(true)
    setCajonAbierto(false)
  }
  function alGuardar(id: string, mensaje: string) {
    sucioRef.current = false
    setSeleccionId(id)
    setLimpiadaPorUsuario(false)
    setAviso(mensaje)
    startTransition(() => router.refresh())
  }

  const activos = conteos.activo

  return (
    <div className="-m-8 flex h-screen">
      {cajonVisible ? (
        <div className="fixed inset-0 z-30 bg-black/20 xl:hidden" onClick={cerrar} aria-hidden="true" />
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col gap-5 overflow-y-auto py-8 pr-7 pl-10 [&>*]:shrink-0">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="text-[28px] font-bold tracking-tight">Centros de acopio</h1>
            <p className="text-sm" style={{ color: colors.texto2 }}>
              {activos} {activos === 1 ? "centro activo" : "centros activos"} en Chetumal
            </p>
          </div>
          <button
            type="button"
            onClick={() => abrir(NUEVO)}
            className="flex h-[42px] items-center gap-2 rounded-xl px-4 text-sm font-semibold text-white"
            style={{ backgroundColor: colors.manglar }}
          >
            <Plus className="h-4 w-4" strokeWidth={2.4} aria-hidden="true" />
            Nuevo centro
          </button>
        </header>

        {error ? (
          <p className="text-sm" style={{ color: colors.rp }}>
            No se pudieron cargar los centros de acopio: {error}
          </p>
        ) : null}
        {aviso ? (
          <p role="status" className="text-sm font-semibold" style={{ color: colors.manglar }}>
            {aviso}
          </p>
        ) : null}

        <div className="flex gap-1 self-start rounded-xl p-1" style={{ backgroundColor: colors.surface3 }}>
          {PESTANAS.map(({ valor, etiqueta }) => {
            const activo = filtro === valor
            return (
              <button
                key={valor}
                type="button"
                aria-pressed={activo}
                onClick={() => setFiltro(valor)}
                className="h-9 rounded-[9px] px-3.5 text-[13px] transition-colors"
                style={activo ? { backgroundColor: "#fff", color: colors.manglar, fontWeight: 700 } : { color: colors.texto2, fontWeight: 500 }}
              >
                {etiqueta} · {conteos[valor]}
              </button>
            )
          })}
        </div>

        <div className="overflow-hidden rounded-[16px] border bg-white" style={{ borderColor: colors.borde }}>
          <Table>
            <TableHeader>
              <TableRow className="border-b-0 hover:bg-transparent" style={{ backgroundColor: colors.fondo }}>
                <TableHead style={ESTILO_TH}>Centro</TableHead>
                <TableHead style={ESTILO_TH}>Materiales</TableHead>
                <TableHead style={ESTILO_TH}>Horario</TableHead>
                <TableHead style={ESTILO_TH}>Verificado</TableHead>
                <TableHead style={ESTILO_TH}>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtrados.length === 0 ? (
                <TableRow className="border-t" style={{ borderColor: colors.borde }}>
                  <TableCell colSpan={5} className="text-center text-sm" style={{ ...ESTILO_TD, padding: "40px 16px", color: colors.texto2 }}>
                    No hay centros con este estado.
                  </TableCell>
                </TableRow>
              ) : (
                filtrados.map((centro) => {
                  const estilo = estiloEstadoAcopio[estadoConocido(centro.estado)]
                  const activa = seleccionId === centro.id
                  return (
                    <TableRow
                      key={centro.id}
                      onClick={() => abrir(centro.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault()
                          abrir(centro.id)
                        }
                      }}
                      tabIndex={0}
                      aria-current={activa ? "true" : undefined}
                      className="cursor-pointer border-t border-b-0"
                      style={{ borderColor: colors.borde, ...(activa ? { backgroundColor: colors.palido } : {}) }}
                    >
                      <TableCell style={{ ...ESTILO_TD, whiteSpace: "normal" }}>
                        <div className="font-semibold">{centro.nombre}</div>
                        <div className="text-xs" style={{ color: colors.texto2 }}>
                          {centro.direccion || "Sin dirección"}
                        </div>
                      </TableCell>
                      <TableCell className="text-[13px]" style={{ ...ESTILO_TD, whiteSpace: "normal" }}>
                        {capitalizar((centro.tipos_material ?? []).join(", ")) || "—"}
                      </TableCell>
                      <TableCell className="text-[13px]" style={{ ...ESTILO_TD, whiteSpace: "normal" }}>
                        {centro.horario || "—"}
                      </TableCell>
                      <TableCell className="text-[13px]" style={{ ...ESTILO_TD, color: colors.texto2 }}>
                        {centro.verificado_en_campo ? fechaSoloDia(centro.verificado_en_campo) : "Sin fecha"}
                      </TableCell>
                      <TableCell style={ESTILO_TD}>
                        <Pastilla bg={activa && estadoConocido(centro.estado) === "activo" ? "#FFFFFF" : estilo.bg} fg={estilo.fg}>
                          {estilo.label}
                        </Pastilla>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
        <p className="text-xs leading-normal" style={{ color: colors.texto2 }}>
          Los centros no se borran: se desactivan y dejan de verse en la app. &quot;Verificado&quot; registra la
          visita de campo de la etapa 1 del estudio.
        </p>
      </div>

      <ColumnaLateral etiqueta="Editar centro" ancho={440} visibleEnCajon={cajonVisible}>
        {haySeleccion ? (
          <AcopioForm
            key={seleccionId === NUEVO ? NUEVO : versionDe(seleccionado!)}
            centro={seleccionado}
            onGuardado={alGuardar}
            onCerrar={cerrar}
            onSucio={marcarSucio}
          />
        ) : (
          <EstadoVacio>Selecciona un centro para editarlo, o crea uno nuevo</EstadoVacio>
        )}
      </ColumnaLateral>
    </div>
  )
}
