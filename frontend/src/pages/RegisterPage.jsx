import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Loader2, Mail, Lock, User, UserPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || '/generate';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  function validate() {
    if (!name.trim()) return { message: 'Please enter your name.' };
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return { message: 'Please enter a valid email address.' };
    }
    if (password.length < 8) {
      return { message: 'Password must be at least 8 characters.' };
    }
    if (password !== confirm) {
      return { message: 'Passwords do not match.' };
    }
    return null;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    const invalid = validate();
    if (invalid) {
      setError(invalid);
      return;
    }
    setSubmitting(true);
    try {
      await register(name.trim(), email, password);
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
        <h1 className="section-title" style={{ fontSize: 20 }}>Create your account</h1>
        <p className="muted" style={{ fontSize: 14, marginTop: 4 }}>
          Your new learner node lands in the graph, ready to save progress and generate personalised
          paths.
        </p>

        <form onSubmit={handleSubmit} className="mt-4" style={{ display: 'grid', gap: 14 }}>
          <div className="field">
            <label className="field-label" htmlFor="name">Name</label>
            <div className="auth-input">
              <User size={15} />
              <input
                id="name"
                className="input auth-input-inner"
                placeholder="Jane Doe"
                value={name}
                autoComplete="name"
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          </div>

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
                placeholder="At least 8 characters"
                value={password}
                autoComplete="new-password"
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div className="field">
            <label className="field-label" htmlFor="confirm">Confirm password</label>
            <div className="auth-input">
              <Lock size={15} />
              <input
                id="confirm"
                type="password"
                className="input auth-input-inner"
                placeholder="Repeat your password"
                value={confirm}
                autoComplete="new-password"
                onChange={(e) => setConfirm(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <div className="auth-error" role="alert">
              {error.message}
            </div>
          )}

          <button className="btn btn-primary btn-block" disabled={submitting} type="submit">
            {submitting ? <Loader2 size={15} className="spin" /> : <UserPlus size={15} />}
            {submitting ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <div className="auth-switch">
          Already have an account? <Link to="/login" state={{ from }}>Sign in</Link>
        </div>
      </div>
    </div>
  );
}
