import { prisma } from "@/lib/prisma";

export const DEFAULT_STAGES = [
  "Ideia",
  "Roteiro",
  "Aprovação do roteiro",
  "Produção",
  "Aprovação do material",
  "Agendado",
  "Publicado",
];

export const DEFAULT_BRAND_PAGES = [
  "Estratégia",
  "Posicionamento",
  "Persona",
  "Tom de voz",
  "Pilares de conteúdo",
];

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/** Cria o cliente já com a estrutura padrão: etapas do kanban + páginas da central da marca. */
export async function createClientWithDefaults(input: {
  name: string;
  color?: string | null;
  createdById: string;
}) {
  const baseSlug = slugify(input.name) || "cliente";

  return prisma.$transaction(async (tx) => {
    let slug = baseSlug;
    let suffix = 1;
    while (await tx.client.findUnique({ where: { slug } })) {
      suffix += 1;
      slug = `${baseSlug}-${suffix}`;
    }

    const client = await tx.client.create({
      data: {
        name: input.name,
        slug,
        color: input.color ?? null,
        createdById: input.createdById,
      },
    });

    await tx.pipelineStage.createMany({
      data: DEFAULT_STAGES.map((name, index) => ({
        clientId: client.id,
        name,
        position: index,
      })),
    });

    for (const [index, title] of DEFAULT_BRAND_PAGES.entries()) {
      await tx.brandCenterPage.create({
        data: {
          clientId: client.id,
          title,
          slug: slugify(title),
          position: index,
          sections: {
            create: [{ heading: title, content: "", position: 0 }],
          },
        },
      });
    }

    return client;
  });
}
