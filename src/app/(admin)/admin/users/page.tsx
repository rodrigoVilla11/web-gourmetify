"use client";

import { useState } from "react";
import {
  useUpdateUserMutation,
  useDeleteUserMutation,
  useListUsersAdminQuery,
  useCreateUserAdminMutation,
} from "@/redux/services/usersApi";
import {
  useGetBranchesAdminQuery,
  useGetBranchesQuery,
} from "@/redux/services/branchesApi";
import { useListTenantsQuery } from "@/redux/services/tenantsApi";

export default function UsersPage() {
  // tenants
  const { data: tenants } = useListTenantsQuery();
  const [tenantId, setTenantId] = useState<string>("");

  // branches (para el select de branch) — filtrado por tenant
  const { data: branches } = useGetBranchesAdminQuery({
    tenantId,
  });

  // users
  const { data: users, isLoading } = useListUsersAdminQuery(
    tenantId ? { tenantId } : undefined
  );
  const [createUser, { isLoading: creating, error }] = useCreateUserAdminMutation();
  const [updateUser] = useUpdateUserMutation();
  const [deleteUser] = useDeleteUserMutation();

  // alta
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPwd] = useState("");
  const [role, setRole] = useState("MANAGER");
  const [branchId, setBranchId] = useState("");

  console.log(error)
  const canCreate = name.trim() && email.trim() && password && tenantId;

  const add = async () => {
    if (!canCreate) return;
    try {
      await createUser({
        tenantId,
        data: {
          name: name.trim(),
          email: email.trim(),
          password,
          role: role as any,
          branchId: branchId || null,
        },
      }).unwrap();
      setName("");
      setEmail("");
      setPwd("");
      setBranchId("");
    } catch {
      alert("No se pudo crear el usuario.");
    }
  };

  const toggleActive = async (u: any) => {
    await updateUser({
      id: u.id,
      tenantId,
      data: { isActive: !u.isActive },
    });
  };

  const remove = async (u: any) => {
    if (!confirm(`¿Eliminar al usuario "${u.name}"?`)) return;
    await deleteUser({ id: u.id, tenantId });
  };

  return (
    <main className="mx-auto max-w-6xl p-4 space-y-6">
      <h1 className="text-2xl font-extrabold text-[#144336]">Usuarios</h1>

      {/* Filtro Tenant */}
      <section className="rounded-xl border bg-white shadow-sm p-3">
        <label className="block text-sm text-zinc-600 mb-1">Tenant</label>
        <select
          value={tenantId}
          onChange={(e) => setTenantId(e.target.value)}
          className="w-full rounded-lg border px-3 py-2"
        >
          <option value="">— Seleccionar Tenant —</option>
          {tenants?.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </section>

      {tenantId && (
        <>
          {/* Alta */}
          <section className="rounded-xl border bg-white shadow-sm p-4 space-y-4">
            <h2 className="text-lg font-semibold text-[#144336]">
              Crear nuevo usuario
            </h2>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-sm text-zinc-600">Nombre</label>
                <input
                  className="input w-full"
                  placeholder="Ej: Juan Pérez"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={creating}
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm text-zinc-600">Email</label>
                <input
                  className="input w-full"
                  placeholder="ejemplo@mail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={creating}
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm text-zinc-600">Password</label>
                <input
                  type="password"
                  className="input w-full"
                  placeholder="********"
                  value={password}
                  onChange={(e) => setPwd(e.target.value)}
                  disabled={creating}
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm text-zinc-600">Rol</label>
                <select
                  className="input w-full"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  disabled={creating}
                >
                  <option>ADMIN</option>
                  <option>MANAGER</option>
                  <option>CASHIER</option>
                  <option>STAFF</option>
                </select>
              </div>

              <div className="space-y-1 sm:col-span-2">
                <label className="text-sm text-zinc-600">
                  Sucursal (opcional)
                </label>
                <select
                  className="input w-full"
                  value={branchId}
                  onChange={(e) => setBranchId(e.target.value)}
                  disabled={creating}
                >
                  <option value="">— Sin branch —</option>
                  {branches?.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                className="btn-primary"
                onClick={add}
                disabled={!canCreate || creating}
              >
                {creating ? "Creando…" : "Crear usuario"}
              </button>
            </div>
          </section>

          {/* Lista */}
          {isLoading ? (
            <div>Cargando…</div>
          ) : users?.length === 0 ? (
            <div className="text-sm text-zinc-500">No hay usuarios.</div>
          ) : (
            <div className="overflow-x-auto rounded-xl border bg-white shadow-sm">
              <table className="w-full text-sm">
                <thead className="bg-zinc-50 text-zinc-600 text-left">
                  <tr>
                    <th className="px-3 py-2">Nombre</th>
                    <th className="px-3 py-2">Email</th>
                    <th className="px-3 py-2">Rol</th>
                    <th className="px-3 py-2">Branch</th>
                    <th className="px-3 py-2">Estado</th>
                    <th className="px-3 py-2">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {users?.map((u) => (
                    <tr key={u.id} className="border-t">
                      <td className="px-3 py-2">{u.name}</td>
                      <td className="px-3 py-2">{u.email}</td>
                      <td className="px-3 py-2">{u.role}</td>
                      <td className="px-3 py-2">
                        {u.branchId
                          ? branches?.find((b) => b.id === u.branchId)?.name
                          : "—"}
                      </td>
                      <td className="px-3 py-2">
                        {u.isActive ? "Activo" : "Inactivo"}
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex gap-2">
                          <button
                            className="text-xs underline text-[#144336]"
                            onClick={() => toggleActive(u)}
                          >
                            Toggle activo
                          </button>
                          <button
                            className="text-xs underline text-rose-600"
                            onClick={() => remove(u)}
                          >
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </main>
  );
}
