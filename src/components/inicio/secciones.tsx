import Link from "next/link"
import type { ReactNode } from "react"
import { colors } from "@/lib/theme"
import {
  etiquetaFechaHora,
  type FilaRankingColonia,
  type PendienteReciente,
  type RespuestaEnterado,
} from "@/lib/inicio-calculos"

// Tarjeta blanca con borde y radio 16, como en la maqueta (docs/panel-v2/1-Inicio.html).
export function Tarjeta({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <section
      className={`flex flex-col gap-4 rounded-2xl border bg-white p-5 sm:p-[22px] ${className}`}
      style={{ borderColor: colors.borde }}
    >
      {children}
    </section>
  )
}

export function Titulo({ children, accion }: { children: ReactNode; accion?: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <h2 className="text-base font-bold">{children}</h2>
      {accion}
    </div>
  )
}

export function Enlace({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="text-[13px] font-semibold hover:underline"
      style={{ color: colors.manglar }}
    >
      {children}
    </Link>
  )
}

export function Vacio({ children }: { children: ReactNode }) {
  return (
    <p className="py-6 text-center text-sm" style={{ color: colors.texto2 }}>
      {children}
    </p>
  )
}

export function Cifra({
  etiqueta,
  valor,
  color = colors.manglar,
  error,
  pie,
}: {
  etiqueta: string
  valor: number | null
  color?: string
  error?: string
  pie: ReactNode
}) {
  return (
    <div
      className="flex flex-col gap-2 rounded-2xl border bg-white p-5"
      style={{ borderColor: colors.borde }}
    >
      <div className="text-[13px] font-semibold" style={{ color: colors.texto2 }}>
        {etiqueta}
      </div>
      {error || valor === null ? (
        <p className="text-xs" style={{ color: colors.rp }}>
          {error ?? "No disponible"}
        </p>
      ) : (
        <div className="text-4xl leading-none font-extrabold" style={{ color }}>
          {valor.toLocaleString("es-MX")}
        </div>
      )}
      <div className="text-[13px]" style={{ color: colors.texto2 }}>
        {pie}
      </div>
    </div>
  )
}

const plural = (n: number, singular: string, plural: string) => (n === 1 ? singular : plural)

export function ComoSeEnteraron({
  respuestas,
  totalRespondieron,
  sinRespuesta,
}: {
  respuestas: RespuestaEnterado[]
  totalRespondieron: number
  sinRespuesta: number
}) {
  return (
    <Tarjeta>
      <div className="flex flex-col gap-0.5">
        <h2 className="text-base font-bold">¿Cómo se enteraron?</h2>
        <span className="text-xs" style={{ color: colors.texto2 }}>
          Indicador de consciencia ciudadana
        </span>
      </div>
      {respuestas.length === 0 ? (
        <Vacio>Aún no hay respuestas en este periodo</Vacio>
      ) : (
        <>
          <ul className="flex flex-col gap-3.5">
            {respuestas.map((r) => (
              <li key={r.respuesta} className="flex flex-col gap-1.5">
                <div className="flex justify-between gap-3 text-sm">
                  <span>{r.respuesta}</span>
                  <span>
                    <strong>{r.porcentaje}%</strong>{" "}
                    <span style={{ color: colors.texto2 }}>({r.total})</span>
                  </span>
                </div>
                <div
                  className="h-2.5 rounded-full"
                  style={{ backgroundColor: colors.surface3 }}
                  role="img"
                  aria-label={`${r.respuesta}: ${r.porcentaje}% (${r.total})`}
                >
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${r.porcentaje}%`, backgroundColor: colors.manglar }}
                  />
                </div>
              </li>
            ))}
          </ul>
          <p className="text-xs" style={{ color: colors.texto2 }}>
            Sobre {totalRespondieron} {plural(totalRespondieron, "respuesta", "respuestas")}
            {sinRespuesta > 0
              ? `. ${sinRespuesta} ${plural(sinRespuesta, "reporte sin respuesta", "reportes sin respuesta")}.`
              : "."}
          </p>
        </>
      )}
    </Tarjeta>
  )
}

export function ColoniasConMasReportes({
  ranking,
  coloniasConReportes,
  coloniasEmpatadasFuera,
  reportesColoniaOtra,
}: {
  ranking: FilaRankingColonia[]
  coloniasConReportes: number
  coloniasEmpatadasFuera: number
  reportesColoniaOtra: number
}) {
  // Las barras se miden contra la colonia con más reportes (la primera del ranking).
  const maximo = ranking[0]?.total ?? 0
  const hayEmpates = ranking.some((fila, i) => i > 0 && fila.posicion === ranking[i - 1].posicion)
  return (
    <Tarjeta>
      <Titulo accion={<Enlace href="/colonias">Ver todas</Enlace>}>Colonias con más reportes</Titulo>
      {ranking.length === 0 ? (
        <Vacio>Aún no hay reportes con colonia en este periodo</Vacio>
      ) : (
        <ol className="flex flex-col gap-3">
          {ranking.map((fila) => (
            <li key={fila.colonia} className="grid grid-cols-[28px_1fr_40px] items-center gap-3">
              <span className="text-[13px] font-bold" style={{ color: colors.texto2 }}>
                {fila.posicion}
              </span>
              <div className="flex min-w-0 flex-col gap-1.5">
                <span className="truncate text-sm font-semibold">{fila.colonia}</span>
                <div
                  className="h-2 rounded-full"
                  style={{
                    width: `${maximo > 0 ? (fila.total / maximo) * 100 : 0}%`,
                    backgroundColor: colors.manglar,
                  }}
                />
              </div>
              <span className="text-right text-sm font-bold">{fila.total}</span>
            </li>
          ))}
        </ol>
      )}
      <div className="flex flex-col gap-1 text-xs" style={{ color: colors.texto2 }}>
        {coloniasEmpatadasFuera > 0 ? (
          <span>
            {coloniasEmpatadasFuera} {plural(coloniasEmpatadasFuera, "colonia más empata", "colonias más empatan")}{" "}
            con la última de esta lista.
          </span>
        ) : null}
        <span>
          {ranking.length > 0
            ? `${coloniasConReportes} ${plural(coloniasConReportes, "colonia con reportes", "colonias con reportes")}. `
            : ""}
          {hayEmpates ? "Los empates comparten posición. " : ""}
          No incluye {reportesColoniaOtra} {plural(reportesColoniaOtra, "reporte", "reportes")} con colonia «Otra».
        </span>
      </div>
    </Tarjeta>
  )
}

// Los pendientes son un estado actual: esta lista NO depende del periodo elegido.
export function PorRevisar({ pendientes, error }: { pendientes: PendienteReciente[]; error?: string }) {
  return (
    <Tarjeta className="gap-3.5">
      <Titulo accion={<Enlace href="/reportes">Abrir reportes</Enlace>}>Por revisar</Titulo>
      {error ? (
        <p className="py-6 text-center text-sm" style={{ color: colors.rp }}>
          No se pudieron cargar los pendientes: {error}
        </p>
      ) : pendientes.length === 0 ? (
        <Vacio>No hay reportes por revisar</Vacio>
      ) : (
        <ul className="flex flex-col">
          {pendientes.map((p, i) => (
            <li
              key={p.id}
              className={`flex items-center gap-3 py-3 ${i < pendientes.length - 1 ? "border-b" : ""}`}
              style={{ borderColor: colors.surface3 }}
            >
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: colors.ambarPendiente }}
                aria-hidden="true"
              />
              <span className="min-w-0 flex-1 truncate text-sm">
                <strong>{p.tipo_residuo}</strong> · {p.colonia}
              </span>
              <span className="shrink-0 text-[13px]" style={{ color: colors.texto2 }}>
                {etiquetaFechaHora(p.created_at)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Tarjeta>
  )
}
