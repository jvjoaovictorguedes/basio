import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/authz";
import { NotesView } from "./notes-view";

export default async function AnotacoesPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;
  await requireUser();

  const notes = await prisma.note.findMany({
    where: { clientId },
    orderBy: { noteDate: "desc" },
    include: { attachments: { include: { file: true } } },
  });

  return <NotesView key={clientId} clientId={clientId} initialNotes={notes} />;
}
