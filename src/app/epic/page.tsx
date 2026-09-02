'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { usePortfolio } from '@/lib/use-portfolio';
import { findOwnerName, findTeamName } from '@/lib/lookups';
import { groupEpics, GROUP_BY_OPTIONS, type GroupByKey } from '@/lib/classification';
import { EPIC_STATUSES, type Epic } from '@/lib/types';
import { scoreRICE } from '@/lib/prioritization';
import { Card, StatusBadge, RiskBadge } from '@/components/ui';
import { formatNumber, cn } from '@/lib/utils';
import { ArrowUpDown, Database, ArrowRight, GripVertical, Trash2 } from 'lucide-react';

const RISKS = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4'];
type SortMode = 'rice' | 'custom';

export default function EpicsPage() {
  const { epics, teams, pillars, users, loading, refresh } = usePortfolio();

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('ALL');
  const [area, setArea] = useState('ALL');
  const [quarter, setQuarter] = useState('ALL');
  const [pillar, setPillar] = useState('ALL');
  const [team, setTeam] = useState('ALL');
  const [risk, setRisk] = useState('ALL');
  const [groupBy, setGroupBy] = useState<GroupByKey>('component');
  const [sortMode, setSortMode] = useState<SortMode>('rice');
  const [localOrder, setLocalOrder] = useState<Epic[] | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const areas = useMemo(() => Array.from(new Set(epics.map((e) => e.productArea))), [epics]);

  const filtered = useMemo(() => {
    return epics
      .filter((e) => (status === 'ALL' ? true : e.status === status))
      .filter((e) => (area === 'ALL' ? true : e.productArea === area))
      .filter((e) => (quarter === 'ALL' ? true : e.targetQuarter === quarter))
      .filter((e) => (pillar === 'ALL' ? true : e.pillarId === pillar))
      .filter((e) => (team === 'ALL' ? true : e.teamId === team))
      .filter((e) => (risk === 'ALL' ? true : e.riskLevel === risk))
      .filter((e) => (search.trim() === '' ? true : `${e.epicKey} ${e.title}`.toLowerCase().includes(search.toLowerCase())));
  }, [epics, search, status, area, quarter, pillar, team, risk]);

  const sorted = useMemo(() => {
    if (sortMode === 'custom') {
      const base = localOrder ?? filtered;
      const filteredIds = new Set(filtered.map((e) => e.id));
      const ranked = base.filter((e) => filteredIds.has(e.id));
      const withRank = filtered.filter((e) => !ranked.find((r) => r.id === e.id));
      return [...ranked, ...withRank].sort((a, b) => (a.priorityRank ?? 999999) - (b.priorityRank ?? 999999) || 0);
    }
    return [...filtered].sort((a, b) => (scoreRICE(b) ?? -1) - (scoreRICE(a) ?? -1));
  }, [filtered, sortMode, localOrder]);

  const groups = useMemo(() => groupEpics(sorted, groupBy, users, teams), [sorted, groupBy, users, teams]);

  async function handleDelete(epic: Epic) {
    if (!confirm(`Delete "${epic.title}" (${epic.epicKey})? This cannot be undone.`)) return;
    setDeleting(epic.id);
    try {
      await fetch(`/api/epics/${epic.id}`, { method: 'DELETE' });
      await refresh();
    } finally {
      setDeleting(null);
    }
  }

  function handleDragStart(id: string) {
    setDragId(id);
  }

  function handleDropOn(targetId: string) {
    if (!dragId || dragId === targetId) return;
    const current = localOrder ?? sorted;
    const from = current.findIndex((e) => e.id === dragId);
    const to = current.findIndex((e) => e.id === targetId);
    if (from === -1 || to === -1) return;

    const next = [...current];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setLocalOrder(next);
    setDragId(null);

    fetch('/api/epics/reorder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderedIds: next.map((e) => e.id) }),
    });
  }

  if (loading) return <div className="p-6 text-sm text-muted">Loading…</div>;

  if (epics.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <Card className="max-w-md px-8 py-10 text-center">
          <Database size={28} className="mx-auto text-muted" />
          <h2 className="mt-3 text-base font-semibold text-ink-800">No epics yet</h2>
          <p className="mt-1.5 text-sm text-muted">Import from Jira or upload a spreadsheet to get started.</p>
          <Link href="/settings" className="mt-4 inline-flex items-center gap-1.5 rounded bg-ink px-4 py-2 text-sm font-medium text-white hover:bg-ink-600">
            Go to Data Source <ArrowRight size={14} />
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-6">
      <div className="flex items-baseline justify-between">
        <div>
          <h1 className="text-lg font-semibold text-ink-800">Epics</h1>
          <p className="text-sm text-muted">{filtered.length} of {epics.length} epics</p>
        </div>
      </div>

      <Card className="flex flex-wrap items-center gap-2 px-4 py-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter by key or title…"
          className="w-56 rounded border border-line px-2.5 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
        />
        <Select label="Status" value={status} onChange={setStatus} options={['ALL', ...EPIC_STATUSES]} />
        <Select label="Area" value={area} onChange={setArea} options={['ALL', ...areas]} />
        <Select label="Quarter" value={quarter} onChange={setQuarter} options={['ALL', ...QUARTERS]} />
        {pillars.length > 0 && (
          <Select label="Pillar" value={pillar} onChange={setPillar} options={['ALL', ...pillars.map((p) => p.id)]} labels={{ ALL: 'All Pillars', ...Object.fromEntries(pillars.map((p) => [p.id, p.name])) }} />
        )}
        {teams.length > 0 && (
          <Select label="Team" value={team} onChange={setTeam} options={['ALL', ...teams.map((t) => t.id)]} labels={{ ALL: 'All Teams', ...Object.fromEntries(teams.map((t) => [t.id, t.name])) }} />
        )}
        <Select label="Risk" value={risk} onChange={setRisk} options={['ALL', ...RISKS]} />

        <span className="ml-auto" />

        <Select
          label="Group by"
          value={groupBy}
          onChange={(v) => setGroupBy(v as GroupByKey)}
          options={GROUP_BY_OPTIONS.map((o) => o.value)}
          labels={Object.fromEntries(GROUP_BY_OPTIONS.map((o) => [o.value, `Group: ${o.label}`]))}
        />
        <div className="flex rounded border border-line bg-surface p-0.5 text-sm">
          <button
            onClick={() => setSortMode('rice')}
            className={cn('flex items-center gap-1 rounded px-2.5 py-1', sortMode === 'rice' ? 'bg-ink text-white' : 'text-muted')}
          >
            <ArrowUpDown size={12} /> RICE
          </button>
          <button
            onClick={() => setSortMode('custom')}
            className={cn('flex items-center gap-1 rounded px-2.5 py-1', sortMode === 'custom' ? 'bg-ink text-white' : 'text-muted')}
          >
            <GripVertical size={12} /> Drag to reorder
          </button>
        </div>
      </Card>

      {sortMode === 'custom' && (
        <p className="text-xs text-muted">
          Drag rows by the handle on the left to set manual priority order. This is saved automatically and shown
          across the app wherever custom order applies.
        </p>
      )}

      <div className="space-y-4">
        {groups.map((group) => (
          <Card key={group.key} className="overflow-hidden">
            {groupBy !== 'none' && (
              <div className="flex items-center justify-between border-b border-line bg-field px-4 py-2">
                <span className="text-sm font-semibold text-ink-800">{group.label}</span>
                <span className="text-xs text-muted">{group.epics.length} epic{group.epics.length === 1 ? '' : 's'}</span>
              </div>
            )}
            <table className="w-full text-sm">
              <thead className="border-b border-line bg-field text-left text-xs uppercase tracking-wide text-muted">
                <tr>
                  {sortMode === 'custom' && <th className="w-8 px-2 py-2.5" />}
                  <th className="px-4 py-2.5 font-medium">Key</th>
                  <th className="px-4 py-2.5 font-medium">Title</th>
                  <th className="px-4 py-2.5 font-medium">Status</th>
                  <th className="px-4 py-2.5 font-medium">Owner</th>
                  <th className="px-4 py-2.5 font-medium">Component</th>
                  <th className="px-4 py-2.5 font-medium">Quarter</th>
                  <th className="px-4 py-2.5 font-medium">RICE</th>
                  <th className="px-4 py-2.5 font-medium">Risk</th>
                  <th className="w-10 px-2 py-2.5" />
                </tr>
              </thead>
              <tbody>
                {group.epics.map((e) => (
                  <tr
                    key={e.id}
                    draggable={sortMode === 'custom'}
                    onDragStart={() => handleDragStart(e.id)}
                    onDragOver={(ev) => sortMode === 'custom' && ev.preventDefault()}
                    onDrop={() => handleDropOn(e.id)}
                    className={cn(
                      'border-b border-line last:border-0 hover:bg-field',
                      dragId === e.id && 'opacity-50'
                    )}
                  >
                    {sortMode === 'custom' && (
                      <td className="cursor-grab px-2 py-2.5 text-muted active:cursor-grabbing">
                        <GripVertical size={14} />
                      </td>
                    )}
                    <td className="px-4 py-2.5">
                      <Link href={`/epics/${e.id}`} className="font-mono text-xs text-ink-500 hover:underline">
                        {e.epicKey}
                      </Link>
                    </td>
                    <td className="px-4 py-2.5">
                      <Link href={`/epics/${e.id}`} className="font-medium text-ink-800 hover:text-accent-600">
                        {e.title}
                      </Link>
                    </td>
                    <td className="px-4 py-2.5"><StatusBadge status={e.status} /></td>
                    <td className="px-4 py-2.5 text-ink-700">{findOwnerName(users, e.ownerId)}</td>
                    <td className="px-4 py-2.5 text-ink-700">{e.component ?? '—'}</td>
                    <td className="px-4 py-2.5 text-ink-700">{e.targetQuarter ?? '—'} {e.targetYear ?? ''}</td>
                    <td className="px-4 py-2.5 font-mono text-ink-700">{formatNumber(scoreRICE(e))}</td>
                    <td className="px-4 py-2.5"><RiskBadge risk={e.riskLevel} /></td>
                    <td className="px-2 py-2.5 text-center">
                      <button
                        onClick={() => handleDelete(e)}
                        disabled={deleting === e.id}
                        className="text-muted hover:text-health-red disabled:opacity-50"
                        aria-label={`Delete ${e.title}`}
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        ))}
        {groups.every((g) => g.epics.length === 0) && (
          <Card className="px-4 py-10 text-center text-sm text-muted">No epics match these filters. Try widening your search.</Card>
        )}
      </div>
    </div>
  );
}

function Select({
  label, value, onChange, options, labels,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  labels?: Record<string, string>;
}) {
  return (
    <select
      aria-label={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded border border-line bg-surface px-2.5 py-1.5 text-sm text-ink-700 focus:outline-none focus:ring-1 focus:ring-accent"
    >
      {options.map((opt) => (
        <option key={opt} value={opt}>
          {labels?.[opt] ?? (opt === 'ALL' ? `All ${label}` : opt.replace('_', ' '))}
        </option>
      ))}
    </select>
  );
}
