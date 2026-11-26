/**
 * Seed do Bolão TGA 2026.
 *
 * Rodar com: yarn prisma:seed   (ou: npx prisma db seed)
 *
 * É idempotente: pode rodar várias vezes sem duplicar nada.
 * - Categorias: criadas/atualizadas pelo slug.
 * - Indicados: criados/atualizados pelo par (categoria, nome).
 * - Settings: o horário de bloqueio é definido só na primeira execução;
 *   depois, o admin altera pela API (PATCH /api/settings).
 * - Admin: criado apenas se não existir; a senha NUNCA é alterada depois.
 */
import 'dotenv/config';
import { randomBytes } from 'node:crypto';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, Role } from '../src/generated/prisma/client';
import { normalizeEmail } from '../src/common/normalize';
import { hashPassword } from '../src/common/password';
import data from './seed-data/tga-2026.json';

// 10/12/2026 às 21h no horário de Brasília (UTC-3, sem horário de verão).
// A cerimônia começa às 21h30 de Brasília (19h30 ET).
const PREDICTIONS_LOCK_AT = new Date('2026-12-10T21:00:00-03:00');

// E-mail de login do admin. Pode ser sobrescrito com ADMIN_EMAIL no .env.
const ADMIN_EMAIL = normalizeEmail(
  process.env.ADMIN_EMAIL ?? 'admin@bolao.local',
);
const ADMIN_NAME = process.env.ADMIN_NAME ?? 'Administrador';

type SeedNominee = { name: string; subtitle?: string };
type SeedCategory = {
  slug: string;
  name: string;
  isGoty?: boolean;
  nominees: SeedNominee[];
};

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

async function seedCategories(categories: SeedCategory[]) {
  if (categories.filter((c) => c.isGoty).length !== 1) {
    throw new Error('O seed precisa ter exatamente uma categoria com isGoty.');
  }

  let nomineeCount = 0;
  for (const [index, cat] of categories.entries()) {
    const category = await prisma.category.upsert({
      where: { slug: cat.slug },
      create: {
        slug: cat.slug,
        name: cat.name,
        sortOrder: index + 1,
        isGoty: cat.isGoty ?? false,
      },
      update: {
        name: cat.name,
        sortOrder: index + 1,
        isGoty: cat.isGoty ?? false,
      },
    });

    for (const [nIndex, nom] of cat.nominees.entries()) {
      await prisma.nominee.upsert({
        where: {
          categoryId_name: { categoryId: category.id, name: nom.name },
        },
        create: {
          categoryId: category.id,
          name: nom.name,
          subtitle: nom.subtitle ?? null,
          sortOrder: nIndex + 1,
        },
        update: { subtitle: nom.subtitle ?? null, sortOrder: nIndex + 1 },
      });
      nomineeCount++;
    }

    // Avisa sobre indicados no banco que não estão mais no JSON
    // (ex.: nome corrigido). Não apaga automaticamente para não perder palpites.
    const orphans = await prisma.nominee.findMany({
      where: {
        categoryId: category.id,
        name: { notIn: cat.nominees.map((n) => n.name) },
      },
      select: { name: true },
    });
    for (const o of orphans) {
      console.warn(`  ! "${o.name}" (${cat.slug}) não está mais no JSON`);
    }
  }

  console.log(
    `✔ ${categories.length} categorias e ${nomineeCount} indicados sincronizados`,
  );
}

async function seedSettings() {
  // Só define o horário na primeira vez: depois disso ele é gerenciado
  // pelo admin (PATCH /api/settings) e o seed não deve sobrescrevê-lo.
  const settings = await prisma.settings.upsert({
    where: { id: 1 },
    create: { id: 1, predictionsLockAt: PREDICTIONS_LOCK_AT },
    update: {},
  });
  const brt =
    settings.predictionsLockAt?.toLocaleString('pt-BR', {
      timeZone: 'America/Sao_Paulo',
    }) ?? 'sem horário definido';
  console.log(`✔ Palpites bloqueiam em ${brt} (horário de Brasília)`);
}

async function seedAdmin() {
  const existing = await prisma.user.findUnique({
    where: { email: ADMIN_EMAIL },
  });
  if (existing) {
    console.log(`✔ Admin "${ADMIN_EMAIL}" já existe (senha mantida)`);
    return;
  }

  const fromEnv = process.env.ADMIN_PASSWORD;
  const password = fromEnv || randomBytes(12).toString('base64url');

  await prisma.user.create({
    data: {
      name: ADMIN_NAME,
      email: ADMIN_EMAIL,
      passwordHash: await hashPassword(password),
      role: Role.ADMIN,
    },
  });

  console.log(`✔ Admin "${ADMIN_EMAIL}" criado`);
  if (!fromEnv) {
    console.log('');
    console.log('  ┌──────────────────────────────────────────────────┐');
    console.log(`  │ Senha do admin: ${password.padEnd(33)}│`);
    console.log('  │ Guarde agora: ela não será exibida novamente.    │');
    console.log('  └──────────────────────────────────────────────────┘');
    console.log('');
  }
}

async function main() {
  console.log(`Seed: ${data.edition}`);
  await seedCategories(data.categories);
  await seedSettings();
  await seedAdmin();
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
