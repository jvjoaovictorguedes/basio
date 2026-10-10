"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

type CustomPageTab = { id: string; title: string };

const FIXED_TABS = [
  { slug: "estrategia", label: "Estratégia" },
  { slug: "ideias", label: "Banco de ideias" },
  { slug: "documentos", label: "Documentos" },
  { slug: "anotacoes", label: "Anotações" },
];

export function ClientTabs({
  clientId,
  customPages,
}: {
  clientId: string;
  customPages: CustomPageTab[];
}) {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 overflow-x-auto px-4">
      {FIXED_TABS.map((tab) => {
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
      {customPages.map((page) => {
        const href = `/clientes/${clientId}/paginas/${page.id}`;
        const active = pathname === href;
        return (
          <Link
            key={page.id}
            href={href}
            className={clsx(
              "whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "border-primary text-primary"
                : "border-transparent text-muted hover:text-foreground",
            )}
          >
            {page.title}
          </Link>
        );
      })}
      <Link
        href={`/clientes/${clientId}/paginas/nova`}
        className="whitespace-nowrap px-3 py-2 text-sm text-muted hover:text-foreground"
      >
        + página
      </Link>
    </nav>
  );
}
