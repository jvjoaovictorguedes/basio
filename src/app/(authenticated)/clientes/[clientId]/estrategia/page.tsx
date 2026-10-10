import { requireUser } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { STRATEGY_KEYS } from "@/lib/client-defaults";
import { StrategyView } from "./strategy-view";

export default async function EstrategiaPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;
  await requireUser();

  const pages = await prisma.strategyPage.findMany({ where: { clientId } });

  const byKey = new Map(pages.map((p) => [p.key, p]));
  const allPages = STRATEGY_KEYS.map((key) => ({
    key,
    content: byKey.get(key)?.content ?? "",
  }));

  return <StrategyView clientId={clientId} pages={allPages} />;
}
