"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useListTenantsQuery } from "@/redux/services/tenantsApi";
import { useGetBranchesQuery } from "@/redux/services/branchesApi";
import { useListUsersQuery } from "@/redux/services/usersApi";

export default function AdminHomePage() {
  const {
    data: tenants,
    isLoading: tenantsLoading,
    isError: tenantsError,
    error: tenantsErrObj,
  } = useListTenantsQuery();
  const {
    data: branches,
    isLoading: branchesLoading,
    isError: branchesError,
    error: branchesErrObj,
  } = useGetBranchesQuery();
  const {
    data: users,
    isLoading: usersLoading,
    isError: usersError,
    error: usersErrObj,
  } = useListUsersQuery();

  const totals = useMemo(
    () => ({
      tenants: tenants?.length ?? 0,
      branches: branches?.length ?? 0,
      users: users?.length ?? 0,
    }),
    [tenants, branches, users]
  );

  const loading = tenantsLoading || branchesLoading || usersLoading;
  const anyError = tenantsError || branchesError || usersError;

  return (
    <div className="mx-auto max-w-6xl p-4 space-y-6">
      {/* Header */}
      <header className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-[#144336]">
            Panel de administración
          </h1>
          <p className="text-sm text-zinc-600">
            Resumen general y accesos rápidos. Sin vueltas.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/users" className="btn-ghost">
            Gestionar usuarios
          </Link>
          <Link href="/admin/branches" className="btn-ghost">
            Gestionar sucursales
          </Link>
          <Link
            href="/admin/tenants"
            className="inline-flex items-center rounded-lg px-4 py-2 text-sm font-medium text-white"
            style={{ backgroundColor: "#144336" }}
          >
            Gestionar tenants
          </Link>
        </div>
      </header>

      {/* Estado de error */}
      {anyError && (
        <div className="rounded-xl border border-red-200 bg-red-50 text-red-700 p-3 text-sm">
          <div className="font-semibold mb-1">
            Ocurrió un problema cargando los datos.
          </div>
          <pre className="whitespace-pre-wrap text-xs">
            {JSON.stringify(
              tenantsErrObj ?? branchesErrObj ?? usersErrObj,
              null,
              2
            )}
          </pre>
        </div>
      )}

      {/* Métricas */}
      <section className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <MetricCard
          title="Tenants"
          value={totals.tenants}
          loading={loading}
          href="/admin/tenants"
          subtitle="Organizaciones activas"
        />
        <MetricCard
          title="Branches"
          value={totals.branches}
          loading={loading}
          href="/admin/branches"
          subtitle="Sucursales registradas"
        />
        <MetricCard
          title="Users"
          value={totals.users}
          loading={loading}
          href="/admin/users"
          subtitle="Usuarios del sistema"
        />
      </section>

      {/* Últimos registros */}
      <section className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        <Box title="Últimos tenants">
          {loading ? (
            <ListSkeleton />
          ) : tenants && tenants.length ? (
            <ul className="divide-y">
              {tenants.slice(0, 5).map((t) => (
                <li
                  key={t.id}
                  className="py-3 flex items-center justify-between"
                >
                  <div>
                    <div className="font-medium">{t.name}</div>
                    <div className="text-xs text-zinc-500 flex items-center gap-2">
                      <Badge tone="neutral">{t.plan}</Badge>
                      <Badge tone={t.status === "ACTIVE" ? "success" : "danger"}>
                        {t.status}
                      </Badge>
                    </div>
                  </div>
                  <Link
                    href="/admin/tenants"
                    className="text-xs underline text-[#144336]"
                    title="Ver todos"
                  >
                    Ver
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              message="Sin tenants todavía."
              href="/admin/tenants"
              cta="Crear tenant"
            />
          )}
        </Box>

        <Box title="Últimos usuarios">
          {loading ? (
            <ListSkeleton />
          ) : users && users.length ? (
            <ul className="divide-y">
              {users.slice(0, 5).map((u) => (
                <li
                  key={u.id}
                  className="py-3 flex items-center justify-between"
                >
                  <div>
                    <div className="font-medium">{u.name}</div>
                    <div className="text-xs text-zinc-500">
                      {u.email} · {u.role}
                    </div>
                  </div>
                  <Link
                    href="/admin/users"
                    className="text-xs underline text-[#144336]"
                    title="Ver todos"
                  >
                    Ver
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              message="Sin usuarios todavía."
              href="/admin/users"
              cta="Crear usuario"
            />
          )}
        </Box>
      </section>
    </div>
  );
}

/* ---------- UI helpers ---------- */

function MetricCard({
  title,
  value,
  subtitle,
  loading,
  href,
}: {
  title: string;
  value: number | string;
  subtitle?: string;
  loading?: boolean;
  href?: string;
}) {
  return (
    <Link
      href={href ?? "#"}
      className="block rounded-xl border border-zinc-200 bg-white p-4 shadow-sm hover:shadow-md transition"
    >
      {/* barra/acento */}
      <div
        className="h-1 rounded-full mb-3"
        style={{ backgroundColor: "#FBBF24" }}
      />
      <div className="text-sm text-zinc-500">{title}</div>
      <div className="text-3xl font-extrabold my-1 text-[#144336]">
        {loading ? "…" : value}
      </div>
      {subtitle && <div className="text-xs text-zinc-500">{subtitle}</div>}
    </Link>
  );
}

function Box({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="font-semibold text-[#144336]">{title}</div>
      </div>
      {children}
    </div>
  );
}

function Badge({
  tone = "neutral",
  children,
}: {
  tone?: "success" | "danger" | "neutral";
  children: React.ReactNode;
}) {
  const cls =
    tone === "success"
      ? "bg-green-100 text-green-700"
      : tone === "danger"
      ? "bg-rose-100 text-rose-700"
      : "bg-zinc-100 text-zinc-700";
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${cls}`}>
      {children}
    </span>
  );
}

function ListSkeleton() {
  return (
    <ul className="animate-pulse space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <li key={i} className="h-6 bg-zinc-100 rounded" />
      ))}
    </ul>
  );
}

function EmptyState({
  message,
  href,
  cta,
}: {
  message: string;
  href: string;
  cta: string;
}) {
  return (
    <div className="text-sm text-zinc-600">
      <div>{message}</div>
      <Link
        href={href}
        className="inline-block mt-2 rounded-lg px-3 py-1 text-sm font-medium text-white"
        style={{ backgroundColor: "#144336" }}
      >
        {cta}
      </Link>
    </div>
  );
}

/* --- util tailwind “btn-ghost” si no lo tenés en globals.css --- */
/*  Agregalo a tu CSS global como util, o dejalo así inline: */
const ghost = `
  inline-flex items-center rounded-lg border border-zinc-300 bg-white
  px-4 py-2 text-sm font-medium hover:bg-zinc-50
`;
