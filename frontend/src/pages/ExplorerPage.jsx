import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Maximize2 } from 'lucide-react';
import { useApi } from '../hooks/useApi.js';
import { api } from '../api/client.js';
import { Loading, ErrorState, EmptyState } from '../components/States.jsx';
import GraphCanvas from '../components/GraphCanvas.jsx';
import { categoryTone } from '../lib/format.js';

export default function ExplorerPage() {
  const navigate = useNavigate();
  const { data, loading, error, refresh } = useApi(() => api.fullGraph(), []);
  const [category, setCategory] = useState('');
  const [search, setSearch] = useState('');

  const categories = useMemo(() => {
    const set = new Set((data?.topics || []).map((t) => t.category));
    return [...set];
  }, [data]);

  const { nodes, edges } = useMemo(() => {
    const full = data?.topics || [];
    const allEdges = data?.edges || [];
    if (!category && !search) return { nodes: full, edges: allEdges };

    const q = search.trim().toLowerCase();
    const ids = new Set(
      full
        .filter((t) => (!category || t.category === category))
        .filter((t) => (!q || t.name.toLowerCase().includes(q) || t.id.includes(q)))
        .map((t) => t.id)
    );
    return {
      nodes: full.filter((t) => ids.has(t.id)),
      edges: allEdges.filter((e) => ids.has(e.source) && ids.has(e.target)),
    };
  }, [data, category, search]);

  if (loading) return <Loading label="Loading the knowledge graph…" />;
  if (error) return <ErrorState message={error.message} onRetry={refresh} />;

  return (
    <div>
      <h1 className="page-title">Graph explorer</h1>
      <p className="page-sub">
        The full topic graph — every node is a topic, every arrow a "requires" relationship. Click a
        node to open it, or filter to one category.
      </p>

      <div className="filter-row mt-6">
        <div className="search-box">
          <Search size={16} />
          <input
            className="input input-search"
            placeholder="Find a topic…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2 wrap">
          <button
            className={`btn btn-sm${!category ? ' btn-primary' : ''}`}
            onClick={() => setCategory('')}
          >
            All
          </button>
          {categories.map((c) => {
            const tone = categoryTone(c);
            return (
              <button
                key={c}
                className={`btn btn-sm${category === c ? ' btn-primary' : ''}`}
                onClick={() => setCategory(category === c ? '' : c)}
              >
                <span className={`dot ${tone ? `cat-dot-${tone}` : 'cat-dot-muted'}`} />
                {c}
              </button>
            );
          })}
        </div>
      </div>

      {nodes.length === 0 ? (
        <EmptyState
          icon={Maximize2}
          title="Nothing to show"
          message="No topics match the current filters."
        />
      ) : (
        <GraphCanvas
          nodes={nodes}
          edges={edges}
          height={Math.max(460, nodes.length * 30 + 160)}
          onSelect={(id) => navigate(`/topics/${id}`)}
        />
      )}

      <div className="card card-pad mt-6 legend">
        <span className="eyebrow">Legend</span>
        <span className="legend-item">
          <span className="dot dot-beginner" /> beginner
        </span>
        <span className="legend-item">
          <span className="dot dot-intermediate" /> intermediate
        </span>
        <span className="legend-item">
          <span className="dot dot-advanced" /> advanced
        </span>
        <span className="legend-item">
          <span className="dot-requires" /> requires
        </span>
      </div>
    </div>
  );
}
