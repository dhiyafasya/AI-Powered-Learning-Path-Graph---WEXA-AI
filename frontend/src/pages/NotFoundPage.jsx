import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="state-wrap state-page">
      <div className="state-icon">
        <Compass size={24} />
      </div>
      <div>
        <div className="state-title-lg">404 — off the map</div>
        <div className="state-msg">That page doesn't exist in this graph.</div>
      </div>
      <Link to="/" className="btn btn-primary">Back to dashboard</Link>
    </div>
  );
}
