import { useApi } from '../hooks/useApi.js';
import { api } from '../api/client.js';
import { Loading, ErrorState, EmptyState } from '../components/States.jsx';

function DemandBar({ count }) {
  const width = Math.min(100, Math.max(4, (count || 0) * 14));
  return (
    <div className="demand-bar">
      <div className="demand-track">
        <div className="demand-fill" style={{ width: `${width}%` }} />
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
        <div className="row skills-head">
          <div className="flex-1">Skill</div>
          <div className="taught-col">taught by</div>
          <div className="demand-col">demand</div>
        </div>
        {data.map((s) => (
          <div className="row" key={s.id}>
            <div className="row-main">
              <div className="row-title">{s.name}</div>
              <div className="row-sub">{s.description}</div>
            </div>
            <DemandBar count={(s.demandCount || 0) / maxDemand * 7} />
            <div className="mono muted taught-col">
              {s.taughtByCount} topics
            </div>
            <div className="mono demand-col">
              {s.demandCount}
              <span className="muted demand-sub"> blocked</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
