import type { Epic, User, Team, StrategicPillar, StrategicObjective, Theme } from './types';

export function findEpicById(epics: Epic[], id: string): Epic | undefined {
  return epics.find((e) => e.id === id);
}

export function findOwnerName(users: User[], ownerId?: string): string {
  if (!ownerId) return 'Unassigned';
  return users.find((u) => u.id === ownerId)?.name ?? 'Unassigned';
}

export function findTeamName(teams: Team[], teamId?: string): string {
  if (!teamId) return 'Unassigned';
  return teams.find((t) => t.id === teamId)?.name ?? 'Unassigned';
}

export function findPillarName(pillars: StrategicPillar[], pillarId?: string): string {
  if (!pillarId) return '—';
  return pillars.find((p) => p.id === pillarId)?.name ?? '—';
}

export function findObjectiveTitle(objectives: StrategicObjective[], objectiveId?: string): string {
  if (!objectiveId) return '—';
  return objectives.find((o) => o.id === objectiveId)?.title ?? '—';
}

export function findThemeName(themes: Theme[], themeId?: string): string {
  if (!themeId) return '—';
  return themes.find((t) => t.id === themeId)?.name ?? '—';
}
