"use client";

import { useState, useTransition } from "react";
import clsx from "clsx";
import { formatDatePtBR } from "@/lib/dates";
import { PRIORITY_COLORS, PRIORITY_LABELS, PRIORITY_OPTIONS } from "@/lib/labels";
import {
  createInternalTaskAction,
  deleteInternalTaskAction,
  toggleTaskStatusAction,
} from "./actions";

type ClientRef = { id: string; name: string };
type Task = {
  id: string;
  title: string;
  description: string | null;
  dueDate: string | Date | null;
  priority: string;
  status: string;
  client: ClientRef | null;
};

export function TasksView({
  initialTasks,
  clients,
}: {
  initialTasks: Task[];
  clients: ClientRef[];
}) {
  const [tasks, setTasks] = useState(initialTasks);
  const [showForm, setShowForm] = useState(false);
  const [, startTransition] = useTransition();

  function handleCreate(formData: FormData) {
    startTransition(async () => {
      const task = await createInternalTaskAction(formData);
      setTasks((prev) => [task, ...prev]);
    });
    setShowForm(false);
  }

  function handleToggle(taskId: string, done: boolean) {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: done ? "CONCLUIDA" : "PENDENTE" } : t)),
    );
    startTransition(async () => {
      await toggleTaskStatusAction(taskId, done);
    });
  }

  function handleDelete(taskId: string) {
    if (!confirm("Excluir esta tarefa?")) return;
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    startTransition(async () => {
      await deleteInternalTaskAction(taskId);
    });
  }

  const pending = tasks.filter((t) => t.status === "PENDENTE");
  const done = tasks.filter((t) => t.status === "CONCLUIDA");

  return (
    <div className="mx-auto max-w-2xl px-6 py-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-foreground">Tarefas internas</h1>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-hover"
        >
          + Nova tarefa
        </button>
      </div>

      {showForm && (
        <form
          action={handleCreate}
          className="mb-5 space-y-3 rounded-lg border border-border bg-surface p-4"
        >
          <input
            name="title"
            required
            autoFocus
            placeholder="Título da tarefa"
            className="w-full rounded-md border border-border px-3 py-2 text-sm outline-none focus:border-primary"
          />
          <textarea
            name="description"
            rows={2}
            placeholder="Descrição (opcional)"
            className="w-full rounded-md border border-border px-3 py-2 text-sm outline-none focus:border-primary"
          />
          <div className="grid grid-cols-3 gap-2">
            <input
              type="date"
              name="dueDate"
              className="rounded-md border border-border px-2 py-1.5 text-sm"
            />
            <select name="priority" defaultValue="MEDIA" className="rounded-md border border-border px-2 py-1.5 text-sm">
              {PRIORITY_OPTIONS.map((p) => (
                <option key={p} value={p}>
                  {PRIORITY_LABELS[p]}
                </option>
              ))}
            </select>
            <select name="clientId" defaultValue="" className="rounded-md border border-border px-2 py-1.5 text-sm">
              <option value="">Sem cliente</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-hover"
          >
            Salvar
          </button>
        </form>
      )}

      <div className="space-y-1.5">
        {pending.map((task) => (
          <TaskRow key={task.id} task={task} onToggle={handleToggle} onDelete={handleDelete} />
        ))}
      </div>

      {done.length > 0 && (
        <div className="mt-6">
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted">
            Concluídas
          </p>
          <div className="space-y-1.5">
            {done.map((task) => (
              <TaskRow key={task.id} task={task} onToggle={handleToggle} onDelete={handleDelete} />
            ))}
          </div>
        </div>
      )}

      {tasks.length === 0 && <p className="text-sm text-muted">Nenhuma tarefa interna ainda.</p>}
    </div>
  );
}

function TaskRow({
  task,
  onToggle,
  onDelete,
}: {
  task: Task;
  onToggle: (id: string, done: boolean) => void;
  onDelete: (id: string) => void;
}) {
  const done = task.status === "CONCLUIDA";
  return (
    <div
      className={clsx(
        "flex items-center gap-3 rounded-md border border-border bg-surface px-3 py-2",
        done && "opacity-50",
      )}
    >
      <input
        type="checkbox"
        checked={done}
        onChange={(e) => onToggle(task.id, e.target.checked)}
        className="h-4 w-4 flex-none"
      />
      <div className="min-w-0 flex-1">
        <p className={clsx("truncate text-sm font-medium text-foreground", done && "line-through")}>
          {task.title}
        </p>
        <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-muted">
          {task.client && <span>{task.client.name}</span>}
          {task.dueDate && <span>· {formatDatePtBR(new Date(task.dueDate))}</span>}
          <span
            className="rounded px-1.5 py-0.5 text-[11px] font-medium text-white"
            style={{ backgroundColor: PRIORITY_COLORS[task.priority] }}
          >
            {PRIORITY_LABELS[task.priority]}
          </span>
        </div>
      </div>
      <button onClick={() => onDelete(task.id)} className="flex-none text-xs text-muted hover:text-danger">
        excluir
      </button>
    </div>
  );
}
