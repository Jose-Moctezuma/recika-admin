"use client"

import { useEffect, useState, useTransition } from "react"
import type { Colonia } from "@/lib/types"
import { colors } from "@/lib/theme"
import {
  DIAS,
  limpiarNombre,
  ordenarDias,
  parsearHorario,
  serializarHorario,
  validarColonia,
  vistaPrevia,
  type EntradaColonia,
} from "@/lib/colonias-validacion"
import { Button } from "@/components/ui/button"
import { CLASE_CAMPO, ESTILO_BORDE, Etiqueta } from "@/components/campos"
import { EncabezadoColumna } from "@/components/columna-lateral"
import { guardarColonia } from "@/app/colonias/actions"

// Formulario de una colonia (nueva si `colonia` es null). El que lo usa lo vuelve a montar (key) al
// cambiar de colonia o cuando llegan datos nuevos del servidor.
export function ColoniaForm({
  colonia,
  todas,
  onGuardado,
  onCerrar,
  onSucio,
}: {
  colonia: Colonia | null
  todas: Colonia[]
  onGuardado: (id: string, aviso: string) => void
  onCerrar: () => void
  onSucio: (sucio: boolean) => void
}) {
  const rangoInicial = parsearHorario(colonia?.horario)
  // Un horario anterior que no tiene el formato "H:MM - H:MM" (texto libre) no cabe en Desde/Hasta: se
  // conserva tal cual mientras no se elija un rango nuevo.
  const horarioLibre = colonia?.horario && !rangoInicial ? colonia.horario : null

  const [nombre, setNombre] = useState(colonia?.nombre ?? "")
  const [dias, setDias] = useState<string[]>(colonia ? ordenarDias(colonia.dias_recoleccion ?? []) : [])
  const [desde, setDesde] = useState(rangoInicial?.desde ?? "")
  const [hasta, setHasta] = useState(rangoInicial?.hasta ?? "")
  const [ruta, setRuta] = useState(colonia?.ruta_numero != null ? String(colonia.ruta_numero) : "")
  // Una colonia nueva nace visible.
  const [visible, setVisible] = useState(colonia?.activa ?? true)
  const [error, setError] = useState<string | null>(null)
  const [pendiente, startTransition] = useTransition()

  const diasIniciales = colonia ? ordenarDias(colonia.dias_recoleccion ?? []) : []
  const sucio =
    nombre !== (colonia?.nombre ?? "") ||
    JSON.stringify(ordenarDias(dias)) !== JSON.stringify(diasIniciales) ||
    desde !== (rangoInicial?.desde ?? "") ||
    hasta !== (rangoInicial?.hasta ?? "") ||
    ruta !== (colonia?.ruta_numero != null ? String(colonia.ruta_numero) : "") ||
    visible !== (colonia?.activa ?? true)

  useEffect(() => {
    onSucio(sucio)
    return () => onSucio(false)
  }, [sucio, onSucio])

  // Lo que se guardará en `horario`: el rango si están las dos horas; el texto anterior si no se tocó;
  // null si no hay; "incompleto" si falta una de las dos.
  const horarioSalida: string | null | "incompleto" =
    desde && hasta ? serializarHorario(desde, hasta) : !desde && !hasta ? horarioLibre : "incompleto"
  const rutaNumero = /^\d+$/.test(ruta.trim()) ? Number(ruta.trim()) : null
  const finAntesDeInicio = Boolean(desde && hasta && hasta < desde)
  const cambioDeNombre = colonia !== null && limpiarNombre(nombre) !== colonia.nombre

  function alternarDia(dia: string) {
    setDias((actuales) => (actuales.includes(dia) ? actuales.filter((d) => d !== dia) : [...actuales, dia]))
  }

  function guardar() {
    setError(null)
    if (horarioSalida === "incompleto") {
      setError("Elige la hora de inicio y la de fin (o deja las dos vacías).")
      return
    }
    const entrada: EntradaColonia = {
      id: colonia?.id,
      nombre,
      dias: ordenarDias(dias),
      horario: horarioSalida,
      ruta: ruta.trim(),
      visible,
    }
    // Misma validación que hará el servidor, para avisar al momento (duplicados, formato…).
    const previo = validarColonia(entrada, {
      otras: todas.map((c) => ({ id: c.id, nombre: c.nombre })),
      horarioActual: colonia?.horario ?? null,
      idActual: colonia?.id,
    })
    if (!previo.ok) {
      setError(previo.error)
      return
    }
    startTransition(async () => {
      const r = await guardarColonia(entrada)
      if (!r.ok) {
        setError(r.error)
        return
      }
      onGuardado(r.id, colonia ? "Cambios guardados" : "Colonia creada")
    })
  }

  return (
    <div className="flex flex-1 flex-col gap-[18px] px-6 py-7">
      <EncabezadoColumna titulo={colonia ? "Editar colonia" : "Nueva colonia"} onCerrar={onCerrar} />

      <div className="flex flex-col gap-1.5">
        <Etiqueta texto="Nombre de la colonia">
          <input
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            maxLength={80}
            className={CLASE_CAMPO}
            style={ESTILO_BORDE}
          />
        </Etiqueta>
        {cambioDeNombre ? (
          <p className="text-xs leading-normal" style={{ color: colors.rme }}>
            Cambiar el nombre no actualiza los reportes ya enviados ni la colonia que cada persona tiene
            guardada en su teléfono: quedarían sin enlazar.
          </p>
        ) : null}
      </div>

      <fieldset>
        <legend className="mb-2 p-0 text-[13px] font-semibold">Días de recolección</legend>
        <div className="grid grid-cols-7 gap-1.5">
          {DIAS.map((d) => {
            const activo = dias.includes(d.valor)
            return (
              <button
                key={d.valor}
                type="button"
                aria-pressed={activo}
                aria-label={d.etiqueta}
                onClick={() => alternarDia(d.valor)}
                className="h-11 rounded-[10px] border text-sm"
                style={
                  activo
                    ? { borderColor: colors.manglar, backgroundColor: colors.manglar, color: "#fff", fontWeight: 700 }
                    : { borderColor: colors.borde, backgroundColor: "#fff", color: colors.texto2, fontWeight: 600 }
                }
              >
                {d.letra}
              </button>
            )
          })}
        </div>
      </fieldset>

      <div className="flex flex-col gap-1.5">
        <div className="grid grid-cols-2 gap-2.5">
          <Etiqueta texto="Desde">
            <input type="time" value={desde} onChange={(e) => setDesde(e.target.value)} className={CLASE_CAMPO} style={ESTILO_BORDE} />
          </Etiqueta>
          <Etiqueta texto="Hasta">
            <input type="time" value={hasta} onChange={(e) => setHasta(e.target.value)} className={CLASE_CAMPO} style={ESTILO_BORDE} />
          </Etiqueta>
        </div>
        {horarioLibre ? (
          <p className="text-xs leading-normal" style={{ color: colors.texto2 }}>
            Horario actual: «{horarioLibre}» (texto libre). Se conserva si no eliges Desde y Hasta.
          </p>
        ) : null}
        {finAntesDeInicio ? (
          <p className="text-xs leading-normal" style={{ color: colors.rme }}>
            La hora de fin es anterior a la de inicio: se guardaría como recolección que cruza la medianoche.
          </p>
        ) : null}
      </div>

      <Etiqueta texto="Número de ruta">
        <input
          type="text"
          inputMode="numeric"
          value={ruta}
          onChange={(e) => setRuta(e.target.value)}
          maxLength={3}
          className={CLASE_CAMPO}
          style={ESTILO_BORDE}
        />
      </Etiqueta>

      <div className="flex flex-col gap-1">
        <label className="flex items-center gap-2.5 text-sm">
          <input
            type="checkbox"
            checked={visible}
            onChange={(e) => setVisible(e.target.checked)}
            className="h-5 w-5"
            style={{ accentColor: colors.manglar }}
          />
          Visible en la app
        </label>
        <p className="text-xs leading-normal" style={{ color: colors.texto2 }}>
          Si la desmarcas, la colonia se oculta en la app. No se borra.
        </p>
      </div>

      <div className="rounded-xl px-3.5 py-3 text-[13px] leading-normal" style={{ backgroundColor: colors.palido, color: colors.manglar }}>
        Vista previa en la app:{" "}
        <strong>
          {vistaPrevia(dias, horarioSalida === "incompleto" ? null : horarioSalida, rutaNumero)}
        </strong>
      </div>

      <p className="text-xs leading-normal" style={{ color: colors.texto2 }}>
        La sugerencia automática de colonia por GPS usa el centro de cada colonia, que se carga aparte
        (supabase/cargar_centros_colonias.sql); aquí no se edita ni se pierde al guardar.
      </p>

      {error ? (
        <p role="alert" className="text-sm" style={{ color: colors.rp }}>
          {error}
        </p>
      ) : null}

      <Button
        type="button"
        disabled={pendiente}
        onClick={guardar}
        className="mt-auto h-[46px] rounded-xl text-[15px] font-bold text-white hover:opacity-90"
        style={{ backgroundColor: colors.manglar }}
      >
        {pendiente ? "Guardando…" : colonia ? "Guardar cambios" : "Crear colonia"}
      </Button>
    </div>
  )
}
