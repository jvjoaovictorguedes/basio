import { prisma } from "@/lib/prisma";

export async function getVisibleClients(user: { id: string; role: "ADMIN" | "COLLABORATOR" }) {
  if (user.role === "ADMIN") {
    return prisma.client.findMany({
      where: { status: "ACTIVE" },
      orderBy: { name: "asc" },
    });
  }

  return prisma.client.findMany({
    where: {
      status: "ACTIVE",
      collaborators: { some: { userId: user.id } },
    },
    orderBy: { name: "asc" },
  });
}
