// Fechas de la pantalla Reportes, en hora de Chetumal (America/Cancun, UTC-5 todo el año: Quintana
// Roo no cambia de horario desde 2015). Sin Intl a propósito: el nombre del mes no depende de la
// versión de ICU del servidor y el resultado es el mismo en servidor y en navegador (así no hay
// diferencias de hidratación).
const MESES_CORTOS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"]
const DESFASE_MS = 5 * 3_600_000

function partes(iso: string) {
  const d = new Date(new Date(iso).getTime() - DESFASE_MS)
  return {
    dia: d.getUTCDate(),
    mes: MESES_CORTOS[d.getUTCMonth()],
    anio: d.getUTCFullYear(),
    hora: `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`,
  }
}

// "27 sep · 23:43" (columna Fecha de la tabla).
export function fechaTabla(iso: string): string {
  const { dia, mes, hora } = partes(iso)
  return `${dia} ${mes} · ${hora}`
}

// "5 oct 2026" a partir de una fecha sin hora ("2026-10-05", como la columna `date` de Postgres).
// No pasa por Date: así la zona horaria no puede correr el día.
export function fechaSoloDia(ymd: string): string {
  const m = ymd.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (!m) return ymd
  return `${Number(m[3])} ${MESES_CORTOS[Number(m[2]) - 1]} ${m[1]}`
}

// "27 sep 2026, 23:43" (encabezado del detalle).
export function fechaDetalle(iso: string): string {
  const { dia, mes, anio, hora } = partes(iso)
  return `${dia} ${mes} ${anio}, ${hora}`
}
