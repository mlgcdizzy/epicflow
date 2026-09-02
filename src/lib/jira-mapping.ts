import type { EpicStatus, RiskLevel } from './types';

// Shared between the live Jira REST API sync (src/app/api/import/jira) and
// the Jira CSV export importer (src/app/api/import/jira-csv). Keeping this
// in one place means fixing a status name only has to happen once.

export const JIRA_STATUS_MAP: Record<string, EpicStatus> = {
  'to do': 'IDEA',
  backlog: 'IDEA',
  open: 'IDEA',
  'select priority': 'IDEA',
  'in discovery': 'DISCOVERY',
  discovery: 'DISCOVERY',
  validated: 'VALIDATED',
  planned: 'PLANNED',
  ready: 'PLANNED',
  committed: 'COMMITTED',
  'in progress': 'IN_PROGRESS',
  'in review': 'IN_PROGRESS',
  'pending review': 'IN_PROGRESS',
  'ready for review': 'IN_PROGRESS',
  blocked: 'BLOCKED',
  impeded: 'BLOCKED',
  done: 'RELEASED',
  released: 'RELEASED',
  closed: 'RELEASED',
  cancelled: 'CANCELLED',
  canceled: 'CANCELLED',
  "won't do": 'CANCELLED',
};

export function mapJiraStatus(jiraStatusName: string): EpicStatus {
  return JIRA_STATUS_MAP[jiraStatusName.trim().toLowerCase()] ?? 'IDEA';
}

export function mapJiraPriorityToRisk(priorityName?: string): RiskLevel {
  const p = (priorityName ?? '').toLowerCase();
  if (p.includes('highest') || p.includes('blocker')) return 'CRITICAL';
  if (p.includes('high')) return 'HIGH';
  if (p.includes('low')) return 'LOW';
  return 'MEDIUM';
}

const MONTHS: Record<string, number> = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
};

/** Parses Jira's exported date format, e.g. "22/Jan/26 12:11 AM". Returns an ISO string, or null if unparseable. */
export function parseJiraDate(raw: string): string | null {
  if (!raw) return null;
  const match = raw.trim().match(/^(\d{1,2})\/([A-Za-z]{3})\/(\d{2,4})\s+(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!match) {
    const fallback = new Date(raw);
    return Number.isNaN(fallback.getTime()) ? null : fallback.toISOString();
  }
  const [, dayStr, monStr, yearStr, hourStr, minStr, ampm] = match;
  const month = MONTHS[monStr.toLowerCase()];
  if (month == null) return null;

  let year = parseInt(yearStr, 10);
  if (year < 100) year += 2000;

  let hour = parseInt(hourStr, 10);
  if (ampm?.toUpperCase() === 'PM' && hour !== 12) hour += 12;
  if (ampm?.toUpperCase() === 'AM' && hour === 12) hour = 0;

  const date = new Date(year, month, parseInt(dayStr, 10), hour, parseInt(minStr, 10));
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

/** Buckets a date into a target quarter/year pair for the roadmap view. */
export function quarterFromDate(iso: string | null): { targetQuarter?: string; targetYear?: number } {
  if (!iso) return {};
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return {};
  const quarter = Math.floor(d.getMonth() / 3) + 1;
  return { targetQuarter: `Q${quarter}`, targetYear: d.getFullYear() };
}
