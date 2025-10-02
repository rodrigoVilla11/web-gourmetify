// src/app/providers.tsx
"use client";

import { Provider } from "react-redux";
import { store } from "@/store";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import {
  getAuthUser,
  getTenantId,
  getUserRole,
  getAuthToken,
  getBranchId,
} from "@/redux/services/baseApi";
import { hydrateSession } from "@/redux/slices/authSlices";
import DevRoleSwitcher from "@/components/dev/DevAuthPanel";

function BootstrapAuth() {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(
      hydrateSession({
        token: getAuthToken(),
        tenantId: getTenantId(),
        branchId: getBranchId(),
        role: getUserRole(),
        user: getAuthUser(),
      })
    );
  }, [dispatch]);

  return null;
}

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <BootstrapAuth />
      <DevRoleSwitcher />
      {children}
    </Provider>
  );
}
