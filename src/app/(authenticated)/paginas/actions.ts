"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { assertUser } from "@/lib/authz";
import type { CustomPageType } from "@/generated/prisma/client";

function pagesPath(clientId: string | null) {
  return clientId ? `/clientes/${clientId}` : "";
}

export async function createCustomPageAction(clientId: string | null, formData: FormData) {
  await assertUser();

  const title = String(formData.get("title") || "").trim();
  const type = formData.get("type") as CustomPageType;
  if (!title) throw new Error("Informe o título da página.");

  const last = await prisma.customPage.findFirst({
    where: { clientId },
    orderBy: { position: "desc" },
  });

  const page = await prisma.customPage.create({
    data: {
      clientId,
      title,
      type,
      position: (last?.position ?? -1) + 1,
      ...(type === "TEXT" ? { textContent: { create: { content: "" } } } : {}),
    },
  });

  revalidatePath(pagesPath(clientId) || "/");
  redirect(`${pagesPath(clientId)}/paginas/${page.id}`);
}

export async function renamePageAction(pageId: string, title: string) {
  const page = await prisma.customPage.findUniqueOrThrow({ where: { id: pageId } });
  await assertUser();
  if (!title.trim()) throw new Error("Informe o título da página.");

  await prisma.customPage.update({ where: { id: pageId }, data: { title: title.trim() } });
  revalidatePath(pagesPath(page.clientId) || "/");
}

export async function deletePageAction(pageId: string) {
  const page = await prisma.customPage.findUniqueOrThrow({ where: { id: pageId } });
  await assertUser();
  await prisma.customPage.delete({ where: { id: pageId } });
  revalidatePath(pagesPath(page.clientId) || "/");
  redirect(page.clientId ? `/clientes/${page.clientId}/estrategia` : "/");
}

export async function movePageAction(pageId: string, direction: -1 | 1) {
  const page = await prisma.customPage.findUniqueOrThrow({ where: { id: pageId } });
  await assertUser();

  const siblings = await prisma.customPage.findMany({
    where: { clientId: page.clientId },
    orderBy: { position: "asc" },
  });
  const index = siblings.findIndex((s) => s.id === pageId);
  const targetIndex = index + direction;
  if (targetIndex < 0 || targetIndex >= siblings.length) return;

  const other = siblings[targetIndex];
  await prisma.$transaction([
    prisma.customPage.update({ where: { id: page.id }, data: { position: other.position } }),
    prisma.customPage.update({ where: { id: other.id }, data: { position: page.position } }),
  ]);

  revalidatePath(pagesPath(page.clientId) || "/");
}

export async function updateTextContentAction(pageId: string, formData: FormData) {
  const page = await prisma.customPage.findUniqueOrThrow({ where: { id: pageId } });
  await assertUser();
  const content = String(formData.get("content") || "");

  await prisma.customPageTextContent.upsert({
    where: { pageId },
    update: { content },
    create: { pageId, content },
  });

  revalidatePath(`${pagesPath(page.clientId)}/paginas/${pageId}`);
}

export async function createListItemAction(pageId: string, title: string) {
  const page = await prisma.customPage.findUniqueOrThrow({ where: { id: pageId } });
  await assertUser();
  if (!title.trim()) return;

  const last = await prisma.customPageListItem.findFirst({
    where: { pageId },
    orderBy: { position: "desc" },
  });

  await prisma.customPageListItem.create({
    data: { pageId, title: title.trim(), position: (last?.position ?? -1) + 1 },
  });

  revalidatePath(`${pagesPath(page.clientId)}/paginas/${pageId}`);
}

export async function toggleListItemAction(itemId: string, done: boolean) {
  const item = await prisma.customPageListItem.findUniqueOrThrow({
    where: { id: itemId },
    include: { page: true },
  });
  await assertUser();
  await prisma.customPageListItem.update({ where: { id: itemId }, data: { done } });
  revalidatePath(`${pagesPath(item.page.clientId)}/paginas/${item.pageId}`);
}

export async function deleteListItemAction(itemId: string) {
  const item = await prisma.customPageListItem.findUniqueOrThrow({
    where: { id: itemId },
    include: { page: true },
  });
  await assertUser();
  await prisma.customPageListItem.delete({ where: { id: itemId } });
  revalidatePath(`${pagesPath(item.page.clientId)}/paginas/${item.pageId}`);
}

export async function uploadPageFileAction(pageId: string, formData: FormData) {
  const page = await prisma.customPage.findUniqueOrThrow({ where: { id: pageId } });
  const user = await assertUser();

  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) throw new Error("Selecione um arquivo.");

  const maxSize = Number(process.env.MAX_UPLOAD_SIZE_BYTES ?? 20 * 1024 * 1024);
  if (file.size > maxSize) throw new Error("Arquivo muito grande.");

  const buffer = Buffer.from(await file.arrayBuffer());
  const storedFile = await prisma.file.create({
    data: {
      filename: file.name,
      mimeType: file.type || "application/octet-stream",
      sizeBytes: buffer.byteLength,
      data: buffer,
      uploadedById: user.id,
    },
  });

  await prisma.customPageFile.create({ data: { pageId, fileId: storedFile.id } });
  revalidatePath(`${pagesPath(page.clientId)}/paginas/${pageId}`);
}

export async function deletePageFileAction(fileEntryId: string) {
  const entry = await prisma.customPageFile.findUniqueOrThrow({
    where: { id: fileEntryId },
    include: { page: true },
  });
  await assertUser();
  await prisma.customPageFile.delete({ where: { id: fileEntryId } });
  await prisma.file.delete({ where: { id: entry.fileId } }).catch(() => {});
  revalidatePath(`${pagesPath(entry.page.clientId)}/paginas/${entry.pageId}`);
}
