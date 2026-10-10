import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { assertUser, ForbiddenError } from "@/lib/authz";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ fileId: string }> },
) {
  const { fileId } = await params;

  try {
    await assertUser();
  } catch (err) {
    if (err instanceof ForbiddenError) {
      return NextResponse.json({ error: err.message }, { status: 403 });
    }
    throw err;
  }

  const file = await prisma.file.findUnique({ where: { id: fileId } });
  if (!file) return NextResponse.json({ error: "Arquivo não encontrado." }, { status: 404 });

  return new NextResponse(file.data, {
    headers: {
      "Content-Type": file.mimeType,
      "Content-Disposition": `inline; filename="${encodeURIComponent(file.filename)}"`,
      "Cache-Control": "private, max-age=3600",
    },
  });
}
