import { Suspense, lazy, useEffect, useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { DatabaseZap, Loader2 } from 'lucide-react';
import { api } from './api/client.js';
import { AuthProvider } from './context/AuthContext.jsx';
import AppShell from './components/AppShell.jsx';
import { Loading } from './components/States.jsx';

const HomePage = lazy(() => import('./pages/HomePage.jsx'));
const PathsPage = lazy(() => import('./pages/PathsPage.jsx'));
const PathDetailPage = lazy(() => import('./pages/PathDetailPage.jsx'));
const TopicsPage = lazy(() => import('./pages/TopicsPage.jsx'));
const TopicPage = lazy(() => import('./pages/TopicPage.jsx'));
const GeneratorPage = lazy(() => import('./pages/GeneratorPage.jsx'));
const ExplorerPage = lazy(() => import('./pages/ExplorerPage.jsx'));
const SkillsPage = lazy(() => import('./pages/SkillsPage.jsx'));
const LoginPage = lazy(() => import('./pages/LoginPage.jsx'));
const RegisterPage = lazy(() => import('./pages/RegisterPage.jsx'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage.jsx'));

function DatabaseOffline({ onRetry }) {
  return (
    <div className="db-offline">
      <div className="card db-offline-card">
        <div className="state-icon db-offline-icon">
          <DatabaseZap size={26} />
        </div>
        <h2 className="section-title db-offline-title">Database is offline</h2>
        <p className="page-sub db-offline-sub">
          Pathfinder couldn't reach its graph database. Make sure your CognoDB instance is running
          and the backend has the right credentials.
        </p>
        <div className="code-line"># backend/.env<br />NEO4J_URI=bolt+s://your-instance.databases.cognodb.cloud<br />NEO4J_USER=cognodb<br />NEO4J_PASSWORD=your-password</div>
        <button className="btn btn-primary btn-block mt-4" onClick={onRetry}>
          <Loader2 size={15} /> Retry connection
        </button>
      </div>
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="db-offline">
      <div className="flex items-center gap-3 muted">
        <div className="spinner" />
        Checking database connection…
      </div>
    </div>
  );
}

export default function App() {
  const [dbState, setDbState] = useState('checking'); // checking | online | offline
  const [checkKey, setCheckKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setDbState('checking');
    api
      .health()
      .then((h) => {
        if (cancelled) return;
        setDbState(h.database === 'online' ? 'online' : 'offline');
      })
      .catch(() => {
        if (!cancelled) setDbState('offline');
      });
    return () => {
      cancelled = true;
    };
  }, [checkKey]);

  if (dbState === 'checking') return <LoadingScreen />;

  if (dbState === 'offline') {
    return <DatabaseOffline onRetry={() => setCheckKey((k) => k + 1)} />;
  }

  return (
    <AuthProvider>
      <Suspense fallback={<Loading label="Loading page…" />}>
        <Routes>
          <Route element={<AppShell />}>
            <Route index element={<HomePage />} />
            <Route path="paths" element={<PathsPage />} />
            <Route path="paths/:pathId" element={<PathDetailPage />} />
            <Route path="topics" element={<TopicsPage />} />
            <Route path="topics/:topicId" element={<TopicPage />} />
            <Route path="generate" element={<GeneratorPage />} />
            <Route path="explore" element={<ExplorerPage />} />
            <Route path="skills" element={<SkillsPage />} />
            <Route path="login" element={<LoginPage />} />
            <Route path="register" element={<RegisterPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </Suspense>
    </AuthProvider>
  );
}
