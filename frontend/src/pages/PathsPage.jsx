import { Link } from 'react-router-dom';
import { BookOpen, ArrowRight } from 'lucide-react';
import { useApi } from '../hooks/useApi.js';
import { api } from '../api/client.js';
import { Loading, ErrorState, EmptyState } from '../components/States.jsx';
import PathIcon from '../components/PathIcon.jsx';
import { pathTone } from '../lib/format.js';

export default function PathsPage() {
  const { data, loading, error, refresh } = useApi(() => api.listPaths(), []);

  if (loading) return <Loading label="Loading learning paths…" />;
  if (error) return <ErrorState message={error.message} onRetry={refresh} />;
  if (!data?.length) {
    return (
      <EmptyState
        title="No learning paths yet"
        message="Seed the database to create topics, paths and prerequisites."
      />
    );
  }

  return (
    <div>
      <h1 className="page-title">Learning paths</h1>
      <p className="page-sub">
        Curated journeys for common career goals. Each topic inside a path is linked to the topics it
        depends on, so paths stay correct even when topics are shared.
      </p>

      <div className="card-grid mt-6">
        {data.map((p) => {
          const tone = pathTone(p.icon);
          return (
            <Link to={`/paths/${p.id}`} key={p.id} className="card card-pad card-hover path-card">
              <div className="path-card-head">
                <div className={`stat-icon path-tile-${tone}`}>
                  <PathIcon icon={p.icon} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="path-card-title">{p.name}</div>
                  <div className="path-card-sub">{p.tagline}</div>
                </div>
              </div>
              <div className="flex items-center justify-between path-card-pill">
                <span className={`pill path-pill-${tone}`}>
                  <BookOpen size={12} /> {p.topicCount} topics
                </span>
                <ArrowRight size={16} className="muted" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
