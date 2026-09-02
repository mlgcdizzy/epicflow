'use client';

import Link from 'next/link';
import {
  BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ScatterChart, Scatter, ZAxis, AreaChart, Area, Legend,
} from 'recharts';
import { Database, ArrowRight } from 'lucide-react';
import { Card, CardHeader, StatCard } from '@/components/ui';
import { usePortfolio } from '@/lib/use-portfolio';
import {
  executiveSummary, statusDistribution, priorityDistribution,
  strategicAlignmentByPillar, capacityUtilizationByTeam, portfolioHealth, burnUpSeries,
} from '@/lib/aggregations';
import { scoreCustom } from '@/lib/prioritization';

const STATUS_COLORS: Record<string, string> = {
  IDEA: '#8B93A6', DISCOVERY: '#5C7FA8', VALIDATED: '#3E749E', PLANNED: '#6D5CA8',
  COMMITTED: '#215680', IN_PROGRESS: '#1F7A6C', BLOCKED: '#C1432B', RELEASED: '#1E8A5F', CANCELLED: '#94A3B8',
};

export default function DashboardPage() {
  const { epics, teams, pillars, loading } = usePortfolio();

  if (loading) return <PageState message="Loading portfolio…" />;

  if (epics.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <Card className="max-w-md px-8 py-10 text-center">
          <Database size={28} className="mx-auto text-muted" />
          <h2 className="mt-3 text-base font-semibold text-ink-800">No epics yet</h2>
          <p className="mt-1.5 text-sm text-muted">
            Connect Jira or upload a spreadsheet to bring your portfolio into EpicFlow.
          </p>
          <Link
            href="/settings"
            className="mt-4 inline-flex items-center gap-1.5 rounded bg-ink px-4 py-2 text-sm font-medium text-white hover:bg-ink-600"
          >
            Go to Data Source <ArrowRight size={14} />
          </Link>
        </Card>
      </div>
    );
  }

  const summary = executiveSummary(epics);
  const health = portfolioHealth(epics, teams);
  const statusData = statusDistribution(epics);
  const priorityData = priorityDistribution(epics);
  const alignmentData = strategicAlignmentByPillar(epics, pillars);
  const capacityData = capacityUtilizationByTeam(epics, teams);
  const burnUp = burnUpSeries(epics);

  const bubbleData = epics
    .map((e) => ({
      name: e.epicKey,
      effort: e.effort ?? 0,
      value: scoreCustom(e) ?? 0,
      size: e.customerImpact ?? 1,
    }))
    .filter((d) => d.value > 0);

  const healthTone = health.band === 'green' ? 'good' : health.band === 'yellow' ? 'warn' : 'bad';

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-baseline justify-between">
        <div>
          <h1 className="text-lg font-semibold text-ink-800">Portfolio Dashboard</h1>
          <p className="text-sm text-muted">
            {new Set(epics.map((e) => e.productArea)).size} product area{new Set(epics.map((e) => e.productArea)).size === 1 ? '' : 's'} · updated just now
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Total Epics" value={summary.total} />
        <StatCard label="Active Epics" value={summary.active} />
        <StatCard label="Blocked" value={summary.blocked} tone={summary.blocked > 5 ? 'bad' : 'default'} />
        <StatCard label="Committed" value={summary.committed} />
        <StatCard label="Completed (Q3)" value={summary.completedThisQuarter} tone="good" />
        <StatCard
          label="Portfolio Health"
          value={`${health.score}`}
          hint="out of 100"
          tone={healthTone as 'good' | 'warn' | 'bad'}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Epic Status Distribution" subtitle="Count of epics per lifecycle stage" />
          <div className="h-72 px-3 py-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusData} margin={{ left: 0, right: 12 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E7EE" vertical={false} />
                <XAxis dataKey="status" tick={{ fontSize: 11 }} interval={0} angle={-25} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" radius={[3, 3, 0, 0]}>
                  {statusData.map((d) => (
                    <Cell key={d.status} fill={STATUS_COLORS[d.status] ?? '#64748B'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <CardHeader title="Priority Distribution" subtitle="RICE score buckets across the portfolio" />
          <div className="h-72 px-3 py-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={priorityData} margin={{ left: 0, right: 12 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E7EE" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#E0952E" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <CardHeader title="Strategic Alignment" subtitle="Average alignment score (1-5) by pillar" />
          <div className="h-72 px-3 py-4">
            {pillars.length === 0 ? (
              <EmptyChartNote text="No strategic pillars defined yet." />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={alignmentData} layout="vertical" margin={{ left: 24, right: 24 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E7EE" horizontal={false} />
                  <XAxis type="number" domain={[0, 5]} tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="pillar" tick={{ fontSize: 11 }} width={140} />
                  <Tooltip />
                  <Bar dataKey="score" fill="#215680" radius={[0, 3, 3, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        <Card>
          <CardHeader title="Capacity Utilization" subtitle="Committed load vs. available capacity, by team" />
          <div className="h-72 px-3 py-4">
            {teams.length === 0 ? (
              <EmptyChartNote text="No teams defined yet." />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={capacityData} margin={{ left: 0, right: 12 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E7EE" vertical={false} />
                  <XAxis dataKey="team" tick={{ fontSize: 10 }} interval={0} angle={-20} textAnchor="end" height={55} />
                  <YAxis tick={{ fontSize: 11 }} unit="%" />
                  <Tooltip formatter={(v: number) => `${v}%`} />
                  <Bar dataKey="utilization" radius={[3, 3, 0, 0]}>
                    {capacityData.map((d, i) => (
                      <Cell key={i} fill={d.status === 'over' ? '#C1432B' : d.status === 'at-risk' ? '#D97706' : '#1E8A5F'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Value vs. Effort" subtitle="Bubble size reflects customer impact — see full matrix for details" />
          <div className="h-72 px-3 py-4">
            {bubbleData.length === 0 ? (
              <EmptyChartNote text="No epics have complete Product Value Score inputs yet." />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ left: 0, right: 20, top: 10, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E7EE" />
                  <XAxis type="number" dataKey="effort" name="Effort" tick={{ fontSize: 11 }} label={{ value: 'Effort', position: 'insideBottom', offset: -5, fontSize: 11 }} />
                  <YAxis type="number" dataKey="value" name="Value" tick={{ fontSize: 11 }} label={{ value: 'Value', angle: -90, position: 'insideLeft', fontSize: 11 }} />
                  <ZAxis type="number" dataKey="size" range={[40, 300]} />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} formatter={(v: number) => v.toFixed(1)} />
                  <Scatter data={bubbleData} fill="#E0952E" fillOpacity={0.65} />
                </ScatterChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        <Card>
          <CardHeader title="Burn-Up Progress" subtitle="Cumulative epics released against total portfolio scope" />
          <div className="h-72 px-3 py-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={burnUp} margin={{ left: 0, right: 12 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E7EE" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Area type="monotone" dataKey="scope" name="Total scope" stroke="#94A3B8" fill="#94A3B8" fillOpacity={0.15} />
                <Area type="monotone" dataKey="completed" name="Completed" stroke="#1E8A5F" fill="#1E8A5F" fillOpacity={0.25} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
}

function PageState({ message }: { message: string }) {
  return <div className="flex h-full items-center justify-center p-6 text-sm text-muted">{message}</div>;
}

function EmptyChartNote({ text }: { text: string }) {
  return <div className="flex h-full items-center justify-center text-xs text-muted">{text}</div>;
}
