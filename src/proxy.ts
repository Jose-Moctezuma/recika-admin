import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Next 16 renombró middleware -> proxy.
export async function proxy(request: NextRequest) {
  const response = NextResponse.next();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) =>
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          ),
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Tener sesión no basta: la app móvil usa sesiones anónimas en este mismo
  // proyecto y el registro por correo está abierto. Solo entra quien tenga
  // app_metadata.is_admin (que ningún usuario puede modificarse a sí mismo).
  const esAdmin = user?.app_metadata?.is_admin === true;

  const isLoginPage = request.nextUrl.pathname === "/login";
  if (!esAdmin && !isLoginPage) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  if (esAdmin && isLoginPage) {
    return NextResponse.redirect(new URL("/", request.url));
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
