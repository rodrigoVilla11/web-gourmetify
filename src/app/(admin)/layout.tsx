"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import RoleGuard from "@/components/auth/RoleGuard";

const NAV = [
  { href: "/admin/tenants", label: "Tenants" },
  { href: "/admin/branches", label: "Branches" },
  { href: "/admin/users", label: "Users" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <RoleGuard allow={["SUPER_ADMIN"]}>
      <div className="min-h-dvh grid grid-cols-12 bg-zinc-50">
        {/* Sidebar */}
        <aside className="col-span-12 md:col-span-2 border-r bg-white p-4 flex flex-col">
          {/* Logo */}
          <div className="mb-6">
            <Link href="/admin" className="text-xl font-extrabold tracking-tight text-[#144336]">
              Gourmetify
            </Link>
            <div className="text-xs text-zinc-500">Admin Panel</div>
          </div>

          {/* Nav */}
          <nav className="flex flex-col gap-1 text-sm font-medium">
            {NAV.map((item) => {
              const active = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-lg px-3 py-2 transition ${
                    active
                      ? "bg-[#144336] text-white shadow-sm"
                      : "text-zinc-700 hover:bg-zinc-100"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto pt-6 text-xs text-zinc-400">
            © {new Date().getFullYear()} Gourmetify
          </div>
        </aside>

        {/* Content */}
        <main className="col-span-12 md:col-span-10 p-6">{children}</main>
      </div>
    </RoleGuard>
  );
}
