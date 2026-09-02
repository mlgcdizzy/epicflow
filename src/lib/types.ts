export type EpicStatus =
  | 'IDEA'
  | 'DISCOVERY'
  | 'VALIDATED'
  | 'PLANNED'
  | 'COMMITTED'
  | 'IN_PROGRESS'
  | 'BLOCKED'
  | 'RELEASED'
  | 'CANCELLED';

export const EPIC_STATUSES: EpicStatus[] = [
  'IDEA',
  'DISCOVERY',
  'VALIDATED',
  'PLANNED',
  'COMMITTED',
  'IN_PROGRESS',
  'BLOCKED',
  'RELEASED',
  'CANCELLED',
];

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type TShirtSize = 'XS' | 'S' | 'M' | 'L' | 'XL';
export type DependencyType = 'TECHNICAL' | 'BUSINESS' | 'COMPLIANCE' | 'DATA' | 'EXTERNAL_VENDOR';
export type DependencyStatus = 'OPEN' | 'AT_RISK' | 'RESOLVED' | 'BLOCKED';
export type Role = 'ADMIN' | 'PORTFOLIO_MANAGER' | 'PRODUCT_MANAGER' | 'READ_ONLY';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  productAreas: string[];
}

export interface Team {
  id: string;
  name: string;
  manager: string;
  capacity: number;
  velocity: number;
  availableEngineers: number;
  availablePMs: number;
  designCapacity: number;
  qaCapacity: number;
}

export interface StrategicPillar {
  id: string;
  name: string;
}

export interface StrategicObjective {
  id: string;
  title: string;
  description: string;
  executiveOwner: string;
  startDate: string;
  endDate: string;
  weight: number;
  pillarId: string;
}

export interface Dependency {
  id: string;
  sourceEpicId: string;
  targetEpicId: string;
  dependencyType: DependencyType;
  status: DependencyStatus;
  notes?: string;
}

export interface Epic {
  id: string;
  epicKey: string;
  title: string;
  description: string;
  productArea: string;
  status: EpicStatus;
  ownerId?: string;
  themeId?: string;
  pillarId?: string;
  objectiveId?: string;
  teamId?: string;
  targetQuarter?: string;
  targetYear?: number;
  riskLevel: RiskLevel;
  storyPoints?: number;
  tShirtSize?: TShirtSize;
  expectedDurationWeeks?: number;
  tags: string[];
  notes?: string;
  createdAt: string;

  // Raw classification signal captured from imports (e.g. Jira Component / Fix Version).
  // Used for grouping on the Epics page and the Prioritization Matrix when
  // formal scoring inputs (below) haven't been filled in yet.
  component?: string;
  fixVersion?: string;

  // Manual ordering, set by dragging rows on the Epics page.
  priorityRank?: number;

  // Manual/group-assigned position for the Prioritization Matrix. Distinct
  // from the RICE/WSJF/Custom scoring fields below — this is what you get
  // when you drag a group of otherwise-unscored epics onto the matrix.
  matrixValue?: number; // 1-10
  matrixEffort?: number; // 1-10

  // RICE
  reach?: number;
  impact?: number;
  confidence?: number;
  effort?: number;

  // WSJF
  businessValue?: number;
  timeCriticality?: number;
  riskReduction?: number;
  jobSize?: number;

  // Custom / Product Value Score
  revenueImpact?: number;
  customerImpact?: number;
  strategicAlignment?: number; // 1-5
  competitivePressure?: number;
  riskScore?: number;
  engineeringComplexity?: number;

  // Alignment sub-scores (1-5 each), feed scoreAlignment()
  alignment?: {
    corporateGoal: number;
    businessGoal: number;
    okr: number;
    pillar: number;
  };
}

export interface Theme {
  id: string;
  name: string;
}
