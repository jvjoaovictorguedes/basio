import { redirect } from "next/navigation";
import { requireUser } from "@/lib/authz";
import { getVisibleClients } from "@/lib/clients-data";

export default async function HomePage() {
  const user = await requireUser();
  const clients = await getVisibleClients(user);

  if (clients.length === 1) {
    redirect(`/clientes/${clients[0].id}/producao`);
  }

  redirect("/clientes");
}
