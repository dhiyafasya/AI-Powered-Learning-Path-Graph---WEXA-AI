import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Clock, GitFork, Unlock } from 'lucide-react';
import { useApi } from '../hooks/useApi.js';
import { api } from '../api/client.js';
import { Loading, ErrorState, EmptyState } from '../components/States.jsx';
import { formatHours, categoryTone } from '../lib/format.js';

export default function TopicsPage() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');

  const { data: topics, loading, error, refresh } = useApi(
    () => api.listTopics({ search, category }),
    [search, category]
  );
  const { data: categories } = useApi(() => api.categories(), []);

  const debounced = useMemo(() => search, [search]);

  if (loading && !topics) return <Loading label="Loading topics…" />;
  if (error) return <ErrorState message={error.message} onRetry={refresh} />;

  return (
    <div>
      <h1 className="page-title">Topics</h1>
      <p className="page-sub">
        Every topic in the knowledge graph. Search by name or filter by category, then open a topic
        to see its prerequisites and what it unlocks.
      </p>

      <div className="filter-row filter-row-lg mt-6">
        <div className="search-box search-box-wide">
          <Search size={16} />
          <input
            className="input input-search"
            placeholder="Search topics…"
            value={debounced}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select className="select select-category" value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">All categories</option>
          {(categories || []).map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {topics?.length === 0 ? (
        <EmptyState
          title="No topics match"
          message="Try a different search term or clear the category filter."
        />
      ) : (
        <div className="card-grid">
          {topics?.map((t) => {
            const tone = categoryTone(t.category);
            return (
              <Link to={`/topics/${t.id}`} key={t.id} className="card card-pad card-hover">
                <div className="topic-card-top">
                  <span className={`category-chip ${tone ? `category-chip-${tone}` : ''}`}>{t.category}</span>
                  <span className={`pill pill-${t.level}`}>{t.level}</span>
                </div>
                <div className="topic-card-title">{t.name}</div>
                <div className="topic-card-summary">{t.summary}</div>
                <div className="topic-card-footer">
                  <span className="flex items-center gap-1"><Clock size={13} /> {formatHours(t.estHours)}</span>
                  <span className="flex items-center gap-1"><GitFork size={13} /> {t.prerequisiteCount} prereqs</span>
                  <span className="flex items-center gap-1"><Unlock size={13} /> unlocks {t.unlocksCount}</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
