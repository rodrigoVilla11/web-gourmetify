"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  getTenantId,
  getUserRole,      // 👈 importamos helper de rol
  setAuthToken,
  setBranchId,
  clearAuthAll,    // 👈 opcional: logout centralizado
} from "@/redux/services/baseApi";

const NAV = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/users", label: "Usuarios" },
  { href: "/profile", label: "Mi perfil" },
  { href: "/settings", label: "Configuración" },
  { href: "/reports", label: "Reportes" },
];

export default function TenantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const tenantId = getTenantId();
  const role = getUserRole(); // 👈 leemos el rol de localStorage

  const logout = () => {
    clearAuthAll(); // borra token, tenant, branch, user, role
    router.push("/login");
  };

  return (
    <div className="min-h-dvh flex">
      {/* Sidebar */}
      <aside className="w-60 shrink-0 bg-[#144336] text-white p-4 space-y-4">
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

        {/* 👇 Solo mostrar si es SUPERADMIN */}
        {role === "SUPER_ADMIN" && (
          <Link
            href="/admin"
            className="block px-5 py-2 rounded-lg bg-[#144336] text-white hover:bg-[#0f3329] transition text-center"
          >
            Panel de administración
          </Link>
        )}

        <div className="mt-6 text-xs/5 opacity-80">
          <div className="font-semibold">Tenant</div>
          <div className="truncate">{tenantId ?? "—"}</div>
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
  );
}
