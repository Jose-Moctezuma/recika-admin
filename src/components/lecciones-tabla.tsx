"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Pencil, Plus } from "lucide-react"
import { supabaseBrowser } from "@/lib/supabase-browser"
import type { Leccion } from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"

const CATEGORIAS = ["RSU", "RME", "RP", "general"]

const MSG_PERMISO =
  "No tienes permiso para modificar lecciones. Ejecuta la migración 0004 y marca tu usuario como administrador (app_metadata.is_admin); luego vuelve a iniciar sesión."

type Formulario = {
  titulo: string
  contenido: string
  categoria: string
  duracion_min: string
  orden: string
  activa: boolean
}

// 42501 = permission denied (falta el GRANT o la política).
function mensajeError(error: { code?: string; message: string }) {
  return error.code === "42501" ? MSG_PERMISO : error.message
}

export function LeccionesTabla({ lecciones }: { lecciones: Leccion[] }) {
  const router = useRouter()
  const [refrescando, startTransition] = useTransition()

  const [dialogAbierto, setDialogAbierto] = useState(false)
  const [editando, setEditando] = useState<Leccion | null>(null)
  const [form, setForm] = useState<Formulario>({
    titulo: "",
    contenido: "",
    categoria: "general",
    duracion_min: "5",
    orden: "1",
    activa: true,
  })
  const [errorForm, setErrorForm] = useState<string | null>(null)
  const [guardando, setGuardando] = useState(false)

  const [accionId, setAccionId] = useState<string | null>(null)
  const [errorAccion, setErrorAccion] = useState<string | null>(null)

  // Una categoría existente que no está en la lista (p. ej. "ambiental") se
  // conserva como opción; si no, editar esa lección la perdería.
  const categoriaActual = editando?.categoria
  const opcionesCategoria =
    categoriaActual && !CATEGORIAS.includes(categoriaActual)
      ? [...CATEGORIAS, categoriaActual]
      : CATEGORIAS

  function abrirNueva() {
    const siguienteOrden = lecciones.reduce((max, l) => Math.max(max, l.orden), 0) + 1
    setEditando(null)
    setForm({
      titulo: "",
      contenido: "",
      categoria: "general",
      duracion_min: "5",
      orden: String(siguienteOrden),
      activa: true,
    })
    setErrorForm(null)
    setDialogAbierto(true)
  }

  function abrirEditar(leccion: Leccion) {
    setEditando(leccion)
    setForm({
      titulo: leccion.titulo,
      contenido: leccion.contenido ?? "",
      categoria: leccion.categoria ?? "general",
      duracion_min: String(leccion.duracion_min),
      orden: String(leccion.orden),
      activa: leccion.activa,
    })
    setErrorForm(null)
    setDialogAbierto(true)
  }

  async function guardar(e: React.FormEvent) {
    e.preventDefault()

    const titulo = form.titulo.trim()
    const duracion = Number(form.duracion_min)
    const orden = Number(form.orden)
    if (!titulo) return setErrorForm("El título es obligatorio.")
    if (form.duracion_min.trim() === "" || !Number.isInteger(duracion) || duracion < 1)
      return setErrorForm("La duración debe ser un número entero de 1 minuto o más.")
    if (form.orden.trim() === "" || !Number.isInteger(orden) || orden < 0)
      return setErrorForm("El orden debe ser un número entero de 0 o más.")

    const payload = {
      titulo,
      contenido: form.contenido.trim() || null,
      categoria: form.categoria,
      duracion_min: duracion,
      orden,
      activa: form.activa,
    }

    setGuardando(true)
    setErrorForm(null)
    const tabla = supabaseBrowser().from("lecciones")
    const { data, error } = editando
      ? await tabla.update(payload).eq("id", editando.id).select("id")
      : await tabla.insert(payload).select("id")
    setGuardando(false)

    if (error) return setErrorForm(mensajeError(error))
    // Con RLS, un UPDATE que ninguna política permite no da error: afecta 0 filas.
    if (!data || data.length === 0) return setErrorForm(MSG_PERMISO)

    setDialogAbierto(false)
    startTransition(() => router.refresh())
  }

  async function alternarActiva(leccion: Leccion) {
    setAccionId(leccion.id)
    setErrorAccion(null)
    const { data, error } = await supabaseBrowser()
      .from("lecciones")
      .update({ activa: !leccion.activa })
      .eq("id", leccion.id)
      .select("id")
    setAccionId(null)

    if (error) return setErrorAccion(mensajeError(error))
    if (!data || data.length === 0) return setErrorAccion(MSG_PERMISO)

    startTransition(() => router.refresh())
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-end">
        <Button onClick={abrirNueva} style={{ backgroundColor: "#085041" }} className="text-white">
          <Plus />
          Nueva lección
        </Button>
      </div>

      {errorAccion ? <p className="text-sm text-destructive">{errorAccion}</p> : null}

      {lecciones.length === 0 ? (
        <p className="text-sm text-muted-foreground">Todavía no hay lecciones.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Orden</TableHead>
              <TableHead>Título</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead>Duración</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {lecciones.map((leccion) => (
              <TableRow key={leccion.id}>
                <TableCell>{leccion.orden}</TableCell>
                <TableCell className="whitespace-normal font-medium">{leccion.titulo}</TableCell>
                <TableCell>{leccion.categoria ?? "—"}</TableCell>
                <TableCell>{leccion.duracion_min} min</TableCell>
                <TableCell>
                  <Badge
                    style={{
                      backgroundColor: leccion.activa ? "#085041" : "#888780",
                      color: "#fff",
                    }}
                    className="border-transparent"
                  >
                    {leccion.activa ? "Activa" : "Inactiva"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={() => abrirEditar(leccion)}>
                      <Pencil />
                      Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => alternarActiva(leccion)}
                      disabled={accionId === leccion.id || refrescando}
                    >
                      {leccion.activa ? "Desactivar" : "Activar"}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Dialog open={dialogAbierto} onOpenChange={setDialogAbierto}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editando ? "Editar lección" : "Nueva lección"}</DialogTitle>
            <DialogDescription>
              {editando
                ? "Los cambios se ven de inmediato en la sección Aprender de la app."
                : "La lección aparece en la app si queda marcada como activa."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={guardar} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="titulo">Título</Label>
              <Input
                id="titulo"
                value={form.titulo}
                onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="contenido">Contenido</Label>
              <Textarea
                id="contenido"
                rows={5}
                value={form.contenido}
                onChange={(e) => setForm({ ...form, contenido: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="categoria">Categoría</Label>
                <Select
                  value={form.categoria}
                  onValueChange={(valor) => setForm({ ...form, categoria: valor })}
                >
                  <SelectTrigger id="categoria" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {opcionesCategoria.map((categoria) => (
                      <SelectItem key={categoria} value={categoria}>
                        {categoria}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="duracion_min">Duración (min)</Label>
                <Input
                  id="duracion_min"
                  type="number"
                  min={1}
                  step={1}
                  value={form.duracion_min}
                  onChange={(e) => setForm({ ...form, duracion_min: e.target.value })}
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="orden">Orden</Label>
                <Input
                  id="orden"
                  type="number"
                  min={0}
                  step={1}
                  value={form.orden}
                  onChange={(e) => setForm({ ...form, orden: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="activa"
                checked={form.activa}
                onCheckedChange={(valor) => setForm({ ...form, activa: valor === true })}
              />
              <Label htmlFor="activa">Activa (visible en la app)</Label>
            </div>

            {errorForm ? <p className="text-sm text-destructive">{errorForm}</p> : null}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogAbierto(false)}>
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={guardando}
                style={{ backgroundColor: "#085041" }}
                className="text-white"
              >
                {guardando ? "Guardando…" : editando ? "Guardar cambios" : "Crear lección"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
