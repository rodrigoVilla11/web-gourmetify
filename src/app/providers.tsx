// src/app/providers.tsx
"use client";

import { Provider, useDispatch, useSelector } from "react-redux";
import { skipToken } from "@reduxjs/toolkit/query";
import { store } from "@/store";
import { useEffect } from "react";
import {
  getAuthUser,
  getTenantId,
  getUserRole,
  getAuthToken,
  getBranchId,
} from "@/redux/services/baseApi";
import { hydrateSession, selectAuthToken } from "@/redux/slices/authSlices";
import { useMeQuery } from "@/redux/services/authApi";
import DevRoleSwitcher from "@/components/dev/DevAuthPanel";

function BootstrapAuth() {
  const dispatch = useDispatch();

  const token = useSelector(selectAuthToken);

  useMeQuery(token ? undefined : skipToken);

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
