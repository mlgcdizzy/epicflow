'use client';

import Link from 'next/link';
import { usePortfolio } from '@/lib/use-portfolio';
import { capacityRisk } from '@/lib/prioritization';
import { Card, CardHeader, ProgressBar } from '@/components/ui';
import { cn } from '@/lib/utils';
import { Database, ArrowRight } from 'lucide-react';

const STATUS_STYLE = {
  under: { label: 'Under-allocated', class: 'text-muted', bar: 'bg-ink-300' },
  healthy: { label: 'Healthy', class: 'text-health-green', bar: 'bg-health-green' },
  'at-risk': { label: 'At risk', class: 'text-health-amber', bar: 'bg-health-amber' },
  over: { label: 'Overcommitted', class: 'text-health-red', bar: 'bg-health-red' },
} as const;

export default function CapacityPage() {
  const { epics, teams, loading } = usePortfolio();

  if (loading) return <div className="p-6 text-sm text-muted">Loading…</div>;

  if (teams.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <Card className="max-w-md px-8 py-10 text-center">
          <Database size={28} className="mx-auto text-muted" />
          <h2 className="mt-3 text-base font-semibold text-ink-800">No teams defined yet</h2>
          <p className="mt-1.5 text-sm text-muted">
            Teams are created automatically from the "Team" column when you import epics, or you can load the sample
            data to see the layout.
          </p>
          <Link href="/settings" className="mt-4 inline-flex items-center gap-1.5 rounded bg-ink px-4 py-2 text-sm font-medium text-white hover:bg-ink-600">
            Go to Data Source <ArrowRight size={14} />
          </Link>
        </Card>
      </div>
    );
  }

  const teamSnapshots = teams.map((team) => {
    const teamEpics = epics.filter((e) => e.teamId === team.id);
    const committedLoad = teamEpics
      .filter((e) => ['COMMITTED', 'IN_PROGRESS'].includes(e.status))
      .reduce((sum, e) => sum + (e.storyPoints ?? 0), 0);
    const risk = capacityRisk({ teamName: team.name, availableCapacity: team.capacity, committedLoad });
    return { team, teamEpics, committedLoad, risk };
  });

  const totalCapacity = teams.reduce((s, t) => s + t.capacity, 0);
  const totalCommitted = teamSnapshots.reduce((s, t) => s + t.committedLoad, 0);
  const forecastRisk = teamSnapshots.filter((t) => t.risk.status === 'over' || t.risk.status === 'at-risk').length;

  return (
    <div className="space-y-4 p-6">
      <div>
        <h1 className="text-lg font-semibold text-ink-800">Capacity Planning</h1>
        <p className="text-sm text-muted">Team capacity vs. committed epic load, with quarterly resource forecasting</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="px-5 py-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">Total Capacity</p>
          <p className="mt-1.5 font-mono text-2xl font-semibold text-ink-800">{totalCapacity} pts/sprint</p>
        </Card>
        <Card className="px-5 py-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">Committed Load</p>
          <p className="mt-1.5 font-mono text-2xl font-semibold text-ink-800">{totalCommitted} pts</p>
        </Card>
        <Card className="px-5 py-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">Capacity Risk</p>
          <p className={cn('mt-1.5 font-mono text-2xl font-semibold', forecastRisk > 0 ? 'text-health-red' : 'text-health-green')}>
            {forecastRisk} team{forecastRisk === 1 ? '' : 's'}
          </p>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {teamSnapshots.map(({ team, teamEpics, committedLoad, risk }) => {
          const style = STATUS_STYLE[risk.status];
          return (
            <Card key={team.id}>
              <CardHeader
                title={team.name}
                subtitle={team.manager ? `Managed by ${team.manager} · Velocity ${team.velocity} pts/sprint` : `Velocity ${team.velocity} pts/sprint`}
                action={<span className={cn('text-xs font-medium', style.class)}>{style.label}</span>}
              />
              <div className="space-y-3 p-5">
                {team.capacity === 0 ? (
                  <p className="text-xs text-muted">
                    This team was created from an import and has no capacity numbers yet — capacity editing isn't
                    built into the UI yet, so set it directly via a Prisma Studio session or a quick SQL update for now.
                  </p>
                ) : (
                  <div>
                    <div className="mb-1 flex justify-between text-xs text-muted">
                      <span>{committedLoad} pts committed</span>
                      <span>{team.capacity} pts available</span>
                    </div>
                    <ProgressBar value={committedLoad} max={team.capacity} colorClass={style.bar} />
                    <p className="mt-1 text-right font-mono text-xs text-muted">{risk.utilization}% utilized</p>
                  </div>
                )}

                <div className="grid grid-cols-4 gap-2 text-center text-xs">
                  <MiniStat label="Engineers" value={team.availableEngineers} />
                  <MiniStat label="PMs" value={team.availablePMs} />
                  <MiniStat label="Design" value={team.designCapacity} />
                  <MiniStat label="QA" value={team.qaCapacity} />
                </div>

                <p className="text-xs text-muted">{teamEpics.length} epics assigned to this team</p>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded bg-field py-2">
      <p className="font-mono text-sm font-semibold text-ink-700">{value}</p>
      <p className="text-[10px] uppercase tracking-wide text-muted">{label}</p>
    </div>
  );
}
