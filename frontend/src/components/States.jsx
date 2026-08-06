import { Loader2, AlertTriangle, Inbox } from 'lucide-react';

export function Loading({ label = 'Loading…', compact = false }) {
  return (
    <div className={`state-wrap ${compact ? 'compact' : ''}`}>
      <div className="spinner" />
      <div>{label}</div>
    </div>
  );
}

export function ErrorState({ message, onRetry, compact = false }) {
  return (
    <div className={`state-wrap ${compact ? 'compact' : ''}`}>
      <div className="state-icon">
        <AlertTriangle size={22} />
      </div>
      <div>
        <div style={{ fontWeight: 600, color: 'var(--ink-soft)' }}>Something went wrong</div>
        <div style={{ marginTop: 4, maxWidth: 420 }}>{message}</div>
      </div>
      {onRetry && (
        <button className="btn btn-primary btn-sm" onClick={onRetry}>
          <Loader2 size={14} /> Try again
        </button>
      )}
    </div>
  );
}

export function EmptyState({ icon: Icon = Inbox, title, message, action }) {
  return (
    <div className="state-wrap">
      <div className="state-icon">
        <Icon size={22} />
      </div>
      <div>
        <div style={{ fontWeight: 600, color: 'var(--ink-soft)' }}>{title}</div>
        {message && (
          <div style={{ marginTop: 4, maxWidth: 420, lineHeight: 1.5 }}>{message}</div>
        )}
      </div>
      {action}
    </div>
  );
}
