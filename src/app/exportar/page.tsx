import { Download } from "lucide-react"
import { colors } from "@/lib/theme"

// Todavía no rediseñada (fase 1 solo cubre Reportes): por ahora, el botón "Exportar CSV" que
// ya existía sigue en la pantalla de Reportes. Esta sección se completa en una fase siguiente.
export default function ExportarPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Exportar datos</h1>
        <p className="text-sm text-muted-foreground">
          Descarga de datos del proyecto en distintos formatos
        </p>
      </div>

      <div
        className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed p-16 text-center"
        style={{ borderColor: colors.borde }}
      >
        <div
          className="flex h-12 w-12 items-center justify-center rounded-full"
          style={{ backgroundColor: colors.palido, color: colors.manglar }}
        >
          <Download className="h-5 w-5" />
        </div>
        <p className="text-sm font-medium">Próximamente</p>
        <p className="max-w-sm text-sm text-muted-foreground">
          Por ahora puedes exportar los reportes en CSV desde la pantalla de{" "}
          <a href="/reportes" className="font-medium underline" style={{ color: colors.manglar }}>
            Reportes
          </a>
          .
        </p>
      </div>
    </div>
  )
}
