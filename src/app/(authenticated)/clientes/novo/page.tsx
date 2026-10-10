import { requireAdmin } from "@/lib/authz";
import { createClientAction } from "../actions";

const COLOR_OPTIONS = [
  "#3b6fd6",
  "#36b37e",
  "#ff8b00",
  "#c9372c",
  "#8777d9",
  "#00a3bf",
];

export default async function NovoClientePage() {
  await requireAdmin();

  return (
    <div className="mx-auto max-w-md px-6 py-8">
      <h1 className="mb-1 text-xl font-semibold text-foreground">Novo cliente</h1>
      <p className="mb-6 text-sm text-muted">
        Cria o espaço do cliente já com as etapas de produção e as páginas da central da
        marca padrão.
      </p>

      <form action={createClientAction} className="space-y-4">
        <div>
          <label htmlFor="name" className="mb-1 block text-sm font-medium text-foreground">
            Nome do cliente
          </label>
          <input
            id="name"
            name="name"
            required
            autoFocus
            className="w-full rounded-md border border-border px-3 py-2 text-sm outline-none focus:border-primary"
          />
        </div>

        <div>
          <span className="mb-1 block text-sm font-medium text-foreground">Cor</span>
          <div className="flex gap-2">
            {COLOR_OPTIONS.map((color, index) => (
              <label key={color} className="cursor-pointer">
                <input
                  type="radio"
                  name="color"
                  value={color}
                  defaultChecked={index === 0}
                  className="peer sr-only"
                />
                <span
                  className="block h-7 w-7 rounded-full ring-offset-2 peer-checked:ring-2 peer-checked:ring-foreground"
                  style={{ backgroundColor: color }}
                />
              </label>
            ))}
          </div>
        </div>

        <button
          type="submit"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover"
        >
          Criar cliente
        </button>
      </form>
    </div>
  );
}
