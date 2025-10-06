// src/app/(tenant)/layout.tsx
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { skipToken } from "@reduxjs/toolkit/query";
import { useEffect, useMemo } from "react";

import RoleGuard from "@/components/auth/RoleGuard";
import {
  selectIsAuthenticated,
  selectEffectiveRole,
  selectAuthTenantId,
  selectAuthBranchId,
  clearSession,
  selectAuthRole,
  selectAuthUser, // si querés mostrar el banner Admin
} from "@/redux/slices/authSlices"; // ajusta si tu archivo es authSlices

import { baseApi, setBranchId, clearAuthAll } from "@/redux/services/baseApi";
import { useGetTenantByIdQuery } from "@/redux/services/tenantsApi";
import { useGetBranchesQuery } from "@/redux/services/branchesApi"; // asumiendo que existe
import BranchSelector from "@/components/tenant/BranchSelector";

const NAV = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/users", label: "Usuarios" },
  { href: "/profile", label: "Mi perfil" },
  { href: "/settings", label: "Configuración" },
  { href: "/reports", label: "Reportes" },
];

const ALLOW_ROLES = [
  "SUPER_ADMIN",
  "ADMIN",
  "MANAGER",
  "CASHIER",
  "WAITER",
] as const;

export default function TenantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useDispatch();

  // ===== sesión & contexto =====
  const isAuthed = useSelector(selectIsAuthenticated);
  const roleEff = useSelector(selectEffectiveRole);
  const tenantId = useSelector(selectAuthTenantId);
  const branchId = useSelector(selectAuthBranchId);
  const role = useSelector(selectAuthRole);
  const user = useSelector(selectAuthUser);

  const isAdminLike = roleEff === "SUPER_ADMIN" || roleEff === "ADMIN";
  const assignedBranchId = user?.branchId ?? null;

  // Redirecciones seguras (evita queries sin contexto)
  useEffect(() => {
    if (!isAuthed) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
      return;
    }
    if (!tenantId) {
      // sin tenant no rendereamos el árbol tenant (evita queries abajo)
      router.replace("/dashboard"); // o "/login", a tu preferencia
    }
  }, [isAuthed, tenantId, pathname, router]);

  // ===== queries condicionadas por contexto =====
  const { data: tenant, isFetching: loadingTenant } = useGetTenantByIdQuery(
    tenantId ? { id: tenantId } : skipToken
  );

  const { data: branches, isFetching: loadingBranches } = useGetBranchesQuery(
    tenantId ? { tenantId } : skipToken
  );

  const tenantLabel = loadingTenant
    ? "Cargando…"
    : tenant?.name ?? tenantId ?? "—";

  // ===== cambio de sucursal =====
  const onSelectBranch = async (newBranchId: string) => {
    // 1) persistencia en storage (headers x-branch-id para futuras requests)
    setBranchId(newBranchId || null);
    // 2) estado global (para guards, selects, etc.)
    dispatch(
      // sólo parcheamos branchId, no tocamos token/tenant/user
      // (si usás setSession parcial, está OK)
      // (si tu setSession no acepta parcial, cambialo a Partial<AuthSession>)
      { type: "auth/setSession", payload: { branchId: newBranchId || null } }
    );
    // 3) limpiar cache RTKQ para que todo recargue con el nuevo branch
    dispatch(baseApi.util.resetApiState());
    // 4) refrescar vista actual
    router.replace(pathname); // o router.refresh() si usás fetch server side
  };

  // ===== logout =====
  const logout = () => {
    clearAuthAll(); // storage + broadcast
    dispatch(clearSession()); // redux
    dispatch(baseApi.util.resetApiState());
    router.replace("/login");
  };

  // ===== fallbacks previos a render =====
  if (!isAuthed) {
    return (
      <div className="p-6 text-sm text-zinc-600">Redirigiendo al login…</div>
    );
  }
  if (!tenantId) {
    return (
      <div className="p-6 text-sm text-zinc-600">
        Sesión sin tenant. Redirigiendo…
      </div>
    );
  }

  return (
    <RoleGuard allow={ALLOW_ROLES as any}>
      <div className="min-h-dvh flex">
        {/* Sidebar */}
        <aside className="w-64 shrink-0 bg-[#144336] text-white p-4 space-y-4">
          <div className="text-lg font-bold tracking-tight">Gourmetify</div>

          <nav className="flex flex-col gap-1 text-sm">
            {NAV.map((item) => {
              const active = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded px-3 py-2 hover:bg-white/10 ${
                    active ? "bg-white/15 font-semibold" : "opacity-90"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Enlace admin sólo si el rol real o efectivo es SUPER_ADMIN */}
          {(roleEff === "SUPER_ADMIN" || role === "SUPER_ADMIN") && (
            <Link
              href="/admin"
              className="block px-5 py-2 rounded-lg bg-[#144336] text-white hover:bg-[#0f3329] transition text-center"
            >
              Panel de administración
            </Link>
          )}

          {/* Tenant & Branch selector */}
          <div className="mt-6 text-xs/5 opacity-90 space-y-2">
            <div className="font-semibold">Tenant</div>
            <div className="truncate" title={tenantLabel}>
              {tenantLabel}
            </div>

            <div className="mt-3">
              <div className="font-semibold mb-1">Sucursal</div>
              <BranchSelector
                tenantId={tenantId}
                currentBranchId={branchId}
                assignedBranchId={assignedBranchId}
                canSwitch={isAdminLike}
                hideWhenLocked={false} 
                onChanged={() => {
                  // opcional: router.replace(pathname) o router.refresh()
                }}
              />
            </div>
          </div>

          <button
            onClick={logout}
            className="mt-6 w-full rounded bg-red-600 py-2 text-sm font-medium hover:bg-red-700"
          >
            Cerrar sesión
          </button>
        </aside>

        {/* Content */}
        <main className="flex-1 bg-zinc-50 p-6">{children}</main>
      </div>
    </RoleGuard>
  );
}
