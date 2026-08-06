import { Link } from 'react-router-dom';
import { BookOpen, GitFork, Layers, Sparkles, ArrowRight, Route } from 'lucide-react';
import { useApi } from '../hooks/useApi.js';
import { api } from '../api/client.js';
import { Loading, ErrorState } from '../components/States.jsx';
import PathIcon from '../components/PathIcon.jsx';
import { pathTone } from '../lib/format.js';

function statCards(stats, paths, skills) {
  return [
    { icon: BookOpen, value: stats?.nodeCount ?? '—', label: 'Knowledge nodes' },
    { icon: GitFork, value: stats?.relationshipCount ?? '—', label: 'Relationships' },
    { icon: Route, value: paths?.length ?? '—', label: 'Learning paths' },
    { icon: Layers, value: skills?.length ?? '—', label: 'Skills' },
  ];
}

export default function HomePage() {
  const { data: stats, loading: statsLoading, error: statsError, refresh } = useApi(() => api.stats(), []);
  const { data: paths, loading: pathsLoading } = useApi(() => api.listPaths(), []);
  const { data: skills } = useApi(() => api.listSkills(), []);

  if (statsLoading || pathsLoading) return <Loading label="Loading dashboard…" />;
  if (statsError) return <ErrorState message={statsError.message} onRetry={refresh} />;

  const cards = statCards(stats, paths, skills);

  return (
    <div>
      <section className="hero">
        <h1 className="hero-title">
          Learn anything, <span className="grad">in the right order.</span>
        </h1>
        <p className="hero-sub">
          Pathfinder models every topic as a node and every prerequisite as a relationship, so it can
          compute the fastest, most sensible route from where you are to where you want to be.
        </p>
        <div className="hero-actions">
          <Link to="/generate" className="btn btn-primary">
            <Sparkles size={16} /> Generate my path
          </Link>
          <Link to="/paths" className="btn">
            Explore paths <ArrowRight size={15} />
          </Link>
        </div>
      </section>

      <section className="stat-grid">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <div className="stat-card" key={c.label}>
              <div className="stat-icon stat-icon-warm">
                <Icon size={20} />
              </div>
              <div>
                <div className="stat-value mono">{c.value}</div>
                <div className="stat-label">{c.label}</div>
              </div>
            </div>
          );
        })}
      </section>

      <div className="flex items-center justify-between mb-4">
        <h2 className="section-title section-title-flush">Learning paths</h2>
        <Link to="/paths" className="btn btn-sm">View all</Link>
      </div>

      <section className="card-grid">
        {paths?.map((p) => {
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
              <div className="flex items-center gap-2 path-card-pill">
                <span className={`pill path-pill-${tone}`}>
                  <BookOpen size={12} /> {p.topicCount} topics
                </span>
              </div>
            </Link>
          );
        })}
      </section>
    </div>
  );
}
