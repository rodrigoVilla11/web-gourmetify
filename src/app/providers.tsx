// src/app/providers.tsx
"use client";

import { Provider, useDispatch } from "react-redux";
import { store } from "@/store";
import { useEffect } from "react";
import { setUser } from "@/redux/slices/authSlices";
import DevAuthPanel from "@/components/dev/DevAuthPanel";

function BootstrapAuth() {
  const dispatch = useDispatch();

  useEffect(() => {
    // Intentar leer de localStorage
    const saved = typeof window !== "undefined" ? localStorage.getItem("mock_user") : null;
    if (saved) {
      dispatch(setUser(JSON.parse(saved)));
      return;
    }
    // Usuario por defecto (ADMIN)
    const mock = {
      id: "u-dev",
      name: "Dev Admin",
      email: "admin@gourmetify.dev",
      role: "ADMIN",
      tenantId: "8944766a-199e-4cc2-9f13-7214d103e78a",
      branchId: "cdc2943d-1183-434f-8357-e0f59b40ef3b",
    } as const;
    dispatch(setUser(mock));
    localStorage.setItem("mock_user", JSON.stringify(mock));
  }, [dispatch]);

  return null;
}

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <BootstrapAuth />
      {/* Panel para cambiar de rol rápido (opcional) */}
      <DevAuthPanel />
      {children}
    </Provider>
  );
}
