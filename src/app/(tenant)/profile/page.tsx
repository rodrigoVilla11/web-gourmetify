// src/app/(tenant)/profile/page.tsx
"use client";

import { useState } from "react";
import { useMeQuery, useChangePasswordMutation } from "@/redux/services/authApi";

export default function TenantProfilePage() {
  const { data, isLoading } = useMeQuery();
  const [changePassword, { isLoading: saving }] = useChangePasswordMutation();

  const [currentPassword, setCurrent] = useState("");
  const [newPassword, setNew] = useState("");
  const [confirm, setConfirm] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null); setErr(null);

    if (newPassword.length < 8) {
      setErr("La nueva contraseña debe tener al menos 8 caracteres");
      return;
    }
    if (newPassword !== confirm) {
      setErr("Las contraseñas no coinciden");
      return;
    }
    try {
      await changePassword({ currentPassword, newPassword }).unwrap();
      setMsg("¡Contraseña actualizada!");
      setCurrent(""); setNew(""); setConfirm("");
    } catch (e: any) {
      setErr("No se pudo actualizar la contraseña. Verificá la actual.");
    }
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-extrabold text-[#144336]">Mi perfil</h1>
        <p className="text-sm text-zinc-600">Datos de tu cuenta y seguridad</p>
      </header>

      {isLoading ? (
        <div>Cargando…</div>
      ) : (
        <section className="rounded-xl border bg-white p-4 shadow-sm space-y-3">
          <div className="font-semibold">{data?.user?.name}</div>
          <div className="text-sm text-zinc-600">{data?.user?.email}</div>
          <div className="text-xs text-zinc-500">Rol: {data?.role}</div>
          <div className="text-xs text-zinc-500">Tenant: {data?.tenantId}</div>
        </section>
      )}

      {/* Cambio de contraseña */}
      <section className="rounded-xl border bg-white p-4 shadow-sm">
        <h2 className="font-semibold text-[#144336] mb-3">Cambiar contraseña</h2>

        {msg && <div className="mb-3 rounded border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">{msg}</div>}
        {err && <div className="mb-3 rounded border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{err}</div>}

        <form onSubmit={submit} className="grid gap-3 sm:grid-cols-3">
          <input
            className="border rounded-lg px-3 py-2"
            placeholder="Contraseña actual"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrent(e.target.value)}
          />
          <input
            className="border rounded-lg px-3 py-2"
            placeholder="Nueva contraseña"
            type="password"
            value={newPassword}
            onChange={(e) => setNew(e.target.value)}
          />
          <input
            className="border rounded-lg px-3 py-2"
            placeholder="Confirmar nueva"
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
          <div className="sm:col-span-3">
            <button
              className="bg-[#144336] text-white rounded-lg px-4 py-2"
              disabled={saving}
            >
              {saving ? "Guardando…" : "Actualizar contraseña"}
            </button>
          </div>
        </form>
        <p className="mt-2 text-xs text-zinc-500">
          Recomendación: mínimo 8 caracteres, combiná mayúsculas, minúsculas y números.
        </p>
      </section>
    </div>
  );
}
