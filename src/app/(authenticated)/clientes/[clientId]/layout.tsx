import { notFound } from "next/navigation";
import { requireClientAccess } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { ClientTabs } from "@/components/client-tabs";

export default async function ClientLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;
  await requireClientAccess(clientId);

  const client = await prisma.client.findUnique({ where: { id: clientId } });
  if (!client) notFound();

  return (
    <div className="flex h-full flex-col">
      <header className="flex-none border-b border-border bg-surface">
        <div className="flex items-center gap-2 px-4 pt-3">
          <span
            className="h-2.5 w-2.5 flex-none rounded-full"
            style={{ backgroundColor: client.color || "#5e6c84" }}
          />
          <h1 className="truncate text-base font-semibold text-foreground">{client.name}</h1>
        </div>
        <ClientTabs clientId={clientId} />
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
    </div>
  );
}
