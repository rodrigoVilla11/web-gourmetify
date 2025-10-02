// src/components/dev/DevRoleSwitcher.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { UserRole } from "@/types/auth";
import { getAuthUser, AUTH_EVENT } from "@/redux/services/baseApi";
import {
  selectAuthUser,
  selectAuthTenantId,
  selectAuthBranchId,
  selectEffectiveRole,
  setDevRoleOverride,
  clearDevRoleOverride,
} from "@/redux/slices/authSlices";

const roleOptions: UserRole[] = ["SUPER_ADMIN", "ADMIN", "MANAGER", "CASHIER", "WAITER"];

// clave local para persistir override
const OVERRIDE_KEY = "gourmetify.dev.roleOverride";

export default function DevRoleSwitcher() {
  const dispatch = useDispatch();

  const user = useSelector(selectAuthUser);
  const role = useSelector(selectEffectiveRole); // 👈 rol efectivo (override > session)
  const tenantId = useSelector(selectAuthTenantId);
  const branchId = useSelector(selectAuthBranchId);

  const [open, setOpen] = useState(false);

  // Bootstrap: leer override de localStorage y setear en Redux
  useEffect(() => {
    try {
      const raw = localStorage.getItem(OVERRIDE_KEY);
      const r = raw ? (JSON.parse(raw) as UserRole | null) : null;
      dispatch(setDevRoleOverride(r ?? null));
    } catch { /* noop */ }
  }, [dispatch]);

  // Sync multi-pestaña + eventos locales
  useEffect(() => {
    const sync = () => {
      try {
        const raw = localStorage.getItem(OVERRIDE_KEY);
        const r = raw ? (JSON.parse(raw) as UserRole | null) : null;
        dispatch(setDevRoleOverride(r ?? null));
      } catch { /* noop */ }
    };
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
    const parts = [user.name ?? user.email, role ?? "no-role"];
    if (tenantId) parts.push(`t:${tenantId.slice(0, 6)}…`);
    if (branchId) parts.push(`b:${branchId.slice(0, 6)}…`);
    return parts.join(" · ");
  }, [user, role, tenantId, branchId]);

  // Setea override SOLO en dev (no toca session ni user)
  const setOverride = (r: UserRole | null) => {
    try {
      if (r) localStorage.setItem(OVERRIDE_KEY, JSON.stringify(r));
      else localStorage.removeItem(OVERRIDE_KEY);
    } catch { /* noop */ }
    dispatch(setDevRoleOverride(r));
  };

  return (
    <div style={{ position: "fixed", bottom: 12, right: 12, zIndex: 9999 }}>
      {open && (
        <div className="border rounded-lg bg-white shadow p-3 text-xs space-y-3 w-[360px]">
          <div className="flex items-center justify-between">
            <div className="font-medium">Dev: Role override</div>
            <button className="text-zinc-500 hover:text-zinc-800" onClick={() => setOpen(false)} title="Cerrar">
              ×
            </button>
          </div>

          <div className="space-y-2">
            <div className="text-zinc-500">Actual</div>
            <div className="text-sm">{currentInfo}</div>

            <div className="text-zinc-500 mt-2">Cambiar rol (override local)</div>
            <div className="flex flex-wrap gap-1">
              {roleOptions.map((r) => (
                <button
                  key={r}
                  onClick={() => setOverride(r)}
                  disabled={!user}
                  className={`border rounded px-2 py-0.5 hover:bg-zinc-50 ${role === r ? "bg-zinc-100" : ""} ${
                    !user ? "opacity-60 cursor-not-allowed" : ""
                  }`}
                >
                  {r}
                </button>
              ))}
              <button
                onClick={() => setOverride(null)}
                className="border rounded px-2 py-0.5 hover:bg-zinc-50 ml-2"
                title="Quitar override"
              >
                Limpiar
              </button>
            </div>

            <div className="text-[10px] text-zinc-500">
              * Esto no modifica el token ni la sesión en el servidor; sólo afecta el guard del cliente.
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
