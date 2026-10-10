"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { assertUser } from "@/lib/authz";

export async function createNoteAction(clientId: string, formData: FormData) {
  await assertUser();

  const content = String(formData.get("content") || "").trim();
  if (!content) throw new Error("Escreva o conteúdo da anotação.");

  const noteDateRaw = String(formData.get("noteDate") || "");
  const title = String(formData.get("title") || "").trim() || null;

  const note = await prisma.note.create({
    data: {
      clientId,
      title,
      content,
      noteDate: noteDateRaw ? new Date(noteDateRaw) : new Date(),
    },
  });

  const file = formData.get("file") as File | null;
  if (file && file.size > 0) {
    const maxSize = Number(process.env.MAX_UPLOAD_SIZE_BYTES ?? 20 * 1024 * 1024);
    if (file.size > maxSize) throw new Error("Arquivo muito grande.");

    const buffer = Buffer.from(await file.arrayBuffer());
    const storedFile = await prisma.file.create({
      data: {
        filename: file.name,
        mimeType: file.type || "application/octet-stream",
        sizeBytes: buffer.byteLength,
        data: buffer,
      },
    });
    await prisma.noteAttachment.create({ data: { noteId: note.id, fileId: storedFile.id } });
  }

  revalidatePath(`/clientes/${clientId}/anotacoes`);
}

export async function deleteNoteAction(noteId: string) {
  const note = await prisma.note.findUniqueOrThrow({ where: { id: noteId } });
  await assertUser();
  await prisma.note.delete({ where: { id: noteId } });
  revalidatePath(`/clientes/${note.clientId}/anotacoes`);
}
