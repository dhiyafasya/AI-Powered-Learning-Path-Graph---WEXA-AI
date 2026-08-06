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
        <div className="state-title">Something went wrong</div>
        <div className="state-msg">{message}</div>
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
        <div className="state-title">{title}</div>
        {message && (
          <div className="state-msg-wide">{message}</div>
        )}
      </div>
      {action}
    </div>
  );
}
