// src/app/page.tsx
"use client";

import Link from "next/link";

export default function PublicHomePage() {
  return (
    <main className="min-h-screen flex flex-col bg-gradient-to-b from-zinc-50 to-zinc-100">
      {/* Hero */}
      <section className="flex flex-1 flex-col items-center justify-center text-center px-6 space-y-6">
        <h1 className="text-4xl font-extrabold text-[#144336]">
          Bienvenido a Gourmetify 👋
        </h1>
        <p className="max-w-xl text-zinc-600">
          Software de gestión gastronómica multi-tenant.  
          Controlá tu negocio o administrá múltiples organizaciones desde un solo lugar.
        </p>

        <div className="flex flex-wrap gap-4 justify-center">
          <Link
            href="/login"
            className="px-5 py-2 rounded-lg border border-zinc-300 bg-white hover:bg-zinc-50 transition"
          >
            Ingresar como tenant
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center py-4 text-sm text-zinc-500 border-t">
        © {new Date().getFullYear()} Gourmetify. Todos los derechos reservados.
      </footer>
    </main>
  );
}
