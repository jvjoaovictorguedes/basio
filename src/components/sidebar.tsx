"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import clsx from "clsx";

type SidebarClient = {
  id: string;
  name: string;
  color: string | null;
};

export function Sidebar({
  clients,
  userName,
  userRole,
}: {
  clients: SidebarClient[];
  userName: string;
  userRole: "ADMIN" | "COLLABORATOR";
}) {
  const pathname = usePathname();
  const activeClientId = pathname.match(/^\/clientes\/([^/]+)/)?.[1];

  return (
    <aside className="flex h-full w-60 flex-none flex-col border-r border-border bg-surface">
      <div className="flex items-center gap-2 border-b border-border px-4 py-4">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-sm font-semibold text-white">
          B
        </div>
        <span className="text-sm font-semibold text-foreground">Basio Studio</span>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-3">
        <div className="mb-1 flex items-center justify-between px-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted">
            Clientes
          </span>
          {userRole === "ADMIN" && (
            <Link
              href="/clientes/novo"
              className="text-xs font-medium text-primary hover:underline"
            >
              + novo
            </Link>
          )}
        </div>

        <ul className="space-y-0.5">
          {clients.map((client) => (
            <li key={client.id}>
              <Link
                href={`/clientes/${client.id}/producao`}
                className={clsx(
                  "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
                  activeClientId === client.id
                    ? "bg-primary/10 font-medium text-primary"
                    : "text-foreground hover:bg-background",
                )}
              >
                <span
                  className="h-2 w-2 flex-none rounded-full"
                  style={{ backgroundColor: client.color || "#5e6c84" }}
                />
                <span className="truncate">{client.name}</span>
              </Link>
            </li>
          ))}
          {clients.length === 0 && (
            <li className="px-2 py-1.5 text-sm text-muted">Nenhum cliente ainda.</li>
          )}
        </ul>

        <div className="mt-4 border-t border-border pt-3">
          <Link
            href="/clientes"
            className={clsx(
              "block rounded-md px-2 py-1.5 text-sm",
              pathname === "/clientes"
                ? "bg-primary/10 font-medium text-primary"
                : "text-foreground hover:bg-background",
            )}
          >
            Todos os clientes
          </Link>
          {userRole === "ADMIN" && (
            <Link
              href="/acessos"
              className={clsx(
                "block rounded-md px-2 py-1.5 text-sm",
                pathname === "/acessos"
                  ? "bg-primary/10 font-medium text-primary"
                  : "text-foreground hover:bg-background",
              )}
            >
              Gestão de acessos
            </Link>
          )}
        </div>
      </nav>

      <div className="border-t border-border p-3">
        <Link
          href="/perfil"
          className="block truncate rounded-md px-2 py-1.5 text-sm text-foreground hover:bg-background"
          title={userName}
        >
          {userName}
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="mt-0.5 w-full rounded-md px-2 py-1.5 text-left text-sm text-muted hover:bg-background"
        >
          Sair
        </button>
      </div>
    </aside>
  );
}
