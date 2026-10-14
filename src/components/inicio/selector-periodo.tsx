"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { colors } from "@/lib/theme"
import { PERIODOS, PERIODO_POR_DEFECTO, type Periodo } from "@/lib/inicio-calculos"

// El periodo vive en la URL (?periodo=...): la página es un Server Component que lee ese
// parámetro, así que cambiar el selector solo navega y el servidor recalcula todo.
export function SelectorPeriodo({ periodo }: { periodo: Periodo }) {
  const router = useRouter()
  const [pendiente, startTransition] = useTransition()

  function cambiar(nuevo: string) {
    startTransition(() => {
      router.replace(nuevo === PERIODO_POR_DEFECTO ? "/" : `/?periodo=${encodeURIComponent(nuevo)}`)
    })
  }

  return (
    <label
      className="flex h-[42px] items-center gap-2 rounded-xl border bg-white px-3.5 text-sm"
      style={{ borderColor: colors.borde, color: colors.texto, opacity: pendiente ? 0.6 : 1 }}
    >
      Periodo
      <select
        value={periodo}
        onChange={(e) => cambiar(e.target.value)}
        disabled={pendiente}
        className="cursor-pointer border-none bg-transparent text-sm font-semibold outline-none"
        style={{ color: colors.manglar, fontFamily: "inherit" }}
      >
        {PERIODOS.map((p) => (
          <option key={p.valor} value={p.valor}>
            {p.etiqueta}
          </option>
        ))}
      </select>
    </label>
  )
}
