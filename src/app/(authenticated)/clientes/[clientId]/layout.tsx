import { notFound } from "next/navigation";
import { requireUser } from "@/lib/authz";
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
  await requireUser();

  const client = await prisma.client.findUnique({ where: { id: clientId } });
  if (!client) notFound();

  const customPages = await prisma.customPage.findMany({
    where: { clientId },
    orderBy: { position: "asc" },
    select: { id: true, title: true },
  });

  return (
    <div className="flex h-full flex-col">
      <header className="flex-none border-b border-border bg-surface">
        <div className="flex items-center gap-2 px-4 pt-3">
          <h1 className="truncate text-base font-semibold text-foreground">{client.name}</h1>
        </div>
        <ClientTabs clientId={clientId} customPages={customPages} />
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
    </div>
  );
}
