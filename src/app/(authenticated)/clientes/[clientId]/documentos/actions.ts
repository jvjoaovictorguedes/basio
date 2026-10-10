"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { assertClientAccess } from "@/lib/authz";

export async function createFolderAction(
  clientId: string,
  parentFolderId: string | null,
  name: string,
) {
  await assertClientAccess(clientId);
  if (!name.trim()) throw new Error("Informe o nome da pasta.");

  await prisma.documentFolder.create({
    data: { clientId, parentFolderId, name: name.trim() },
  });

  revalidatePath(`/clientes/${clientId}/documentos`);
}

export async function renameFolderAction(folderId: string, name: string) {
  const folder = await prisma.documentFolder.findUniqueOrThrow({ where: { id: folderId } });
  await assertClientAccess(folder.clientId);
  await prisma.documentFolder.update({ where: { id: folderId }, data: { name } });
  revalidatePath(`/clientes/${folder.clientId}/documentos`);
}

export async function deleteFolderAction(folderId: string) {
  const folder = await prisma.documentFolder.findUniqueOrThrow({ where: { id: folderId } });
  await assertClientAccess(folder.clientId);
  await prisma.documentFolder.delete({ where: { id: folderId } });
  revalidatePath(`/clientes/${folder.clientId}/documentos`);
}

export async function uploadDocumentAction(
  clientId: string,
  folderId: string | null,
  formData: FormData,
) {
  const user = await assertClientAccess(clientId);
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

  await prisma.document.create({
    data: {
      clientId,
      folderId,
      fileId: storedFile.id,
      name: file.name,
      uploadedById: user.id,
    },
  });

  revalidatePath(`/clientes/${clientId}/documentos`);
}

export async function deleteDocumentAction(documentId: string) {
  const doc = await prisma.document.findUniqueOrThrow({ where: { id: documentId } });
  await assertClientAccess(doc.clientId);
  await prisma.document.delete({ where: { id: documentId } });
  await prisma.file.delete({ where: { id: doc.fileId } }).catch(() => {});
  revalidatePath(`/clientes/${doc.clientId}/documentos`);
}
