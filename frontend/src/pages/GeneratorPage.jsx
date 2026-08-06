import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams, useLocation, Link } from 'react-router-dom';
import {
  Sparkles,
  Clock,
  Target,
  PlayCircle,
  CheckCircle2,
  Lock,
  ArrowRight,
  Hourglass,
  BadgeCheck,
  UserCircle2,
  LogIn,
  UserPlus,
} from 'lucide-react';
import { useApi } from '../hooks/useApi.js';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
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

/**
 * Returns a copy of `path` with `topicId` flipped to completed and the
 * dependent stats recomputed — used for instant UI feedback while the
 * server confirms in the background.
 */
function optimisticComplete(path, topicId) {
  const steps = path.steps.map((s) =>
    s.id === topicId
      ? { ...s, isCompleted: true, isReady: false }
      : {
          ...s,
          isReady: s.prerequisites.every(
            (p) =>
              p === topicId ||
              path.steps.find((step) => step.id === p)?.isCompleted
          ),
        }
  );
  const completedTopics = steps.filter((s) => s.isCompleted).length;
  return {
    ...path,
    steps,
    stats: {
      ...path.stats,
      completedTopics,
      remainingTopics: steps.length - completedTopics,
    },
  };
}

export default function GeneratorPage() {
  const { user, loading: authLoading, refreshUser } = useAuth();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const initialTarget = searchParams.get('target') || '';

  const [targetId, setTargetId] = useState(initialTarget);
  const [result, setResult] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [justCompleted, setJustCompleted] = useState(null);
  const [marking, setMarking] = useState(null);
  const autoRan = useRef(false);

  const { data: topics, loading: topicsLoading } = useApi(() => api.listTopics(), []);

  const grouped = useMemo(() => {
    const g = {};
    for (const t of topics || []) {
      if (!g[t.category]) g[t.category] = [];
      g[t.category].push(t);
    }
    return g;
  }, [topics]);

  async function generate({ silent = false } = {}) {
    if (!targetId || !user) return;
    if (!silent) setGenerating(true);
    setError(null);
    try {
      // Paths are always personalised for the signed-in account.
      const res = await api.generatePath({
        targetId,
        userId: user.id,
        completedTopicIds: [],
      });
      setResult(res);
    } catch (e) {
      setError(e);
      if (!silent) setResult(null);
    } finally {
      setGenerating(false);
    }
  }

  /** Optimistically flip a step to completed, then reconcile with the server. */
  async function handleMarkComplete(topicId) {
    if (!user) return;
    setMarking(topicId);
    setError(null);
    try {
      await api.markComplete(user.id, topicId);
      // Instant local update so the UI reacts immediately (no flicker).
      setResult((prev) => (prev ? optimisticComplete(prev, topicId) : prev));
      setJustCompleted(topicId);
      // Reconcile progress count and path from the server in the background.
      await Promise.all([refreshUser().catch(() => null), generate({ silent: true }).catch(() => null)]);
    } catch (e) {
      setError(e);
    } finally {
      setMarking(null);
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

  const refreshing = result != null && (generating || marking != null);

  if (authLoading) return <Loading label="Checking session…" />;

  if (!user) {
    return (
      <div>
        <h1 className="page-title">Generate my path</h1>
        <p className="page-sub">
          Tell Pathfinder what you want to learn, and it will walk the graph to build a step-by-step
          route — every prerequisite in the right order, personalised to what you've already
          completed.
        </p>

        <div className="card card-pad mt-6 auth-gate">
          <div className="auth-gate-icon">
            <UserCircle2 size={22} />
          </div>
          <h2 className="section-title section-title-md">Sign in to generate your path</h2>
          <p className="muted gate-sub">
            Personalised paths use <strong>your</strong> progress in the graph, and completing topics
            saves to your account — so we need to know who you are.
          </p>
          <div className="auth-gate-actions">
            <Link to="/login" state={{ from: location.pathname + location.search }} className="btn btn-primary btn-green">
              <LogIn size={15} /> Sign in
            </Link>
            <Link to="/register" state={{ from: location.pathname + location.search }} className="btn">
              <UserPlus size={15} /> Create account
            </Link>
          </div>
          {initialTarget && (
            <p className="eyebrow muted gate-note">
              Goal dipilih: <span className="mono">{initialTarget}</span> — dilanjutkan otomatis setelah login.
            </p>
          )}
        </div>
      </div>
    );
  }

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
        <div className="card-grid card-grid-240">
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
            <label className="field-label">Learner</label>
            <div className="learner-locked">
              <span
                className="avatar avatar-xs"
                style={{ '--avatar-bg': user.avatarColor }}
              >
                {user.name
                  .split(' ')
                  .map((w) => w[0])
                  .filter(Boolean)
                  .slice(0, 2)
                  .join('')
                  .toUpperCase()}
              </span>
              <span className="learner-locked-name">{user.name}</span>
              <span className="pill status-ready">
                <CheckCircle2 size={12} /> {user.completedCount ?? 0} completed
              </span>
            </div>
            <span className="eyebrow learner-note">
              <UserCircle2 size={13} /> Personalised for your account — progress saves to the graph.
            </span>
          </div>

          <div className="field field-end">
            <button
              className="btn btn-primary btn-block mt-6"
              disabled={!targetId || generating}
              onClick={generate}
            >
              {generating ? <Hourglass size={16} /> : <Sparkles size={16} />}
              {generating ? 'Planning route…' : 'Generate my path'}
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="card card-pad mt-6 card-error">
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
            <h2 className="section-title section-title-flush">
              Your path to <span className="accent-text">{result.target.name}</span>
            </h2>
            <Link
              to={`/topics/${result.target.id}`}
              className="btn btn-sm section-title-flush"
            >
              View goal <ArrowRight size={14} />
            </Link>
          </div>

          <div className="stat-grid mt-4">
            <div className="stat-card">
              <div className="stat-icon stat-icon-sky">
                <Target size={20} />
              </div>
              <div>
                <div className="stat-value mono">{result.stats.totalTopics}</div>
                <div className="stat-label">topics needed</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon stat-icon-green">
                <PlayCircle size={20} />
              </div>
              <div>
                <div className="stat-value mono">{result.stats.remainingTopics}</div>
                <div className="stat-label">still to learn</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon stat-icon-orange">
                <Clock size={20} />
              </div>
              <div>
                <div className="stat-value mono">{formatHours(result.stats.remainingEstHours)}</div>
                <div className="stat-label">estimated time left</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon stat-icon-blue">
                <CheckCircle2 size={20} />
              </div>
              <div>
                <div className="stat-value mono">{result.stats.completedTopics}</div>
                <div className="stat-label">already done</div>
              </div>
            </div>
          </div>

          {result.nextSuggestions.length > 0 && (
            <div className="card card-pad mt-6 card-recommend">
              <div className="recommend-head">
                <Sparkles size={16} className="icon-accent" />
                <h3 className="section-title section-title-flush">Recommended next step</h3>
              </div>
              <div className="flex wrap gap-3">
                {result.nextSuggestions.slice(0, 3).map((t, i) => (
                  <Link
                    key={t.id}
                    to={`/topics/${t.id}`}
                    className={`card card-pad card-hover recommend-item${i === 0 ? ' recommend-item-first' : ''}`}
                  >
                    {i === 0 && (
                      <div className="eyebrow eyebrow-accent-sm">
                        Start with
                      </div>
                    )}
                    <div className="suggestion-name">{t.name}</div>
                    <div className="suggestion-summary">
                      {t.summary}
                    </div>
                    {user && i === 0 && (
                      <button
                        className="btn btn-sm btn-primary mt-4 btn-block"
                        disabled={marking === t.id}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleMarkComplete(t.id);
                        }}
                      >
                        {marking === t.id ? (
                          <Hourglass size={13} />
                        ) : justCompleted === t.id ? (
                          <BadgeCheck size={13} />
                        ) : (
                          <CheckCircle2 size={13} />
                        )}
                        {marking === t.id
                          ? 'Saving…'
                          : justCompleted === t.id
                            ? 'Saved to the graph'
                            : 'Mark as complete'}                      </button>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          )}

          <h2 className="section-title mt-6">Route map</h2>
          <p className="page-note">
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
              <Link to={`/topics/${s.id}`} key={s.id} className={`row card-hover row-rounded${s.isCompleted ? ' row-title-done' : ''}`}>
                <span className="row-index">{i + 1}</span>
                <div className="row-main">
                  <div className="row-title">
                    {s.topic.name}
                    {s.isTarget && (
                      <span className="pill status-target pill-goal">
                        <Target size={11} /> goal
                      </span>
                    )}
                  </div>
                  <div className="row-sub">
                    {s.topic.summary} · unlocks {s.unlockScore} topic{s.unlockScore === 1 ? '' : 's'} downstream
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="pill pill-neutral">
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
