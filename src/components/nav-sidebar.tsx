"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, MapPin, Building2, Leaf, BookOpen, Download } from "lucide-react"
import { cn } from "cn"
import { colors } from "@/lib/theme"

const LINKS = [
  { href: "/", label: "Inicio", icon: LayoutDashboard },
  { href: "/reportes", label: "Reportes", icon: MapPin },
  { href: "/acopios", label: "Centros de acopio", icon: Leaf },
  { href: "/colonias", label: "Colonias y rutas", icon: Building2 },
  { href: "/lecciones", label: "Lecciones", icon: BookOpen },
  { href: "/exportar", label: "Exportar datos", icon: Download },
] as const

export function NavSidebar({ reportesPendientes }: { reportesPendientes: number | null }) {
  const pathname = usePathname()

  return (
    <aside className="flex h-full w-60 shrink-0 flex-col border-r border-border bg-white">
      <div className="flex items-center gap-2 px-5 py-5">
        <div
          className="flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold text-white"
          style={{ backgroundColor: colors.manglar }}
        >
          RK
        </div>
        <span className="text-lg font-semibold" style={{ color: colors.manglar }}>
          ReciKa
        </span>
      </div>

      <nav className="flex flex-col gap-1 px-3">
        {LINKS.map(({ href, label, icon: Icon }) => {
          const activo = href === "/" ? pathname === "/" : pathname.startsWith(href)
          // Solo "Reportes" trae contador, y solo si ya se pudo calcular (requiere la migración 0008).
          const contador = href === "/reportes" ? reportesPendientes : null
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                activo
                  ? "text-white"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
              style={activo ? { backgroundColor: colors.manglar } : undefined}
            >
              <Icon className="h-4 w-4" />
              <span className="flex-1">{label}</span>
              {contador !== null ? (
                <span
                  className="rounded-full px-2 py-0.5 text-xs font-bold"
                  style={
                    activo
                      ? { backgroundColor: "rgba(255,255,255,0.2)", color: "#fff" }
                      : { backgroundColor: colors.palido, color: colors.manglar }
                  }
                >
                  {contador}
                </span>
              ) : null}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
