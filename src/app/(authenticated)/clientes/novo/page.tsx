import { requireUser } from "@/lib/authz";
import { createClientAction } from "../actions";

export default async function NovoClientePage() {
  await requireUser();

  return (
    <div className="mx-auto max-w-md px-6 py-8">
      <h1 className="mb-1 text-xl font-semibold text-foreground">Novo cliente</h1>
      <p className="mb-6 text-sm text-muted">
        Cria o espaço do cliente já com a estrutura padrão do KardoJota (etapas do kanban e
        páginas de estratégia).
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
          <label htmlFor="service" className="mb-1 block text-sm font-medium text-foreground">
            Serviço contratado
          </label>
          <input
            id="service"
            name="service"
            placeholder="Ex: 3 posts/semana + stories"
            className="w-full rounded-md border border-border px-3 py-2 text-sm outline-none focus:border-primary"
          />
        </div>

        <div>
          <label htmlFor="contactName" className="mb-1 block text-sm font-medium text-foreground">
            Nome do contato
          </label>
          <input
            id="contactName"
            name="contactName"
            className="w-full rounded-md border border-border px-3 py-2 text-sm outline-none focus:border-primary"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="contactEmail" className="mb-1 block text-sm font-medium text-foreground">
              E-mail
            </label>
            <input
              id="contactEmail"
              name="contactEmail"
              type="email"
              className="w-full rounded-md border border-border px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </div>
          <div>
            <label htmlFor="contactPhone" className="mb-1 block text-sm font-medium text-foreground">
              Telefone
            </label>
            <input
              id="contactPhone"
              name="contactPhone"
              className="w-full rounded-md border border-border px-3 py-2 text-sm outline-none focus:border-primary"
            />
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
