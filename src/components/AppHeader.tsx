"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { BrandMark } from "./BrandMark";

type NavItem = { href: string; label: string };

export function AppHeader({
  items,
  userName,
  homeHref,
}: {
  items: NavItem[];
  userName?: string | null;
  homeHref: string;
}) {
  const pathname = usePathname();

  return (
    <header className="app-nav">
      <div className="shell py-3 flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <BrandMark href={homeHref} size={56} />
          <div className="flex items-center gap-2">
            {userName && (
              <span className="hidden sm:inline text-sm text-[var(--muted)] max-w-[160px] truncate">
                {userName}
              </span>
            )}
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => signOut({ callbackUrl: "/" })}
            >
              Cerrar sesión
            </button>
          </div>
        </div>
        <nav className="nav-links" aria-label="Navegación principal">
          {items.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-link ${active ? "active" : ""}`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
