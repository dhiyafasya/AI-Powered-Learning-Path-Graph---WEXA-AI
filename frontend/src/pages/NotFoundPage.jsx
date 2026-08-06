import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="state-wrap" style={{ minHeight: '60vh' }}>
      <div className="state-icon">
        <Compass size={24} />
      </div>
      <div>
        <div style={{ fontWeight: 800, fontSize: 22, color: 'var(--ink)' }}>404 — off the map</div>
        <div style={{ marginTop: 6 }}>That page doesn't exist in this graph.</div>
      </div>
      <Link to="/" className="btn btn-primary">Back to dashboard</Link>
    </div>
  );
}
