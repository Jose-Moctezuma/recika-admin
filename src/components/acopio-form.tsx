"use client"

import { useEffect, useState, useTransition } from "react"
import type { CentroAcopio } from "@/lib/types"
import { colors } from "@/lib/theme"
import { MATERIALES, validarCentro, type EntradaCentro } from "@/lib/acopios-validacion"
import { Button } from "@/components/ui/button"
import { CLASE_CAMPO, ESTILO_BORDE, Etiqueta } from "@/components/campos"
import { EncabezadoColumna } from "@/components/columna-lateral"
import { UbicacionMapa } from "@/components/ubicacion-mapa"
import { desactivarCentro, guardarCentro, reactivarCentro } from "@/app/acopios/actions"

const ESTADOS: { valor: string; etiqueta: string }[] = [
  { valor: "activo", etiqueta: "Activo" },
  { valor: "sin_servicio", etiqueta: "Sin servicio" },
  { valor: "inactivo", etiqueta: "Inactivo" },
]

// Formulario de un centro (nuevo si `centro` es null). El que lo usa lo vuelve a montar (key) al cambiar
// de centro o cuando llegan datos nuevos del servidor.
export function AcopioForm({
  centro,
  onGuardado,
  onCerrar,
  onSucio,
}: {
  centro: CentroAcopio | null
  onGuardado: (id: string, aviso: string) => void
  onCerrar: () => void
  onSucio: (sucio: boolean) => void
}) {
  const [nombre, setNombre] = useState(centro?.nombre ?? "")
  const [direccion, setDireccion] = useState(centro?.direccion ?? "")
  // Se conserva el orden de la fila: guardar sin tocar nada deja tipos_material exactamente igual.
  const [tipos, setTipos] = useState<string[]>(centro?.tipos_material ?? [])
  const [horario, setHorario] = useState(centro?.horario ?? "")
  const [estado, setEstado] = useState(centro?.estado ?? "activo")
  const [lat, setLat] = useState<number | null>(centro?.lat ?? null)
  const [lng, setLng] = useState<number | null>(centro?.lng ?? null)
  const [error, setError] = useState<string | null>(null)
  const [pendiente, startTransition] = useTransition()

  const tiposIniciales = centro?.tipos_material ?? []
  // Materiales que ya tiene la fila y no están entre los 9 chips: se muestran igual (y se conservan).
  const extras = tiposIniciales.filter((t) => !MATERIALES.some((m) => m.valor === t))
  const chips = [
    ...MATERIALES.map((m) => ({ valor: m.valor as string, etiqueta: m.etiqueta as string })),
    ...extras.map((t) => ({ valor: t, etiqueta: t.charAt(0).toUpperCase() + t.slice(1) })),
  ]

  const sucio =
    nombre !== (centro?.nombre ?? "") ||
    direccion !== (centro?.direccion ?? "") ||
    JSON.stringify(tipos) !== JSON.stringify(tiposIniciales) ||
    horario !== (centro?.horario ?? "") ||
    estado !== (centro?.estado ?? "activo") ||
    lat !== (centro?.lat ?? null) ||
    lng !== (centro?.lng ?? null)

  useEffect(() => {
    onSucio(sucio)
    return () => onSucio(false)
  }, [sucio, onSucio])

  function alternar(valor: string) {
    setTipos((actuales) => (actuales.includes(valor) ? actuales.filter((t) => t !== valor) : [...actuales, valor]))
  }

  function guardar() {
    setError(null)
    let entrada: EntradaCentro = { id: centro?.id, nombre, direccion, tipos_material: tipos, horario, estado, lat, lng }
    // Misma validación que hará el servidor, para avisar al momento. El servidor la repite siempre.
    const previo = validarCentro(entrada, tiposIniciales)
    if (!previo.ok) {
      if (!previo.pideConfirmacion) {
        setError(previo.error)
        return
      }
      if (!window.confirm(previo.error)) return
      entrada = { ...entrada, confirmarFueraDeZona: true }
    }
    startTransition(async () => {
      const r = await guardarCentro(entrada)
      if (!r.ok) {
        setError(r.error)
        return
      }
      onGuardado(r.id, centro ? "Cambios guardados" : "Centro creado")
    })
  }

  function cambiarActivo() {
    if (!centro) return
    const desactivar = centro.estado !== "inactivo"
    const aviso = desactivar
      ? "¿Desactivar este centro? Dejará de verse en la app. No se borra: puedes reactivarlo cuando quieras."
      : "¿Reactivar este centro? Volverá a verse en la app."
    if (!window.confirm(sucio ? `${aviso}\n\nTienes cambios sin guardar: se descartarán.` : aviso)) return
    setError(null)
    startTransition(async () => {
      const r = desactivar ? await desactivarCentro(centro.id) : await reactivarCentro(centro.id)
      if (!r.ok) {
        setError(r.error)
        return
      }
      onGuardado(centro.id, desactivar ? "Centro desactivado" : "Centro reactivado")
    })
  }

  return (
    <div className="flex flex-1 flex-col gap-4 px-6 py-7">
      <EncabezadoColumna titulo={centro ? "Editar centro" : "Nuevo centro"} onCerrar={onCerrar} />

      <Etiqueta texto="Nombre">
        <input
          type="text"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          maxLength={120}
          className={CLASE_CAMPO}
          style={ESTILO_BORDE}
        />
      </Etiqueta>

      <Etiqueta texto="Dirección">
        <input
          type="text"
          value={direccion}
          onChange={(e) => setDireccion(e.target.value)}
          maxLength={200}
          className={CLASE_CAMPO}
          style={ESTILO_BORDE}
        />
      </Etiqueta>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 p-0 text-[13px] font-semibold">Materiales que recibe</legend>
        <div className="flex flex-wrap gap-1.5">
          {chips.map(({ valor, etiqueta }) => {
            const activo = tipos.includes(valor)
            return (
              <button
                key={valor}
                type="button"
                aria-pressed={activo}
                onClick={() => alternar(valor)}
                className="h-[34px] rounded-full border px-3 text-[13px]"
                style={
                  activo
                    ? { borderColor: colors.manglar, backgroundColor: colors.manglar, color: "#fff", fontWeight: 600 }
                    : { borderColor: colors.borde, backgroundColor: "#fff", color: colors.texto }
                }
              >
                {etiqueta}
              </button>
            )
          })}
        </div>
      </fieldset>

      <Etiqueta texto="Horario (como se mostrará en la app)">
        <input
          type="text"
          value={horario}
          onChange={(e) => setHorario(e.target.value)}
          maxLength={200}
          placeholder="Lun–Vie 8:00–18:00, Sáb 8:00–14:00"
          className={CLASE_CAMPO}
          style={ESTILO_BORDE}
        />
      </Etiqueta>

      <UbicacionMapa
        lat={lat}
        lng={lng}
        onChange={(la, ln) => {
          setLat(la)
          setLng(ln)
        }}
      />

      <div className="grid grid-cols-2 gap-2.5">
        <Etiqueta texto="Verificado en campo">
          <input
            type="date"
            disabled
            value={centro?.verificado_en_campo ?? ""}
            readOnly
            className={CLASE_CAMPO}
            style={ESTILO_BORDE}
          />
        </Etiqueta>
        <Etiqueta texto="Estado">
          <select value={estado} onChange={(e) => setEstado(e.target.value)} className={CLASE_CAMPO} style={ESTILO_BORDE}>
            {ESTADOS.map((e) => (
              <option key={e.valor} value={e.valor}>
                {e.etiqueta}
              </option>
            ))}
          </select>
        </Etiqueta>
      </div>
      <Etiqueta texto="Notas de verificación">
        <textarea
          disabled
          readOnly
          rows={2}
          value={centro?.notas_verificacion ?? ""}
          className="w-full rounded-[10px] border bg-white px-3 py-2 text-sm disabled:cursor-not-allowed disabled:bg-[#F7F6F2] disabled:text-[#5F5E58]"
          style={ESTILO_BORDE}
        />
      </Etiqueta>
      <p className="-mt-2 text-xs leading-normal" style={{ color: colors.texto2 }}>
        Se habilita cuando se cierre el acceso directo a la tabla (migración 0010).
      </p>

      {error ? (
        <p role="alert" className="text-sm" style={{ color: colors.rp }}>
          {error}
        </p>
      ) : null}

      <div className="mt-auto flex gap-2.5">
        <Button
          type="button"
          disabled={pendiente}
          onClick={guardar}
          className="h-[46px] flex-1 rounded-xl text-[15px] font-bold text-white hover:opacity-90"
          style={{ backgroundColor: colors.manglar }}
        >
          {pendiente ? "Guardando…" : centro ? "Guardar cambios" : "Crear centro"}
        </Button>
        {centro ? (
          <Button
            type="button"
            variant="outline"
            disabled={pendiente}
            onClick={cambiarActivo}
            className="h-[46px] rounded-xl px-4 text-sm font-semibold"
            style={{ color: colors.texto2 }}
          >
            {centro.estado === "inactivo" ? "Reactivar" : "Desactivar"}
          </Button>
        ) : null}
      </div>
    </div>
  )
}
