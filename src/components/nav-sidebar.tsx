"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, MapPin, Building2, Leaf, BookOpen } from "lucide-react"
import { cn } from "cn"

const LINKS = [
  { href: "/", label: "Inicio", icon: LayoutDashboard },
  { href: "/reportes", label: "Reportes", icon: MapPin },
  { href: "/colonias", label: "Colonias", icon: Building2 },
  { href: "/acopios", label: "Acopios", icon: Leaf },
  { href: "/lecciones", label: "Lecciones", icon: BookOpen },
] as const

export function NavSidebar() {
  const pathname = usePathname()

  return (
    <aside className="flex h-full w-60 shrink-0 flex-col border-r border-border bg-white">
      <div className="flex items-center gap-2 px-5 py-5">
        <div
          className="flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold text-white"
          style={{ backgroundColor: "#085041" }}
        >
          RK
        </div>
        <span className="text-lg font-semibold" style={{ color: "#085041" }}>
          ReciKa
        </span>
      </div>

      <nav className="flex flex-col gap-1 px-3">
        {LINKS.map(({ href, label, icon: Icon }) => {
          const activo = href === "/" ? pathname === "/" : pathname.startsWith(href)
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
              style={activo ? { backgroundColor: "#085041" } : undefined}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
