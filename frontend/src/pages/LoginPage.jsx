import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LogIn, Loader2, Lock, Mail } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

const DEMO_ACCOUNTS = [
  { email: 'amelia@example.com', name: 'Amelia Chen', note: 'Frontend · 3 topics done' },
  { email: 'bima@example.com', name: 'Bima Putra', note: 'Data science · 3 topics done' },
  { email: 'ciara@example.com', name: "Ciara O'Brien", note: 'Backend · 4 topics done' },
];

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || '/generate';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    if (!email || !password) {
      setError({ message: 'Email and password are required.' });
      return;
    }
    setSubmitting(true);
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="card card-pad auth-card">
        <h1 className="section-title" style={{ fontSize: 20 }}>Sign in to Pathfinder</h1>
        <p className="muted" style={{ fontSize: 14, marginTop: 4 }}>
          Sign in to personalise your learning paths and save your progress to the graph.
        </p>

        <form onSubmit={handleSubmit} className="mt-4" style={{ display: 'grid', gap: 14 }}>
          <div className="field">
            <label className="field-label" htmlFor="email">Email</label>
            <div className="auth-input">
              <Mail size={15} />
              <input
                id="email"
                type="email"
                className="input auth-input-inner"
                placeholder="you@example.com"
                value={email}
                autoComplete="email"
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="field">
            <label className="field-label" htmlFor="password">Password</label>
            <div className="auth-input">
              <Lock size={15} />
              <input
                id="password"
                type="password"
                className="input auth-input-inner"
                placeholder="••••••••"
                value={password}
                autoComplete="current-password"
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <div className="auth-error" role="alert">
              {error.message}
            </div>
          )}

          <button className="btn btn-primary btn-block" disabled={submitting} type="submit">
            {submitting ? <Loader2 size={15} className="spin" /> : <LogIn size={15} />}
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <div className="auth-switch">
          No account yet? <Link to="/register" state={{ from }}>Create one</Link>
        </div>

        <div className="divider" />

        <div className="eyebrow" style={{ marginBottom: 8 }}>Demo accounts</div>
        <div className="demo-accounts">
          {DEMO_ACCOUNTS.map((d) => (
            <button
              key={d.email}
              type="button"
              className="demo-account"
              onClick={() => {
                setEmail(d.email);
                setPassword('password123');
              }}
            >
              <span className="demo-account-main">
                <span className="demo-account-name">{d.name}</span>
                <span className="demo-account-note">{d.note}</span>
              </span>
              <span className="demo-account-email">{d.email}</span>
              <span className="pill status-ready">password123</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
