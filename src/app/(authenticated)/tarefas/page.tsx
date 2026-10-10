import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/authz";
import { TasksView } from "./tasks-view";

export default async function TarefasPage() {
  await requireUser();

  const [tasks, clients] = await Promise.all([
    prisma.internalTask.findMany({
      orderBy: [{ status: "asc" }, { dueDate: "asc" }],
      include: { client: { select: { id: true, name: true } } },
    }),
    prisma.client.findMany({
      where: { status: "ACTIVE" },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  return <TasksView initialTasks={tasks} clients={clients} />;
}
