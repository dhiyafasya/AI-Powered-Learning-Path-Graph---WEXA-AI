import { useState } from 'react';
import { NavLink, Outlet, Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Route,
  BookOpen,
  Sparkles,
  Network,
  Layers,
  Database,
  CircleDashed,
  LogIn,
  LogOut,
  Menu,
  X,
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
];

const TITLES = {
  '/': 'Dashboard',
  '/generate': 'Generate My Path',
  '/paths': 'Learning Paths',
  '/topics': 'Topics',
  '/explore': 'Graph Explorer',
  '/skills': 'Skills',
};

function titleFor(pathname) {
  const match = Object.entries(TITLES).find(([path]) =>
    path === '/' ? pathname === '/' : pathname.startsWith(path)
  );
  return match ? match[1] : 'Pathfinder';
}

function DbPill({ status }) {
  if (!status) return <span className="pill pill-neutral"><CircleDashed size={12} /> checking…</span>;
  if (status === 'online') return <span className="pill status-ready"><Database size={12} /> database online</span>;
  return <span className="pill status-locked"><Database size={12} /> database offline</span>;
}

export default function AppShell() {
  const location = useLocation();
  const { data: health } = useApi(() => api.health(), []);
  const degraded = health && health.database === 'offline';
  const { user, loading: authLoading, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  function closeMobileNav() {
    setMobileOpen(false);
  }

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
    <div className={`app-shell${sidebarOpen ? '' : ' sidebar-collapsed'}`}>
      <aside className={`sidebar${mobileOpen ? ' mobile-open' : ''}`}>
        <div className="sidebar-head">
          <div className="brand">
            <div className="brand-text">
              <div className="brand-name">Pathfinder</div>
              <div className="brand-sub">AI Learning Path Graph</div>
            </div>
          </div>
          <button
            className="sidebar-burger"
            onClick={() => setSidebarOpen((o) => !o)}
            title={sidebarOpen ? 'Hide menu' : 'Show menu'}
            aria-label="Toggle navigation"
          >
            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>

        <div className="nav-section">Explore</div>
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
            onClick={closeMobileNav}
          >
            <item.icon size={17} />
            <span className="nav-label">{item.label}</span>
          </NavLink>
        ))}

        <div className="sidebar-user">
          {authLoading ? (
            <span className="pill pill-sidebar">
              <CircleDashed size={12} /> session…
            </span>
          ) : user ? (
            <>
              <div className="sidebar-user-info">
                <span
                  className="avatar avatar-sm"
                  style={{ '--avatar-bg': user.avatarColor }}
                >
                  {initials(user.name)}
                </span>
                <div className="sidebar-user-text">
                  <div className="sidebar-user-name">{user.name}</div>
                  <div className="sidebar-user-sub">Learner</div>
                </div>
              </div>
              <button className="sidebar-logout" title="Sign out" onClick={() => { logout(); closeMobileNav(); }}>
                <LogOut size={15} />
              </button>
            </>
          ) : (
            <Link to="/login" className="btn btn-sm btn-block" onClick={closeMobileNav}>
              <LogIn size={14} /> Sign in
            </Link>
          )}
        </div>
      </aside>

      {mobileOpen && <div className="mobile-backdrop" onClick={closeMobileNav} />}

      <div className="main">
        {degraded && (
          <div className="db-banner">
            The graph database is currently unreachable. Pages will show cached or empty data until
            it comes back online.
          </div>
        )}
        <div className="topbar">
          <button
            className="sidebar-burger mobile-menu-btn"
            onClick={() => setMobileOpen((o) => !o)}
            title={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-label="Toggle navigation"
          >
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
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
