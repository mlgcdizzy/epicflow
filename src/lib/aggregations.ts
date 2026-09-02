import type { Epic, Team, StrategicPillar } from './types';
import { scoreRICE, scorePortfolioHealth, capacityRisk, scoreAlignment } from './prioritization';

export function executiveSummary(epics: Epic[]) {
  const total = epics.length;
  const active = epics.filter((e) => !['RELEASED', 'CANCELLED'].includes(e.status)).length;
  const blocked = epics.filter((e) => e.status === 'BLOCKED').length;
  const committed = epics.filter((e) => e.status === 'COMMITTED').length;
  const completedThisQuarter = epics.filter((e) => e.status === 'RELEASED' && e.targetQuarter === 'Q3').length;

  return { total, active, blocked, committed, completedThisQuarter };
}

export function statusDistribution(epics: Epic[]) {
  const counts: Record<string, number> = {};
  for (const e of epics) counts[e.status] = (counts[e.status] ?? 0) + 1;
  return Object.entries(counts).map(([status, count]) => ({ status, count }));
}

export function priorityDistribution(epics: Epic[]) {
  const buckets = [
    { label: '0-5', min: 0, max: 5, count: 0 },
    { label: '5-10', min: 5, max: 10, count: 0 },
    { label: '10-20', min: 10, max: 20, count: 0 },
    { label: '20-50', min: 20, max: 50, count: 0 },
    { label: '50+', min: 50, max: Infinity, count: 0 },
  ];
  for (const e of epics) {
    const score = scoreRICE(e);
    if (score == null) continue;
    const bucket = buckets.find((b) => score >= b.min && score < b.max);
    if (bucket) bucket.count += 1;
  }
  return buckets;
}

export function strategicAlignmentByPillar(epics: Epic[], pillars: StrategicPillar[]) {
  return pillars.map((pillar) => {
    const pillarEpics = epics.filter((e) => e.pillarId === pillar.id && e.alignment);
    const avg =
      pillarEpics.length > 0
        ? pillarEpics.reduce((sum, e) => sum + scoreAlignment(e.alignment!), 0) / pillarEpics.length
        : 0;
    return { pillar: pillar.name, score: Math.round(avg * 10) / 10, epicCount: pillarEpics.length };
  });
}

export function capacityUtilizationByTeam(epics: Epic[], teams: Team[]) {
  return teams.map((team) => {
    const committedLoad = epics
      .filter((e) => e.teamId === team.id && ['COMMITTED', 'IN_PROGRESS'].includes(e.status))
      .reduce((sum, e) => sum + (e.storyPoints ?? 0), 0);
    const risk = capacityRisk({ teamName: team.name, availableCapacity: team.capacity, committedLoad });
    return { team: team.name, capacity: team.capacity, committedLoad, ...risk };
  });
}

export function portfolioHealth(epics: Epic[], teams: Team[]) {
  const withAlignment = epics.filter((e) => e.alignment);
  const alignmentAvg =
    withAlignment.length > 0
      ? withAlignment.reduce((sum, e) => sum + scoreAlignment(e.alignment!), 0) / withAlignment.length
      : 0;

  const priorityQuality = epics.length > 0 ? epics.filter((e) => scoreRICE(e) != null).length / epics.length : 0;

  // Dependency risk is a placeholder constant until dependency data volume is
  // large enough to compute a real blocked/at-risk ratio; wire this to
  // `dependencies` once you have enough of them to be meaningful.
  const dependencyRisk = epics.length > 0 ? 0.78 : 1;

  const releasedOnTarget = epics.filter((e) => e.status === 'RELEASED').length;
  const committedTotal = epics.filter((e) => ['COMMITTED', 'IN_PROGRESS', 'RELEASED'].includes(e.status)).length;
  const deliveryProgress = committedTotal > 0 ? releasedOnTarget / committedTotal : 0;

  const utilization = capacityUtilizationByTeam(epics, teams);
  const resourceAvailability =
    utilization.length > 0
      ? 1 - utilization.reduce((sum, t) => sum + Math.max(0, t.utilization / 100 - 1), 0) / utilization.length
      : 1;

  return scorePortfolioHealth({
    strategicAlignment: alignmentAvg,
    priorityQuality,
    dependencyRisk,
    deliveryProgress,
    resourceAvailability,
  });
}

export function burnUpSeries(epics: Epic[]) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const releasedByMonth = new Array(12).fill(0);
  epics
    .filter((e) => e.status === 'RELEASED')
    .forEach((e) => {
      const m = new Date(e.createdAt).getMonth();
      releasedByMonth[m] += 1;
    });

  const committedTotal = epics.filter((e) => e.status !== 'CANCELLED').length;
  let cumulative = 0;
  return months.map((month, i) => {
    cumulative += releasedByMonth[i];
    return { month, completed: cumulative, scope: committedTotal };
  });
}
