"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { changePasswordAction, updateProfileAction } from "./actions";

export function PerfilForm({
  name,
  email,
  role,
}: {
  name: string;
  email: string;
  role: "ADMIN" | "COLLABORATOR";
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [profileMsg, setProfileMsg] = useState<string | null>(null);
  const [passwordMsg, setPasswordMsg] = useState<string | null>(null);
  const [passwordErr, setPasswordErr] = useState<string | null>(null);

  function handleProfile(formData: FormData) {
    setProfileMsg(null);
    startTransition(async () => {
      await updateProfileAction(formData);
      setProfileMsg("Perfil atualizado.");
      router.refresh();
    });
  }

  function handlePassword(formData: FormData) {
    setPasswordMsg(null);
    setPasswordErr(null);
    startTransition(async () => {
      try {
        await changePasswordAction(formData);
        setPasswordMsg("Senha alterada com sucesso.");
      } catch (err) {
        setPasswordErr(err instanceof Error ? err.message : "Erro ao trocar senha.");
      }
    });
  }

  return (
    <div className="space-y-8">
      <section className="rounded-lg border border-border bg-surface p-4">
        <h2 className="mb-3 text-sm font-semibold text-foreground">Dados pessoais</h2>
        <form action={handleProfile} className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted">Nome</label>
            <input
              name="name"
              defaultValue={name}
              className="w-full rounded-md border border-border px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted">E-mail</label>
            <input
              value={email}
              disabled
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-muted"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted">Papel</label>
            <input
              value={role === "ADMIN" ? "Administradora" : "Colaboradora"}
              disabled
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-muted"
            />
          </div>
          {profileMsg && <p className="text-sm text-primary">{profileMsg}</p>}
          <button
            type="submit"
            disabled={isPending}
            className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-60"
          >
            Salvar
          </button>
        </form>
      </section>

      <section className="rounded-lg border border-border bg-surface p-4">
        <h2 className="mb-3 text-sm font-semibold text-foreground">Trocar senha</h2>
        <form action={handlePassword} className="space-y-3">
          <input
            name="currentPassword"
            type="password"
            required
            placeholder="Senha atual"
            className="w-full rounded-md border border-border px-3 py-2 text-sm outline-none focus:border-primary"
          />
          <input
            name="newPassword"
            type="password"
            required
            minLength={6}
            placeholder="Nova senha"
            className="w-full rounded-md border border-border px-3 py-2 text-sm outline-none focus:border-primary"
          />
          <input
            name="confirmPassword"
            type="password"
            required
            minLength={6}
            placeholder="Confirmar nova senha"
            className="w-full rounded-md border border-border px-3 py-2 text-sm outline-none focus:border-primary"
          />
          {passwordErr && <p className="text-sm text-danger">{passwordErr}</p>}
          {passwordMsg && <p className="text-sm text-primary">{passwordMsg}</p>}
          <button
            type="submit"
            disabled={isPending}
            className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-60"
          >
            Trocar senha
          </button>
        </form>
      </section>
    </div>
  );
}
