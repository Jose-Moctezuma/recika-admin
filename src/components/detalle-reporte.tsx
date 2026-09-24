"use client"

import { Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

// Datos ya formateados en el servidor (la fecha con zona horaria de Cancún), para que el
// servidor y el navegador muestren exactamente lo mismo.
export interface DatosDetalleReporte {
  fecha: string
  colonia: string | null
  tipoResiduo: string | null
  urgencia: string
  desdeSitio: boolean
  lat: number | null
  lng: number | null
  estado: string
  descripcion: string | null
  referenciaLugar: string | null
}

function Fila({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <>
      <dt className="text-muted-foreground">{etiqueta}</dt>
      <dd>{valor}</dd>
    </>
  )
}

function TextoLibre({ etiqueta, texto }: { etiqueta: string; texto: string | null }) {
  return (
    <section className="flex flex-col gap-1">
      <h3 className="text-sm font-medium">{etiqueta}</h3>
      {/* React escapa el texto: no se interpreta como HTML. pre-wrap respeta los saltos de línea. */}
      <p className="rounded-lg border bg-muted/30 p-3 text-sm whitespace-pre-wrap break-words">
        {texto && texto.trim() !== "" ? texto : <span className="text-muted-foreground">Sin {etiqueta.toLowerCase()}</span>}
      </p>
    </section>
  )
}

export function DetalleReporte({ reporte }: { reporte: DatosDetalleReporte }) {
  const ubicacion =
    reporte.lat !== null && reporte.lng !== null
      ? `${reporte.lat.toFixed(5)}, ${reporte.lng.toFixed(5)}`
      : "Sin GPS"

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Eye />
          Ver
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Detalle del reporte</DialogTitle>
          <DialogDescription>
            {reporte.fecha} · {reporte.colonia ?? "Sin colonia"}
          </DialogDescription>
        </DialogHeader>

        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
          <Fila etiqueta="Tipo de residuo" valor={reporte.tipoResiduo ?? "—"} />
          <Fila etiqueta="Urgencia" valor={reporte.urgencia} />
          <Fila etiqueta="Origen" valor={reporte.desdeSitio ? "Desde el sitio (GPS)" : "Desde casa"} />
          <Fila etiqueta="Ubicación" valor={ubicacion} />
          <Fila etiqueta="Estado" valor={reporte.estado} />
        </dl>

        <TextoLibre etiqueta="Descripción" texto={reporte.descripcion} />
        <TextoLibre etiqueta="Referencia del lugar" texto={reporte.referenciaLugar} />

        <p className="text-xs text-muted-foreground">
          Texto escrito por el ciudadano. Solo lo ve el panel: no aparece en la app ni en el mapa.
        </p>
      </DialogContent>
    </Dialog>
  )
}
