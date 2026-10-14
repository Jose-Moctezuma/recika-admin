// Motivo obligatorio cuando estado = 'descartado' (CHECK de la migración 0008); nulo en cualquier
// otro estado.
export type MotivoDescarte = 'falso' | 'duplicado' | 'prueba'

export interface Reporte {
  id: string
  // null en los reportes remotos (sin GPS).
  lat: number | null
  lng: number | null
  colonia: string
  tipo_residuo: string
  tiempo_estimado: string | null
  urgencia: 'alta' | 'media' | 'baja'
  foto_url: string | null
  como_se_entero: string | null
  desde_sitio: boolean
  // Texto libre del ciudadano (migración 0006). Solo lo ve el panel: no está en las
  // vistas públicas ni en la app de otros usuarios. Opcionales: sin la 0006 no existen.
  descripcion?: string | null
  referencia_lugar?: string | null
  // 'pendiente' | 'atendido' | 'descartado' (CHECK de la migración 0008). Antes de esa migración
  // el valor podía ser cualquier texto libre; se deja como string por si el panel corre contra
  // una base sin 0008 todavía (los botones de moderación simplemente no encontrarían nada que
  // igualar y no harían nada raro).
  estado: string
  motivo_descarte?: MotivoDescarte | null
  estado_actualizado_at?: string | null
  estado_actualizado_por?: string | null
  created_at: string
}

export interface Colonia {
  id: string
  nombre: string
  // text[] en Supabase (ver supabase/migrations/0001_init.sql), no string: nombres completos en
  // minúscula y con acento ("martes", "miércoles", "sábado"), en orden lunes -> domingo.
  dias_recoleccion: string[]
  // Texto "H:MM - H:MM" (p. ej. "8:00 - 11:00"); null si no hay.
  horario: string | null
  ruta_numero: number | null
  // false = oculta: la app no la lista (en la base no se borra).
  activa: boolean
  // Centro de la colonia para sugerirla por GPS (migración 0007). El panel no los edita.
  centro_lat?: number | null
  centro_lng?: number | null
}

export interface CentroAcopio {
  id: string
  nombre: string
  direccion: string | null
  lat: number
  lng: number
  tipos_material: string[]
  horario: string | null
  // 'activo' | 'sin_servicio' | 'inactivo' (migración 0008). 'inactivo' nunca llega a la app
  // (centros_acopio_publico lo excluye); 'sin_servicio' sí, con su etiqueta gris.
  estado: string
  // Solo panel (verificación en campo, etapa 1 de la metodología): nunca están en
  // centros_acopio_publico, la vista que usa la app. Opcionales: sin la 0008 no existen.
  verificado_en_campo?: string | null
  notas_verificacion?: string | null
}

// Vista mapa_reportes: solo reportes con coordenadas (excluye los remotos
// sin GPS) y sin foto_url/como_se_entero/desde_sitio (no están en la vista).
export interface ReporteMapa {
  id: string
  lat: number
  lng: number
  colonia: string
  tipo_residuo: string
  urgencia: 'alta' | 'media' | 'baja'
  estado: string
  created_at: string
}

export interface RankingColonia {
  colonia: string
  total_reportes: number
  // La vista ranking_colonias expone "urgentes", no "urgencia_alta".
  urgentes: number
}

export interface Leccion {
  id: string
  titulo: string
  contenido: string | null
  categoria: string | null
  duracion_min: number
  orden: number
  activa: boolean
}
