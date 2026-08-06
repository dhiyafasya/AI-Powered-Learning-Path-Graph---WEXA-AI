import { NavLink, Outlet, Link, useLocation } from 'react-router-dom';
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
  LogIn,
  LogOut,
} from 'lucide-react';
import { useApi } from '../hooks/useApi.js';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';

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
  const { user, loading: authLoading, logout } = useAuth();

  function initials(name) {
    return name
      .split(' ')
      .map((w) => w[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase();
  }

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
            {authLoading ? (
              <span className="pill" style={{ background: '#f1f5f9', color: '#64748b' }}>
                <CircleDashed size={12} /> session…</span>
            ) : user ? (
              <div className="topbar-user">
                <span className="avatar" style={{ width: 28, height: 28, fontSize: 12, background: user.avatarColor || '#6366f1' }}>
                  {initials(user.name)}
                </span>
                <span className="topbar-user-name">{user.name}</span>
                <button className="topbar-logout" title="Sign out" onClick={logout}>
                  <LogOut size={14} />
                </button>
              </div>
            ) : (
              <Link to="/login" className="btn btn-sm">
                <LogIn size={14} /> Sign in
              </Link>
            )}
          </div>
        </div>
        <div className="content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
