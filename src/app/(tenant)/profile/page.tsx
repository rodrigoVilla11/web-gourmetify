"use client";

import { useEffect, useMemo, useState } from "react";
import { Shield, ShieldCheck, Loader2, Eye, EyeOff, Copy, Check } from "lucide-react";
import { useChangePasswordMutation } from "@/redux/services/authApi";

type CachedAuthUser = {
  id: string;
  name: string;
  email: string;
  role?: string;
};

function safeParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try { return JSON.parse(raw) as T; } catch { return null; }
}

/** Lee authUser de localStorage y se mantiene en sync si cambia en otro tab */
function useAuthUser() {
  const [cached, setCached] = useState<CachedAuthUser | null>(null);

  useEffect(() => {
    const read = () => {
      const obj = safeParse<CachedAuthUser>(localStorage.getItem("authUser"));
      setCached(obj);
    };
    read();
    const onStorage = (e: StorageEvent) => {
      if (e.key === "authUser") read();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  return cached;
}

export default function TenantProfilePage() {
  const [changePassword, { isLoading: saving }] = useChangePasswordMutation();
  const cachedUser = useAuthUser();

  // guard de montaje para evitar mismatch SSR/CSR
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const user = cachedUser as { id?: string; name?: string; email?: string } | undefined;
  const role = cachedUser?.role as string | undefined;

  // password form
  const [currentPassword, setCurrent] = useState("");
  const [newPassword, setNew] = useState("");
  const [confirm, setConfirm] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [showPwd, setShowPwd] = useState(false);
  const [copied, setCopied] = useState(false);

  const strength = useMemo(() => passwordStrength(newPassword), [newPassword]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    setErr(null);

    if (newPassword.length < 8) {
      setErr("La nueva contraseña debe tener al menos 8 caracteres");
      return;
    }
    if (newPassword !== confirm) {
      setErr("Las contraseñas no coinciden");
      return;
    }
    try {
      await changePassword({ currentPassword, newPassword }).unwrap();
      setMsg("¡Contraseña actualizada!");
      setCurrent("");
      setNew("");
      setConfirm("");
    } catch {
      setErr("No se pudo actualizar la contraseña. Verificá la actual.");
    }
  };

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(user?.email ?? "");
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {}
  };

  if (!mounted) return null; // evita parpadeos antes de que exista localStorage

  return (
    <div className="space-y-8">
      {/* Header */}
      <header className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-black tracking-tight text-[#144336]">Mi perfil</h1>
          <p className="text-sm text-zinc-600">Datos de tu cuenta y seguridad</p>
        </div>
      </header>

      {/* Info card */}
      <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        {!cachedUser ? (
          <ProfileSkeleton />
        ) : (
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <Avatar name={user?.name} size="lg" />
              <div>
                <p className="text-lg font-semibold text-[#144336]">{user?.name}</p>
                <p className="text-xs text-zinc-500">Rol: {role}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={copyEmail}
                className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-700 shadow-sm transition hover:border-[#144336] hover:text-[#144336]"
                aria-label="Copiar email"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />} {user?.email}
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Security */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm lg:col-span-3">
          <h2 className="mb-3 text-base font-semibold text-[#144336]">Cambiar contraseña</h2>

          {msg && <Alert tone="success" text={msg} />}
          {err && <Alert tone="error" text={err} />}

          <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
            <LabeledInput
              label="Contraseña actual"
              type={showPwd ? "text" : "password"}
              value={currentPassword}
              onChange={setCurrent}
              placeholder="••••••••"
              rightIcon={showPwd ? EyeOff : Eye}
              onRightIconClick={() => setShowPwd(v => !v)}
            />
            <LabeledInput
              label="Nueva contraseña"
              type={showPwd ? "text" : "password"}
              value={newPassword}
              onChange={setNew}
              placeholder="Mínimo 8 caracteres"
            />
            <div className="sm:col-span-2">
              <StrengthMeter score={strength.score} hints={strength.hints} />
            </div>
            <LabeledInput
              label="Confirmar nueva"
              type={showPwd ? "text" : "password"}
              value={confirm}
              onChange={setConfirm}
              placeholder="Repetí la contraseña"
            />
            <div className="sm:col-span-2 mt-1">
              <button
                className="inline-flex items-center gap-2 rounded-xl bg-[#144336] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:opacity-95 disabled:opacity-60"
                disabled={saving}
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Shield className="h-4 w-4" />}
                {saving ? "Guardando…" : "Actualizar contraseña"}
              </button>
              <p className="mt-2 text-xs text-zinc-500">
                Recomendación: mínimo 8 caracteres, combiná mayúsculas, minúsculas y números.
              </p>
            </div>
          </form>
        </div>

        {/* Security extras */}
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <h3 className="mb-2 text-sm font-semibold text-[#144336]">Estado de seguridad</h3>
            <div className="flex items-center gap-2 text-sm text-emerald-700">
              <ShieldCheck className="h-4 w-4" />
              Tu cuenta está protegida.
            </div>
            <ul className="mt-3 space-y-1 text-xs text-zinc-600">
              <li>• Email verificado: {user?.email ? "sí" : "no"}</li>
              <li>• Último cambio de contraseña: —</li>
            </ul>
          </div>

          <div className="rounded-2xl border border-dashed border-zinc-200 bg-white p-5 shadow-sm">
            <h3 className="mb-2 text-sm font-semibold text-[#144336]">Autenticación en dos pasos (próximamente)</h3>
            <p className="text-xs text-zinc-600">Activá 2FA con app autenticadora para mayor seguridad.</p>
          </div>
        </div>
      </section>
    </div>
  );
}

/* ================================ */
/* UI building blocks */
/* ================================ */

function Avatar({ name, size = "md" }: { name?: string; size?: "md" | "lg" }) {
  const initials = (name ?? "?").split(" ").map(s => s[0]).slice(0, 2).join("").toUpperCase();
  const cls = size === "lg" ? "h-12 w-12 text-base" : "h-8 w-8 text-xs";
  return (
    <div className={`flex items-center justify-center rounded-full bg-[#144336]/10 ${cls} font-semibold text-[#144336]`}>
      {initials}
    </div>
  );
}

function LabeledInput({
  label, value, onChange, type = "text", placeholder, rightIcon: RightIcon, onRightIconClick,
}: {
  label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string; rightIcon?: any; onRightIconClick?: () => void;
}) {
  const id = useMemo(() => `in_${Math.random().toString(36).slice(2, 8)}`, []);
  return (
    <label htmlFor={id} className="space-y-1">
      <span className="block text-xs font-medium text-zinc-600">{label}</span>
      <div className="relative">
        <input
          id={id}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 pr-9 text-sm text-zinc-800 shadow-sm outline-none ring-0 placeholder:text-zinc-400 focus:border-[#144336]"
        />
        {RightIcon && (
          <button
            type="button"
            onClick={onRightIconClick}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-zinc-500 hover:text-[#144336]"
            aria-label="toggle-visibility"
          >
            <RightIcon className="h-4 w-4" />
          </button>
        )}
      </div>
    </label>
  );
}

function Alert({ tone, text }: { tone: "success" | "error"; text: string }) {
  const map = {
    success: "border-green-200 bg-green-50 text-green-700",
    error: "border-rose-200 bg-rose-50 text-rose-700",
  } as const;
  return <div className={`mb-3 rounded border px-3 py-2 text-sm ${map[tone]}`}>{text}</div>;
}

function StrengthMeter({ score, hints }: { score: number; hints: string[] }) {
  const labels = ["Muy débil", "Débil", "Aceptable", "Buena", "Fuerte"];
  return (
    <div className="space-y-1">
      <div className="flex h-1.5 overflow-hidden rounded bg-zinc-200">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className={`flex-1 ${i < score ? "bg-emerald-500" : "bg-transparent"}`} />
        ))}
      </div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-zinc-600">Fuerza: {labels[Math.max(0, Math.min(4, score - 1))]}</span>
        {hints.length > 0 && <span className="text-zinc-500">Sugerencia: {hints[0]}</span>}
      </div>
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="flex items-center gap-3">
      <div className="h-12 w-12 animate-pulse rounded-full bg-zinc-200" />
      <div className="space-y-2">
        <div className="h-4 w-40 animate-pulse rounded bg-zinc-200" />
        <div className="h-3 w-60 animate-pulse rounded bg-zinc-200" />
      </div>
    </div>
  );
}

// naive strength heuristic
function passwordStrength(pwd: string) {
  let score = 0;
  const hints: string[] = [];
  if (pwd.length >= 8) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[a-z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;

  if (pwd.length < 12) hints.push("Usá 12+ caracteres");
  if (!/[A-Z]/.test(pwd)) hints.push("Agregá una mayúscula");
  if (!/[0-9]/.test(pwd)) hints.push("Incluí números");
  if (!/[^A-Za-z0-9]/.test(pwd)) hints.push("Sumá un símbolo");

  return { score: Math.min(5, score), hints };
}
