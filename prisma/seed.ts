/**
 * Seeds a real Postgres database with the same demo portfolio used by the
 * in-memory mock data layer, so `npm run db:seed` gives you a working
 * dataset the moment DATABASE_URL points at a live instance.
 *
 * Run with: npm run db:seed  (after `npm run db:migrate`)
 */
import { PrismaClient, Role, EpicStatus, RiskLevel, TShirtSize } from '@prisma/client';
import { users, teams, pillars, objectives, themes, epics, dependencies } from '../src/lib/sample-data';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding EpicFlow demo data…');

  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role as Role,
        productAreas: u.productAreas,
      },
    });
  }

  for (const t of teams) {
    await prisma.team.upsert({
      where: { name: t.name },
      update: {},
      create: { ...t, id: t.id },
    });
  }

  for (const p of pillars) {
    await prisma.strategicPillar.upsert({ where: { name: p.name }, update: {}, create: { id: p.id, name: p.name } });
  }

  for (const th of themes) {
    await prisma.theme.upsert({ where: { name: th.name }, update: {}, create: { id: th.id, name: th.name } });
  }

  for (const o of objectives) {
    await prisma.strategicObjective.upsert({
      where: { id: o.id },
      update: {},
      create: {
        id: o.id,
        title: o.title,
        description: o.description,
        executiveOwnerId: users[3].id, // demo: assign to portfolio manager
        startDate: new Date(o.startDate),
        endDate: new Date(o.endDate),
        weight: o.weight,
        pillarId: o.pillarId,
      },
    });
  }

  for (const e of epics) {
    await prisma.epic.upsert({
      where: { epicKey: e.epicKey },
      update: {},
      create: {
        id: e.id,
        epicKey: e.epicKey,
        title: e.title,
        description: e.description,
        productArea: e.productArea,
        status: e.status as EpicStatus,
        ownerId: e.ownerId,
        themeId: e.themeId,
        pillarId: e.pillarId,
        objectiveId: e.objectiveId,
        teamId: e.teamId,
        targetQuarter: e.targetQuarter,
        targetYear: e.targetYear,
        riskLevel: e.riskLevel as RiskLevel,
        storyPoints: e.storyPoints,
        tShirtSize: e.tShirtSize as TShirtSize | undefined,
        expectedDurationWeeks: e.expectedDurationWeeks,
        tags: e.tags,
        reach: e.reach,
        impact: e.impact,
        confidence: e.confidence,
        effort: e.effort,
        businessValue: e.businessValue,
        timeCriticality: e.timeCriticality,
        riskReduction: e.riskReduction,
        jobSize: e.jobSize,
        revenueImpact: e.revenueImpact,
        customerImpact: e.customerImpact,
        strategicAlignment: e.strategicAlignment,
        competitivePressure: e.competitivePressure,
        riskScore: e.riskScore,
        engineeringComplexity: e.engineeringComplexity,
      },
    });
  }

  for (const d of dependencies) {
    await prisma.dependency.upsert({
      where: { id: d.id },
      update: {},
      create: {
        id: d.id,
        sourceEpicId: d.sourceEpicId,
        targetEpicId: d.targetEpicId,
        dependencyType: d.dependencyType,
        status: d.status,
        notes: d.notes,
      },
    });
  }

  console.log('Seed complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
