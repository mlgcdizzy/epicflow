/**
 * EpicFlow prioritization engine.
 *
 * Pure, side-effect-free scoring functions so they can be unit tested,
 * run on the server (API routes) or client (live matrix re-scoring),
 * and reused by the AI prioritization assistant as a "ground truth"
 * the model's suggestions are checked against.
 */

import type { Epic } from './types';

// ---------------------------------------------------------------------------
// Model 1: RICE — (Reach x Impact x Confidence) / Effort
// ---------------------------------------------------------------------------
export function scoreRICE(epic: Pick<Epic, 'reach' | 'impact' | 'confidence' | 'effort'>): number | null {
  const { reach, impact, confidence, effort } = epic;
  if (reach == null || impact == null || confidence == null || !effort) return null;
  if (effort <= 0) return null;
  return (reach * impact * confidence) / effort;
}

// ---------------------------------------------------------------------------
// Model 2: WSJF — (Business Value + Time Criticality + Risk Reduction) / Job Size
// ---------------------------------------------------------------------------
export function scoreWSJF(
  epic: Pick<Epic, 'businessValue' | 'timeCriticality' | 'riskReduction' | 'jobSize'>
): number | null {
  const { businessValue, timeCriticality, riskReduction, jobSize } = epic;
  if (businessValue == null || timeCriticality == null || riskReduction == null || !jobSize) return null;
  if (jobSize <= 0) return null;
  return (businessValue + timeCriticality + riskReduction) / jobSize;
}

// ---------------------------------------------------------------------------
// Model 3: Product Value Score (Custom, weighted)
// ((Revenue*0.25) + (Customer*0.25) + (Strategy*0.20) + (Competitive*0.15) + (Risk*0.15)) / Complexity
// ---------------------------------------------------------------------------
export function scoreCustom(
  epic: Pick<
    Epic,
    'revenueImpact' | 'customerImpact' | 'strategicAlignment' | 'competitivePressure' | 'riskScore' | 'engineeringComplexity'
  >
): number | null {
  const {
    revenueImpact,
    customerImpact,
    strategicAlignment,
    competitivePressure,
    riskScore,
    engineeringComplexity,
  } = epic;
  if (
    revenueImpact == null ||
    customerImpact == null ||
    strategicAlignment == null ||
    competitivePressure == null ||
    riskScore == null ||
    !engineeringComplexity
  ) {
    return null;
  }
  if (engineeringComplexity <= 0) return null;

  const weighted =
    revenueImpact * 0.25 +
    customerImpact * 0.25 +
    strategicAlignment * 0.2 +
    competitivePressure * 0.15 +
    riskScore * 0.15;

  return weighted / engineeringComplexity;
}

export type ScoringModelKey = 'RICE' | 'WSJF' | 'CUSTOM';

export function scoreEpic(epic: Epic, model: ScoringModelKey): number | null {
  switch (model) {
    case 'RICE':
      return scoreRICE(epic);
    case 'WSJF':
      return scoreWSJF(epic);
    case 'CUSTOM':
      return scoreCustom(epic);
  }
}

/** Normalizes any model's raw score to 0-100 against the full epic set, for cross-model comparison in the UI. */
export function normalizeScores(scores: Array<number | null>): Array<number | null> {
  const valid = scores.filter((s): s is number => s != null && Number.isFinite(s));
  if (valid.length === 0) return scores.map(() => null);
  const max = Math.max(...valid);
  const min = Math.min(...valid);
  const range = max - min || 1;
  return scores.map((s) => (s == null ? null : Math.round(((s - min) / range) * 100)));
}

// ---------------------------------------------------------------------------
// Strategic Alignment Score
// (Corporate Goal + Business Goal + OKR + Pillar) / 4, scale 1-5
// ---------------------------------------------------------------------------
export interface AlignmentInputs {
  corporateGoal: number; // 1-5
  businessGoal: number; // 1-5
  okr: number; // 1-5
  pillar: number; // 1-5
}

export function scoreAlignment(inputs: AlignmentInputs): number {
  const { corporateGoal, businessGoal, okr, pillar } = inputs;
  return round1((corporateGoal + businessGoal + okr + pillar) / 4);
}

// ---------------------------------------------------------------------------
// Portfolio Health Score
// Strategic Alignment 25% + Priority Quality 20% + Dependency Risk 15%
//  + Delivery Progress 20% + Resource Availability 20%  -> 0-100
// ---------------------------------------------------------------------------
export interface HealthScoreInputs {
  /** Average alignment score across active epics, 1-5 */
  strategicAlignment: number;
  /** Share of epics with a complete, non-stale prioritization score, 0-1 */
  priorityQuality: number;
  /** 1 = no dependency risk, 0 = fully blocked network, 0-1 */
  dependencyRisk: number;
  /** Share of committed work delivered on schedule this period, 0-1 */
  deliveryProgress: number;
  /** Available capacity vs. committed load, capped at 1.0 (>=1 is healthy) */
  resourceAvailability: number;
}

export function scorePortfolioHealth(inputs: HealthScoreInputs): {
  score: number;
  band: 'green' | 'yellow' | 'red';
  breakdown: Record<keyof HealthScoreInputs, number>;
} {
  const alignmentPct = inputs.strategicAlignment / 5; // normalize 1-5 -> 0-1

  const weighted = {
    strategicAlignment: alignmentPct * 25,
    priorityQuality: inputs.priorityQuality * 20,
    dependencyRisk: inputs.dependencyRisk * 15,
    deliveryProgress: inputs.deliveryProgress * 20,
    resourceAvailability: Math.min(inputs.resourceAvailability, 1) * 20,
  };

  const score = Math.round(
    weighted.strategicAlignment +
      weighted.priorityQuality +
      weighted.dependencyRisk +
      weighted.deliveryProgress +
      weighted.resourceAvailability
  );

  const band = score >= 75 ? 'green' : score >= 50 ? 'yellow' : 'red';

  return { score, band, breakdown: weighted };
}

// ---------------------------------------------------------------------------
// Priority Matrix quadrant classification (Value x Effort)
// ---------------------------------------------------------------------------
export type Quadrant = 'quick-wins' | 'major-projects' | 'fill-ins' | 'avoid';

export function classifyQuadrant(value: number, effort: number, valueMid: number, effortMid: number): Quadrant {
  const highValue = value >= valueMid;
  const highEffort = effort >= effortMid;
  if (highValue && !highEffort) return 'quick-wins';
  if (highValue && highEffort) return 'major-projects';
  if (!highValue && !highEffort) return 'fill-ins';
  return 'avoid';
}

export const QUADRANT_LABELS: Record<Quadrant, string> = {
  'quick-wins': 'Quick Wins',
  'major-projects': 'Major Projects',
  'fill-ins': 'Fill Ins',
  avoid: 'Avoid',
};

// ---------------------------------------------------------------------------
// Capacity planning
// ---------------------------------------------------------------------------
export interface CapacitySnapshot {
  teamName: string;
  availableCapacity: number; // points/period
  committedLoad: number; // points/period from committed+in-progress epics
}

export function capacityRisk(snapshot: CapacitySnapshot): {
  utilization: number; // committed / available, can exceed 1
  status: 'under' | 'healthy' | 'at-risk' | 'over';
} {
  const utilization = snapshot.availableCapacity > 0 ? snapshot.committedLoad / snapshot.availableCapacity : Infinity;
  let status: 'under' | 'healthy' | 'at-risk' | 'over';
  if (utilization < 0.6) status = 'under';
  else if (utilization <= 0.9) status = 'healthy';
  else if (utilization <= 1.1) status = 'at-risk';
  else status = 'over';
  return { utilization: round1(utilization * 100), status };
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
