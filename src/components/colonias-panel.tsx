"use client"

import { useCallback, useEffect, useRef, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Plus } from "lucide-react"
import type { Colonia } from "@/lib/types"
import { colors } from "@/lib/theme"
import { DIAS, horarioParaMostrar } from "@/lib/colonias-validacion"
import { calcularRanking, type FilaRanking } from "@/lib/ranking-colonias"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ESTILO_TD, ESTILO_TH, Pastilla } from "@/components/campos"
import { ColumnaLateral, EstadoVacio } from "@/components/columna-lateral"
import { ColoniaForm } from "@/components/colonia-form"

type Pestana = "rutas" | "ranking"

// Valor de seleccionId cuando se está creando una colonia nueva.
const NUEVA = "__nueva__"

// Cambia cuando cambia cualquier dato de la colonia: así el formulario se vuelve a montar con lo guardado.
function versionDe(c: Colonia): string {
  return JSON.stringify([c.id, c.nombre, c.dias_recoleccion, c.horario, c.ruta_numero, c.activa])
}

function PastillasDias({ dias, resaltada }: { dias: string[]; resaltada: boolean }) {
  return (
    <div className="flex gap-1" role="img" aria-label={dias.length ? `Días: ${dias.join(", ")}` : "Sin días registrados"}>
      {DIAS.map((d) => {
        const activo = dias.includes(d.valor)
        return (
          <span
            key={d.valor}
            aria-hidden="true"
            className="flex h-[26px] w-[26px] items-center justify-center rounded-[7px] text-xs"
            style={
              activo
                ? { backgroundColor: colors.manglar, color: "#fff", fontWeight: 700 }
                : { backgroundColor: resaltada ? "#FFFFFF" : colors.surface3, color: colors.texto2, fontWeight: 600 }
            }
          >
            {d.letra}
          </span>
        )
      })}
    </div>
  )
}

export function ColoniasPanel({
  colonias,
  ranking,
  errorColonias,
  errorRanking,
}: {
  colonias: Colonia[]
  ranking: FilaRanking[]
  errorColonias?: string
  errorRanking?: string
}) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [pestana, setPestana] = useState<Pestana>("rutas")
  // Al entrar ya hay una colonia abierta (la primera).
  const [seleccionId, setSeleccionId] = useState<string | null>(() => colonias[0]?.id ?? null)
  const [limpiadaPorUsuario, setLimpiadaPorUsuario] = useState(false)
  // Solo cuenta por debajo de 1280 px, donde la edición es un cajón.
  const [cajonAbierto, setCajonAbierto] = useState(false)
  const [aviso, setAviso] = useState<string | null>(null)
  const sucioRef = useRef(false)
  const marcarSucio = useCallback((sucio: boolean) => {
    sucioRef.current = sucio
  }, [])

  useEffect(() => {
    if (!aviso) return
    const t = setTimeout(() => setAviso(null), 4000)
    return () => clearTimeout(t)
  }, [aviso])

  // Si la colonia abierta ya no existe (otra persona la cambió) o no hay ninguna abierta y hay
  // colonias, se abre la primera. Una selección vacía solo se respeta si la dejó la persona con la X.
  // Una recién creada que aún no llega del servidor no está en `colonias`: no se toca.
  if (!limpiadaPorUsuario && seleccionId === null && colonias.length > 0) setSeleccionId(colonias[0].id)

  const seleccionada = seleccionId && seleccionId !== NUEVA ? (colonias.find((c) => c.id === seleccionId) ?? null) : null
  const haySeleccion = seleccionId === NUEVA || seleccionada !== null
  const cajonVisible = pestana === "rutas" && haySeleccion && cajonAbierto

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
  function cambiarPestana(nueva: Pestana) {
    if (nueva === pestana) return
    if (!confirmarDescarte()) return
    setPestana(nueva)
    setCajonAbierto(false)
  }
  function alGuardar(id: string, mensaje: string) {
    sucioRef.current = false
    setSeleccionId(id)
    setLimpiadaPorUsuario(false)
    setAviso(mensaje)
    startTransition(() => router.refresh())
  }

  const { filas: filasRanking, reportesOtra } = calcularRanking(ranking)

  return (
    <div className="-m-8 flex h-screen">
      {cajonVisible ? (
        <div className="fixed inset-0 z-30 bg-black/20 xl:hidden" onClick={cerrar} aria-hidden="true" />
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col gap-5 overflow-y-auto py-8 pr-7 pl-10 [&>*]:shrink-0">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="text-[28px] font-bold tracking-tight">Colonias y rutas</h1>
            <p className="text-sm" style={{ color: colors.texto2 }}>
              Días y horario del camión que ve la ciudadanía en la app
            </p>
          </div>
          {pestana === "rutas" ? (
            <button
              type="button"
              onClick={() => abrir(NUEVA)}
              className="flex h-[42px] items-center gap-2 rounded-xl px-4 text-sm font-semibold text-white"
              style={{ backgroundColor: colors.manglar }}
            >
              <Plus className="h-4 w-4" strokeWidth={2.4} aria-hidden="true" />
              Nueva colonia
            </button>
          ) : null}
        </header>

        <div role="tablist" className="flex gap-1 border-b" style={{ borderColor: colors.borde }}>
          {(
            [
              ["rutas", "Rutas y horarios"],
              ["ranking", "Ranking de reportes"],
            ] as const
          ).map(([valor, etiqueta]) => {
            const activa = pestana === valor
            return (
              <button
                key={valor}
                type="button"
                role="tab"
                aria-selected={activa}
                onClick={() => cambiarPestana(valor)}
                className="h-11 px-4 text-sm"
                style={{
                  borderBottom: `3px solid ${activa ? colors.manglar : "transparent"}`,
                  color: activa ? colors.manglar : colors.texto2,
                  fontWeight: activa ? 700 : 500,
                  marginBottom: -1,
                }}
              >
                {etiqueta}
              </button>
            )
          })}
        </div>

        {aviso ? (
          <p role="status" className="text-sm font-semibold" style={{ color: colors.manglar }}>
            {aviso}
          </p>
        ) : null}

        {pestana === "rutas" ? (
          <>
            {errorColonias ? (
              <p className="text-sm" style={{ color: colors.rp }}>
                No se pudieron cargar las colonias: {errorColonias}
              </p>
            ) : null}
            <div className="overflow-hidden rounded-[16px] border bg-white" style={{ borderColor: colors.borde }}>
              <Table>
                <TableHeader>
                  <TableRow className="border-b-0 hover:bg-transparent" style={{ backgroundColor: colors.fondo }}>
                    <TableHead style={ESTILO_TH}>Colonia</TableHead>
                    <TableHead style={ESTILO_TH}>Días</TableHead>
                    <TableHead style={ESTILO_TH}>Horario</TableHead>
                    <TableHead style={ESTILO_TH}>Ruta</TableHead>
                    <TableHead style={ESTILO_TH}>En la app</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {colonias.length === 0 ? (
                    <TableRow className="border-t" style={{ borderColor: colors.borde }}>
                      <TableCell colSpan={5} className="text-center text-sm" style={{ ...ESTILO_TD, padding: "40px 16px", color: colors.texto2 }}>
                        Aún no hay colonias.
                      </TableCell>
                    </TableRow>
                  ) : (
                    colonias.map((c) => {
                      const activa = seleccionId === c.id
                      return (
                        <TableRow
                          key={c.id}
                          onClick={() => abrir(c.id)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault()
                              abrir(c.id)
                            }
                          }}
                          tabIndex={0}
                          aria-current={activa ? "true" : undefined}
                          className="cursor-pointer border-t border-b-0"
                          style={{ borderColor: colors.borde, ...(activa ? { backgroundColor: colors.palido } : {}) }}
                        >
                          <TableCell className="font-semibold" style={ESTILO_TD}>
                            {c.nombre}
                          </TableCell>
                          <TableCell style={ESTILO_TD}>
                            <PastillasDias dias={c.dias_recoleccion ?? []} resaltada={activa} />
                          </TableCell>
                          <TableCell style={{ ...ESTILO_TD, color: c.horario ? undefined : colors.texto2 }}>
                            {c.horario ? horarioParaMostrar(c.horario) : "—"}
                          </TableCell>
                          <TableCell style={{ ...ESTILO_TD, color: c.ruta_numero != null ? undefined : colors.texto2 }}>
                            {c.ruta_numero ?? "—"}
                          </TableCell>
                          <TableCell style={ESTILO_TD}>
                            {c.activa ? (
                              <Pastilla bg={activa ? "#FFFFFF" : colors.rsuBg} fg={colors.manglar}>
                                Visible
                              </Pastilla>
                            ) : (
                              <Pastilla bg={colors.surface3} fg={colors.texto2}>
                                Oculta
                              </Pastilla>
                            )}
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </div>
            <p className="text-xs leading-normal" style={{ color: colors.texto2 }}>
              Las colonias no se borran: se ocultan y la app deja de listarlas. El horario se muestra como lo
              verá la ciudadanía en la app.
            </p>
          </>
        ) : (
          <>
            {errorRanking ? (
              <p className="text-sm" style={{ color: colors.rp }}>
                No se pudo cargar el ranking: {errorRanking}
              </p>
            ) : null}
            <div className="overflow-hidden rounded-[16px] border bg-white" style={{ borderColor: colors.borde }}>
              <Table>
                <TableHeader>
                  <TableRow className="border-b-0 hover:bg-transparent" style={{ backgroundColor: colors.fondo }}>
                    <TableHead style={{ ...ESTILO_TH, width: 64 }}>#</TableHead>
                    <TableHead style={ESTILO_TH}>Colonia</TableHead>
                    <TableHead style={ESTILO_TH}>Total reportes</TableHead>
                    <TableHead style={ESTILO_TH}>Urgencia alta</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filasRanking.length === 0 ? (
                    <TableRow className="border-t" style={{ borderColor: colors.borde }}>
                      <TableCell colSpan={4} className="text-center text-sm" style={{ ...ESTILO_TD, padding: "40px 16px", color: colors.texto2 }}>
                        Aún no hay reportes con colonia.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filasRanking.map((f) => (
                      <TableRow key={f.colonia} className="border-t border-b-0" style={{ borderColor: colors.borde }}>
                        <TableCell className="font-bold" style={{ ...ESTILO_TD, color: colors.texto2 }}>
                          {f.posicion}
                        </TableCell>
                        <TableCell className="font-semibold" style={ESTILO_TD}>
                          {f.colonia}
                        </TableCell>
                        <TableCell style={ESTILO_TD}>{f.total_reportes}</TableCell>
                        <TableCell style={ESTILO_TD}>
                          {f.urgentes > 0 ? (
                            <Pastilla bg={colors.rpBg} fg={colors.rp}>
                              {f.urgentes}
                            </Pastilla>
                          ) : (
                            <span style={{ color: colors.texto2 }}>0</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            <p className="text-xs leading-normal" style={{ color: colors.texto2 }}>
              Cuenta los reportes pendientes (los atendidos y descartados salen del ranking). Las colonias con
              el mismo total comparten posición. No incluye {reportesOtra}{" "}
              {reportesOtra === 1 ? "reporte" : "reportes"} con colonia «Otra».
            </p>
          </>
        )}
      </div>

      {pestana === "rutas" ? (
        <ColumnaLateral etiqueta="Editar colonia" ancho={420} visibleEnCajon={cajonVisible}>
          {haySeleccion ? (
            <ColoniaForm
              key={seleccionId === NUEVA ? NUEVA : versionDe(seleccionada!)}
              colonia={seleccionada}
              todas={colonias}
              onGuardado={alGuardar}
              onCerrar={cerrar}
              onSucio={marcarSucio}
            />
          ) : (
            <EstadoVacio>Selecciona una colonia para editarla, o crea una nueva</EstadoVacio>
          )}
        </ColumnaLateral>
      ) : null}
    </div>
  )
}
