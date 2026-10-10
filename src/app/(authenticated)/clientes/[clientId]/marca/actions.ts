"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { assertAdmin, assertClientAccess } from "@/lib/authz";

function slugify(value: string) {
  return (
    value
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "pagina"
  );
}

export async function createBrandPageAction(clientId: string, title: string) {
  await assertAdmin();
  if (!title.trim()) throw new Error("Informe o título da página.");

  const last = await prisma.brandCenterPage.findFirst({
    where: { clientId },
    orderBy: { position: "desc" },
  });

  const page = await prisma.brandCenterPage.create({
    data: {
      clientId,
      title: title.trim(),
      slug: slugify(title),
      position: (last?.position ?? -1) + 1,
      sections: { create: [{ heading: title.trim(), content: "", position: 0 }] },
    },
  });

  revalidatePath(`/clientes/${clientId}/marca`);
  return page.id;
}

export async function renameBrandPageAction(pageId: string, title: string) {
  const page = await prisma.brandCenterPage.findUniqueOrThrow({ where: { id: pageId } });
  await assertAdmin();
  await prisma.brandCenterPage.update({ where: { id: pageId }, data: { title } });
  revalidatePath(`/clientes/${page.clientId}/marca`);
}

export async function deleteBrandPageAction(pageId: string) {
  const page = await prisma.brandCenterPage.findUniqueOrThrow({ where: { id: pageId } });
  await assertAdmin();
  await prisma.brandCenterPage.delete({ where: { id: pageId } });
  revalidatePath(`/clientes/${page.clientId}/marca`);
}

export async function createSectionAction(pageId: string, heading: string) {
  const page = await prisma.brandCenterPage.findUniqueOrThrow({ where: { id: pageId } });
  await assertAdmin();
  if (!heading.trim()) throw new Error("Informe o título da seção.");

  const last = await prisma.brandCenterSection.findFirst({
    where: { pageId },
    orderBy: { position: "desc" },
  });

  await prisma.brandCenterSection.create({
    data: { pageId, heading: heading.trim(), position: (last?.position ?? -1) + 1 },
  });

  revalidatePath(`/clientes/${page.clientId}/marca`);
}

export async function updateSectionAction(sectionId: string, formData: FormData) {
  const section = await prisma.brandCenterSection.findUniqueOrThrow({
    where: { id: sectionId },
    include: { page: true },
  });
  await assertClientAccess(section.page.clientId);

  await prisma.brandCenterSection.update({
    where: { id: sectionId },
    data: {
      heading: String(formData.get("heading") || section.heading),
      content: String(formData.get("content") ?? ""),
    },
  });

  revalidatePath(`/clientes/${section.page.clientId}/marca`);
}

export async function deleteSectionAction(sectionId: string) {
  const section = await prisma.brandCenterSection.findUniqueOrThrow({
    where: { id: sectionId },
    include: { page: true },
  });
  await assertAdmin();
  await prisma.brandCenterSection.delete({ where: { id: sectionId } });
  revalidatePath(`/clientes/${section.page.clientId}/marca`);
}
