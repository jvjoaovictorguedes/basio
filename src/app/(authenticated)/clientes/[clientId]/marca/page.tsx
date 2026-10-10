import { prisma } from "@/lib/prisma";
import { requireClientAccess } from "@/lib/authz";
import { BrandCenter } from "./brand-center";

export default async function MarcaPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;
  const user = await requireClientAccess(clientId);

  const pages = await prisma.brandCenterPage.findMany({
    where: { clientId },
    orderBy: { position: "asc" },
    include: { sections: { orderBy: { position: "asc" } } },
  });

  return (
    <BrandCenter
      key={clientId}
      clientId={clientId}
      initialPages={pages}
      isAdmin={user.role === "ADMIN"}
    />
  );
}
