"use client";
import { ReactNode, useMemo } from "react";
import { useSelector } from "react-redux";
import { selectSession } from "@/redux/slices/authSlices";

type Props = { allow: string[]; children: ReactNode };

export default function RoleGuard({ allow, children }: Props) {
  const session = useSelector(selectSession);
  const user = session.user;
  const role = session.role ?? user?.role ?? null;

  const ok = useMemo(() => !!role && allow.includes(role), [role, allow]);
  if (!user) {
    return <div className="p-6">Necesitás iniciar sesión.</div>;
  }
  if (!ok) {
    return <div className="p-6">No tenés permisos para ver esta sección.</div>;
  }
  return <>{children}</>;
}
