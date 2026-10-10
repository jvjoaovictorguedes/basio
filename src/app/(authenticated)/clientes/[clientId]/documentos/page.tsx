import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/authz";
import { DocumentsView } from "./documents-view";

export default async function DocumentosPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;
  await requireUser();

  const [folders, documents] = await Promise.all([
    prisma.documentFolder.findMany({ where: { clientId }, orderBy: { name: "asc" } }),
    prisma.document.findMany({
      where: { clientId },
      orderBy: { name: "asc" },
      include: { file: { select: { id: true, mimeType: true, sizeBytes: true } } },
    }),
  ]);

  return (
    <DocumentsView key={clientId} clientId={clientId} folders={folders} documents={documents} />
  );
}
