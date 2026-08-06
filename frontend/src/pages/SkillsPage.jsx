import { useApi } from '../hooks/useApi.js';
import { api } from '../api/client.js';
import { Loading, ErrorState, EmptyState } from '../components/States.jsx';

function DemandBar({ count }) {
  const width = Math.min(100, Math.max(4, (count || 0) * 14));
  return (
    <div style={{ flex: 1, minWidth: 120 }}>
      <div style={{ height: 8, background: '#eef1f8', borderRadius: 999, overflow: 'hidden' }}>
        <div style={{ width: `${width}%`, height: '100%', background: 'linear-gradient(90deg,#6366f1,#8b5cf6)', borderRadius: 999 }} />
      </div>
    </div>
  );
}

export default function SkillsPage() {
  const { data, loading, error, refresh } = useApi(() => api.listSkills(true), []);

  if (loading) return <Loading label="Loading skills…" />;
  if (error) return <ErrorState message={error.message} onRetry={refresh} />;
  if (!data?.length) {
    return (
      <EmptyState
        title="No skills in the graph"
        message="Seed the database to create skills and TEACHES relationships."
      />
    );
  }

  const maxDemand = Math.max(...data.map((s) => s.demandCount || 0), 1);

  return (
    <div>
      <h1 className="page-title">Skills & demand</h1>
      <p className="page-sub">
        Each skill is a node that topics <span className="mono">TEACHES</span>. "Demand" counts how
        many other topics are blocked (up to two hops away) by needing this skill first — a query
        that's awkward to express relationally.
      </p>

      <div className="card card-pad mt-6">
        <div className="row" style={{ fontWeight: 600, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--muted)' }}>
          <div className="flex-1">Skill</div>
          <div style={{ width: 120, textAlign: 'right' }}>taught by</div>
          <div style={{ width: 130, textAlign: 'right' }}>demand</div>
        </div>
        {data.map((s) => (
          <div className="row" key={s.id}>
            <div className="row-main">
              <div className="row-title">{s.name}</div>
              <div className="row-sub">{s.description}</div>
            </div>
            <DemandBar count={(s.demandCount || 0) / maxDemand * 7} />
            <div className="mono muted" style={{ width: 120, textAlign: 'right', fontSize: 14 }}>
              {s.taughtByCount} topics
            </div>
            <div className="mono" style={{ width: 130, textAlign: 'right', fontSize: 15, fontWeight: 700 }}>
              {s.demandCount}
              <span className="muted" style={{ fontSize: 12, fontWeight: 500 }}> blocked</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
