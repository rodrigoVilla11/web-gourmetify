// src/components/tenant/BranchSelector.tsx
"use client";

import { skipToken } from "@reduxjs/toolkit/query";
import { useEffect, useMemo } from "react";
import { useDispatch } from "react-redux";
import { baseApi, setBranchId } from "@/redux/services/baseApi";
import { useGetBranchesQuery } from "@/redux/services/branchesApi";
import { setSession } from "@/redux/slices/authSlices";

type Props = {
  tenantId: string | null;
  currentBranchId: string | null;
  assignedBranchId: string | null; // 👈 branch del usuario (de su perfil)
  canSwitch: boolean; // 👈 permitir cambios de sucursal
  onChanged?: (branchId: string | null) => void;
  hideWhenLocked?: boolean; // opcional: ocultar selector si no puede cambiar
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

  const { data: branches, isFetching } = useGetBranchesQuery(
    tenantId ? { tenantId } : skipToken
  );

  const options = useMemo(
    () =>
      (branches ?? [])
        .slice()
        .sort((a, b) => (a.name ?? "").localeCompare(b.name ?? "")),
    [branches]
  );

  // 🔒 Si NO es admin, forzamos el branch al asignado
  useEffect(() => {
    if (!tenantId) return;
    if (!canSwitch && assignedBranchId && currentBranchId !== assignedBranchId) {
      persistBranch(assignedBranchId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId, canSwitch, assignedBranchId, currentBranchId]);

  // Auto-selección solo si PUEDE cambiar y no hay branch seleccionado
  useEffect(() => {
    if (!tenantId || isFetching || !canSwitch) return;
    if (!currentBranchId && options.length === 1) {
      persistBranch(options[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId, isFetching, canSwitch, currentBranchId, options.length]);

  const persistBranch = (branchId: string | null) => {
    setBranchId(branchId);
    dispatch(setSession({ branchId }));
    dispatch(baseApi.util.resetApiState());
    onChanged?.(branchId);
  };

  // UI: si está bloqueado y querés ocultarlo
  if (hideWhenLocked && !canSwitch) return null;

  return (
    <select
      className="w-full rounded px-2 py-1 text-sm text-[#144336] bg-white/95"
      disabled={isFetching || !canSwitch}
      title={
        !canSwitch ? "No tenés permisos para cambiar de sucursal" : undefined
      }
      value={currentBranchId ?? ""}
      onChange={(e) => persistBranch(e.target.value || null)}
    >
      {/* opción vacía → "Todas" si es admin, "Sucursal asignada" si no */}
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
