export interface Reporte {
  id: string
  lat: number
  lng: number
  colonia: string
  tipo_residuo: string
  urgencia: 'alta' | 'media' | 'baja'
  foto_url: string | null
  como_se_entero: string | null
  desde_sitio: boolean
  estado: string
  created_at: string
}

export interface Colonia {
  id: string
  nombre: string
  // text[] en Supabase (ver supabase/migrations/0001_init.sql), no string.
  dias_recoleccion: string[]
  horario: string
  ruta_numero: number
}

export interface CentroAcopio {
  id: string
  nombre: string
  direccion: string
  lat: number
  lng: number
  tipos_material: string[]
  horario: string
  estado: string
}

export interface RankingColonia {
  colonia: string
  total_reportes: number
  // La vista ranking_colonias expone "urgentes", no "urgencia_alta".
  urgentes: number
}
