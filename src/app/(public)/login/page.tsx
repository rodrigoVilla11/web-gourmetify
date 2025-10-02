// src/app/(public)/login/page.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useLoginMutation } from "@/redux/services/authApi";
import { useSelector } from "react-redux";
import { selectSession } from "@/redux/slices/authSlices";
import { useRouter, useSearchParams } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const search = useSearchParams();
  const session = useSelector(selectSession);
  const hasRedirected = useRef(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [login, { isLoading }] = useLoginMutation();

  // destino de redirección: ?next=/algo (sólo rutas internas)
  const nextParam = search?.get("next") || "";
  const safeNext = useMemo(() => {
    if (!nextParam) return null;
    try {
      // Evitamos URLs absolutas externas
      const u = new URL(nextParam, "http://dummy.base");
      return u.pathname.startsWith("/") ? u.pathname + u.search + u.hash : null;
    } catch {
      return null;
    }
  }, [nextParam]);

  // Redirección tras login según role o ?next
  useEffect(() => {
    if (hasRedirected.current) return;
    if (!session.token) return;

    const target = safeNext
      ? safeNext
      : (session.role ?? session.user?.role) === "SUPER_ADMIN"
      ? "/admin"
      : "/dashboard";

    hasRedirected.current = true;
    router.replace(target);
  }, [router, session.token, session.role, session.user?.role, safeNext]);

  // Validación mínima
  const canSubmit = email.trim().length > 3 && password.length >= 1 && !isLoading;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setErrorMessage(null);
    try {
      await login({ email: email.trim().toLowerCase(), password }).unwrap();
      // redirige el useEffect
    } catch (err: any) {
      const msg =
        err?.data?.message ??
        (typeof err?.error === "string" ? err.error : null) ??
        "Error al iniciar sesión";
      setErrorMessage(msg);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto max-w-sm p-6 bg-white shadow rounded-lg space-y-4"
    >
      <h1 className="text-xl font-bold">Iniciar sesión</h1>

      <div className="space-y-2">
        <label className="block text-sm font-medium">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="tu@correo.com"
          autoComplete="username"
          className="w-full border rounded px-3 py-2 outline-none focus:ring focus:ring-emerald-200"
          required
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium">Contraseña</label>
        <div className="relative">
          <input
            type={showPass ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete="current-password"
            className="w-full border rounded px-3 py-2 pr-10 outline-none focus:ring focus:ring-emerald-200"
            required
          />
          <button
            type="button"
            onClick={() => setShowPass((v) => !v)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-gray-500 hover:text-gray-700"
            aria-label={showPass ? "Ocultar contraseña" : "Mostrar contraseña"}
          >
            {showPass ? "Ocultar" : "Mostrar"}
          </button>
        </div>
      </div>

      <button
        type="submit"
        disabled={!canSubmit}
        className={`w-full py-2 rounded text-white ${
          canSubmit ? "bg-[#144336] hover:opacity-95" : "bg-[#144336]/50"
        }`}
      >
        {isLoading ? "Ingresando…" : "Ingresar"}
      </button>

      {errorMessage && (
        <p className="text-red-600 text-sm" role="alert">
          {errorMessage}
        </p>
      )}

      {safeNext && (
        <p className="text-xs text-gray-500">
          Te enviaremos a <span className="font-mono">{safeNext}</span> después de iniciar sesión.
        </p>
      )}
    </form>
  );
}
