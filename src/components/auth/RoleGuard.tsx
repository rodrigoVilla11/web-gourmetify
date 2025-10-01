"use client";
import { ReactNode, useMemo } from "react";
import { useSelector } from "react-redux";

type Props = { allow: string[]; children: ReactNode };

export default function RoleGuard({ allow, children }: Props) {
  // Ajustá este selector a tu estado real de auth/session
  const currentUser = useSelector((s: any) => s.auth?.user) as { id?: string; role?: string } | null;
  const ok = useMemo(() => !!currentUser?.role && allow.includes(currentUser.role), [currentUser, allow]);

  if (!currentUser) {
    return <div className="p-6">Necesitás iniciar sesión.</div>;
  }
  if (!ok) {
    return <div className="p-6">No tenés permisos para ver esta sección.</div>;
  }
  return <>{children}</>;
}
