import "dotenv/config";
import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/prisma";

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL ?? "jo@jotastudio.com";
  const password = process.env.SEED_ADMIN_PASSWORD ?? "jota123";
  const name = process.env.SEED_ADMIN_NAME ?? "Jô";

  const existing = await prisma.staffUser.findUnique({ where: { email } });
  if (existing) {
    console.log(`Usuária já existe: ${email}`);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.staffUser.create({
    data: { name, email, passwordHash },
  });

  console.log("Usuária criada:");
  console.log(`  e-mail: ${email}`);
  console.log(`  senha:  ${password}`);
  console.log("Troque a senha após o primeiro login.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
