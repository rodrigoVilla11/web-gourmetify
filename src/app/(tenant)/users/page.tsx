// src/app/(tenant)/users/page.tsx
"use client";

import { useState } from "react";
import { useListUsersQuery, useCreateUserMutation } from "@/redux/services/usersApi";
import { getTenantId } from "@/redux/services/baseApi";

export default function TenantUsersPage() {
  const tenantId = getTenantId()!;
  const { data: users, isLoading } = useListUsersQuery({ tenantId });
  const [createUser, { isLoading: creating }] = useCreateUserMutation();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");

  const add = async () => {
    if (!name || !email || !pwd) return;
    await createUser({ tenantId, data: { name, email, password: pwd, role: "STAFF" } }).unwrap();
    setName(""); setEmail(""); setPwd("");
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold text-[#144336]">Usuarios</h1>

      <section className="rounded-xl border bg-white shadow-sm p-3 grid gap-3 sm:grid-cols-[1fr,1fr,1fr,auto]">
        <input className="border rounded-lg px-3 py-2" placeholder="Nombre" value={name} onChange={e=>setName(e.target.value)} />
        <input className="border rounded-lg px-3 py-2" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
        <input className="border rounded-lg px-3 py-2" placeholder="Contraseña" type="password" value={pwd} onChange={e=>setPwd(e.target.value)} />
        <button onClick={add} disabled={creating || !name || !email || !pwd} className="bg-[#144336] text-white rounded-lg px-4 py-2">
          {creating ? "Creando…" : "Crear"}
        </button>
      </section>

      {isLoading ? (
        <div>Cargando…</div>
      ) : (
        <ul className="space-y-2">
          {users?.map(u => (
            <li key={u.id} className="border rounded-lg bg-white shadow-sm p-3 flex items-center justify-between">
              <div>
                <div className="font-medium">{u.name}</div>
                <div className="text-xs text-zinc-500">{u.email} · {u.role}</div>
              </div>
              <span className={`text-xs ${u.isActive ? "text-green-600" : "text-red-600"}`}>
                {u.isActive ? "Activo" : "Inactivo"}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
