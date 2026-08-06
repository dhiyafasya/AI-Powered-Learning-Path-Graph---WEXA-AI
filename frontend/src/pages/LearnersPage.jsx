import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, ChevronUp, Sparkles, GraduationCap } from 'lucide-react';
import { useApi } from '../hooks/useApi.js';
import { api } from '../api/client.js';
import { Loading, ErrorState, EmptyState } from '../components/States.jsx';
import { initials } from '../lib/format.js';

function LearnerProgress({ userId }) {
  const { data, loading, error } = useApi(() => api.user(userId), [userId]);

  if (loading) return <Loading compact label="Loading progress…" />;
  if (error) return <div className="muted" style={{ fontSize: 14 }}>{error.message}</div>;
  if (!data) return null;

  return (
    <div style={{ padding: '4px 4px 0' }}>
      <div className="flex wrap gap-2" style={{ marginBottom: 10 }}>
        {data.enrolledPaths?.length > 0 && (
          <span className="pill status-done">
            <GraduationCap size={12} /> {data.enrolledPaths.map((p) => p.name).join(', ')}
          </span>
        )}
        <span className="pill" style={{ background: '#f1f5f9', color: '#334155' }}>
          {data.completed.length} completed
        </span>
      </div>
      {data.completed.length === 0 ? (
        <div className="muted" style={{ fontSize: 14 }}>No topics completed yet.</div>
      ) : (
        <div className="flex wrap gap-2">
          {data.completed.map((t) => (
            <Link key={t.id} to={`/topics/${t.id}`} className="pill" style={{ background: '#eef2ff', color: '#4f46e5' }}>
              {t.name}
            </Link>
          ))}
        </div>
      )}
      <Link to={`/generate?user=${data.user.id}`} className="btn btn-sm btn-primary mt-4">
        <Sparkles size={14} /> Generate a path for {data.user.name.split(' ')[0]}
      </Link>
    </div>
  );
}

export default function LearnersPage() {
  const { data, loading, error, refresh } = useApi(() => api.listUsers(), []);
  const [openId, setOpenId] = useState(null);

  if (loading) return <Loading label="Loading learners…" />;
  if (error) return <ErrorState message={error.message} onRetry={refresh} />;
  if (!data?.length) {
    return (
      <EmptyState
        title="No learners yet"
        message="Seed the database to create sample learners with progress."
      />
    );
  }

  return (
    <div>
      <h1 className="page-title">Learners</h1>
      <p className="page-sub">
        Sample learners with real progress stored as <span className="mono">COMPLETED</span>{' '}
        relationships. Open one to see their history and generate a personalised path from it.
      </p>

      <div className="card-grid mt-6">
        {data.map((u) => {
          const expanded = openId === u.id;
          return (
            <div className="card card-pad" key={u.id}>
              <button
                onClick={() => setOpenId(expanded ? null : u.id)}
                style={{ border: 'none', background: 'none', padding: 0, width: '100%', textAlign: 'left', cursor: 'pointer' }}
              >
                <div className="flex items-center gap-3">
                  <div className="avatar" style={{ background: u.avatarColor }}>
                    {initials(u.name)}
                  </div>
                  <div className="flex-1">
                    <div style={{ fontWeight: 700, fontSize: 16 }}>{u.name}</div>
                    <div className="muted" style={{ fontSize: 13 }}>{u.focus}</div>
                  </div>
                  {expanded ? <ChevronUp size={18} className="muted" /> : <ChevronDown size={18} className="muted" />}
                </div>
              </button>
              <div style={{ marginTop: 12 }}>
                <div className="row" style={{ padding: '10px 0', borderTop: '1px solid var(--border)' }}>
                  <div className="flex-1 muted" style={{ fontSize: 13.5 }}>Topics completed</div>
                  <div className="mono" style={{ fontWeight: 700, fontSize: 16 }}>{u.completedCount}</div>
                </div>
              </div>
              {expanded && (
                <div className="mt-4">
                  <LearnerProgress userId={u.id} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
