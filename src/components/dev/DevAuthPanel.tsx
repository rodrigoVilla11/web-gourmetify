// src/components/dev/DevRoleSwitcher.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "@/store";
import type { UserRole } from "@/types/auth";
import { getAuthUser, setAuthUser, AUTH_EVENT } from "@/redux/services/baseApi";
import { clearUser, setUser } from "@/redux/slices/authSlices";

const roleOptions: UserRole[] = ["SUPER_ADMIN", "ADMIN", "MANAGER", "CASHIER", "WAITER"];

export default function DevRoleSwitcher() {
  const dispatch = useDispatch();
  const user = useSelector((s: RootState) => s.auth.user);
  const [open, setOpen] = useState(false);

  // sync multi-pestaña + primer carga desde localStorage
  useEffect(() => {
    const sync = () => {
      const u = getAuthUser();
      if (u) dispatch(setUser(u));
      else dispatch(clearUser());
    };
    sync();
    window.addEventListener("storage", sync);
    window.addEventListener(AUTH_EVENT, sync as EventListener);
    window.addEventListener("focus", sync);
    const vis = () => { if (document.visibilityState === "visible") sync(); };
    document.addEventListener("visibilitychange", vis);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(AUTH_EVENT, sync as EventListener);
      window.removeEventListener("focus", sync);
      document.removeEventListener("visibilitychange", vis);
    };
  }, [dispatch]);

  const currentInfo = useMemo(() => {
    if (!user) return "—";
    const parts = [user.name ?? user.email, user.role ?? "no-role"];
    if (user.tenantId) parts.push(`t:${user.tenantId.slice(0, 6)}…`);
    if (user.branchId) parts.push(`b:${user.branchId.slice(0, 6)}…`);
    return parts.join(" · ");
  }, [user?.name, user?.email, user?.role, user?.tenantId, user?.branchId]);

  const setRoleOnly = (r: UserRole) => {
    const u = getAuthUser();
    if (!u) return;
    // solo cambia role; todo lo demás queda igual
    setAuthUser({ ...u, role: r });
  };

  return (
    <div style={{ position: "fixed", bottom: 12, right: 12, zIndex: 9999 }}>
      {open && (
        <div className="border rounded-lg bg-white shadow p-3 text-xs space-y-3 w-[360px]">
          <div className="flex items-center justify-between">
            <div className="font-medium">Dev: Role</div>
            <button
              className="text-zinc-500 hover:text-zinc-800"
              onClick={() => setOpen(false)}
              title="Cerrar"
            >
              ×
            </button>
          </div>

          <div className="space-y-2">
            <div className="text-zinc-500">Actual</div>
            <div className="text-sm">{currentInfo}</div>

            <div className="text-zinc-500 mt-2">Cambiar rol</div>
            <div className="flex flex-wrap gap-1">
              {roleOptions.map((r) => (
                <button
                  key={r}
                  onClick={() => setRoleOnly(r)}
                  className={`border rounded px-2 py-0.5 hover:bg-zinc-50 ${
                    user?.role === r ? "bg-zinc-100" : ""
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen((v) => !v)}
        className="border rounded-full px-3 py-1 bg-white shadow text-xs"
        title="Dev: Role"
      >
        {open ? "×" : "Role"}
      </button>
    </div>
  );
}
