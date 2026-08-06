import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LogIn, Loader2, Lock, Mail, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

const DEMO_ACCOUNTS = [
  { email: 'dhiyafasya05@gmail.com', name: 'Dhiya Fasya', note: 'Full-stack · 3 topics done' },
];

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || '/generate';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
        <h1 className="section-title auth-title">Sign in to Pathfinder</h1>
        <p className="muted auth-sub">
          Sign in to personalise your learning paths and save your progress to the graph.
        </p>

        <form onSubmit={handleSubmit} className="auth-form">
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
                type={showPassword ? 'text' : 'password'}
                className="input auth-input-inner"
                placeholder="••••••••"
                value={password}
                autoComplete="current-password"
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="auth-input-toggle"
                onClick={() => setShowPassword((s) => !s)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="auth-error" role="alert">
              {error.message}
            </div>
          )}

          <button className="btn btn-primary btn-block btn-green" disabled={submitting} type="submit">
            {submitting ? <Loader2 size={15} className="spin" /> : <LogIn size={15} />}
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <div className="auth-switch">
          No account yet? <Link to="/register" state={{ from }}>Create one</Link>
        </div>

        <div className="divider" />

        <div className="eyebrow auth-demo-label">Demo account</div>
        <div className="demo-accounts">
          {DEMO_ACCOUNTS.map((d) => (
            <button
              key={d.email}
              type="button"
              className="demo-account"
              onClick={() => {
                setEmail(d.email);
                setPassword('Dhiya123#');
              }}
            >
              <span className="demo-account-main">
                <span className="demo-account-name">{d.name}</span>
                <span className="demo-account-note">{d.note}</span>
              </span>
              <span className="demo-account-email">{d.email}</span>
              <span className="pill status-ready">Dhiya123#</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
