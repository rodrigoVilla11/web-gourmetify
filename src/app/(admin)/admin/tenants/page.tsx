"use client";

import { useMemo, useState } from "react";
import {
  useListTenantsQuery,
  useCreateTenantMutation,
  useUpdateTenantMutation,
  useDeleteTenantMutation,
  type Tenant,
  type TenantPlan,
  type TenantStatus,
} from "@/redux/services/tenantsApi";

const PLAN_OPTS: TenantPlan[] = ["FREE", "PRO", "ENTERPRISE"];
const STATUS_OPTS: TenantStatus[] = ["ACTIVE", "INACTIVE"];

export default function TenantsPage() {
  const { data, isLoading, isFetching, error, refetch } = useListTenantsQuery();
  const [createTenant, { isLoading: creating }] = useCreateTenantMutation();
  const [updateTenant] = useUpdateTenantMutation();
  const [deleteTenant, { isLoading: deleting }] = useDeleteTenantMutation();

  // alta
  const [name, setName] = useState("");
  const [plan, setPlan] = useState<TenantPlan>("FREE");
  const [status, setStatus] = useState<TenantStatus>("ACTIVE");
  const canCreate = !!name.trim();

  // filtros
  const [q, setQ] = useState("");
  const [planFilter, setPlanFilter] = useState<"ALL" | TenantPlan>("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | TenantStatus>("ALL");
  const [sortAsc, setSortAsc] = useState(false);

  const filtered = useMemo(() => {
    const arr = (data ?? []).slice();
    const text = q.trim().toLowerCase();
    let out = arr;

    if (text) {
      out = out.filter(
        (t) =>
          t.name.toLowerCase().includes(text) ||
          t.plan.toLowerCase().includes(text) ||
          t.status.toLowerCase().includes(text)
      );
    }
    if (planFilter !== "ALL") out = out.filter((t) => t.plan === planFilter);
    if (statusFilter !== "ALL") out = out.filter((t) => t.status === statusFilter);

    out.sort((a, b) =>
      sortAsc
        ? a.createdAt.localeCompare(b.createdAt)
        : b.createdAt.localeCompare(a.createdAt)
    );
    return out;
  }, [data, q, planFilter, statusFilter, sortAsc]);

  // acciones
  const add = async () => {
    if (!canCreate) return;
    try {
      await createTenant({ data: { name: name.trim(), plan, status } }).unwrap();
      setName(""); setPlan("FREE"); setStatus("ACTIVE");
    } catch {
      alert("No se pudo crear el tenant.");
    }
  };
  const toggleStatus = (t: Tenant) =>
    updateTenant({ id: t.id, data: { status: t.status === "ACTIVE" ? "INACTIVE" : "ACTIVE" } });

  const changePlan = (t: Tenant, p: TenantPlan) =>
    t.plan !== p && updateTenant({ id: t.id, data: { plan: p } });

  const remove = (t: Tenant) => {
    if (!confirm(`¿Eliminar "${t.name}"?`)) return;
    deleteTenant({ id: t.id });
  };

  // UI
  return (
    <div className="mx-auto max-w-6xl p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-brand tracking-tight">
            Tenants
          </h1>
          <p className="text-sm text-zinc-500">
            Controlá planes, estados y altas. Sin vueltas.
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="btn-ghost"
          disabled={isFetching}
        >
          {isFetching ? "Actualizando…" : "Refrescar"}
        </button>
      </div>

      {/* Alta */}
      <div className="card p-3 grid gap-3 sm:grid-cols-[1fr,200px,200px,auto] items-end">
        <div>
          <label className="block text-[11px] uppercase tracking-wide text-zinc-500 mb-1">
            Nombre
          </label>
          <input
            className="input"
            placeholder="Acme Corp"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && add()}
          />
        </div>
        <div>
          <label className="block text-[11px] uppercase tracking-wide text-zinc-500 mb-1">
            Plan
          </label>
          <select className="select" value={plan} onChange={(e) => setPlan(e.target.value as TenantPlan)}>
            {PLAN_OPTS.map((p) => <option key={p}>{p}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-[11px] uppercase tracking-wide text-zinc-500 mb-1">
            Status
          </label>
          <select className="select" value={status} onChange={(e) => setStatus(e.target.value as TenantStatus)}>
            {STATUS_OPTS.map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div className="flex justify-end">
          <button
            onClick={add}
            disabled={!canCreate}
            className="btn-brand"
          >
            {creating ? "Creando…" : "Crear"}
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="card p-3 grid gap-3 sm:grid-cols-[1fr,200px,200px,auto] items-end">
        <input
          className="input"
          placeholder="Buscar por nombre/plan/estado…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select className="select" value={planFilter} onChange={(e) => setPlanFilter(e.target.value as any)}>
          <option value="ALL">Plan (todos)</option>
          {PLAN_OPTS.map((p) => <option key={p}>{p}</option>)}
        </select>
        <select className="select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)}>
          <option value="ALL">Estado (todos)</option>
          {STATUS_OPTS.map((s) => <option key={s}>{s}</option>)}
        </select>
        <div className="flex gap-2 justify-end">
          <button className="btn-ghost" onClick={() => { setQ(""); setPlanFilter("ALL"); setStatusFilter("ALL"); }}>
            Limpiar
          </button>
        </div>
      </div>

      {/* Tabla */}
      {error ? (
        <div className="text-sm text-red-600">Error cargando tenants.</div>
      ) : isLoading ? (
        <div className="text-sm">Cargando…</div>
      ) : (
        <div className="card p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-brand/5 text-zinc-700">
              <tr>
                <Th className="text-left">Nombre</Th>
                <Th>Plan</Th>
                <Th>Estado</Th>
                <Th
                  className="cursor-pointer select-none"
                  onClick={() => setSortAsc((s) => !s)}
                  title="Ordenar por Creado"
                >
                  Creado {sortAsc ? "▲" : "▼"}
                </Th>
                <Th>Acciones</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t, i) => (
                <tr key={t.id} className={i % 2 ? "bg-white" : "bg-zinc-50/40"}>
                  <Td className="text-left">{t.name}</Td>
                  <Td>
                    <select
                      className="select !py-1 !px-2"
                      value={t.plan}
                      onChange={(e) => changePlan(t, e.target.value as TenantPlan)}
                    >
                      {PLAN_OPTS.map((p) => <option key={p}>{p}</option>)}
                    </select>
                  </Td>
                  <Td>
                    <StatusBadge status={t.status} />
                  </Td>
                  <Td>{new Date(t.createdAt).toLocaleString("es-AR", { dateStyle: "short", timeStyle: "medium" })}</Td>
                  <Td>
                    <div className="flex items-center gap-4">
                      <button className="text-xs underline text-brand" onClick={() => toggleStatus(t)}>
                        Toggle status
                      </button>
                      <button
                        className="text-xs underline text-red-600 disabled:opacity-50"
                        onClick={() => remove(t)}
                        disabled={deleting}
                      >
                        Eliminar
                      </button>
                    </div>
                  </Td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-zinc-500">Sin resultados.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* = Helpers UI coherentes con el kit = */
function Th({ className = "", ...props }: React.HTMLAttributes<HTMLTableCellElement>) {
  return <th className={`px-3 py-2 border-b border-zinc-200 font-semibold ${className}`} {...props} />;
}
function Td({ className = "", ...props }: React.HTMLAttributes<HTMLTableCellElement>) {
  return <td className={`px-3 py-2 border-t border-zinc-200 ${className}`} {...props} />;
}
function StatusBadge({ status }: { status: TenantStatus }) {
  const isActive = status === "ACTIVE";
  const cls = isActive
    ? "bg-green-100 text-green-700"
    : "bg-rose-100 text-rose-700";
  return <span className={`badge ${cls}`}>{status}</span>;
}
