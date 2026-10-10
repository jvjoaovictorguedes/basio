import Link from "next/link";
import { requireUser } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { calculateSemaphore } from "@/lib/dates";
import { SEMAPHORE_COLORS, SEMAPHORE_LABELS } from "@/lib/labels";

export default async function ClientesPage() {
  await requireUser();

  const clients = await prisma.client.findMany({
    where: { status: "ACTIVE" },
    orderBy: { name: "asc" },
    include: {
      cards: { select: { dueDate: true, stage: { select: { isFinal: true } } } },
    },
  });

  const kardoJotaUrl = process.env.NEXT_PUBLIC_KARDOJOTA_URL;

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-foreground">Clientes</h1>
        <Link
          href="/clientes/novo"
          className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-white hover:bg-primary-hover"
        >
          Novo cliente
        </Link>
      </div>

      {clients.length === 0 ? (
        <p className="text-sm text-muted">Nenhum cliente cadastrado ainda. Crie o primeiro.</p>
      ) : (
        <div className="space-y-2">
          {clients.map((client) => {
            const pendingCards = client.cards.filter((c) => !c.stage.isFinal);
            const semaphore = calculateSemaphore(pendingCards.map((c) => c.dueDate));

            return (
              <div
                key={client.id}
                className="flex items-center justify-between gap-4 rounded-lg border border-border bg-surface px-4 py-3"
              >
                <Link href={`/clientes/${client.id}/estrategia`} className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 flex-none rounded-full"
                      style={{ backgroundColor: SEMAPHORE_COLORS[semaphore] }}
                      title={SEMAPHORE_LABELS[semaphore]}
                    />
                    <span className="truncate font-medium text-foreground">{client.name}</span>
                  </div>
                  <p className="mt-0.5 truncate text-sm text-muted">
                    {client.contactName || "Sem contato definido"}
                    {client.service ? ` · ${client.service}` : ""}
                  </p>
                </Link>

                <div className="flex flex-none items-center gap-4">
                  <span className="text-sm text-muted">{pendingCards.length} pendências</span>
                  {kardoJotaUrl ? (
                    <a
                      href={`${kardoJotaUrl}/clientes/${client.id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-md border border-border px-3 py-1.5 text-sm font-medium text-foreground hover:bg-background"
                    >
                      Abrir no KardoJota
                    </a>
                  ) : (
                    <span
                      className="rounded-md border border-border px-3 py-1.5 text-sm text-muted/60"
                      title="KardoJota ainda não está disponível"
                    >
                      KardoJota em breve
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
