import { requireUser } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/app-shell";

export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();

  const generalPages = await prisma.customPage.findMany({
    where: { clientId: null },
    orderBy: { position: "asc" },
    select: { id: true, title: true, type: true },
  });

  return (
    <AppShell userName={user.name ?? user.email ?? "Jô"} generalPages={generalPages}>
      {children}
    </AppShell>
  );
}
