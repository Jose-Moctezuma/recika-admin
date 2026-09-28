import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import { ConditionalNav } from "@/components/conditional-nav";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { colors } from "@/lib/theme";
import "./globals.css";

// Inter, la misma tipografía de la app v2 (antes el panel caía en Times: Geist Sans no
// terminaba de cargar el archivo de variable y el navegador usaba su serif por defecto).
const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ReciKa Admin",
  description: "Panel administrativo de ReciKa — gestión de residuos en Chetumal",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // Para el contador de "Reportes" en el menú lateral. Se calcula aquí (Server Component) y
  // se pasa como prop porque el menú es un Client Component (usePathname); si falla (p. ej. la
  // migración 0008 aún no corrió) no se rompe el layout, solo no se muestra el contador.
  const { count } = await supabaseAdmin
    .from("reportes")
    .select("*", { count: "exact", head: true })
    .eq("estado", "pendiente");

  return (
    <html
      lang="es"
      className={`${inter.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex h-full min-h-screen font-sans" style={{ backgroundColor: colors.fondo }}>
        <ConditionalNav reportesPendientes={count ?? null} />
        <main className="flex-1 overflow-y-auto p-8">{children}</main>
      </body>
    </html>
  );
}
