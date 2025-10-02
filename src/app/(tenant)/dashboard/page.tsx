// src/app/(tenant)/dashboard/page.tsx
"use client";

import Link from "next/link";
import { useListUsersQuery } from "@/redux/services/usersApi";
import { getTenantId } from "@/redux/services/baseApi";
import type { LucideIcon } from "lucide-react";
import {
  ArrowUpRight,
  Building2,
  FileBarChart2,
  Loader2,
  Settings2,
  UserCog,
  UserCircle,
  Users,
} from "lucide-react";

export default function TenantDashboardPage() {
  const tenantId = getTenantId()!;
  const { data: users, isLoading } = useListUsersQuery({ tenantId });
  const metrics: MetricCardProps[] = [
    {
      title: "Usuarios",
      value: users?.length ?? 0,
      hint: "Colaboradores activos",
      icon: Users,
      accent: "from-amber-400/80 via-amber-300 to-amber-500",
      isLoading,
    },
    {
      title: "Sucursales",
      hint: "Solo las crea un Admin",
      icon: Building2,
      accent: "from-sky-400/70 via-sky-300 to-sky-500",
      comingSoon: true,
    },
    {
      title: "Reportes",
      hint: "Llegarán en el siguiente release",
      icon: FileBarChart2,
      accent: "from-emerald-400/70 via-emerald-300 to-emerald-500",
      comingSoon: true,
    },
  ];

  const quickLinks: QuickLinkProps[] = [
    {
      href: "/users",
      title: "Gestionar usuarios",
      desc: "Alta, roles y estado",
      icon: UserCog,
    },
    {
      href: "/profile",
      title: "Mi perfil",
      desc: "Datos personales y contraseña",
      icon: UserCircle,
    },
    {
      href: "/settings",
      title: "Configuración",
      desc: "Preferencias del tenant",
      icon: Settings2,
    },
  ];
  return (
    <div className="space-y-10">
      {/* Header */}
      <header className="space-y-2">
        <h1 className="text-3xl font-black tracking-tight text-[#144336]">
          Dashboard
        </h1>
        <p className="text-sm text-zinc-600">
          Visualizá el pulso general de tu organización.
        </p>
      </header>

      {/* Métricas */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {metrics.map((metric) => (
          <MetricCard key={metric.title} {...metric} />
        ))}
      </section>

      {/* Accesos rápidos */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[#144336]">
            Accesos rápidos
          </h2>
          <span className="text-xs uppercase tracking-wide text-zinc-500">
            Ahorra tiempo en tus flujos diarios
          </span>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {quickLinks.map((link) => (
            <QuickLink key={link.href} {...link} />
          ))}
        </div>
      </section>
    </div>
  );
}

type MetricCardProps = {
  title: string;
  value?: number;
  hint?: string;
  icon: LucideIcon;
  accent: string;
  isLoading?: boolean;
  comingSoon?: boolean;
};

function MetricCard({
  title,
  value,
  hint,
  icon: Icon,
  accent,
  isLoading,
  comingSoon,
}: MetricCardProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:shadow-md">
      <div
        className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${accent}`}
        aria-hidden
      />
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-zinc-500">{title}</p>
          <div
            className="mt-2 flex items-center gap-3"
            aria-live={isLoading ? "polite" : undefined}
          >
            {isLoading ? (
              <span className="inline-flex items-center gap-2 text-sm font-medium text-zinc-500">
                <Loader2 aria-hidden className="h-4 w-4 animate-spin" />
                Cargando
              </span>
            ) : (
              <span className="text-3xl font-extrabold text-[#144336]">
                {typeof value === "number" ? value.toLocaleString() : "—"}
              </span>
            )}
            {comingSoon && (
              <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                Próximamente
              </span>
            )}
          </div>
        </div>
        <span
          className="rounded-full bg-[#144336]/10 p-2 text-[#144336]"
          aria-hidden
        >
          <Icon className="h-5 w-5" />
        </span>
      </div>
      {hint && <p className="mt-3 text-xs text-zinc-500">{hint}</p>}{" "}
    </div>
  );
}

type QuickLinkProps = {
  href: string;
  title: string;
  desc: string;
  icon: LucideIcon;
};

function QuickLink({ href, title, desc, icon: Icon }: QuickLinkProps) {
  return (
    <Link
      href={href}
      aria-label={`${title}. ${desc}`}
      className="group relative flex items-center justify-between gap-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:border-[#144336] hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#144336]"
    >
      <span className="flex items-start gap-4">
        <span
          className="rounded-full bg-[#144336]/10 p-2 text-[#144336]"
          aria-hidden
        >
          <Icon className="h-5 w-5" />
        </span>
        <span>
          <h3 className="text-lg font-semibold text-[#144336]">{title}</h3>
          <p className="mt-1 text-sm text-zinc-600">{desc}</p>
        </span>
      </span>
      <ArrowUpRight
        aria-hidden
        className="h-5 w-5 text-zinc-400 transition group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-[#144336]"
      />
    </Link>
  );
}
