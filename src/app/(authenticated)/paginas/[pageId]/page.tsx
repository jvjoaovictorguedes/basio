import { notFound } from "next/navigation";
import { requireUser } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { CustomPageView } from "@/components/custom-page-view";

export default async function PaginaGeralPage({
  params,
}: {
  params: Promise<{ pageId: string }>;
}) {
  const { pageId } = await params;
  await requireUser();

  const page = await prisma.customPage.findUnique({
    where: { id: pageId },
    include: {
      textContent: true,
      listItems: { orderBy: { position: "asc" } },
      files: { include: { file: { select: { id: true, filename: true, sizeBytes: true } } } },
    },
  });

  if (!page || page.clientId !== null) notFound();

  return <CustomPageView page={page} />;
}
