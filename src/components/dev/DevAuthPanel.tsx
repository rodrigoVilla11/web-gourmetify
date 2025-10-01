// src/components/dev/DevAuthPanel.tsx
"use client";

import { useDispatch, useSelector } from "react-redux";
import { MockUser, setUser } from "@/redux/slices/authSlices";
import type { RootState } from "@/store";
import { useState } from "react";

export default function DevAuthPanel() {
  const user = useSelector((s: RootState) => s.auth.user);
  const dispatch = useDispatch();
  const [open, setOpen] = useState(false);

  const setRole = (role: "ADMIN" | "MANAGER" | "CASHIER" | "STAFF") => {
    if (!user) return;
    const next = { ...user, role };
    dispatch(setUser(next));
    localStorage.setItem("mock_user", JSON.stringify(next));
  };

  const clear = () => {
    dispatch(setUser(null));
    localStorage.removeItem("mock_user");
  };

  // UI minimal, flotante
  return (
    <div style={{ position: "fixed", bottom: 12, right: 12, zIndex: 50 }}>
      {open && (
        <div className="border rounded-lg bg-white shadow p-3 text-xs space-y-2">
          <div className="font-medium">DevAuth</div>
          <div>user: {user ? `${user.name} (${user.role})` : "—"}</div>
          <div className="flex gap-1 flex-wrap">
            {["ADMIN", "MANAGER", "CASHIER", "STAFF"].map((r) => (
              <button
                key={r}
                onClick={() => setRole(r as any)}
                className="border rounded px-2 py-0.5 hover:bg-zinc-50"
              >
                {r}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={clear} className="underline">
              Logout (mock)
            </button>
            <button
              onClick={() => {
                const mock = {
                  id: "u-dev",
                  name: "Dev Admin",
                  email: "admin@gourmetify.dev",
                  role: "ADMIN",
                  tenantId: "8944766a-199e-4cc2-9f13-7214d103e78a",
                  branchId: "cdc2943d-1183-434f-8357-e0f59b40ef3b",
                } as const satisfies MockUser;
                dispatch(setUser(mock));
                localStorage.setItem("mock_user", JSON.stringify(mock));
              }}
              className="underline"
            >
              Login (ADMIN)
            </button>
          </div>
        </div>
      )}
      <button
        onClick={() => setOpen((v) => !v)}
        className="border rounded-full px-3 py-1 bg-white shadow text-xs"
        title="DevAuth"
      >
        {open ? "×" : "Auth"}
      </button>
    </div>
  );
}
