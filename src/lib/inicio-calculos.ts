// Cálculos de la pantalla Inicio. Todo aquí es puro (sin red ni dependencias): recibe las filas
// ya leídas de `reportes` y devuelve lo que la pantalla dibuja. Así se puede probar sin base de
// datos y la pantalla solo se ocupa de pintar.
//
// ZONA HORARIA: el piloto es en Chetumal (America/Cancun, UTC-5 todo el año: Quintana Roo no
// cambia de horario desde 2015). El servidor (Vercel) corre en UTC, así que "hoy" y los límites de
// cada día se calculan aquí con ese desfase fijo, no con la hora del servidor.

export type Periodo = "30d" | "piloto" | "todo"

export const PERIODOS: { valor: Periodo; etiqueta: string }[] = [
  { valor: "30d", etiqueta: "Últimos 30 días" },
  { valor: "piloto", etiqueta: "Piloto (7–9 oct 2026)" },
  { valor: "todo", etiqueta: "Todo" },
]

export const PERIODO_POR_DEFECTO: Periodo = "30d"

// Ventana del piloto (días calendario de Chetumal, ambos incluidos).
const PILOTO_PRIMER_DIA = "2026-10-07"
const PILOTO_ULTIMO_DIA = "2026-10-09"

const HORAS_DESFASE_CANCUN = 5
const MESES_CORTOS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"]

// Respuestas que ofrece la app en "¿Cómo te enteraste?" (app/reporte.tsx, ENTERASTE). Se muestran
// siempre en este orden; si algún día llegara otro texto, se agrega después.
export const RESPUESTAS_ENTERADO = ["Ya lo conocía", "Me lo dijeron", "Lo vi en esta app"]

const TOP_COLONIAS = 5
const TOP_POR_REVISAR = 5

// Solo lo que la pantalla necesita de cada reporte. A propósito NO hay user_id, descripcion ni
// referencia_lugar: ni se leen de la base ni pueden terminar en esta pantalla.
export interface FilaReporte {
  id: string
  created_at: string
  estado: string | null
  colonia: string | null
  tipo_residuo: string | null
  como_se_entero: string | null
}

export function leerPeriodo(valor: string | string[] | undefined): Periodo {
  const texto = Array.isArray(valor) ? valor[0] : valor
  return PERIODOS.some((p) => p.valor === texto) ? (texto as Periodo) : PERIODO_POR_DEFECTO
}

// ---- Fechas (día calendario de Chetumal, formato AAAA-MM-DD) -------------------------------

export function diaCancun(instante: Date | string): string {
  const ms = new Date(instante).getTime() - HORAS_DESFASE_CANCUN * 3_600_000
  return new Date(ms).toISOString().slice(0, 10)
}

export function sumarDias(dia: string, dias: number): string {
  const [a, m, d] = dia.split("-").map(Number)
  return new Date(Date.UTC(a, m - 1, d + dias)).toISOString().slice(0, 10)
}

// Instante (ISO, UTC) en que empieza ese día en Chetumal.
export function inicioDelDia(dia: string): string {
  return new Date(`${dia}T00:00:00-0${HORAS_DESFASE_CANCUN}:00`).toISOString()
}

// "3 oct". Fijo, sin Intl: el nombre del mes no depende de la versión de ICU del servidor.
export function etiquetaDiaCorta(dia: string): string {
  const [, m, d] = dia.split("-").map(Number)
  return `${d} ${MESES_CORTOS[m - 1]}`
}

// "27 sep, 23:43" (hora de Chetumal).
export function etiquetaFechaHora(iso: string): string {
  const desplazada = new Date(new Date(iso).getTime() - HORAS_DESFASE_CANCUN * 3_600_000)
  const hh = String(desplazada.getUTCHours()).padStart(2, "0")
  const mm = String(desplazada.getUTCMinutes()).padStart(2, "0")
  return `${desplazada.getUTCDate()} ${MESES_CORTOS[desplazada.getUTCMonth()]}, ${hh}:${mm}`
}

// ---- Periodo -------------------------------------------------------------------------------

export interface RangoPeriodo {
  hoy: string
  // Primer y último día del periodo. primerDia es null en "Todo" (empieza en el primer reporte).
  primerDia: string | null
  ultimoDia: string
  // Límites para filtrar en la base: [desdeISO, hastaISO). null = sin límite de ese lado.
  desdeISO: string | null
  hastaISO: string | null
}

export function rangoPeriodo(periodo: Periodo, ahora: Date): RangoPeriodo {
  const hoy = diaCancun(ahora)
  if (periodo === "piloto") {
    return {
      hoy,
      primerDia: PILOTO_PRIMER_DIA,
      ultimoDia: PILOTO_ULTIMO_DIA,
      desdeISO: inicioDelDia(PILOTO_PRIMER_DIA),
      hastaISO: inicioDelDia(sumarDias(PILOTO_ULTIMO_DIA, 1)),
    }
  }
  if (periodo === "todo") {
    return { hoy, primerDia: null, ultimoDia: hoy, desdeISO: null, hastaISO: null }
  }
  // Últimos 30 días: hoy y los 29 anteriores.
  const primerDia = sumarDias(hoy, -29)
  return {
    hoy,
    primerDia,
    ultimoDia: hoy,
    desdeISO: inicioDelDia(primerDia),
    hastaISO: inicioDelDia(sumarDias(hoy, 1)),
  }
}

// ---- Resumen -------------------------------------------------------------------------------

export interface PuntoPorDia {
  dia: string
  etiqueta: string
  total: number
}

export interface RespuestaEnterado {
  respuesta: string
  total: number
  porcentaje: number
}

export interface FilaRankingColonia {
  posicion: number
  colonia: string
  total: number
}

export interface PendienteReciente {
  id: string
  tipo_residuo: string
  colonia: string
  created_at: string
}

export interface ResumenInicio {
  recibidos: number
  hoy: number
  pendientes: number
  atendidos: number
  descartados: number
  porDia: PuntoPorDia[]
  maximoPorDia: number
  enterados: RespuestaEnterado[]
  totalRespondieron: number
  sinRespuesta: number
  ranking: FilaRankingColonia[]
  // Colonias distintas con al menos un reporte (sin contar "Otra"): la cifra que antes mostraba
  // "Colonias con reportes".
  coloniasConReportes: number
  // Colonias que quedaron fuera del top por empatar con la última del top.
  coloniasEmpatadasFuera: number
  reportesColoniaOtra: number
  porRevisar: PendienteReciente[]
}

// Mismo criterio que el panel de Reportes: lo que no es atendido ni descartado cuenta como
// pendiente (así también se lee bien una base a la que aún no se le aplicó la migración 0008).
function estadoNormalizado(estado: string | null): "pendiente" | "atendido" | "descartado" {
  return estado === "atendido" || estado === "descartado" ? estado : "pendiente"
}

function esColoniaOtra(colonia: string): boolean {
  return colonia.trim().toLowerCase() === "otra"
}

export function calcularResumen(filas: FilaReporte[], rango: RangoPeriodo): ResumenInicio {
  let hoy = 0
  let pendientes = 0
  let atendidos = 0
  let descartados = 0
  let reportesColoniaOtra = 0
  let sinRespuesta = 0
  const porDiaConteo = new Map<string, number>()
  const enteradoConteo = new Map<string, number>()
  const coloniaConteo = new Map<string, number>()

  for (const fila of filas) {
    const dia = diaCancun(fila.created_at)
    porDiaConteo.set(dia, (porDiaConteo.get(dia) ?? 0) + 1)
    if (dia === rango.hoy) hoy++

    const estado = estadoNormalizado(fila.estado)
    if (estado === "pendiente") pendientes++
    else if (estado === "atendido") atendidos++
    else descartados++

    const respuesta = fila.como_se_entero?.trim() ?? ""
    if (respuesta === "") sinRespuesta++
    else enteradoConteo.set(respuesta, (enteradoConteo.get(respuesta) ?? 0) + 1)

    const colonia = fila.colonia?.trim() ?? ""
    if (colonia === "") continue
    if (esColoniaOtra(colonia)) reportesColoniaOtra++
    else coloniaConteo.set(colonia, (coloniaConteo.get(colonia) ?? 0) + 1)
  }

  // Un punto por día calendario del periodo, también los días sin reportes (altura 0).
  // En "Todo" el eje empieza en el día del primer reporte.
  const primerDia = rango.primerDia ?? [...porDiaConteo.keys()].sort()[0] ?? null
  const porDia: PuntoPorDia[] = []
  if (primerDia !== null) {
    for (let dia = primerDia; dia <= rango.ultimoDia; dia = sumarDias(dia, 1)) {
      porDia.push({ dia, etiqueta: etiquetaDiaCorta(dia), total: porDiaConteo.get(dia) ?? 0 })
    }
  }
  const maximoPorDia = porDia.reduce((max, punto) => Math.max(max, punto.total), 0)

  const totalRespondieron = [...enteradoConteo.values()].reduce((suma, n) => suma + n, 0)
  const otras = [...enteradoConteo.keys()].filter((r) => !RESPUESTAS_ENTERADO.includes(r)).sort()
  const enterados: RespuestaEnterado[] = totalRespondieron === 0
    ? []
    : [...RESPUESTAS_ENTERADO, ...otras].map((respuesta) => {
        const total = enteradoConteo.get(respuesta) ?? 0
        return { respuesta, total, porcentaje: Math.round((total / totalRespondieron) * 100) }
      })

  // Más reportes primero; a igual cantidad, orden alfabético (para que el resultado sea estable).
  const ordenadas = [...coloniaConteo.entries()].sort(
    (a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "es")
  )
  // Posición con empates: 1, 1, 3 (las colonias empatadas comparten posición y la siguiente salta).
  const ranking: FilaRankingColonia[] = []
  ordenadas.slice(0, TOP_COLONIAS).forEach(([colonia, total], i) => {
    const posicion = i > 0 && ranking[i - 1].total === total ? ranking[i - 1].posicion : i + 1
    ranking.push({ posicion, colonia, total })
  })
  const ultimaDelTop = ranking.at(-1)
  const coloniasEmpatadasFuera = ultimaDelTop
    ? ordenadas.slice(TOP_COLONIAS).filter(([, total]) => total === ultimaDelTop.total).length
    : 0

  const porRevisar = filas
    .filter((fila) => estadoNormalizado(fila.estado) === "pendiente")
    .sort((a, b) => (a.created_at < b.created_at ? 1 : a.created_at > b.created_at ? -1 : 0))
    .slice(0, TOP_POR_REVISAR)
    .map((fila) => ({
      id: fila.id,
      tipo_residuo: fila.tipo_residuo?.trim() || "Reporte",
      colonia: fila.colonia?.trim() || "Sin colonia",
      created_at: fila.created_at,
    }))

  return {
    recibidos: filas.length,
    hoy,
    pendientes,
    atendidos,
    descartados,
    porDia,
    maximoPorDia,
    enterados,
    totalRespondieron,
    sinRespuesta,
    ranking,
    coloniasConReportes: coloniaConteo.size,
    coloniasEmpatadasFuera,
    reportesColoniaOtra,
    porRevisar,
  }
}
