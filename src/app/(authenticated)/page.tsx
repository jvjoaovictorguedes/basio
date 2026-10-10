import { requireUser } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { MyTasksView } from "./my-tasks-view";

export default async function HomePage() {
  await requireUser();

  const [tasks, cards] = await Promise.all([
    prisma.internalTask.findMany({
      where: { status: "PENDENTE" },
      include: { client: { select: { id: true, name: true } } },
    }),
    prisma.contentCard.findMany({
      where: { stage: { awaiting: "STUDIO" } },
      include: {
        client: { select: { id: true, name: true } },
        stage: { select: { name: true } },
      },
    }),
  ]);

  return <MyTasksView tasks={tasks} cards={cards} />;
}
