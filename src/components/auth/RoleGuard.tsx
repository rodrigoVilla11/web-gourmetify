// src/components/auth/RoleGuard.tsx
"use client";
import { ReactNode, useMemo } from "react";
import { useSelector } from "react-redux";
import {
  selectSession,
  selectAuthLoading,
  selectEffectiveRole,
} from "@/redux/slices/authSlices";
import type { UserRole } from "@/types/auth";

export default function RoleGuard({
  allow,
  children,
}: {
  allow: UserRole[];
  children: ReactNode;
}) {
  const session = useSelector(selectSession);
  const loading = useSelector(selectAuthLoading);
  const effectiveRole = useSelector(selectEffectiveRole); // 👈 usa override si existe

  const token = session.token;
  const user = session.user;

  const bootstrapping = Boolean(token && !user);
  const ok = useMemo(
    () => !!effectiveRole && allow.includes(effectiveRole),
    [effectiveRole, allow]
  );

  if (loading || bootstrapping)
    return <div className="p-6 text-gray-500">Cargando sesión…</div>;
  if (!token)
    return <div className="p-6 text-red-600">Necesitás iniciar sesión.</div>;
  if (!ok)
    return (
      <div className="p-6 text-orange-600">
        No tenés permisos para ver esta sección.
      </div>
    );
  return <>{children}</>;
}
