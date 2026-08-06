import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Clock, Sparkles, Target } from 'lucide-react';
import { useApi } from '../hooks/useApi.js';
import { api } from '../api/client.js';
import { Loading, ErrorState, EmptyState } from '../components/States.jsx';
import GraphCanvas from '../components/GraphCanvas.jsx';
import { formatHours } from '../lib/format.js';

function NeighbourList({ items, emptyLabel }) {
  if (!items?.length) return <div className="muted" style={{ fontSize: 14 }}>{emptyLabel}</div>;
  return (
    <div className="flex wrap gap-2">
      {items.map((n) => (
        <Link
          key={n.id}
          to={`/topics/${n.id}`}
          className="pill"
          style={{ background: '#f1f5f9', color: '#334155', fontWeight: 600 }}
        >
          {n.name}
        </Link>
      ))}
    </div>
  );
}

export default function TopicPage() {
  const { topicId } = useParams();
  const { data: detail, loading, error, refresh } = useApi(() => api.topic(topicId), [topicId]);
  const { data: subgraph, loading: graphLoading } = useApi(
    () => api.subgraph(topicId, 2),
    [topicId]
  );

  const { nodes, edges } = useMemo(
    () => ({ nodes: subgraph?.nodes || [], edges: subgraph?.edges || [] }),
    [subgraph]
  );

  if (loading) return <Loading label="Loading topic…" />;
  if (error) return <ErrorState message={error.message} onRetry={refresh} />;
  if (!detail) {
    return (
      <EmptyState
        title="Topic not found"
        message={`No topic with the id "${topicId}" exists in the graph.`}
      />
    );
  }

  const t = detail.topic;

  return (
    <div>
      <Link to="/topics" className="flex items-center gap-2 muted" style={{ fontSize: 14, marginBottom: 16 }}>
        <ArrowLeft size={15} /> All topics
      </Link>

      <div className="hero" style={{ padding: '26px 28px' }}>
        <div className="flex items-center gap-2 wrap" style={{ marginBottom: 10 }}>
          <span className="category-chip">{t.category}</span>
          <span className={`pill pill-${t.level}`}>{t.level}</span>
          <span className="pill" style={{ background: '#f1f5f9', color: '#334155' }}>
            <Clock size={12} /> {formatHours(t.estHours)}
          </span>
        </div>
        <h1 className="page-title">{t.name}</h1>
        <p className="page-sub">{t.summary}</p>
        <div className="hero-actions">
          <Link to={`/generate?target=${t.id}`} className="btn btn-primary">
            <Sparkles size={16} /> Make this my goal
          </Link>
        </div>
      </div>

      <div className="card-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', marginTop: 22 }}>
        <div className="card card-pad">
          <h3 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <GitForkIcon /> Prerequisites
          </h3>
          <NeighbourList items={detail.prerequisites} emptyLabel="No prerequisites — you can start here." />
        </div>
        <div className="card card-pad">
          <h3 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Target size={16} /> Unlocks
          </h3>
          <NeighbourList items={detail.unlocks} emptyLabel="Nothing depends on this topic yet." />
        </div>
        <div className="card card-pad">
          <h3 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <AwardIcon /> Skills
          </h3>
          <NeighbourList items={detail.skills} emptyLabel="No skills attached." />
        </div>
      </div>

      {(t.goals?.length > 0 || detail.paths?.length > 0) && (
        <div className="card-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', marginTop: 18 }}>
          {t.goals?.length > 0 && (
            <div className="card card-pad">
              <h3 className="section-title">What you'll learn</h3>
              <ul style={{ margin: 0, paddingLeft: 18, color: 'var(--ink-soft)', fontSize: 14, lineHeight: 1.9 }}>
                {t.goals.map((g, i) => <li key={i}>{g}</li>)}
              </ul>
            </div>
          )}
          {detail.paths?.length > 0 && (
            <div className="card card-pad">
              <h3 className="section-title">Appears in these paths</h3>
              <NeighbourList
                items={detail.paths.map((p) => ({ ...p, id: p.id }))}
                emptyLabel="Not part of any curated path."
              />
            </div>
          )}
        </div>
      )}

      <h2 className="section-title mt-6">Neighbourhood map</h2>
      <p className="muted" style={{ marginBottom: 12, fontSize: 14 }}>
        Two hops of REQUIRES relationships around this topic. Scroll and drag to explore.
      </p>
      {graphLoading ? (
        <Loading label="Building neighbourhood…" compact />
      ) : (
        <GraphCanvas
          nodes={nodes}
          edges={edges}
          height={480}
          selectedId={topicId}
          statusBy={{ [topicId]: 'target' }}
        />
      )}
    </div>
  );
}

function GitForkIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="6" cy="6" r="3" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="6" r="3" />
      <path d="M6 9v6M18 9c0 4-6 4-8 8" />
    </svg>
  );
}

function AwardIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="8" r="6" /><path d="M8.5 13.5 7 22l5-3 5 3-1.5-8.5" />
    </svg>
  );
}
