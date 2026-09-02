import { prisma } from './db';
import type { Epic, User, Team, StrategicPillar, StrategicObjective, Theme, Dependency } from './types';

/**
 * EpicFlow data store — Postgres-backed via Prisma.
 *
 * This replaced an earlier JSON-file-based store. That worked fine for local
 * dev but doesn't survive on serverless hosts (Vercel functions have a
 * read-only filesystem outside /tmp, and /tmp itself doesn't persist between
 * invocations) or in browser-sandboxed dev environments like StackBlitz's
 * WebContainer. This module keeps the exact same function signatures the
 * rest of the app already calls — every function is now async, backed by a
 * real database, so data survives restarts, redeploys, and multiple users.
 */

export interface PortfolioData {
  users: User[];
  teams: Team[];
  pillars: StrategicPillar[];
  objectives: StrategicObjective[];
  themes: Theme[];
  epics: Epic[];
  dependencies: Dependency[];
}

export interface JiraConnection {
  baseUrl: string;
  email: string;
  apiToken: string;
  projectKey: string;
  jql?: string;
  lastSyncedAt?: string;
}

// --- Prisma <-> app-type mapping helpers -----------------------------------
// Prisma returns `null` for empty optional fields; the app's types use
// `undefined`. Both are falsy so most code doesn't care, but this keeps the
// shapes clean and consistent with how the app was originally written.

function mapEpic(e: any): Epic {
  return {
    id: e.id,
    epicKey: e.epicKey,
    title: e.title,
    description: e.description ?? '',
    productArea: e.productArea,
    status: e.status,
    ownerId: e.ownerId ?? undefined,
    themeId: e.themeId ?? undefined,
    pillarId: e.pillarId ?? undefined,
    objectiveId: e.objectiveId ?? undefined,
    teamId: e.teamId ?? undefined,
    targetQuarter: e.targetQuarter ?? undefined,
    targetYear: e.targetYear ?? undefined,
    riskLevel: e.riskLevel,
    storyPoints: e.storyPoints ?? undefined,
    tShirtSize: e.tShirtSize ?? undefined,
    expectedDurationWeeks: e.expectedDurationWeeks ?? undefined,
    component: e.component ?? undefined,
    fixVersion: e.fixVersion ?? undefined,
    priorityRank: e.priorityRank ?? undefined,
    matrixValue: e.matrixValue ?? undefined,
    matrixEffort: e.matrixEffort ?? undefined,
    reach: e.reach ?? undefined,
    impact: e.impact ?? undefined,
    confidence: e.confidence ?? undefined,
    effort: e.effort ?? undefined,
    businessValue: e.businessValue ?? undefined,
    timeCriticality: e.timeCriticality ?? undefined,
    riskReduction: e.riskReduction ?? undefined,
    jobSize: e.jobSize ?? undefined,
    revenueImpact: e.revenueImpact ?? undefined,
    customerImpact: e.customerImpact ?? undefined,
    strategicAlignment: e.strategicAlignment ?? undefined,
    competitivePressure: e.competitivePressure ?? undefined,
    riskScore: e.riskScore ?? undefined,
    engineeringComplexity: e.engineeringComplexity ?? undefined,
    alignment: (e.alignment as Epic['alignment']) ?? undefined,
    tags: e.tags ?? [],
    notes: e.notes ?? undefined,
    createdAt: (e.createdAt instanceof Date ? e.createdAt.toISOString() : e.createdAt) ?? new Date().toISOString(),
  };
}

function mapUser(u: any): User {
  return { id: u.id, name: u.name, email: u.email, role: u.role, productAreas: u.productAreas ?? [] };
}

function mapTeam(t: any): Team {
  return {
    id: t.id, name: t.name, manager: t.manager ?? '', capacity: t.capacity, velocity: t.velocity,
    availableEngineers: t.availableEngineers, availablePMs: t.availablePMs,
    designCapacity: t.designCapacity, qaCapacity: t.qaCapacity,
  };
}

function mapPillar(p: any): StrategicPillar {
  return { id: p.id, name: p.name };
}

function mapObjective(o: any): StrategicObjective {
  return {
    id: o.id, title: o.title, description: o.description ?? '', executiveOwner: o.executiveOwnerId ?? '',
    startDate: (o.startDate instanceof Date ? o.startDate.toISOString() : o.startDate),
    endDate: (o.endDate instanceof Date ? o.endDate.toISOString() : o.endDate),
    weight: o.weight, pillarId: o.pillarId ?? '',
  };
}

function mapTheme(t: any): Theme {
  return { id: t.id, name: t.name };
}

function mapDependency(d: any): Dependency {
  return {
    id: d.id, sourceEpicId: d.sourceEpicId, targetEpicId: d.targetEpicId,
    dependencyType: d.dependencyType, status: d.status, notes: d.notes ?? undefined,
  };
}

// --- Reads -------------------------------------------------------------

export async function readPortfolio(): Promise<PortfolioData> {
  const [users, teams, pillars, objectives, themes, epics, dependencies] = await Promise.all([
    prisma.user.findMany(),
    prisma.team.findMany(),
    prisma.strategicPillar.findMany(),
    prisma.strategicObjective.findMany(),
    prisma.theme.findMany(),
    prisma.epic.findMany(),
    prisma.dependency.findMany(),
  ]);

  return {
    users: users.map(mapUser),
    teams: teams.map(mapTeam),
    pillars: pillars.map(mapPillar),
    objectives: objectives.map(mapObjective),
    themes: themes.map(mapTheme),
    epics: epics.map(mapEpic),
    dependencies: dependencies.map(mapDependency),
  };
}

// --- Writes --------------------------------------------------------------

export async function clearPortfolio() {
  // Dependencies/scores/etc cascade from Epic via onDelete: Cascade in the
  // schema, so deleting epics is enough. Non-epic reference data (teams,
  // pillars, themes, objectives) is left in place deliberately — those are
  // portfolio configuration, not imported epic data.
  await prisma.epic.deleteMany({});
}

/** Merges new epics into the store, keyed by epicKey. In 'append' mode,
 *  existing rows are updated (not replaced) so re-importing a source file
 *  to pick up new fields never wipes manual work like priorityRank or
 *  matrixValue/matrixEffort set from drag-and-drop inside EpicFlow. */
export async function upsertEpics(newEpics: Epic[], mode: 'append' | 'replace' = 'append'): Promise<Epic[]> {
  if (mode === 'replace') {
    await prisma.epic.deleteMany({});
  }

  for (const e of newEpics) {
    const data = {
      epicKey: e.epicKey,
      title: e.title,
      description: e.description,
      productArea: e.productArea,
      status: e.status,
      ownerId: e.ownerId ?? null,
      themeId: e.themeId ?? null,
      pillarId: e.pillarId ?? null,
      objectiveId: e.objectiveId ?? null,
      teamId: e.teamId ?? null,
      targetQuarter: e.targetQuarter ?? null,
      targetYear: e.targetYear ?? null,
      riskLevel: e.riskLevel,
      storyPoints: e.storyPoints ?? null,
      tShirtSize: e.tShirtSize ?? null,
      expectedDurationWeeks: e.expectedDurationWeeks ?? null,
      component: e.component ?? null,
      fixVersion: e.fixVersion ?? null,
      tags: e.tags ?? [],
      notes: e.notes ?? null,
    };

    await prisma.epic.upsert({
      where: { epicKey: e.epicKey },
      create: { id: e.id, ...data, createdAt: new Date(e.createdAt) },
      // Deliberately NOT touching priorityRank/matrixValue/matrixEffort/scoring
      // fields on update — those are set from inside EpicFlow (drag-and-drop,
      // manual scoring) and re-importing the source file shouldn't clobber them.
      update: data,
    });
  }

  return (await prisma.epic.findMany()).map(mapEpic);
}

export async function upsertUsers(newUsers: User[]): Promise<User[]> {
  for (const u of newUsers) {
    await prisma.user.upsert({
      where: { email: u.email },
      create: { id: u.id, name: u.name, email: u.email, role: u.role, productAreas: u.productAreas },
      update: { name: u.name, productAreas: u.productAreas },
    });
  }
  return (await prisma.user.findMany()).map(mapUser);
}

export async function upsertTeams(newTeams: Team[]): Promise<Team[]> {
  for (const t of newTeams) {
    await prisma.team.upsert({
      where: { name: t.name },
      create: { ...t },
      update: {},
    });
  }
  return (await prisma.team.findMany()).map(mapTeam);
}

export async function reorderEpics(orderedIds: string[]): Promise<Epic[]> {
  await Promise.all(
    orderedIds.map((id, i) => prisma.epic.update({ where: { id }, data: { priorityRank: i } }).catch(() => null))
  );
  return (await prisma.epic.findMany()).map(mapEpic);
}

export async function bulkClassifyEpics(epicIds: string[], matrixValue: number, matrixEffort: number): Promise<Epic[]> {
  await prisma.epic.updateMany({ where: { id: { in: epicIds } }, data: { matrixValue, matrixEffort } });
  return (await prisma.epic.findMany()).map(mapEpic);
}

export async function deleteEpicById(id: string): Promise<Epic[]> {
  await prisma.epic.delete({ where: { id } }).catch(() => null);
  return (await prisma.epic.findMany()).map(mapEpic);
}

export async function loadSampleData() {
  const sample = await import('./sample-data');

  await prisma.epic.deleteMany({});

  for (const u of sample.users) {
    await prisma.user.upsert({
      where: { email: u.email },
      create: { id: u.id, name: u.name, email: u.email, role: u.role, productAreas: u.productAreas },
      update: {},
    });
  }
  for (const t of sample.teams) {
    await prisma.team.upsert({ where: { name: t.name }, create: { ...t }, update: {} });
  }
  for (const p of sample.pillars) {
    await prisma.strategicPillar.upsert({ where: { name: p.name }, create: { id: p.id, name: p.name }, update: {} });
  }
  for (const th of sample.themes) {
    await prisma.theme.upsert({ where: { name: th.name }, create: { id: th.id, name: th.name }, update: {} });
  }
  for (const o of sample.objectives) {
    const owner = sample.users.find((u: User) => u.role === 'PORTFOLIO_MANAGER') ?? sample.users[0];
    await prisma.strategicObjective.upsert({
      where: { id: o.id },
      create: {
        id: o.id, title: o.title, description: o.description, executiveOwnerId: owner.id,
        startDate: new Date(o.startDate), endDate: new Date(o.endDate), weight: o.weight, pillarId: o.pillarId,
      },
      update: {},
    });
  }
  for (const e of sample.epics) {
    await prisma.epic.upsert({
      where: { epicKey: e.epicKey },
      create: {
        id: e.id, epicKey: e.epicKey, title: e.title, description: e.description, productArea: e.productArea,
        status: e.status, ownerId: e.ownerId, themeId: e.themeId, pillarId: e.pillarId, objectiveId: e.objectiveId,
        teamId: e.teamId, targetQuarter: e.targetQuarter, targetYear: e.targetYear, riskLevel: e.riskLevel,
        storyPoints: e.storyPoints, tShirtSize: e.tShirtSize, expectedDurationWeeks: e.expectedDurationWeeks,
        tags: e.tags, reach: e.reach, impact: e.impact, confidence: e.confidence, effort: e.effort,
        businessValue: e.businessValue, timeCriticality: e.timeCriticality, riskReduction: e.riskReduction,
        jobSize: e.jobSize, revenueImpact: e.revenueImpact, customerImpact: e.customerImpact,
        strategicAlignment: e.strategicAlignment, competitivePressure: e.competitivePressure,
        riskScore: e.riskScore, engineeringComplexity: e.engineeringComplexity, alignment: e.alignment ?? undefined,
      },
      update: {},
    });
  }
  for (const d of sample.dependencies) {
    await prisma.dependency.upsert({
      where: { id: d.id },
      create: { id: d.id, sourceEpicId: d.sourceEpicId, targetEpicId: d.targetEpicId, dependencyType: d.dependencyType, status: d.status, notes: d.notes },
      update: {},
    });
  }
}

// --- Jira connection config (its own table, singleton row) ---

export async function readJiraConnection(): Promise<JiraConnection | null> {
  const row = await prisma.jiraConnection.findUnique({ where: { id: 'singleton' } });
  if (!row) return null;
  return {
    baseUrl: row.baseUrl,
    email: row.email,
    apiToken: row.apiToken,
    projectKey: row.projectKey,
    jql: row.jql ?? undefined,
    lastSyncedAt: row.lastSyncedAt?.toISOString(),
  };
}

export async function writeJiraConnection(conn: JiraConnection) {
  await prisma.jiraConnection.upsert({
    where: { id: 'singleton' },
    create: {
      id: 'singleton', baseUrl: conn.baseUrl, email: conn.email, apiToken: conn.apiToken,
      projectKey: conn.projectKey, jql: conn.jql, lastSyncedAt: conn.lastSyncedAt ? new Date(conn.lastSyncedAt) : null,
    },
    update: {
      baseUrl: conn.baseUrl, email: conn.email, apiToken: conn.apiToken, projectKey: conn.projectKey,
      jql: conn.jql, lastSyncedAt: conn.lastSyncedAt ? new Date(conn.lastSyncedAt) : null,
    },
  });
}
