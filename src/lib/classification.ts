import type { Epic, User, Team } from './types';
import { findOwnerName, findTeamName } from './lookups';

export type GroupByKey = 'component' | 'fixVersion' | 'productArea' | 'status' | 'owner' | 'team' | 'riskLevel' | 'none';

export const GROUP_BY_OPTIONS: { value: GroupByKey; label: string }[] = [
  { value: 'none', label: 'No grouping' },
  { value: 'component', label: 'Component' },
  { value: 'fixVersion', label: 'Fix Version' },
  { value: 'productArea', label: 'Product Area' },
  { value: 'status', label: 'Status' },
  { value: 'owner', label: 'Owner' },
  { value: 'team', label: 'Team' },
  { value: 'riskLevel', label: 'Risk Level' },
];

export interface EpicGroup {
  key: string;
  label: string;
  epics: Epic[];
}

/** Groups epics by the chosen dimension. Epics missing that field land in an "Unclassified" bucket rather than being dropped. */
export function groupEpics(epics: Epic[], by: GroupByKey, users: User[], teams: Team[]): EpicGroup[] {
  if (by === 'none') {
    return [{ key: 'all', label: 'All Epics', epics }];
  }

  const buckets = new Map<string, Epic[]>();

  for (const epic of epics) {
    let label: string;
    switch (by) {
      case 'component':
        label = epic.component || 'Unclassified';
        break;
      case 'fixVersion':
        label = epic.fixVersion || 'No fix version';
        break;
      case 'productArea':
        label = epic.productArea || 'Unclassified';
        break;
      case 'status':
        label = epic.status;
        break;
      case 'owner':
        label = findOwnerName(users, epic.ownerId);
        break;
      case 'team':
        label = findTeamName(teams, epic.teamId);
        break;
      case 'riskLevel':
        label = epic.riskLevel;
        break;
      default:
        label = 'Unclassified';
    }
    if (!buckets.has(label)) buckets.set(label, []);
    buckets.get(label)!.push(epic);
  }

  return Array.from(buckets.entries())
    .map(([key, groupEpics]) => ({ key, label: key, epics: groupEpics }))
    .sort((a, b) => b.epics.length - a.epics.length);
}
