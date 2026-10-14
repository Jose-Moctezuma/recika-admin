import { normalizarNombre, NOMBRE_RESERVADO } from "./colonias-validacion"

// Ranking de colonias por número de reportes. Puro (sin dependencias).
//   · Se excluye «Otra» (lo que la app guarda cuando alguien no encuentra su colonia): no es una colonia.
//   · Las colonias empatadas en total de reportes comparten posición (1, 1, 3…).
//   · Orden estable: más reportes primero y, a igual cantidad, más urgentes y luego alfabético.

export interface FilaRanking {
  colonia: string | null
  total_reportes: number
  urgentes: number
}

export interface FilaRankingPosicion {
  posicion: number
  colonia: string
  total_reportes: number
  urgentes: number
}

export function calcularRanking(filas: FilaRanking[]): { filas: FilaRankingPosicion[]; reportesOtra: number } {
  let reportesOtra = 0
  const colonias: FilaRanking[] = []
  for (const f of filas) {
    if (!f.colonia || f.colonia.trim() === "") continue
    if (normalizarNombre(f.colonia) === NOMBRE_RESERVADO) reportesOtra += f.total_reportes
    else colonias.push(f)
  }
  colonias.sort(
    (a, b) =>
      b.total_reportes - a.total_reportes ||
      b.urgentes - a.urgentes ||
      (a.colonia as string).localeCompare(b.colonia as string, "es")
  )
  const resultado: FilaRankingPosicion[] = []
  colonias.forEach((f, i) => {
    const empata = i > 0 && resultado[i - 1].total_reportes === f.total_reportes
    resultado.push({
      posicion: empata ? resultado[i - 1].posicion : i + 1,
      colonia: f.colonia as string,
      total_reportes: f.total_reportes,
      urgentes: f.urgentes,
    })
  })
  return { filas: resultado, reportesOtra }
}
