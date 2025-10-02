// src/app/providers.tsx
"use client";

import { Provider } from "react-redux";
import { store } from "@/store";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { getAuthUser, AUTH_EVENT } from "@/redux/services/baseApi";
import DevAuthPanel from "@/components/dev/DevAuthPanel";
import { clearUser, setUser } from "@/redux/slices/authSlices";

function BootstrapAuth() {
  const dispatch = useDispatch();

  const syncUser = () => {
    const u = getAuthUser();
    if (u) dispatch(setUser(u));
    else dispatch(clearUser());
  };

  useEffect(() => {
    // 1) Inicial
    syncUser();

    // 2) Cambios en otras pestañas
    const onStorage = (e: StorageEvent) => {
      if (e.key === "authUser" || e.key === "x-tenant-id" || e.key === "x-branch-id" || e.key === "token") {
        syncUser();
      }
    };
    window.addEventListener("storage", onStorage);

    // 3) Cambios en esta misma pestaña (evento custom)
    const onAuthChanged = () => syncUser();
    window.addEventListener(AUTH_EVENT, onAuthChanged);

    // 4) Re-sync al volver el foco/visibilidad
    const onFocus = () => syncUser();
    const onVisibility = () => { if (document.visibilityState === "visible") syncUser(); };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(AUTH_EVENT, onAuthChanged as EventListener);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [dispatch]);

  return null;
}

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <BootstrapAuth />
      {/* Si no lo necesitás, podés quitarlo */}
      <DevAuthPanel />
      {children}
    </Provider>
  );
}
