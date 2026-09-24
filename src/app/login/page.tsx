"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase-browser";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = supabaseBrowser();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError("Credenciales incorrectas");
      setLoading(false);
    } else if (data.user.app_metadata?.is_admin !== true) {
      // Cuenta válida pero sin permiso: el proxy la devolvería a /login sin
      // explicación, así que se cierra la sesión y se avisa aquí.
      await supabase.auth.signOut();
      setError("Esta cuenta no tiene permisos de administrador");
      setLoading(false);
    } else {
      router.push("/");
      router.refresh();
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center" style={{ backgroundColor: "#F7F6F2" }}>
      <div className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold" style={{ color: "#085041" }}>
            Reci<span className="font-light">Ka</span>
          </h1>
          <p className="mt-1 text-sm text-gray-500">Panel administrativo</p>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Correo</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-green-700 focus:ring-1 focus:ring-green-700"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-green-700 focus:ring-1 focus:ring-green-700"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="mt-2 rounded-lg py-2.5 text-sm font-semibold text-white disabled:opacity-60"
            style={{ backgroundColor: "#085041" }}
          >
            {loading ? "Entrando…" : "Iniciar sesión"}
          </button>
        </form>
      </div>
    </div>
  );
}
