"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

const TABS = [
  { slug: "producao", label: "Produção" },
  { slug: "calendario", label: "Calendário" },
  { slug: "marca", label: "Central da marca" },
  { slug: "ideias", label: "Banco de ideias" },
  { slug: "documentos", label: "Documentos" },
  { slug: "configuracoes", label: "Configurações" },
];

export function ClientTabs({ clientId }: { clientId: string }) {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 overflow-x-auto px-4">
      {TABS.map((tab) => {
        const href = `/clientes/${clientId}/${tab.slug}`;
        const active = pathname.startsWith(href);
        return (
          <Link
            key={tab.slug}
            href={href}
            className={clsx(
              "whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "border-primary text-primary"
                : "border-transparent text-muted hover:text-foreground",
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
