// src/app/(tenant)/dashboard/page.tsx
"use client";

import Link from "next/link";
import { useListUsersQuery } from "@/redux/services/usersApi";
import { getTenantId } from "@/redux/services/baseApi";

export default function TenantDashboardPage() {
  const tenantId = getTenantId()!;
  const { data: users, isLoading } = useListUsersQuery({ tenantId });

  return (
    <div className="space-y-8">
      {/* Header */}
      <header>
        <h1 className="text-2xl font-extrabold text-[#144336]">Dashboard</h1>
        <p className="text-sm text-zinc-600">Resumen de tu organización.</p>
      </header>

      {/* Métricas */}
      <section className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <MetricCard title="Usuarios" value={isLoading ? "…" : (users?.length ?? 0)} hint="Colaboradores activos" />
        <MetricCard title="Sucursales" value="—" hint="Solo las crea un Admin" />
        <MetricCard title="Reportes" value="—" hint="Próximamente" />
      </section>

      {/* Accesos rápidos */}
      <section className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <QuickLink href="/tenant/users" title="Gestionar usuarios" desc="Alta, roles y estado" />
        <QuickLink href="/tenant/profile" title="Mi perfil" desc="Datos personales y contraseña" />
        <QuickLink href="/tenant/settings" title="Configuración" desc="Preferencias del tenant" />
      </section>
    </div>
  );
}

function MetricCard({ title, value, hint }: { title: string; value: string | number; hint?: string }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="h-1 rounded-full mb-3" style={{ backgroundColor: "#FBBF24" }} />
      <div className="text-sm text-zinc-500">{title}</div>
      <div className="text-3xl font-extrabold my-1 text-[#144336]">{value}</div>
      {hint && <div className="text-xs text-zinc-500">{hint}</div>}
    </div>
  );
}

function QuickLink({ href, title, desc }: { href: string; title: string; desc: string }) {
  return (
    <Link
      href={href}
      className="block rounded-xl border border-zinc-200 bg-white p-4 shadow-sm hover:shadow-md transition"
    >
      <h3 className="text-lg font-semibold text-[#144336]">{title}</h3>
      <p className="text-sm text-zinc-600 mt-1">{desc}</p>
    </Link>
  );
}
