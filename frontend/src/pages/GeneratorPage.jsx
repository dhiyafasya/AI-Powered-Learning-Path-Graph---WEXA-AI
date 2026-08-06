import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Sparkles,
  Clock,
  Target,
  PlayCircle,
  CheckCircle2,
  Lock,
  ArrowRight,
  Hourglass,
} from 'lucide-react';
import { useApi } from '../hooks/useApi.js';
import { api } from '../api/client.js';
import { Loading, ErrorState, EmptyState } from '../components/States.jsx';
import GraphCanvas from '../components/GraphCanvas.jsx';
import { formatHours } from '../lib/format.js';

function StepStatus({ step }) {
  if (step.isCompleted) {
    return <span className="pill status-done"><CheckCircle2 size={12} /> done</span>;
  }
  if (step.isReady) {
    return <span className="pill status-ready"><PlayCircle size={12} /> ready to start</span>;
  }
  return <span className="pill status-locked"><Lock size={12} /> locked</span>;
}

export default function GeneratorPage() {
  const [searchParams] = useSearchParams();
  const initialTarget = searchParams.get('target') || '';
  const initialUser = searchParams.get('user') || 'user-guest';

  const [targetId, setTargetId] = useState(initialTarget);
  const [userId, setUserId] = useState(initialUser);
  const [result, setResult] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);
  const autoRan = useRef(false);

  const { data: topics, loading: topicsLoading } = useApi(() => api.listTopics(), []);
  const { data: users } = useApi(() => api.listUsers(), []);

  const grouped = useMemo(() => {
    const g = {};
    for (const t of topics || []) {
      if (!g[t.category]) g[t.category] = [];
      g[t.category].push(t);
    }
    return g;
  }, [topics]);

  async function generate() {
    if (!targetId) return;
    setGenerating(true);
    setError(null);
    try {
      const res = await api.generatePath({ targetId, userId: userId || null, completedTopicIds: [] });
      setResult(res);
    } catch (e) {
      setError(e);
      setResult(null);
    } finally {
      setGenerating(false);
    }
  }

  // Auto-run once when arriving with a ?target= deep link.
  useEffect(() => {
    if (topics && initialTarget && !autoRan.current) {
      autoRan.current = true;
      generate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topics, initialTarget]);

  const statusBy = useMemo(() => {
    const map = {};
    if (result) {
      for (const s of result.steps) {
        if (s.isCompleted) map[s.id] = 'done';
        if (s.isTarget) map[s.id] = 'target';
      }
    }
    return map;
  }, [result]);

  const unlockBy = useMemo(() => {
    const map = {};
    if (result) for (const s of result.steps) map[s.id] = s.unlockScore;
    return map;
  }, [result]);

  const graphEdges = useMemo(() => {
    const edges = [];
    if (result) {
      const ids = new Set(result.steps.map((s) => s.id));
      for (const s of result.steps) {
        for (const pr of s.prerequisites) {
          if (ids.has(pr)) edges.push({ source: s.id, target: pr });
        }
      }
    }
    return edges;
  }, [result]);

  if (topicsLoading && !topics) return <Loading label="Loading topics…" />;

  return (
    <div>
      <h1 className="page-title">Generate my path</h1>
      <p className="page-sub">
        Tell Pathfinder what you want to learn and who you are, and it will walk the graph to build a
        step-by-step route — every prerequisite in the right order, personalised to what you've
        already completed.
      </p>

      <div className="card card-pad mt-6">
        <div className="card-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
          <div className="field">
            <label className="field-label" htmlFor="target">My goal</label>
            <select
              id="target"
              className="select"
              value={targetId}
              onChange={(e) => setTargetId(e.target.value)}
            >
              <option value="">Select a topic to learn…</option>
              {Object.entries(grouped).map(([category, list]) => (
                <optgroup key={category} label={category}>
                  {list.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          <div className="field">
            <label className="field-label" htmlFor="learner">Learner</label>
            <select
              id="learner"
              className="select"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
            >
              {(users || []).map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} · {u.completedCount} completed
                </option>
              ))}
            </select>
          </div>

          <div className="field" style={{ justifyContent: 'flex-end' }}>
            <button
              className="btn btn-primary btn-block"
              disabled={!targetId || generating}
              onClick={generate}
              style={{ marginTop: 24 }}
            >
              {generating ? <Hourglass size={16} /> : <Sparkles size={16} />}
              {generating ? 'Planning route…' : 'Generate my path'}
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="card card-pad mt-6" style={{ borderColor: '#fecaca', background: '#fef2f2' }}>
          <ErrorState message={error.message} onRetry={generate} compact />
        </div>
      )}

      {!result && !error && !generating && (
        <div className="card mt-6">
          <EmptyState
            icon={Target}
            title="No path yet"
            message="Pick a goal above and Pathfinder will compute the ordered set of topics you need, using the prerequisite relationships stored in the graph."
          />
        </div>
      )}

      {result && (
        <div className="mt-6">
          <div className="flex items-center justify-between wrap gap-3">
            <h2 className="section-title" style={{ marginBottom: 0 }}>
              Your path to <span style={{ color: 'var(--accent-ink)' }}>{result.target.name}</span>
            </h2>
            <Link
              to={`/topics/${result.target.id}`}
              className="btn btn-sm"
              style={{ marginBottom: 0 }}
            >
              View goal <ArrowRight size={14} />
            </Link>
          </div>

          <div className="stat-grid mt-4">
            <div className="stat-card">
              <div className="stat-icon" style={{ background: '#eef2ff', color: '#4f46e5' }}>
                <Target size={20} />
              </div>
              <div>
                <div className="stat-value mono">{result.stats.totalTopics}</div>
                <div className="stat-label">topics needed</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon" style={{ background: '#f0fdf4', color: '#059669' }}>
                <PlayCircle size={20} />
              </div>
              <div>
                <div className="stat-value mono">{result.stats.remainingTopics}</div>
                <div className="stat-label">still to learn</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon" style={{ background: '#fff7ed', color: '#c2410c' }}>
                <Clock size={20} />
              </div>
              <div>
                <div className="stat-value mono">{formatHours(result.stats.remainingEstHours)}</div>
                <div className="stat-label">estimated time left</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon" style={{ background: '#eff6ff', color: '#0284c7' }}>
                <CheckCircle2 size={20} />
              </div>
              <div>
                <div className="stat-value mono">{result.stats.completedTopics}</div>
                <div className="stat-label">already done</div>
              </div>
            </div>
          </div>

          {result.nextSuggestions.length > 0 && (
            <div className="card card-pad mt-6" style={{ borderColor: '#d5daf0', background: 'linear-gradient(135deg,#fbfaff,#f5f3ff)' }}>
              <div className="flex items-center gap-2" style={{ marginBottom: 12 }}>
                <Sparkles size={16} style={{ color: 'var(--accent)' }} />
                <h3 className="section-title" style={{ marginBottom: 0 }}>Recommended next step</h3>
              </div>
              <div className="flex wrap gap-3">
                {result.nextSuggestions.slice(0, 3).map((t, i) => (
                  <Link
                    key={t.id}
                    to={`/topics/${t.id}`}
                    className="card card-pad card-hover"
                    style={{ flex: '1 1 220px', borderColor: i === 0 ? '#c7d2fe' : 'var(--border)' }}
                  >
                    {i === 0 && (
                      <div className="eyebrow" style={{ color: 'var(--accent-ink)', marginBottom: 6 }}>
                        Start with
                      </div>
                    )}
                    <div style={{ fontWeight: 700, fontSize: 15 }}>{t.name}</div>
                    <div className="muted" style={{ fontSize: 13, marginTop: 4 }}>
                      {t.summary}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          <h2 className="section-title mt-6">Route map</h2>
          <p className="muted" style={{ marginBottom: 12, fontSize: 14 }}>
            Fundamentals on the left, your goal on the right. Green topics are done, the orange one is
            your target, and an arrow points at what a topic depends on.
          </p>
          <GraphCanvas
            nodes={result.steps.map((s) => s.topic)}
            edges={graphEdges}
            statusBy={statusBy}
            unlockBy={unlockBy}
            selectedId={result.target.id}
            height={Math.max(360, result.steps.length * 34 + 120)}
          />

          <h2 className="section-title mt-6">Step by step</h2>
          <div className="card card-pad">
            {result.steps.map((s, i) => (
              <Link to={`/topics/${s.id}`} key={s.id} className="row card-hover" style={{ borderRadius: 8 }}>
                <span className="row-index">{i + 1}</span>
                <div className="row-main">
                  <div className="row-title" style={{ color: s.isCompleted ? 'var(--muted)' : undefined }}>
                    {s.topic.name}
                    {s.isTarget && (
                      <span className="pill status-target" style={{ marginLeft: 8 }}>
                        <Target size={11} /> goal
                      </span>
                    )}
                  </div>
                  <div className="row-sub">
                    {s.topic.summary} · unlocks {s.unlockScore} topic{s.unlockScore === 1 ? '' : 's'} downstream
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="pill" style={{ background: '#f1f5f9', color: '#334155' }}>
                    <Clock size={12} /> {formatHours(s.topic.estHours)}
                  </span>
                  <StepStatus step={s} />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
