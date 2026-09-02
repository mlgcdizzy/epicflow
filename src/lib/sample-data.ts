import type {
  Epic,
  Team,
  StrategicPillar,
  StrategicObjective,
  Theme,
  User,
  Dependency,
  EpicStatus,
  RiskLevel,
} from './types';

export const users: User[] = [
  { id: 'u1', name: 'Priya Raman', email: 'priya.raman@epicflow.dev', role: 'ADMIN', productAreas: ['Platform', 'Payments'] },
  { id: 'u2', name: 'Daniel Ortega', email: 'daniel.ortega@epicflow.dev', role: 'PRODUCT_MANAGER', productAreas: ['Onboarding'] },
  { id: 'u3', name: 'Mei Lin', email: 'mei.lin@epicflow.dev', role: 'PRODUCT_MANAGER', productAreas: ['Analytics'] },
  { id: 'u4', name: 'Sam Whitfield', email: 'sam.whitfield@epicflow.dev', role: 'PORTFOLIO_MANAGER', productAreas: ['Platform', 'Payments', 'Onboarding', 'Analytics', 'Mobile'] },
  { id: 'u5', name: 'Aisha Bello', email: 'aisha.bello@epicflow.dev', role: 'PRODUCT_MANAGER', productAreas: ['Mobile'] },
];

export const teams: Team[] = [
  { id: 't1', name: 'Platform Core', manager: 'Rina Suzuki', capacity: 120, velocity: 108, availableEngineers: 9, availablePMs: 1, designCapacity: 20, qaCapacity: 30 },
  { id: 't2', name: 'Payments', manager: 'Marcus Idowu', capacity: 90, velocity: 95, availableEngineers: 7, availablePMs: 1, designCapacity: 10, qaCapacity: 22 },
  { id: 't3', name: 'Growth & Onboarding', manager: 'Elena Popescu', capacity: 80, velocity: 62, availableEngineers: 6, availablePMs: 1, designCapacity: 15, qaCapacity: 18 },
  { id: 't4', name: 'Analytics', manager: 'Josh Feldman', capacity: 60, velocity: 58, availableEngineers: 5, availablePMs: 1, designCapacity: 8, qaCapacity: 12 },
  { id: 't5', name: 'Mobile', manager: 'Nadia Haddad', capacity: 70, velocity: 40, availableEngineers: 5, availablePMs: 1, designCapacity: 12, qaCapacity: 14 },
];

export const pillars: StrategicPillar[] = [
  { id: 'p1', name: 'Scale the Platform' },
  { id: 'p2', name: 'Expand Payments' },
  { id: 'p3', name: 'Reduce Time to Value' },
  { id: 'p4', name: 'Trust & Compliance' },
];

export const objectives: StrategicObjective[] = [
  { id: 'o1', title: 'Support 10x transaction volume', description: 'Scale core infrastructure ahead of enterprise rollout.', executiveOwner: 'CTO', startDate: '2026-01-01', endDate: '2026-12-31', weight: 0.9, pillarId: 'p1' },
  { id: 'o2', title: 'Launch international payments', description: 'Enable multi-currency settlement in EU and APAC.', executiveOwner: 'CFO', startDate: '2026-03-01', endDate: '2026-12-31', weight: 0.85, pillarId: 'p2' },
  { id: 'o3', title: 'Cut activation time in half', description: 'Reduce median time-to-first-value for new accounts.', executiveOwner: 'CPO', startDate: '2026-01-01', endDate: '2026-09-30', weight: 0.75, pillarId: 'p3' },
  { id: 'o4', title: 'Achieve SOC 2 Type II', description: 'Close compliance gaps ahead of enterprise sales cycle.', executiveOwner: 'CISO', startDate: '2026-02-01', endDate: '2026-08-31', weight: 0.8, pillarId: 'p4' },
];

export const themes: Theme[] = [
  { id: 'th1', name: 'Reliability' },
  { id: 'th2', name: 'Self-serve' },
  { id: 'th3', name: 'Enterprise readiness' },
  { id: 'th4', name: 'International' },
  { id: 'th5', name: 'Mobile parity' },
];

const areas = ['Platform', 'Payments', 'Onboarding', 'Analytics', 'Mobile'];
const statuses: EpicStatus[] = ['IDEA', 'DISCOVERY', 'VALIDATED', 'PLANNED', 'COMMITTED', 'IN_PROGRESS', 'BLOCKED', 'RELEASED', 'CANCELLED'];
const risks: RiskLevel[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

const rand = seededRandom(42);
function pick<T>(arr: T[]): T {
  return arr[Math.floor(rand() * arr.length)];
}
function num(min: number, max: number): number {
  return Math.round((min + rand() * (max - min)) * 10) / 10;
}

const epicTitles = [
  'Multi-region database failover', 'Self-serve API key management', 'EU payment rail integration',
  'Onboarding checklist redesign', 'Real-time fraud scoring', 'Usage-based billing engine',
  'Audit log export for enterprise', 'Mobile offline mode', 'Role-based dashboard permissions',
  'Webhook delivery reliability', 'In-app upgrade flow', 'SSO for enterprise tenants',
  'Data residency controls (EU)', 'Automated dunning for failed payments', 'Customer health score model',
  'Bulk CSV import for accounts', 'Push notification infrastructure', 'Currency conversion at checkout',
  'Zero-downtime schema migrations', 'Guided setup wizard', 'Anomaly detection alerts',
  'Vendor risk assessment workflow', 'Native iOS biometric login', 'GraphQL public API v2',
  'Invoice customization for enterprise', 'Cross-team capacity forecasting', 'PCI DSS re-certification',
  'Marketplace app integrations', 'Dark mode across web app', 'Consolidated activity feed',
  'Tax calculation engine (APAC)', 'Team-based access reviews', 'Search relevance overhaul',
  'Subscription pause/resume', 'Data warehouse sync connector', 'Localization for 6 new languages',
  'Incident status page automation', 'Contract renewal automation', 'Android tablet layout',
  'Rate limiting per API key',
];

export const epics: Epic[] = epicTitles.map((title, i) => {
  const productArea = areas[i % areas.length];
  const status = pick(statuses.filter((s) => s !== 'CANCELLED') as EpicStatus[]);
  const owner = users.filter((u) => u.role === 'PRODUCT_MANAGER' || u.role === 'PORTFOLIO_MANAGER');
  const team = teams[areas.indexOf(productArea) % teams.length];

  return {
    id: `e${i + 1}`,
    epicKey: `EPIC-${1000 + i}`,
    title,
    description: `${title} — initiative to advance ${productArea.toLowerCase()} roadmap goals for the upcoming planning cycle.`,
    productArea,
    status,
    ownerId: pick(owner).id,
    themeId: pick(themes).id,
    pillarId: pick(pillars).id,
    objectiveId: pick(objectives).id,
    teamId: team.id,
    targetQuarter: pick(quarters),
    targetYear: 2026,
    riskLevel: pick(risks),
    storyPoints: Math.round(num(5, 60)),
    tShirtSize: pick(['XS', 'S', 'M', 'L', 'XL']),
    expectedDurationWeeks: Math.round(num(2, 16)),
    tags: [productArea.toLowerCase(), pick(themes).name.toLowerCase().replace(/\s+/g, '-')],
    notes: '',
    createdAt: new Date(2026, i % 8, (i % 27) + 1).toISOString(),

    reach: Math.round(num(200, 9000)),
    impact: num(0.5, 3),
    confidence: num(0.4, 1),
    effort: num(1, 12),

    businessValue: num(1, 10),
    timeCriticality: num(1, 10),
    riskReduction: num(1, 10),
    jobSize: num(1, 13),

    revenueImpact: num(1, 5),
    customerImpact: num(1, 5),
    strategicAlignment: num(1, 5),
    competitivePressure: num(1, 5),
    riskScore: num(1, 5),
    engineeringComplexity: num(1, 5),

    alignment: {
      corporateGoal: Math.round(num(1, 5)),
      businessGoal: Math.round(num(1, 5)),
      okr: Math.round(num(1, 5)),
      pillar: Math.round(num(1, 5)),
    },
  };
});

export const dependencies: Dependency[] = [
  { id: 'd1', sourceEpicId: 'e2', targetEpicId: 'e12', dependencyType: 'TECHNICAL', status: 'AT_RISK', notes: 'SSO must ship before self-serve API keys for enterprise tenants.' },
  { id: 'd2', sourceEpicId: 'e5', targetEpicId: 'e14', dependencyType: 'DATA', status: 'OPEN', notes: 'Fraud scoring feeds the dunning engine.' },
  { id: 'd3', sourceEpicId: 'e3', targetEpicId: 'e18', dependencyType: 'COMPLIANCE', status: 'BLOCKED', notes: 'EU payment rail blocked on data residency controls.' },
  { id: 'd4', sourceEpicId: 'e26', targetEpicId: 'e2', dependencyType: 'EXTERNAL_VENDOR', status: 'OPEN', notes: 'Marketplace apps depend on public API key management.' },
  { id: 'd5', sourceEpicId: 'e27', targetEpicId: 'e33', dependencyType: 'TECHNICAL', status: 'RESOLVED', notes: 'PCI re-cert unblocked by access review rollout.' },
  { id: 'd6', sourceEpicId: 'e31', targetEpicId: 'e13', dependencyType: 'BUSINESS', status: 'AT_RISK', notes: 'Tax engine timing tied to EU payment rail launch.' },
];

export function getEpicById(id: string): Epic | undefined {
  return epics.find((e) => e.id === id);
}

export function getOwnerName(ownerId: string): string {
  return users.find((u) => u.id === ownerId)?.name ?? 'Unassigned';
}

export function getTeamName(teamId?: string): string {
  return teams.find((t) => t.id === teamId)?.name ?? 'Unassigned';
}

export function getPillarName(pillarId?: string): string {
  return pillars.find((p) => p.id === pillarId)?.name ?? '—';
}

export function getObjectiveTitle(objectiveId?: string): string {
  return objectives.find((o) => o.id === objectiveId)?.title ?? '—';
}

export function getThemeName(themeId?: string): string {
  return themes.find((t) => t.id === themeId)?.name ?? '—';
}
