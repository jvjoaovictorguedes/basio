import { prisma } from "@/lib/prisma";
import type { StrategyKey } from "@/generated/prisma/client";

export const DEFAULT_STAGES: { name: string; awaiting: "STUDIO" | "CLIENT"; isFinal?: boolean }[] = [
  { name: "Ideia", awaiting: "STUDIO" },
  { name: "Roteiro", awaiting: "STUDIO" },
  { name: "Aprovação do roteiro", awaiting: "CLIENT" },
  { name: "Produção", awaiting: "STUDIO" },
  { name: "Aprovação do material", awaiting: "CLIENT" },
  { name: "Agendado", awaiting: "STUDIO" },
  { name: "Publicado", awaiting: "STUDIO", isFinal: true },
];

export const STRATEGY_KEYS: StrategyKey[] = [
  "POSICIONAMENTO",
  "PERSONA",
  "TOM_DE_VOZ",
  "PILARES",
];

/** Cria o cliente já com a estrutura padrão do KardoJota: etapas do kanban + páginas de estratégia. */
export async function createClientWithDefaults(input: {
  name: string;
  contactName?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  service?: string | null;
  createdById: string;
}) {
  return prisma.$transaction(async (tx) => {
    const client = await tx.client.create({
      data: {
        name: input.name,
        contactName: input.contactName ?? null,
        contactEmail: input.contactEmail ?? null,
        contactPhone: input.contactPhone ?? null,
        service: input.service ?? null,
        createdById: input.createdById,
      },
    });

    await tx.pipelineStage.createMany({
      data: DEFAULT_STAGES.map((stage, index) => ({
        clientId: client.id,
        name: stage.name,
        position: index,
        awaiting: stage.awaiting,
        isFinal: stage.isFinal ?? false,
      })),
    });

    await tx.strategyPage.createMany({
      data: STRATEGY_KEYS.map((key) => ({
        clientId: client.id,
        key,
        content: "",
      })),
    });

    return client;
  });
}
