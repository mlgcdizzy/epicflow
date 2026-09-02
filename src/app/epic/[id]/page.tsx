'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePortfolio } from '@/lib/use-portfolio';
import { findEpicById, findOwnerName, findTeamName, findPillarName, findObjectiveTitle, findThemeName } from '@/lib/lookups';
import { scoreRICE, scoreWSJF, scoreCustom, scoreAlignment } from '@/lib/prioritization';
import { Card, CardHeader, StatusBadge, RiskBadge } from '@/components/ui';
import { formatNumber } from '@/lib/utils';
import { ArrowLeft, Sparkles, ChevronRight } from 'lucide-react';

export default function EpicDetailPage({ params }: { params: { id: string } }) {
  const { epics, users, teams, pillars, objectives, themes, dependencies, loading } = usePortfolio();
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);

  if (loading) return <div className="p-6 text-sm text-muted">Loading…</div>;

  const epic = findEpicById(epics, params.id);
  if (!epic) {
    return (
      <div className="p-6">
        <Link href="/epics" className="flex items-center gap-1 text-sm text-muted hover:text-ink-700">
          <ArrowLeft size={14} /> Back to Epics
        </Link>
        <p className="mt-4 text-sm text-muted">This epic wasn't found — it may have been removed or re-imported with a new ID.</p>
      </div>
    );
  }

  const rice = scoreRICE(epic);
  const wsjf = scoreWSJF(epic);
  const custom = scoreCustom(epic);
  const alignment = epic.alignment ? scoreAlignment(epic.alignment) : null;

  const outgoing = dependencies.filter((d) => d.sourceEpicId === epic.id);
  const incoming = dependencies.filter((d) => d.targetEpicId === epic.id);

  async function requestAiSummary() {
    setLoadingAi(true);
    try {
      const res = await fetch('/api/ai/summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ epicId: epic!.id }),
      });
      const data = await res.json();
      setAiSummary(data.summary);
    } finally {
      setLoadingAi(false);
    }
  }

  return (
    <div className="space-y-5 p-6">
      <Link href="/epics" className="flex items-center gap-1 text-sm text-muted hover:text-ink-700">
        <ArrowLeft size={14} /> Back to Epics
      </Link>

      <div className="flex items-start justify-between">
        <div>
          <p className="font-mono text-xs text-muted">{epic.epicKey}</p>
          <h1 className="text-xl font-semibold text-ink-800">{epic.title}</h1>
          <div className="mt-2 flex items-center gap-2">
            <StatusBadge status={epic.status} />
            <RiskBadge risk={epic.riskLevel} />
            <span className="text-xs text-muted">{epic.productArea} · {findTeamName(teams, epic.teamId)}</span>
          </div>
        </div>
        <button
          onClick={requestAiSummary}
          disabled={loadingAi}
          className="flex items-center gap-1.5 rounded border border-accent-500 px-3 py-1.5 text-sm font-medium text-accent-600 hover:bg-accent-50 disabled:opacity-50"
        >
          <Sparkles size={14} />
          {loadingAi ? 'Summarizing…' : 'AI Executive Summary'}
        </button>
      </div>

      {aiSummary && (
        <Card className="border-accent-100 bg-accent-50 px-4 py-3 text-sm text-ink-800">{aiSummary}</Card>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2 p-5">
          <p className="text-sm leading-relaxed text-ink-700">{epic.description || 'No description provided.'}</p>
          <dl className="mt-4 grid grid-cols-2 gap-y-3 text-sm sm:grid-cols-3">
            <Field label="Owner" value={findOwnerName(users, epic.ownerId)} />
            <Field label="Target" value={epic.targetQuarter ? `${epic.targetQuarter} ${epic.targetYear ?? ''}` : '—'} />
            <Field label="Theme" value={findThemeName(themes, epic.themeId)} />
            <Field label="Pillar" value={findPillarName(pillars, epic.pillarId)} />
            <Field label="Objective" value={findObjectiveTitle(objectives, epic.objectiveId)} />
            <Field label="Story Points" value={String(epic.storyPoints ?? '—')} />
            <Field label="T-Shirt Size" value={epic.tShirtSize ?? '—'} />
            <Field label="Duration (wks)" value={String(epic.expectedDurationWeeks ?? '—')} />
          </dl>
          {epic.tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {epic.tags.map((t) => (
                <span key={t} className="rounded bg-field px-2 py-0.5 text-xs text-muted">#{t}</span>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-5">
          <h3 className="mb-3 text-sm font-semibold text-ink-800">Strategic Alignment</h3>
          {epic.alignment ? (
            <>
              <p className="font-mono text-3xl font-semibold text-ink-700">{alignment}<span className="text-base text-muted">/5</span></p>
              <div className="mt-3 space-y-1.5 text-xs text-muted">
                <AlignRow label="Corporate Goal" value={epic.alignment.corporateGoal} />
                <AlignRow label="Business Goal" value={epic.alignment.businessGoal} />
                <AlignRow label="OKR" value={epic.alignment.okr} />
                <AlignRow label="Pillar" value={epic.alignment.pillar} />
              </div>
            </>
          ) : (
            <p className="text-sm text-muted">No alignment data recorded.</p>
          )}
        </Card>
      </div>

      <Card>
        <CardHeader title="Prioritization Scores" subtitle="Computed live from the epic's current inputs" />
        <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-3">
          <ScoreBlock
            name="RICE"
            score={rice}
            rows={[
              ['Reach', epic.reach], ['Impact', epic.impact], ['Confidence', epic.confidence], ['Effort', epic.effort],
            ]}
          />
          <ScoreBlock
            name="WSJF"
            score={wsjf}
            rows={[
              ['Business Value', epic.businessValue], ['Time Criticality', epic.timeCriticality],
              ['Risk Reduction', epic.riskReduction], ['Job Size', epic.jobSize],
            ]}
          />
          <ScoreBlock
            name="Product Value Score"
            score={custom}
            rows={[
              ['Revenue Impact', epic.revenueImpact], ['Customer Impact', epic.customerImpact],
              ['Strategic Alignment', epic.strategicAlignment], ['Competitive Pressure', epic.competitivePressure],
              ['Risk', epic.riskScore], ['Eng. Complexity', epic.engineeringComplexity],
            ]}
          />
        </div>
        {rice == null && wsjf == null && custom == null && (
          <p className="border-t border-line px-5 py-3 text-xs text-muted">
            None of the scoring models have complete inputs for this epic yet. Fill them in via the API
            (<code className="rounded bg-field px-1">PATCH /api/epics/{epic.id}</code>) or your import source to see scores here.
          </p>
        )}
      </Card>

      <Card>
        <CardHeader title="Dependencies" subtitle={`${outgoing.length + incoming.length} linked epics`} />
        <div className="divide-y divide-line">
          {[...outgoing, ...incoming].length === 0 && (
            <p className="px-5 py-4 text-sm text-muted">No dependencies recorded for this epic.</p>
          )}
          {outgoing.map((d) => {
            const target = epics.find((e) => e.id === d.targetEpicId);
            return <DependencyRow key={d.id} direction="Blocks" epic={target} type={d.dependencyType} status={d.status} />;
          })}
          {incoming.map((d) => {
            const source = epics.find((e) => e.id === d.sourceEpicId);
            return <DependencyRow key={d.id} direction="Blocked by" epic={source} type={d.dependencyType} status={d.status} />;
          })}
        </div>
      </Card>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-muted">{label}</dt>
      <dd className="text-ink-800">{value}</dd>
    </div>
  );
}

function AlignRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between">
      <span>{label}</span>
      <span className="font-mono text-ink-700">{value}/5</span>
    </div>
  );
}

function ScoreBlock({ name, score, rows }: { name: string; score: number | null; rows: [string, number | undefined][] }) {
  return (
    <div className="rounded border border-line p-4">
      <div className="flex items-baseline justify-between">
        <p className="text-sm font-semibold text-ink-800">{name}</p>
        <p className="font-mono text-xl font-semibold text-accent-600">{formatNumber(score, 2)}</p>
      </div>
      <div className="mt-2 space-y-1 text-xs text-muted">
        {rows.map(([label, value]) => (
          <div key={label} className="flex justify-between">
            <span>{label}</span>
            <span className="font-mono text-ink-600">{formatNumber(value, 2)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function DependencyRow({ direction, epic, type, status }: { direction: string; epic?: ReturnType<typeof findEpicById>; type: string; status: string }) {
  if (!epic) return null;
  return (
    <Link href={`/epics/${epic.id}`} className="flex items-center justify-between px-5 py-3 hover:bg-field">
      <div className="flex items-center gap-3">
        <span className="w-24 shrink-0 text-xs font-medium text-muted">{direction}</span>
        <span className="font-mono text-xs text-ink-500">{epic.epicKey}</span>
        <span className="text-sm text-ink-800">{epic.title}</span>
      </div>
      <div className="flex items-center gap-3 text-xs text-muted">
        <span>{type.replace('_', ' ')}</span>
        <StatusPill status={status} />
        <ChevronRight size={14} />
      </div>
    </Link>
  );
}

function StatusPill({ status }: { status: string }) {
  const tone =
    status === 'BLOCKED' ? 'bg-health-red/10 text-health-red'
    : status === 'AT_RISK' ? 'bg-health-amber/10 text-health-amber'
    : status === 'RESOLVED' ? 'bg-health-green/10 text-health-green'
    : 'bg-ink-100 text-ink-600';
  return <span className={`rounded px-2 py-0.5 font-medium ${tone}`}>{status.replace('_', ' ')}</span>;
}
