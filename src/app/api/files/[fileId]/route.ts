import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { assertClientAccess, assertUser, ForbiddenError } from "@/lib/authz";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ fileId: string }> },
) {
  const { fileId } = await params;

  const file = await prisma.file.findUnique({
    where: { id: fileId },
    include: {
      cardAttachments: { include: { card: { select: { clientId: true } } }, take: 1 },
      documents: { select: { clientId: true }, take: 1 },
      clientLogos: { select: { id: true }, take: 1 },
    },
  });

  if (!file) return NextResponse.json({ error: "Arquivo não encontrado." }, { status: 404 });

  try {
    const clientId = file.cardAttachments[0]?.card.clientId ?? file.documents[0]?.clientId;
    if (clientId) {
      await assertClientAccess(clientId);
    } else {
      await assertUser();
    }
  } catch (err) {
    if (err instanceof ForbiddenError) {
      return NextResponse.json({ error: err.message }, { status: 403 });
    }
    throw err;
  }

  return new NextResponse(file.data, {
    headers: {
      "Content-Type": file.mimeType,
      "Content-Disposition": `inline; filename="${encodeURIComponent(file.filename)}"`,
      "Cache-Control": "private, max-age=3600",
    },
  });
}
