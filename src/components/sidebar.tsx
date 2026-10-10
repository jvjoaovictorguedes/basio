"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import clsx from "clsx";

type GeneralPage = { id: string; title: string };

const PAGE_TYPE_ICON: Record<string, string> = {
  TEXT: "📄",
  LIST: "☑️",
  FOLDER: "🗂️",
};

export function Sidebar({
  userName,
  generalPages,
}: {
  userName: string;
  generalPages: (GeneralPage & { type: string })[];
}) {
  const pathname = usePathname();

  const navItem = (href: string, label: string) => (
    <Link
      href={href}
      className={clsx(
        "block rounded-md px-3 py-2 text-sm transition-colors",
        pathname === href || (href !== "/" && pathname.startsWith(href))
          ? "bg-primary/10 font-medium text-primary"
          : "text-foreground hover:bg-background",
      )}
    >
      {label}
    </Link>
  );

  return (
    <aside className="flex h-full w-60 flex-none flex-col border-r border-border bg-surface">
      <div className="flex items-center gap-2 px-4 py-5">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-sm font-semibold text-white">
          J
        </div>
        <span className="text-sm font-semibold text-foreground">Jota Studio</span>
      </div>

      <nav className="flex-1 overflow-y-auto px-3">
        <div className="space-y-0.5">
          {navItem("/", "Minhas tarefas")}
          {navItem("/clientes", "Clientes")}
          {navItem("/tarefas", "Tarefas internas")}
        </div>

        {generalPages.length > 0 && (
          <div className="mt-6">
            <span className="px-3 text-xs font-semibold uppercase tracking-wide text-muted">
              Páginas
            </span>
            <div className="mt-1 space-y-0.5">
              {generalPages.map((page) => (
                <Link
                  key={page.id}
                  href={`/paginas/${page.id}`}
                  className={clsx(
                    "flex items-center gap-2 rounded-md px-3 py-2 text-sm",
                    pathname === `/paginas/${page.id}`
                      ? "bg-primary/10 font-medium text-primary"
                      : "text-foreground hover:bg-background",
                  )}
                >
                  <span className="text-xs">{PAGE_TYPE_ICON[page.type]}</span>
                  <span className="truncate">{page.title}</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="mt-2">
          <Link
            href="/paginas/novo"
            className="block rounded-md px-3 py-2 text-sm text-muted hover:bg-background"
          >
            + Nova página
          </Link>
        </div>
      </nav>

      <div className="border-t border-border p-3">
        <div className="truncate px-2 py-1 text-sm text-foreground">{userName}</div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="w-full rounded-md px-2 py-1.5 text-left text-sm text-muted hover:bg-background"
        >
          Sair
        </button>
      </div>
    </aside>
  );
}
