export interface Reporte {
  id: string
  // null en los reportes remotos (sin GPS).
  lat: number | null
  lng: number | null
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
