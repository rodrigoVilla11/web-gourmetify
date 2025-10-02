"use client";
import { useEffect, useState } from "react";
import { useLoginMutation } from "@/redux/services/authApi";
import { useSelector } from "react-redux";
import { selectSession } from "@/redux/slices/authSlices";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const session = useSelector(selectSession);
  const sessionUserRole = session.user?.role;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [login, { isLoading }] = useLoginMutation();

  useEffect(() => {
    if (!session.token) return;
    const role = session.role ?? sessionUserRole;
    if (role === "SUPER_ADMIN") {
      router.replace("/admin");
    } else {
      router.replace("/dashboard");
    }
  }, [router, session.token, session.role, sessionUserRole]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    try {
      await login({ email, password }).unwrap();
    } catch {
      setErrorMessage("Error al iniciar sesión");
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto max-w-sm p-6 bg-white shadow rounded-lg space-y-4"
    >
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
      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-[#144336] text-white py-2 rounded"
      >
        {isLoading ? "Ingresando…" : "Ingresar"}
      </button>
      {errorMessage && <p className="text-red-600 text-sm">{errorMessage}</p>}
    </form>
  );
}
