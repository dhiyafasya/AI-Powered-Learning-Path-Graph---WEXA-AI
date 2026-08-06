import { useMemo } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, BookOpen, Clock, Sparkles } from 'lucide-react';
import { useApi } from '../hooks/useApi.js';
import { api } from '../api/client.js';
import { Loading, ErrorState, EmptyState } from '../components/States.jsx';
import GraphCanvas from '../components/GraphCanvas.jsx';
import { formatHours } from '../lib/format.js';

export default function PathDetailPage() {
  const { pathId } = useParams();
  const navigate = useNavigate();
  const { data: detail, loading, error, refresh } = useApi(() => api.pathDetail(pathId), [pathId]);

  const { nodes, edges } = useMemo(() => {
    if (!detail) return { nodes: [], edges: [] };
    const ids = new Set(detail.topics.map((t) => t.id));
    const edges = [];
    for (const t of detail.topics) {
      for (const pr of t.requires || []) {
        if (ids.has(pr)) edges.push({ source: t.id, target: pr });
      }
    }
    return { nodes: detail.topics, edges };
  }, [detail]);

  if (loading) return <Loading label="Loading path…" />;
  if (error) return <ErrorState message={error.message} onRetry={refresh} />;
  if (!detail) {
    return (
      <EmptyState
        title="Path not found"
        message={`No learning path with the id "${pathId}" exists in the graph.`}
      />
    );
  }

  const totalHours = detail.topics.reduce((acc, t) => acc + (t.estHours || 0), 0);
  const targetId = detail.topics[detail.topics.length - 1]?.id;

  return (
    <div>
      <Link to="/paths" className="back-link">
        <ArrowLeft size={15} /> All paths
      </Link>

      <div className="hero hero-compact">
        <div className="flex items-center gap-3 wrap">
          <span className="eyebrow">{detail.topics.length} topics · {totalHours}h total</span>
        </div>
        <h1 className="page-title mt-2">{detail.name}</h1>
        <p className="page-sub">{detail.description}</p>
        <div className="hero-actions">
          {targetId && (
            <button
              className="btn btn-primary"
              onClick={() => navigate(`/generate?target=${targetId}`)}
            >
              <Sparkles size={16} /> Build a personalised version
            </button>
          )}
        </div>
      </div>

      <h2 className="section-title mt-6">Path map</h2>
      <p className="page-note">
        Topics flow left-to-right. An arrow from a topic to the left means "this topic requires that
        one first".
      </p>
      <GraphCanvas nodes={nodes} edges={edges} height={440} />

      <h2 className="section-title mt-6">Curriculum</h2>
      <div className="card card-pad">
        {detail.topics.map((t, i) => (
          <Link to={`/topics/${t.id}`} key={t.id} className="row card-hover row-rounded">
            <span className="row-index">{i + 1}</span>
            <div className="row-main">
              <div className="row-title">{t.name}</div>
              <div className="row-sub">
                {t.summary} · {t.requires?.length ? `${t.requires.length} prerequisite${t.requires.length > 1 ? 's' : ''}` : 'No prerequisites'}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`pill pill-${t.level}`}>{t.level}</span>
              <span className="pill pill-neutral">
                <Clock size={12} /> {formatHours(t.estHours)}
              </span>
              <BookOpen size={15} className="muted" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
