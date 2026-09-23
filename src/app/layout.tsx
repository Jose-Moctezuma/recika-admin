import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ConditionalNav } from "@/components/conditional-nav";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
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

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex h-full min-h-screen" style={{ backgroundColor: "#F7F6F2" }}>
        <ConditionalNav />
        <main className="flex-1 overflow-y-auto p-8">{children}</main>
      </body>
    </html>
  );
}
