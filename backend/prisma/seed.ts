import { PrismaClient, Prisma } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const church = await prisma.church.upsert({
    where: { slug: 'demo-church' },
    update: {},
    create: {
      name: 'Igreja Demo',
      slug: 'demo-church',
      email: 'contato@demo-church.com.br',
      phone: '(11) 9 9999-9999',
      address: 'Rua das Flores, 123 — São Paulo, SP',
      denomination: 'Assembleia de Deus',
      serviceHours: 'Domingo 18h, Quarta 19h30',
    },
  });

  const users: Array<{ email: string; password: string; name: string; role: 'ADMIN' | 'PASTOR' | 'TREASURER' | 'SECRETARY' }> = [
    { email: 'admin@demo-church.com.br', password: 'Admin@2024', name: 'Administrador', role: 'ADMIN' },
    { email: 'pastor@demo-church.com.br', password: 'Pastor@2024', name: 'Pastor Demo', role: 'PASTOR' },
    { email: 'tesoureiro@demo-church.com.br', password: 'Tesoureiro@2024', name: 'Tesoureiro Demo', role: 'TREASURER' },
    { email: 'secretaria@demo-church.com.br', password: 'Secretaria@2024', name: 'Secretária Demo', role: 'SECRETARY' },
  ];

  for (const u of users) {
    const passwordHash = await bcrypt.hash(u.password, 10);
    await prisma.user.upsert({
      where: { email: u.email },
      update: { passwordHash, name: u.name, role: u.role, active: true, churchId: church.id },
      create: {
        churchId: church.id,
        email: u.email,
        passwordHash,
        name: u.name,
        role: u.role,
        active: true,
      },
    });
  }

  const cellCount = await prisma.cell.count({ where: { churchId: church.id } });
  if (cellCount === 0) {
    const cell = await prisma.cell.create({
      data: {
        churchId: church.id,
        name: 'Célula Central',
        dayOfWeek: 'Quinta',
        time: '20:00',
        neighborhood: 'Centro',
        address: 'Rua das Acácias, 45',
        capacity: 20,
      },
    });

    await prisma.member.createMany({
      data: [
        { churchId: church.id, name: 'João da Silva', email: 'joao@exemplo.com', phone: '(11) 98888-1111', status: 'ACTIVE', role: 'MEMBER', cellId: cell.id, joinedAt: new Date('2022-03-10') },
        { churchId: church.id, name: 'Maria Souza', email: 'maria@exemplo.com', phone: '(11) 98888-2222', status: 'ACTIVE', role: 'DEACON', cellId: cell.id, joinedAt: new Date('2021-07-22') },
        { churchId: church.id, name: 'Pedro Santos', phone: '(11) 98888-3333', status: 'VISITOR', joinedAt: new Date('2024-01-15') },
      ],
    });

    const incomeAmt = new Prisma.Decimal(1500);
    const expenseAmt = new Prisma.Decimal(420.5);
    await prisma.transaction.createMany({
      data: [
        { churchId: church.id, type: 'INCOME', category: 'Dízimos', amount: incomeAmt, date: new Date(), description: 'Dízimos do mês' },
        { churchId: church.id, type: 'INCOME', category: 'Ofertas', amount: new Prisma.Decimal(640), date: new Date() },
        { churchId: church.id, type: 'EXPENSE', category: 'Despesas', amount: expenseAmt, date: new Date(), description: 'Conta de luz' },
      ],
    });

    await prisma.event.create({
      data: {
        churchId: church.id,
        name: 'Culto de Celebração',
        date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
        location: 'Templo Sede',
        type: 'Culto',
        capacity: 200,
      },
    });
  }

  // Membro COM acesso ao portal. Sem isto não dá para abrir o portal em
  // desenvolvimento: os membros acima não têm senha, e o cadastro pelo site
  // nasce PENDING (precisa de aprovação de um admin).
  const membroSenha = 'Membro@2024';
  const membroEmail = 'membro@demo-church.com.br';
  await prisma.member.upsert({
    where: { id: 'seed-membro-portal' },
    update: {
      passwordHash: await bcrypt.hash(membroSenha, 10),
      portalStatus: 'APPROVED',
    },
    create: {
      id: 'seed-membro-portal',
      churchId: church.id,
      name: 'Membro do Portal',
      email: membroEmail,
      phone: '(11) 98888-0000',
      passwordHash: await bcrypt.hash(membroSenha, 10),
      portalStatus: 'APPROVED',
      status: 'ACTIVE',
      role: 'MEMBER',
      gender: 'MALE',
      birthDate: new Date('1990-05-10T12:00:00Z'),
    },
  });

  console.log('Seed concluído. Igreja: %s', church.name);
  console.log(
    'Portal do membro: /portal/%s — %s / %s',
    church.slug,
    membroEmail,
    membroSenha,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
