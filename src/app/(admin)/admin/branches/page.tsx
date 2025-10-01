"use client";

import { useState, useMemo } from "react";
import {
  useUpdateBranchMutation,
  useDeleteBranchMutation,
  useGetBranchesAdminQuery,
  useCreateBranchAdminMutation,
} from "@/redux/services/branchesApi";
import { useListTenantsQuery } from "@/redux/services/tenantsApi";

export default function BranchesPage() {
  // ===== tenants
  const { data: tenants } = useListTenantsQuery();
  const [tenantId, setTenantId] = useState<string>("");

  const { data, isLoading, isFetching, error, refetch } =
    useGetBranchesAdminQuery(
      { tenantId },
      { skip: !tenantId } // 👈 no dispara si no hay tenant
    );

  const [createBranch, { isLoading: creating }] = useCreateBranchAdminMutation();
  const [updateBranch] = useUpdateBranchMutation();
  const [deleteBranch] = useDeleteBranchMutation();

  // ===== alta
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");

  const canCreate = name.trim().length > 0 && tenantId;

  const branches = useMemo(() => {
    if (!tenantId) return [];
    return (data ?? [])
      .slice()
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [data, tenantId]);

  // ===== acciones
  const add = async () => {
    if (!canCreate) return;
    try {
      await createBranch({
        tenantId,
        data: {
          name: name.trim(),
          address: address.trim() || undefined,
          phone: phone.trim() || undefined,
        },
      }).unwrap();
      setName("");
      setAddress("");
      setPhone("");
    } catch {
      alert("No se pudo crear la sucursal.");
    }
  };

  const editPhoneQuick = async (id: string, current?: string | null) => {
    const next = prompt("Nuevo teléfono:", current ?? "") ?? "";
    if (next.trim() === (current ?? "")) return;
    await updateBranch({ id, data: { phone: next.trim() || undefined } });
  };

  const remove = async (id: string, name: string) => {
    if (!confirm(`¿Eliminar la sucursal "${name}"?`)) return;
    await deleteBranch(id);
  };

  // ===== UI
  return (
    <main className="mx-auto max-w-6xl p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-[#144336]">Sucursales</h1>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="border rounded-lg px-3 py-1 text-sm"
        >
          {isFetching ? "Actualizando…" : "Refrescar"}
        </button>
      </div>

      {/* Filtro Tenant */}
      <section className="rounded-xl border bg-white p-3 shadow-sm">
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
          <section className="rounded-xl border bg-white p-3 shadow-sm grid sm:grid-cols-4 gap-3 items-end">
            <input
              className="border rounded-lg px-3 py-2"
              placeholder="Nombre"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <input
              className="border rounded-lg px-3 py-2"
              placeholder="Dirección"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
            <input
              className="border rounded-lg px-3 py-2"
              placeholder="Teléfono"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            <button
              onClick={add}
              disabled={!canCreate || creating}
              className="bg-[#144336] text-white rounded-lg px-4 py-2"
            >
              {creating ? "Creando…" : "Crear"}
            </button>
          </section>

          {/* Lista */}
          {error ? (
            <div className="text-sm text-red-600">
              Error cargando sucursales.
            </div>
          ) : isLoading ? (
            <div>Cargando…</div>
          ) : branches.length === 0 ? (
            <div className="text-sm text-zinc-500">No hay sucursales.</div>
          ) : (
            <ul className="space-y-2">
              {branches.map((b) => (
                <li
                  key={b.id}
                  className="border rounded-lg bg-white shadow-sm p-3 flex items-center justify-between"
                >
                  <div>
                    <div className="font-medium">{b.name}</div>
                    <div className="text-xs text-zinc-500">
                      {b.address || "—"} · {b.phone || "—"}
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button
                      className="text-xs underline text-[#144336]"
                      onClick={() => editPhoneQuick(b.id, b.phone)}
                    >
                      Editar
                    </button>
                    <button
                      className="text-xs underline text-red-600"
                      onClick={() => remove(b.id, b.name)}
                    >
                      Eliminar
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </main>
  );
}
