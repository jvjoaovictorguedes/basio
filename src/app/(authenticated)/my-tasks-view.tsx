"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import clsx from "clsx";
import { bucketForDate, formatDatePtBR, type DueBucket } from "@/lib/dates";
import { PRIORITY_COLORS, PRIORITY_LABELS } from "@/lib/labels";
import { toggleTaskStatusAction } from "./tarefas/actions";

type ClientRef = { id: string; name: string };
type Task = {
  id: string;
  title: string;
  dueDate: string | Date | null;
  priority: string;
  client: ClientRef | null;
};
type Card = {
  id: string;
  title: string;
  dueDate: string | Date | null;
  priority: string;
  client: ClientRef;
  stage: { name: string };
};

type Item = {
  key: string;
  kind: "task" | "card";
  id: string;
  title: string;
  clientName: string | null;
  dueDate: Date | null;
  priority: string;
  href: string | null;
  stageName?: string;
};

const BUCKET_LABELS: Record<DueBucket, string> = {
  HOJE: "Hoje",
  SEMANA: "Esta semana",
  DEPOIS: "Depois",
};

export function MyTasksView({ tasks, cards }: { tasks: Task[]; cards: Card[] }) {
  const [doneIds, setDoneIds] = useState<Set<string>>(new Set());
  const [, startTransition] = useTransition();

  const items: Item[] = useMemo(() => {
    const taskItems: Item[] = tasks
      .filter((t) => !doneIds.has(t.id))
      .map((t) => ({
        key: `task-${t.id}`,
        kind: "task",
        id: t.id,
        title: t.title,
        clientName: t.client?.name ?? null,
        dueDate: t.dueDate ? new Date(t.dueDate) : null,
        priority: t.priority,
        href: null,
      }));

    const cardItems: Item[] = cards.map((c) => ({
      key: `card-${c.id}`,
      kind: "card",
      id: c.id,
      title: c.title,
      clientName: c.client.name,
      dueDate: c.dueDate ? new Date(c.dueDate) : null,
      priority: c.priority,
      href: `/clientes/${c.client.id}/cards/${c.id}`,
      stageName: c.stage.name,
    }));

    return [...taskItems, ...cardItems].sort((a, b) => {
      if (!a.dueDate && !b.dueDate) return 0;
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return a.dueDate.getTime() - b.dueDate.getTime();
    });
  }, [tasks, cards, doneIds]);

  const buckets: Record<DueBucket, Item[]> = { HOJE: [], SEMANA: [], DEPOIS: [] };
  for (const item of items) {
    buckets[bucketForDate(item.dueDate)].push(item);
  }

  function handleToggleTask(taskId: string) {
    setDoneIds((prev) => new Set(prev).add(taskId));
    startTransition(async () => {
      await toggleTaskStatusAction(taskId, true);
    });
  }

  const isEmpty = items.length === 0;

  return (
    <div className="mx-auto max-w-2xl px-6 py-8">
      <h1 className="mb-6 text-xl font-semibold text-foreground">Minhas tarefas</h1>

      {isEmpty ? (
        <p className="text-sm text-muted">Tudo em dia por aqui.</p>
      ) : (
        (["HOJE", "SEMANA", "DEPOIS"] as DueBucket[]).map((bucket) =>
          buckets[bucket].length > 0 ? (
            <section key={bucket} className="mb-6">
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
                {BUCKET_LABELS[bucket]}
              </h2>
              <div className="space-y-1.5">
                {buckets[bucket].map((item) => (
                  <ItemRow key={item.key} item={item} onToggleTask={handleToggleTask} />
                ))}
              </div>
            </section>
          ) : null,
        )
      )}
    </div>
  );
}

function ItemRow({
  item,
  onToggleTask,
}: {
  item: Item;
  onToggleTask: (taskId: string) => void;
}) {
  const content = (
    <div className="flex items-center gap-3 rounded-md border border-border bg-surface px-3 py-2">
      {item.kind === "task" ? (
        <input
          type="checkbox"
          onChange={() => onToggleTask(item.id)}
          className="h-4 w-4 flex-none"
        />
      ) : (
        <span className="flex-none text-sm">📋</span>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{item.title}</p>
        <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-muted">
          {item.clientName && <span>{item.clientName}</span>}
          {item.stageName && <span>· {item.stageName}</span>}
          {item.dueDate && <span>· {formatDatePtBR(item.dueDate)}</span>}
        </div>
      </div>
      <span
        className={clsx("flex-none rounded px-1.5 py-0.5 text-[11px] font-medium text-white")}
        style={{ backgroundColor: PRIORITY_COLORS[item.priority] }}
      >
        {PRIORITY_LABELS[item.priority]}
      </span>
    </div>
  );

  if (item.href) {
    return (
      <Link href={item.href} className="block hover:opacity-90">
        {content}
      </Link>
    );
  }

  return content;
}
