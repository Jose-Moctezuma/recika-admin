import Link from "next/link"
import { Download } from "lucide-react"
import { cargarInicio } from "@/lib/inicio-datos"
import { PERIODOS, leerPeriodo } from "@/lib/inicio-calculos"
import { colors } from "@/lib/theme"
import { GraficaPorDia } from "@/components/inicio/grafica-por-dia"
import { SelectorPeriodo } from "@/components/inicio/selector-periodo"
import {
  ComoSeEnteraron,
  ColoniasConMasReportes,
  Cifra,
  Enlace,
  PorRevisar,
  Tarjeta,
  Titulo,
  Vacio,
} from "@/components/inicio/secciones"

// Datos en vivo (conteos/rankings) — no se debe congelar en el build.
export const dynamic = "force-dynamic"

export default async function InicioPage({ searchParams }: PageProps<"/">) {
  const periodo = leerPeriodo((await searchParams).periodo)
  const { resumen, errorReportes, pendientes, lecciones } = await cargarInicio(periodo)
  const etiquetaPeriodo = PERIODOS.find((p) => p.valor === periodo)?.etiqueta ?? ""

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-[28px] font-bold tracking-tight">Inicio</h1>
          <p className="text-sm" style={{ color: colors.texto2 }}>
            Resumen del piloto de ReciKa en Chetumal
          </p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <SelectorPeriodo periodo={periodo} />
          <Link
            href="/exportar"
            className="flex h-[42px] items-center gap-2 rounded-xl px-4 text-sm font-semibold text-white"
            style={{ backgroundColor: colors.manglar }}
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            Exportar datos
          </Link>
        </div>
      </header>

      {errorReportes || !resumen ? (
        <p className="text-sm" style={{ color: colors.rp }}>
          No se pudieron cargar los reportes: {errorReportes ?? "error desconocido"}
        </p>
      ) : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Cifra
          etiqueta="Reportes recibidos"
          valor={resumen?.recibidos ?? null}
          pie={`${resumen?.hoy ?? 0} hoy`}
        />
        <Cifra
          etiqueta="Por revisar"
          // Estado actual: cuenta TODOS los pendientes, sin importar el periodo (igual que el menú).
          valor={pendientes.total}
          error={pendientes.error}
          color={colors.rme}
          pie={<Enlace href="/reportes">Ir a reportes pendientes</Enlace>}
        />
        <Cifra
          etiqueta="Atendidos"
          valor={resumen?.atendidos ?? null}
          pie={`${resumen?.descartados ?? 0} ${resumen?.descartados === 1 ? "descartado" : "descartados"}`}
        />
        <Cifra
          etiqueta="Lecciones completadas"
          valor={lecciones.completadas}
          error={lecciones.error}
          pie={`de ${lecciones.activas ?? "—"} ${lecciones.activas === 1 ? "lección activa" : "lecciones activas"}`}
        />
      </div>

      {resumen ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Tarjeta className="lg:col-span-2">
            <Titulo
              accion={
                <span className="text-xs" style={{ color: colors.texto2 }}>
                  {etiquetaPeriodo}
                </span>
              }
            >
              Reportes por día
            </Titulo>
            {resumen.recibidos === 0 ? (
              <Vacio>Aún no hay reportes en este periodo</Vacio>
            ) : (
              <GraficaPorDia datos={resumen.porDia} maximo={resumen.maximoPorDia} />
            )}
          </Tarjeta>
          <ComoSeEnteraron
            respuestas={resumen.enterados}
            totalRespondieron={resumen.totalRespondieron}
            sinRespuesta={resumen.sinRespuesta}
          />
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {resumen ? (
          <ColoniasConMasReportes
            ranking={resumen.ranking}
            coloniasConReportes={resumen.coloniasConReportes}
            coloniasEmpatadasFuera={resumen.coloniasEmpatadasFuera}
            reportesColoniaOtra={resumen.reportesColoniaOtra}
          />
        ) : null}
        <PorRevisar pendientes={pendientes.recientes} error={pendientes.error} />
      </div>
    </div>
  )
}
