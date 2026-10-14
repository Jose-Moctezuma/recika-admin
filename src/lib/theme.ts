// Paleta ReciKa (la misma que la app móvil: constants/theme.ts en el repo recika). Se centraliza
// aquí para no repetir hex sueltos en cada componente nuevo del panel v2.
export const colors = {
  manglar: "#085041",
  manglarOscuro: "#04342C",
  selva: "#1D9E75",
  turquesa: "#9FE1CB",
  palido: "#E1F5EE",
  texto: "#1F2A26",
  texto2: "#5F5E58",
  fondo: "#F7F6F2",
  borde: "#E0DED7",
  surface3: "#EFEDE7",
  ambarOscuro: "#3A1C08",
  ambarAcento: "#EF9F27",
  // Punto de "pendiente" en la lista "Por revisar" de Inicio (maqueta panel-v2/1-Inicio.html).
  ambarPendiente: "#BA7517",
  rsu: "#085041",
  rsuBg: "#E1F5EE",
  rme: "#8A5510",
  rmeBg: "#F8EEDF",
  rp: "#B8322F",
  rpBg: "#FCE5E4",
} as const;

// Urgencia de un reporte: baja = RSU, media = RME, alta = RP (mismo criterio que la app).
export const estiloUrgencia: Record<"alta" | "media" | "baja", { bg: string; fg: string; label: string }> = {
  alta: { bg: colors.rpBg, fg: colors.rp, label: "Alta" },
  media: { bg: colors.rmeBg, fg: colors.rme, label: "Media" },
  baja: { bg: colors.rsuBg, fg: colors.rsu, label: "Baja" },
};

// Estado de un reporte (migración 0008): pendiente = gris neutro, atendido = verde, descartado =
// rojo claro (con su motivo). No es una escala de urgencia: un solo tono por estado, no una
// gradación, para no confundirlo con la urgencia de arriba.
export const estiloEstadoReporte: Record<"pendiente" | "atendido" | "descartado", { bg: string; fg: string; label: string }> = {
  pendiente: { bg: colors.surface3, fg: colors.texto, label: "Pendiente" },
  atendido: { bg: colors.rsuBg, fg: colors.rsu, label: "Atendido" },
  descartado: { bg: colors.rpBg, fg: colors.rp, label: "Descartado" },
};

export const MOTIVO_DESCARTE_LABEL: Record<"falso" | "duplicado" | "prueba", string> = {
  falso: "Falso",
  duplicado: "Duplicado",
  prueba: "Prueba",
};

// Estado de un centro de acopio (migración 0008): 'inactivo' nunca llega a la app; 'sin_servicio'
// sí, con la etiqueta gris "Temporalmente sin servicio" (mismo texto que components/AcopioCard.tsx
// en la app). Aquí, en el panel, se muestran los tres para poder gestionarlos.
export const estiloEstadoAcopio: Record<"activo" | "sin_servicio" | "inactivo", { bg: string; fg: string; label: string }> = {
  activo: { bg: colors.rsuBg, fg: colors.rsu, label: "Activo" },
  sin_servicio: { bg: colors.surface3, fg: colors.texto2, label: "Temporalmente sin servicio" },
  inactivo: { bg: colors.rpBg, fg: colors.rp, label: "Inactivo" },
};
