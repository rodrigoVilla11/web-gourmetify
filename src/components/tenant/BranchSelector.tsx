// src/components/tenant/BranchSelector.tsx
"use client";

import { skipToken } from "@reduxjs/toolkit/query";
import { useEffect, useMemo } from "react";
import { useDispatch } from "react-redux";
import { baseApi, setBranchId } from "@/redux/services/baseApi";
import { useGetBranchesQuery } from "@/redux/services/branchesApi";
import { setSession } from "@/redux/slices/authSlices";

type BranchIdUI = string | null | "ALL";

type Props = {
  tenantId: string | null;
  currentBranchId: BranchIdUI;      // Puede ser "ALL" (todas), null o un id
  assignedBranchId: string | null;  // Sucursal fija del usuario (si no puede cambiar)
  canSwitch: boolean;               // Solo true para SUPER_ADMIN/ADMIN (viene del layout)
  onChanged?: (branchId: BranchIdUI) => void;
  hideWhenLocked?: boolean;         // Si no puede cambiar, ocultar el selector
};

export default function BranchSelector({
  tenantId,
  currentBranchId,
  assignedBranchId,
  canSwitch,
  onChanged,
  hideWhenLocked,
}: Props) {
  const dispatch = useDispatch();

  // Trae sucursales del tenant
  const { data: branches, isFetching } = useGetBranchesQuery(
    tenantId ? { tenantId } : skipToken
  );

  // Orden alfabético para UI
  const options = useMemo(
    () =>
      (branches ?? [])
        .slice()
        .sort((a, b) => (a.name ?? "").localeCompare(b.name ?? "")),
    [branches]
  );

  // Forzar sucursal asignada si el usuario NO puede cambiar
  useEffect(() => {
    if (!tenantId) return;
    if (!canSwitch && assignedBranchId && currentBranchId !== assignedBranchId) {
      persistBranch(assignedBranchId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId, canSwitch, assignedBranchId, currentBranchId]);

  // Si puede cambiar y hay una sola sucursal, seleccionar automáticamente
  useEffect(() => {
    if (!tenantId || isFetching || !canSwitch) return;
    const isAll = currentBranchId === "ALL" || currentBranchId == null;
    if (isAll && options.length === 1) {
      persistBranch(options[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId, isFetching, canSwitch, currentBranchId, options.length]);

  // Persistencia del cambio (storage + redux + reset RTKQ + callback)
  const persistBranch = (branchId: string | null) => {
    // En modo "puede cambiar", UI vacío ("") => "ALL"
    const toStore: BranchIdUI = canSwitch && !branchId ? "ALL" : branchId;

    // 1) Storage (para header x-branch-id en baseApi)
    setBranchId(toStore as any);

    // 2) Redux (auth.branchId)
    dispatch(setSession({ branchId: toStore as any }));

    // 3) Limpiar caché RTK Query para refetchear con el nuevo header
    dispatch(baseApi.util.resetApiState());

    // 4) Notificar al layout para refrescar la ruta si hace falta
    onChanged?.(toStore);
  };

  // Mapear sentinela a valor de <select>
  // "ALL" o null => "" (primera opción)
  // id => id
  const uiValue =
    currentBranchId === "ALL" || currentBranchId == null ? "" : currentBranchId;

  if (hideWhenLocked && !canSwitch) return null;

  return (
    <select
      className="w-full rounded px-2 py-1 text-sm text-[#144336] bg-white/95"
      disabled={isFetching || !canSwitch}
      title={!canSwitch ? "No tenés permisos para cambiar de sucursal" : undefined}
      value={uiValue}
      onChange={(e) => persistBranch(e.target.value || null)}
    >
      <option value="">
        {isFetching
          ? "Cargando…"
          : canSwitch
          ? "Todas las sucursales"
          : "Sucursal asignada"}
      </option>

      {options.map((b) => (
        <option key={b.id} value={b.id}>
          {b.name ?? b.id}
        </option>
      ))}
    </select>
  );
}
