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

  // La app móvil usa sesiones anónimas en este mismo proyecto Supabase: un
  // usuario anónimo tiene JWT válido, pero no es un administrador.
  const autenticado = !!user && !user.is_anonymous;

  const isLoginPage = request.nextUrl.pathname === "/login";
  if (!autenticado && !isLoginPage) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  if (autenticado && isLoginPage) {
    return NextResponse.redirect(new URL("/", request.url));
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
