"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Users,
  UserPlus,
  UserCog,
  Mail,
  ShieldCheck,
  Loader2,
  Search,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { getTenantId } from "@/redux/services/baseApi";
import {
  useListUsersQuery,
  useCreateUserMutation,
  UserRole,
  // useUpdateUserMutation, // ← descomenta si tenés este endpoint
} from "@/redux/services/usersApi";

// ================================
// Page
// ================================
export default function TenantUsersPage() {
  const tenantId = getTenantId()!;

  // data
  const { data: users = [], isLoading, isError, refetch } = useListUsersQuery({ tenantId });
  const [createUser, { isLoading: creating }] = useCreateUserMutation();
  // const [updateUser] = useUpdateUserMutation();

  // form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("STAFF");
  const [errMsg, setErrMsg] = useState<string | null>(null);

  // ui state
  const [q, setQ] = useState("");
  const [showForm, setShowForm] = useState(false);

  const total = users.length;

  const filtered = useMemo(() => {
    if (!q.trim()) return users;
    const s = q.toLowerCase();
    return users.filter((u) =>
      [u.name, u.email, u.role]?.some((x) => String(x ?? "").toLowerCase().includes(s))
    );
  }, [users, q]);

  // create handler
  const handleCreate = async () => {
    setErrMsg(null);
    if (!name.trim() || !email.trim() || !password.trim()) {
      setErrMsg("Completá nombre, email y contraseña.");
      return;
    }
    try {
      await createUser({ tenantId, data: { name: name.trim(), email: email.trim().toLowerCase(), password, role } }).unwrap();
      setName("");
      setEmail("");
      setPassword("");
      setRole("STAFF");
      setShowForm(false);
    } catch (e: any) {
      setErrMsg(e?.data?.message ?? "No se pudo crear el usuario.");
    }
  };

  // toggle activo (opcional si tenés endpoint)
  // const toggleActive = async (u: UserLite) => {
  //   try {
  //     await updateUser({ id: u.id, data: { isActive: !u.isActive } }).unwrap();
  //   } catch {}
  // };

  return (
    <div className="space-y-8">
      {/* Header */}
      <header className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-black tracking-tight text-[#144336]">Usuarios</h1>
          <p className="text-sm text-zinc-600">Gestioná colaboradores, roles y accesos.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/settings"
            className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-700 shadow-sm transition hover:border-[#144336] hover:text-[#144336]"
            aria-label="Ir a configuración"
          >
            <UserCog className="h-4 w-4" aria-hidden />
            Configuración
          </Link>
          <button
            onClick={() => setShowForm((v) => !v)}
            className="inline-flex items-center gap-2 rounded-xl bg-[#144336] px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:opacity-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#144336]"
          >
            <UserPlus className="h-4 w-4" aria-hidden />
            Nuevo usuario
          </button>
        </div>
      </header>

      {/* Metrics strip */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <MetricCard
          icon={Users}
          title="Colaboradores"
          value={isLoading ? undefined : total}
          hint="Activos y pendientes"
          accent="from-amber-400/80 via-amber-300 to-amber-500"
          isLoading={isLoading}
        />
        <MetricCard
          icon={ShieldCheck}
          title="Roles"
          value={uniqueRolesCount(users)}
          hint="Seguridad por permisos"
          accent="from-sky-400/70 via-sky-300 to-sky-500"
          isLoading={isLoading}
        />
        <MetricCard
          icon={Mail}
          title="Emails configurados"
          value={users.filter((u) => Boolean(u.email)).length}
          hint="Login por correo"
          accent="from-emerald-400/70 via-emerald-300 to-emerald-500"
          isLoading={isLoading}
        />
      </section>

      {/* Toolbar */}
      <section className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" aria-hidden />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por nombre, email o rol"
            className="w-full rounded-xl border border-zinc-200 bg-white py-2 pl-9 pr-3 text-sm text-zinc-700 shadow-sm outline-none ring-0 placeholder:text-zinc-400 focus:border-[#144336]"
            aria-label="Buscar usuarios"
          />
        </div>
        <span className="text-xs text-zinc-500">{filtered.length} resultados</span>
      </section>

      {/* Create panel */}
      {showForm && (
        <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr,1fr,1fr,auto]">
            <LabeledInput label="Nombre" value={name} onChange={setName} placeholder="Ej. Juana Pérez" />
            <LabeledInput label="Email" value={email} onChange={setEmail} placeholder="ejemplo@correo.com" type="email" />
            <LabeledInput label="Contraseña" value={password} onChange={setPassword} type="password" placeholder="••••••••" />
            <LabeledSelect label="Rol" value={role} onChange={(v) => setRole(v as UserRole)} options={roleOptions} />
          </div>
          {errMsg && <p className="mt-2 text-sm text-red-600">{errMsg}</p>}
          <div className="mt-3 flex items-center gap-2">
            <button
              onClick={handleCreate}
              disabled={creating}
              className="inline-flex items-center gap-2 rounded-xl bg-[#144336] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:opacity-95 disabled:opacity-60"
            >
              {creating ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <UserPlus className="h-4 w-4" aria-hidden />}
              {creating ? "Creando…" : "Crear usuario"}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="rounded-xl px-3 py-2 text-sm font-medium text-zinc-700 hover:text-[#144336]"
            >
              Cancelar
            </button>
          </div>
        </section>
      )}

      {/* List */}
      <section className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <header className="flex items-center justify-between gap-2 border-b px-4 py-3">
          <span className="text-sm font-semibold text-[#144336]">Listado</span>
          <button onClick={() => refetch()} className="text-xs text-zinc-500 hover:text-[#144336]">Actualizar</button>
        </header>

        {isLoading ? (
          <ListSkeleton />
        ) : isError ? (
          <div className="p-6 text-sm text-red-600">No se pudo cargar la lista.</div>
        ) : filtered.length === 0 ? (
          <EmptyState onNew={() => setShowForm(true)} />
        ) : (
          <ul className="divide-y">
            {filtered.map((u) => (
              <li key={u.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar name={u.name} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-[#144336]">{u.name}</p>
                    <p className="truncate text-xs text-zinc-500">{u.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <RoleBadge role={u.role} />
                  <StatusPill active={u.isActive} />
                  {/* <button onClick={() => toggleActive(u)} className="text-xs text-zinc-500 hover:text-[#144336]">{u.isActive ? "Desactivar" : "Activar"}</button> */}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

// ================================
// Types/helpers (ajustá a tu schema)
// ================================

type UserLite = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
};


const roleOptions: { label: string; value: UserRole }[] = [
  { label: "Admin", value: "ADMIN" },
  { label: "Manager", value: "MANAGER" },
  { label: "Cashier", value: "CASHIER" },
  { label: "Waiter", value: "WAITER" },

];

function uniqueRolesCount(users: UserLite[]) {
  return new Set(users?.map((u) => u.role)).size || 0;
}

// ================================
// UI Building Blocks
// ================================

function MetricCard({
  title,
  value,
  hint,
  icon: Icon,
  accent,
  isLoading,
}: {
  title: string;
  value?: number;
  hint?: string;
  icon: any;
  accent: string;
  isLoading?: boolean;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:shadow-md">
      <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${accent}`} aria-hidden />
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-zinc-500">{title}</p>
          <div className="mt-2 flex items-center gap-3" aria-live={isLoading ? "polite" : undefined}>
            {isLoading ? (
              <span className="inline-flex items-center gap-2 text-sm font-medium text-zinc-500">
                <Loader2 aria-hidden className="h-4 w-4 animate-spin" />
                Cargando
              </span>
            ) : (
              <span className="text-3xl font-extrabold text-[#144336]">{typeof value === "number" ? value.toLocaleString() : "—"}</span>
            )}
          </div>
          {hint && <p className="mt-2 text-xs text-zinc-500">{hint}</p>}
        </div>
        <span className="rounded-full bg-[#144336]/10 p-2 text-[#144336]" aria-hidden>
          <Icon className="h-5 w-5" />
        </span>
      </div>
    </div>
  );
}

function LabeledInput({ label, value, onChange, type = "text", placeholder }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  const id = useMemo(() => `in_${Math.random().toString(36).slice(2, 8)}`, []);
  return (
    <label htmlFor={id} className="space-y-1">
      <span className="block text-xs font-medium text-zinc-600">{label}</span>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-800 shadow-sm outline-none ring-0 placeholder:text-zinc-400 focus:border-[#144336]"
      />
    </label>
  );
}

function LabeledSelect({ label, value, onChange, options }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { label: string; value: string }[];
}) {
  const id = useMemo(() => `sel_${Math.random().toString(36).slice(2, 8)}`, []);
  return (
    <label htmlFor={id} className="space-y-1">
      <span className="block text-xs font-medium text-zinc-600">{label}</span>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-800 shadow-sm outline-none ring-0 focus:border-[#144336]"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function RoleBadge({ role }: { role: UserRole }) {
  const map: Record<UserRole, string> = {
    OWNER: "bg-purple-100 text-purple-700",
    ADMIN: "bg-sky-100 text-sky-700",
    MANAGER: "bg-amber-100 text-amber-700",
    STAFF: "bg-emerald-100 text-emerald-700",
  };
  return <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${map[role]}`}>{role}</span>;
}

function StatusPill({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
        active ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
      }`}
    >
      {active ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
      {active ? "Activo" : "Inactivo"}
    </span>
  );
}

function Avatar({ name }: { name?: string }) {
  const initials = (name ?? "?")
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#144336]/10 text-xs font-semibold text-[#144336]">
      {initials}
    </div>
  );
}

function EmptyState({ onNew }: { onNew: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 p-10 text-center">
      <div className="rounded-2xl border border-dashed border-zinc-200 p-6">
        <Users className="h-8 w-8 text-zinc-400" aria-hidden />
      </div>
      <p className="max-w-sm text-sm text-zinc-600">
        Aún no hay usuarios con este filtro. Creá tu primer usuario o ajustá la búsqueda.
      </p>
      <button
        onClick={onNew}
        className="inline-flex items-center gap-2 rounded-xl bg-[#144336] px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:opacity-95"
      >
        <UserPlus className="h-4 w-4" aria-hidden />
        Crear usuario
      </button>
    </div>
  );
}

function ListSkeleton() {
  return (
    <ul className="divide-y">
      {Array.from({ length: 6 }).map((_, i) => (
        <li key={i} className="flex items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 animate-pulse rounded-full bg-zinc-200" />
            <div className="space-y-2">
              <div className="h-3 w-40 animate-pulse rounded bg-zinc-200" />
              <div className="h-3 w-28 animate-pulse rounded bg-zinc-200" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-5 w-16 animate-pulse rounded-full bg-zinc-200" />
            <div className="h-5 w-20 animate-pulse rounded-full bg-zinc-200" />
          </div>
        </li>
      ))}
    </ul>
  );
}
