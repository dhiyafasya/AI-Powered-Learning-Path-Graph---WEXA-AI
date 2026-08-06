import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Route,
  BookOpen,
  Sparkles,
  Network,
  Layers,
  GraduationCap,
  Database,
  DatabaseZap,
  CircleDashed,
} from 'lucide-react';
import { useApi } from '../hooks/useApi.js';
import { api } from '../api/client.js';

const NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/generate', label: 'Generate My Path', icon: Sparkles },
  { to: '/paths', label: 'Learning Paths', icon: Route },
  { to: '/topics', label: 'Topics', icon: BookOpen },
  { to: '/explore', label: 'Graph Explorer', icon: Network },
  { to: '/skills', label: 'Skills', icon: Layers },
  { to: '/learners', label: 'Learners', icon: GraduationCap },
];

const TITLES = {
  '/': 'Dashboard',
  '/generate': 'Generate My Path',
  '/paths': 'Learning Paths',
  '/topics': 'Topics',
  '/explore': 'Graph Explorer',
  '/skills': 'Skills',
  '/learners': 'Learners',
};

function titleFor(pathname) {
  const match = Object.entries(TITLES).find(([path]) =>
    path === '/' ? pathname === '/' : pathname.startsWith(path)
  );
  return match ? match[1] : 'Pathfinder';
}

function DbPill({ status }) {
  if (!status) return <span className="pill" style={{ background: '#f1f5f9', color: '#64748b' }}><CircleDashed size={12} /> checking…</span>;
  if (status === 'online') return <span className="pill status-ready"><Database size={12} /> database online</span>;
  return <span className="pill status-locked"><Database size={12} /> database offline</span>;
}

export default function AppShell() {
  const location = useLocation();
  const { data: health } = useApi(() => api.health(), []);
  const degraded = health && health.database === 'offline';

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">
            <DatabaseZap size={18} />
          </div>
          <div>
            <div className="brand-name">Pathfinder</div>
            <div className="brand-sub">AI Learning Path Graph</div>
          </div>
        </div>

        <div className="nav-section">Explore</div>
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
          >
            <item.icon size={17} />
            {item.label}
          </NavLink>
        ))}

        <div className="sidebar-footer">
          Built on a graph database — topics, prerequisites and skills modelled as nodes and
          relationships.
        </div>
      </aside>

      <div className="main">
        {degraded && (
          <div
            style={{
              background: '#fef3c7',
              color: '#92400e',
              padding: '10px 32px',
              fontSize: 13.5,
              fontWeight: 500,
              borderBottom: '1px solid #fde68a',
            }}
          >
            The graph database is currently unreachable. Pages will show cached or empty data until
            it comes back online.
          </div>
        )}
        <div className="topbar">
          <span className="topbar-title">{titleFor(location.pathname)}</span>
          <div className="topbar-right">
            <DbPill status={health?.database} />
          </div>
        </div>
        <div className="content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
