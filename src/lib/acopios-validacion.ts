// Reglas de los centros de acopio. Puro (sin red ni dependencias): lo usan el formulario (aviso al
// momento) y la server action (la que decide de verdad).
//
// FORMATO QUE YA USA LA TABLA y que lee la app (lib/acopio.ts, AcopioCard, mapa):
//   · tipos_material: text[] de palabras en minúscula y con acento ("plástico", "electrónico"). La
//     app arma sus chips de filtro con los valores que encuentra y los muestra con la primera letra
//     en mayúscula; compara por igualdad exacta, así que "Plástico" y "plástico" serían dos chips.
//   · horario: texto libre tal como se muestra ("Lun–Vie 8:00–18:00, Sáb 8:00–14:00").
//   · lat / lng: números; estado: 'activo' | 'sin_servicio' | 'inactivo'.

export const MATERIALES = [
  { valor: "orgánico", etiqueta: "Orgánico" },
  { valor: "plástico", etiqueta: "Plástico" },
  { valor: "papel", etiqueta: "Papel" },
  { valor: "cartón", etiqueta: "Cartón" },
  { valor: "vidrio", etiqueta: "Vidrio" },
  { valor: "metal", etiqueta: "Metal" },
  { valor: "electrónico", etiqueta: "Electrónico" },
  { valor: "pilas", etiqueta: "Pilas" },
  { valor: "aceite", etiqueta: "Aceite" },
] as const

export const ESTADOS_CENTRO = ["activo", "sin_servicio", "inactivo"] as const
export type EstadoCentro = (typeof ESTADOS_CENTRO)[number]

// Chetumal y alrededores (incluye Calderitas). Un punto fuera de aquí casi siempre es un error de
// captura (coordenadas invertidas, signo faltante, otra ciudad): se pide confirmación.
export const ZONA = { latMin: 18.4, latMax: 18.65, lngMin: -88.45, lngMax: -88.15 } as const
export const CENTRO_MAPA: [number, number] = [18.5001, -88.2963]

export function enZona(lat: number, lng: number): boolean {
  return lat >= ZONA.latMin && lat <= ZONA.latMax && lng >= ZONA.lngMin && lng <= ZONA.lngMax
}

export const NOMBRE_MAX = 120
export const DIRECCION_MAX = 200
export const HORARIO_MAX = 200

export function redondear6(n: number): number {
  return Number(n.toFixed(6))
}

export interface EntradaCentro {
  id?: string
  nombre: string
  direccion: string
  tipos_material: string[]
  horario: string
  estado: string
  lat: number | null
  lng: number | null
  // La persona confirmó guardar un punto fuera de la zona de Chetumal.
  confirmarFueraDeZona?: boolean
}

export interface CentroValido {
  nombre: string
  direccion: string | null
  tipos_material: string[]
  horario: string | null
  estado: EstadoCentro
  lat: number
  lng: number
}

export type ResultadoCentro =
  | { ok: true; valor: CentroValido }
  | { ok: false; error: string; pideConfirmacion?: boolean }

function texto(valor: unknown, max: number): string | null | undefined {
  if (valor === null || valor === undefined) return null
  if (typeof valor !== "string") return undefined
  const limpio = valor.replace(/\s+/g, " ").trim()
  return limpio.length > max ? undefined : limpio
}

export function validarCentro(
  entrada: unknown,
  // Materiales que ya tiene la fila (si se edita): se conservan aunque no estén entre los chips.
  tiposActuales: readonly string[] = []
): ResultadoCentro {
  if (typeof entrada !== "object" || entrada === null) return { ok: false, error: "Datos no válidos." }
  const e = entrada as Record<string, unknown>

  const nombre = texto(e.nombre, NOMBRE_MAX)
  if (!nombre) return { ok: false, error: `Escribe el nombre del centro (máximo ${NOMBRE_MAX} caracteres).` }

  const direccion = texto(e.direccion, DIRECCION_MAX)
  if (direccion === undefined) return { ok: false, error: `La dirección no puede pasar de ${DIRECCION_MAX} caracteres.` }

  const horario = texto(e.horario, HORARIO_MAX)
  if (horario === undefined) return { ok: false, error: `El horario no puede pasar de ${HORARIO_MAX} caracteres.` }

  if (!Array.isArray(e.tipos_material) || e.tipos_material.some((t) => typeof t !== "string")) {
    return { ok: false, error: "Los materiales no son válidos." }
  }
  const permitidos = new Set<string>([...MATERIALES.map((m) => m.valor), ...tiposActuales])
  const tipos: string[] = []
  for (const bruto of e.tipos_material as string[]) {
    const t = bruto.trim().toLocaleLowerCase("es")
    if (!permitidos.has(t)) return { ok: false, error: `Material no válido: «${bruto}».` }
    if (!tipos.includes(t)) tipos.push(t)
  }
  if (tipos.length === 0) return { ok: false, error: "Elige al menos un material." }

  if (typeof e.estado !== "string" || !(ESTADOS_CENTRO as readonly string[]).includes(e.estado)) {
    return { ok: false, error: "El estado no es válido." }
  }

  if (typeof e.lat !== "number" || typeof e.lng !== "number" || !Number.isFinite(e.lat) || !Number.isFinite(e.lng)) {
    return { ok: false, error: "Marca la ubicación en el mapa." }
  }
  if (e.lat < -90 || e.lat > 90 || e.lng < -180 || e.lng > 180) {
    return { ok: false, error: "Las coordenadas no son válidas." }
  }
  const lat = redondear6(e.lat)
  const lng = redondear6(e.lng)
  if (!enZona(lat, lng) && e.confirmarFueraDeZona !== true) {
    return {
      ok: false,
      pideConfirmacion: true,
      error: `El punto está fuera de Chetumal y alrededores (lat ${ZONA.latMin}–${ZONA.latMax}, lng ${ZONA.lngMin} a ${ZONA.lngMax}). Confirma para guardarlo de todos modos.`,
    }
  }

  return {
    ok: true,
    valor: { nombre, direccion: direccion || null, tipos_material: tipos, horario: horario || null, estado: e.estado as EstadoCentro, lat, lng },
  }
}
