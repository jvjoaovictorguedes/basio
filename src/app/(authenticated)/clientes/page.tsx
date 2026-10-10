import Link from "next/link";
import { requireUser } from "@/lib/authz";
import { getVisibleClients } from "@/lib/clients-data";

export default async function ClientesPage() {
  const user = await requireUser();
  const clients = await getVisibleClients(user);

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-foreground">Clientes</h1>
        {user.role === "ADMIN" && (
          <Link
            href="/clientes/novo"
            className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-white hover:bg-primary-hover"
          >
            Novo cliente
          </Link>
        )}
      </div>

      {clients.length === 0 ? (
        <p className="text-sm text-muted">
          {user.role === "ADMIN"
            ? "Nenhum cliente cadastrado ainda. Crie o primeiro para começar."
            : "Você ainda não foi adicionada a nenhum cliente."}
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {clients.map((client) => (
            <Link
              key={client.id}
              href={`/clientes/${client.id}/producao`}
              className="rounded-lg border border-border bg-surface p-4 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex items-center gap-2">
                <span
                  className="h-3 w-3 flex-none rounded-full"
                  style={{ backgroundColor: client.color || "#5e6c84" }}
                />
                <span className="truncate font-medium text-foreground">{client.name}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
