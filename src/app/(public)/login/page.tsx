"use client";
import { useState } from "react";
import { useLoginMutation } from "@/redux/services/authApi";
import {
  setAuthToken,
  setTenantId,
  setAuthUser,
} from "@/redux/services/baseApi";
import type { AuthUser } from "@/types/auth";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [login, { isLoading, error }] = useLoginMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Backend: { access_token, role, tenantId, user }
      const res = await login({ email, password }).unwrap();

      // Guardar credenciales
      setAuthToken(res.access_token);
      setTenantId(res.tenantId ?? null);

      // Guardamos role dentro de user
      const user: AuthUser | null = res.user
        ? { ...res.user, role: (res.role as AuthUser["role"]) }
        : null;
      setAuthUser(user);

      // Redirección por rol
      const role = user?.role;
      if (role === "SUPER_ADMIN")      window.location.href = "/admin";
      else                             window.location.href = "/dashboard";
    } catch {
      alert("Login incorrecto");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-sm p-6 bg-white shadow rounded-lg space-y-4">
      <h1 className="text-xl font-bold">Iniciar sesión</h1>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        className="w-full border rounded px-3 py-2"
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Contraseña"
        className="w-full border rounded px-3 py-2"
      />
      <button type="submit" disabled={isLoading} className="w-full bg-[#144336] text-white py-2 rounded">
        {isLoading ? "Ingresando…" : "Ingresar"}
      </button>
      {error && <p className="text-red-600 text-sm">Error al iniciar sesión</p>}
    </form>
  );
}
