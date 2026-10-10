"use client";

import { createCustomPageAction } from "@/app/(authenticated)/paginas/actions";

const TYPE_OPTIONS = [
  { value: "TEXT", label: "Página de texto" },
  { value: "LIST", label: "Lista" },
  { value: "FOLDER", label: "Pasta de arquivos" },
];

export function NewPageForm({ clientId }: { clientId: string | null }) {
  return (
    <form
      action={createCustomPageAction.bind(null, clientId)}
      className="mx-auto max-w-md space-y-4 px-6 py-8"
    >
      <h1 className="text-xl font-semibold text-foreground">Nova página</h1>

      <div>
        <label htmlFor="title" className="mb-1 block text-sm font-medium text-foreground">
          Título
        </label>
        <input
          id="title"
          name="title"
          required
          autoFocus
          className="w-full rounded-md border border-border px-3 py-2 text-sm outline-none focus:border-primary"
        />
      </div>

      <div>
        <span className="mb-1 block text-sm font-medium text-foreground">Tipo</span>
        <div className="space-y-1.5">
          {TYPE_OPTIONS.map((opt, index) => (
            <label key={opt.value} className="flex items-center gap-2 text-sm text-foreground">
              <input type="radio" name="type" value={opt.value} defaultChecked={index === 0} />
              {opt.label}
            </label>
          ))}
        </div>
      </div>

      <button
        type="submit"
        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover"
      >
        Criar página
      </button>
    </form>
  );
}
