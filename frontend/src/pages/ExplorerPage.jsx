import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Maximize2 } from 'lucide-react';
import { useApi } from '../hooks/useApi.js';
import { api } from '../api/client.js';
import { Loading, ErrorState, EmptyState } from '../components/States.jsx';
import GraphCanvas from '../components/GraphCanvas.jsx';
import { CATEGORY_COLORS } from '../lib/format.js';

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

      <div className="flex gap-3 wrap items-center mt-6" style={{ marginBottom: 16 }}>
        <div style={{ position: 'relative', flex: '1 1 260px' }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--faint)' }} />
          <input
            className="input"
            style={{ paddingLeft: 36 }}
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
          {categories.map((c) => (
            <button
              key={c}
              className={`btn btn-sm${category === c ? ' btn-primary' : ''}`}
              onClick={() => setCategory(category === c ? '' : c)}
            >
              <span className="dot" style={{ background: CATEGORY_COLORS[c] || '#94a3b8' }} />
              {c}
            </button>
          ))}
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

      <div className="card card-pad mt-6" style={{ display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <span className="eyebrow">Legend</span>
        <span className="flex items-center gap-2" style={{ fontSize: 13, color: 'var(--ink-soft)' }}>
          <span className="dot" style={{ background: '#10b981' }} /> beginner
        </span>
        <span className="flex items-center gap-2" style={{ fontSize: 13, color: 'var(--ink-soft)' }}>
          <span className="dot" style={{ background: '#0ea5e9' }} /> intermediate
        </span>
        <span className="flex items-center gap-2" style={{ fontSize: 13, color: 'var(--ink-soft)' }}>
          <span className="dot" style={{ background: '#8b5cf6' }} /> advanced
        </span>
        <span className="flex items-center gap-2" style={{ fontSize: 13, color: 'var(--ink-soft)' }}>
          <span style={{ width: 26, height: 0, borderTop: '2px solid #94a3b8' }} /> requires
        </span>
      </div>
    </div>
  );
}
