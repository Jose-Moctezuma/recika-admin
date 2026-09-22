# ReciKa Admin

Panel administrativo de ReciKa (gestión de residuos sólidos urbanos en Chetumal). Next.js 16 + App Router + shadcn/ui (Radix) + Supabase.

## Setup

```bash
npm install
cp .env.local.example .env.local
# Completa .env.local con tus keys reales de Supabase (Settings → API):
#   NEXT_PUBLIC_SUPABASE_URL
#   NEXT_PUBLIC_SUPABASE_ANON_KEY        — pública, va al navegador
#   SUPABASE_SERVICE_ROLE_KEY            — secreta, solo servidor, bypasea RLS
```

Las tablas/vistas de Supabase que este panel consulta (`reportes`, `mapa_reportes`,
`ranking_colonias`, `usuarios_progreso`, `centros_acopio`, `colonias`, `lecciones`)
requieren los `GRANT` de las migraciones en el repo `recika` (`supabase/migrations/`),
incluyendo `0003_grants_service_role.sql` para que la `service_role` key funcione.

## Desarrollo local

`npm run dev` (Turbopack) actualmente falla con `TypeError: fetch failed` al
consultar Supabase desde los Server Components — parece un problema de cómo
Turbopack instrumenta `fetch` en modo dev en este entorno, no del código. Hasta
resolverlo, usa el build de producción para desarrollar/probar localmente:

```bash
npm run build && npm start
```

## Producción

Se despliega en Vercel.

## Estructura

```
src/
├── app/
│   ├── page.tsx              # Inicio: 4 métricas
│   ├── reportes/page.tsx     # Tabla de reportes
│   ├── colonias/page.tsx     # Ranking de colonias
│   └── acopios/page.tsx      # Tabla de centros de acopio
├── components/
│   ├── nav-sidebar.tsx
│   └── ui/                   # shadcn/ui
└── lib/
    ├── supabase.ts           # Cliente anon (público)
    ├── supabase-admin.ts     # Cliente service_role (solo servidor)
    └── types.ts
```
