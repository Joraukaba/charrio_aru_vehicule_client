import { useEffect } from 'react';
import { STATUTS } from '../format.js';

export function Badge({ map, value }) {
  const m = map?.[value] || { label: value || '—', cls: 'muted' };
  return <span className={`badge ${m.cls}`}>{m.label}</span>;
}

export const StatutBadge = ({ statut }) => <Badge map={STATUTS} value={statut} />;

export function Modal({ title, onClose, children, footer, wide }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`modal ${wide ? 'wide' : ''}`} role="dialog" aria-modal="true">
        <div className="modal-head">
          <h2>{title}</h2>
          <button className="close" onClick={onClose} aria-label="Fermer">×</button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>
  );
}

export function PageHead({ title, subtitle, children }) {
  return (
    <div className="page-head">
      <div>
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {children && <div className="actions">{children}</div>}
    </div>
  );
}

export function Stat({ label, value, sub, alert }) {
  return (
    <div className={`stat ${alert ? 'alert' : ''}`}>
      <div className="label">{label}</div>
      <div className="value">{value ?? '—'}</div>
      {sub && <div className="sub">{sub}</div>}
    </div>
  );
}

export const Loading = () => <div className="empty">Chargement…</div>;
export const ErrorBox = ({ error }) => (error ? <div className="error">{error}</div> : null);
