"use client"

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import type { TooltipContentProps } from "recharts"
import { colors } from "@/lib/theme"
import type { PuntoPorDia } from "@/lib/inicio-calculos"

interface PuntoGrafica extends PuntoPorDia {
  // recharts usa `fill` de cada dato como color de esa barra.
  fill: string
}

// Hasta este número de días se rotula cada barra; con más (30 días, "Todo") recharts omite
// etiquetas para que el eje no se encime.
const DIAS_CON_TODAS_LAS_ETIQUETAS = 10

function TooltipDia({ active, payload }: TooltipContentProps) {
  if (!active || !payload?.length) return null
  const punto = payload[0].payload as PuntoGrafica
  return (
    <div
      className="rounded-lg border bg-white px-3 py-2 text-xs shadow-sm"
      style={{ borderColor: colors.borde, color: colors.texto }}
    >
      <strong>{punto.etiqueta}</strong> · {punto.total} {punto.total === 1 ? "reporte" : "reportes"}
    </div>
  )
}

export function GraficaPorDia({ datos, maximo }: { datos: PuntoPorDia[]; maximo: number }) {
  // El día (o los días, si empatan) con más reportes va en verde oscuro; el resto en verde ReciKa.
  const puntos: PuntoGrafica[] = datos.map((d) => ({
    ...d,
    fill: d.total === maximo && maximo > 0 ? colors.manglar : colors.selva,
  }))
  const diasMaximos = new Set(puntos.filter((p) => p.fill === colors.manglar).map((p) => p.etiqueta))

  return (
    <div
      role="img"
      aria-label={`Gráfica de barras de reportes por día. Máximo: ${maximo} en un día.`}
      className="h-[220px] w-full"
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={puntos} margin={{ top: 8, right: 4, bottom: 0, left: -20 }}>
          <CartesianGrid vertical={false} stroke={colors.surface3} />
          <XAxis
            dataKey="etiqueta"
            tickLine={false}
            axisLine={{ stroke: colors.borde }}
            interval={puntos.length <= DIAS_CON_TODAS_LAS_ETIQUETAS ? 0 : "preserveStartEnd"}
            minTickGap={12}
            tick={({ x, y, payload }) => (
              <text
                x={x}
                y={Number(y) + 12}
                textAnchor="middle"
                fontSize={11}
                fill={diasMaximos.has(String(payload.value)) ? colors.texto : colors.texto2}
                fontWeight={diasMaximos.has(String(payload.value)) ? 700 : 400}
              >
                {payload.value}
              </text>
            )}
          />
          <YAxis
            allowDecimals={false}
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11, fill: colors.texto2 }}
          />
          <Tooltip content={TooltipDia} cursor={{ fill: colors.surface3 }} />
          <Bar dataKey="total" radius={[6, 6, 0, 0]} maxBarSize={46} isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
