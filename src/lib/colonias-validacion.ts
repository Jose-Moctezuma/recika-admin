// Reglas y formato de las colonias y rutas. Todo puro (sin red ni dependencias): lo usan el formulario
// (para dar aviso al momento) y la server action (que es la que de verdad decide, porque el cliente
// no es de fiar).
//
// FORMATO QUE LEE LA APP MÓVIL (repo recika: lib/colonias.ts, lib/formato.ts, lib/recordatorios.ts)
// y que aquí NO se cambia:
//   · dias_recoleccion: text[] con nombres completos, en minúscula y con acento:
//     "lunes" | "martes" | "miércoles" | "jueves" | "viernes" | "sábado" | "domingo". La app los
//     compara con includes() y los usa como llave de un mapa (recordatorios); un nombre distinto
//     ("Miercoles", "mie") se ignora o rompe el recordatorio. Se guardan en orden lunes → domingo,
//     como las filas que ya existen.
//   · horario: texto "H:MM - H:MM" (hora sin cero a la izquierda, guion con espacios), p. ej.
//     "8:00 - 11:00" o "7:00 - 9:30". La app lo muestra como "De 8:00 a 11:00" (formatoHorario).
//   · ruta_numero: entero o null ("Sin asignar"). activa: boolean (la app solo lista las activas).

export const DIAS = [
  { valor: "lunes", letra: "L", abreviatura: "Lun", etiqueta: "Lunes" },
  { valor: "martes", letra: "M", abreviatura: "Mar", etiqueta: "Martes" },
  { valor: "miércoles", letra: "M", abreviatura: "Mié", etiqueta: "Miércoles" },
  { valor: "jueves", letra: "J", abreviatura: "Jue", etiqueta: "Jueves" },
  { valor: "viernes", letra: "V", abreviatura: "Vie", etiqueta: "Viernes" },
  { valor: "sábado", letra: "S", abreviatura: "Sáb", etiqueta: "Sábado" },
  { valor: "domingo", letra: "D", abreviatura: "Dom", etiqueta: "Domingo" },
] as const

export type Dia = (typeof DIAS)[number]["valor"]

const VALORES_DIA: readonly string[] = DIAS.map((d) => d.valor)

// "Otra" es el valor que la app guarda en reportes.colonia cuando alguien no encuentra la suya
// (COLONIA_OTRA en lib/colonias.ts): una colonia real con ese nombre se confundiría con ella.
export const NOMBRE_RESERVADO = "otra"

export const NOMBRE_MIN = 2
export const NOMBRE_MAX = 80
export const RUTA_MAX = 999

// ---- Nombres ------------------------------------------------------------------------------

// Recorta y junta los espacios repetidos ("  El   Vergel " -> "El Vergel").
export function limpiarNombre(texto: string): string {
  return texto.replace(/\s+/g, " ").trim()
}

// Forma para COMPARAR nombres: sin acentos, sin mayúsculas, sin espacios de más.
export function normalizarNombre(texto: string): string {
  return limpiarNombre(texto).normalize("NFD").replace(/\p{M}/gu, "").toLowerCase()
}

// Devuelve el nombre de la colonia que choca (comparando sin acentos ni mayúsculas), o null.
export function nombreDuplicado(
  nombre: string,
  otras: { id: string; nombre: string }[],
  idActual?: string
): string | null {
  const buscado = normalizarNombre(nombre)
  const choque = otras.find((c) => c.id !== idActual && normalizarNombre(c.nombre) === buscado)
  return choque ? choque.nombre : null
}

// ---- Días ---------------------------------------------------------------------------------

// Sin repetidos y de lunes a domingo (el orden en que ya están guardadas las filas actuales).
export function ordenarDias(dias: readonly string[]): Dia[] {
  return VALORES_DIA.filter((d) => dias.includes(d)) as Dia[]
}

// ---- Horario ------------------------------------------------------------------------------

export interface RangoHorario {
  // "HH:MM" de 24 h, que es lo que entrega y recibe <input type="time">.
  desde: string
  hasta: string
}

// Mismo patrón que formatoHorario() de la app: "8:00 - 11:00", con -, – , — o "a" como separador.
const PATRON_RANGO = /^(\d{1,2}):(\d{2})\s*(?:-|–|—|a)\s*(\d{1,2}):(\d{2})$/i

function hora(h: string, m: string): string | null {
  const hh = Number(h)
  const mm = Number(m)
  if (!Number.isInteger(hh) || !Number.isInteger(mm) || hh < 0 || hh > 23 || mm < 0 || mm > 59) return null
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`
}

// "8:00 - 11:00" -> { desde: "08:00", hasta: "11:00" }; cualquier otro texto -> null.
export function parsearHorario(texto: string | null | undefined): RangoHorario | null {
  const limpio = texto?.trim()
  if (!limpio) return null
  const m = limpio.match(PATRON_RANGO)
  if (!m) return null
  const desde = hora(m[1], m[2])
  const hasta = hora(m[3], m[4])
  return desde && hasta ? { desde, hasta } : null
}

// { "08:00", "11:00" } -> "8:00 - 11:00" (el formato exacto de las filas que ya existen).
export function serializarHorario(desde: string, hasta: string): string {
  const parte = (hhmm: string) => {
    const [h, m] = hhmm.split(":")
    return `${Number(h)}:${m}`
  }
  return `${parte(desde)} - ${parte(hasta)}`
}

// Cómo lo muestra el panel (igual que la tarjeta de la app, sin el "De "): "8:00 a 11:00".
export function horarioParaMostrar(texto: string | null | undefined): string {
  const rango = parsearHorario(texto)
  if (rango) return serializarHorario(rango.desde, rango.hasta).replace(" - ", " a ")
  return texto?.trim() || "Sin definir"
}

// ---- Vista previa -------------------------------------------------------------------------

// Hora de Chetumal (UTC-5 fijo) para saber qué día de la semana es "hoy".
function diaDeLaSemanaEnChetumal(ahora: Date): number {
  return new Date(ahora.getTime() - 5 * 3_600_000).getUTCDay()
}

const ORDEN_DOMINGO_PRIMERO: Dia[] = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"]

// "Martes · 8:00 a 11:00 · Ruta 2": el día es la PRÓXIMA recolección (la app muestra "Hoy" o
// "Mañana" cuando corresponde; aquí va el nombre para que se lea igual en cualquier fecha).
export function vistaPrevia(
  dias: readonly string[],
  horario: string | null,
  ruta: number | null,
  ahora: Date = new Date()
): string {
  const hoy = diaDeLaSemanaEnChetumal(ahora)
  let proximo: string | null = null
  for (let salto = 0; salto < 7; salto++) {
    const dia = ORDEN_DOMINGO_PRIMERO[(hoy + salto) % 7]
    if (dias.includes(dia)) {
      proximo = dia.charAt(0).toUpperCase() + dia.slice(1)
      break
    }
  }
  return [proximo ?? "Sin días registrados", horario ? horarioParaMostrar(horario) : null, ruta ? `Ruta ${ruta}` : null]
    .filter(Boolean)
    .join(" · ")
}

// ---- Validación completa ------------------------------------------------------------------

export interface EntradaColonia {
  id?: string
  nombre: string
  dias: string[]
  // Ya serializado ("8:00 - 11:00") o null si no hay horario.
  horario: string | null
  ruta: number | string | null
  visible: boolean
}

export interface ColoniaValida {
  nombre: string
  dias_recoleccion: Dia[]
  horario: string | null
  ruta_numero: number | null
  activa: boolean
}

export type ResultadoValidacion<T> = { ok: true; valor: T } | { ok: false; error: string }

export function validarColonia(
  entrada: unknown,
  contexto: {
    otras: { id: string; nombre: string }[]
    // Horario que tiene hoy la fila (si se está editando): si llega igual, se deja tal cual aunque
    // no tenga el formato "H:MM - H:MM" (texto libre anterior), en vez de rechazar guardar otros cambios.
    horarioActual?: string | null
    idActual?: string
  }
): ResultadoValidacion<ColoniaValida> {
  if (typeof entrada !== "object" || entrada === null) return { ok: false, error: "Datos no válidos." }
  const e = entrada as Record<string, unknown>

  if (typeof e.nombre !== "string") return { ok: false, error: "Escribe el nombre de la colonia." }
  const nombre = limpiarNombre(e.nombre)
  if (nombre.length < NOMBRE_MIN) return { ok: false, error: "Escribe el nombre de la colonia." }
  if (nombre.length > NOMBRE_MAX) return { ok: false, error: `El nombre no puede pasar de ${NOMBRE_MAX} caracteres.` }
  if (/[\u0000-\u001f\u007f]/.test(nombre)) return { ok: false, error: "El nombre tiene caracteres no válidos." }
  if (normalizarNombre(nombre) === NOMBRE_RESERVADO) {
    return { ok: false, error: "«Otra» está reservada: es lo que la app guarda cuando alguien no encuentra su colonia." }
  }
  const choque = nombreDuplicado(nombre, contexto.otras, contexto.idActual)
  if (choque) return { ok: false, error: `Ya existe una colonia llamada «${choque}» (se comparan sin acentos ni mayúsculas).` }

  if (!Array.isArray(e.dias) || e.dias.some((d) => typeof d !== "string" || !VALORES_DIA.includes(d))) {
    return { ok: false, error: "Los días no son válidos." }
  }
  const dias = ordenarDias(e.dias as string[])

  let horario: string | null = null
  if (e.horario !== null && e.horario !== undefined && e.horario !== "") {
    if (typeof e.horario !== "string") return { ok: false, error: "El horario no es válido." }
    const rango = parsearHorario(e.horario)
    if (rango) {
      if (rango.desde === rango.hasta) return { ok: false, error: "La hora de inicio y la de fin no pueden ser iguales." }
      horario = serializarHorario(rango.desde, rango.hasta)
    } else if (contexto.horarioActual != null && e.horario.trim() === contexto.horarioActual.trim()) {
      horario = contexto.horarioActual
    } else {
      return { ok: false, error: "El horario no es válido: elige la hora de inicio y la de fin." }
    }
  }

  let ruta: number | null = null
  if (e.ruta !== null && e.ruta !== undefined && e.ruta !== "") {
    const n = typeof e.ruta === "number" ? e.ruta : typeof e.ruta === "string" && /^\d+$/.test(e.ruta.trim()) ? Number(e.ruta.trim()) : NaN
    if (!Number.isInteger(n) || n < 1 || n > RUTA_MAX) {
      return { ok: false, error: `El número de ruta debe ser un entero entre 1 y ${RUTA_MAX}.` }
    }
    ruta = n
  }

  if (typeof e.visible !== "boolean") return { ok: false, error: "Falta indicar si la colonia es visible en la app." }

  return { ok: true, valor: { nombre, dias_recoleccion: dias, horario, ruta_numero: ruta, activa: e.visible } }
}
