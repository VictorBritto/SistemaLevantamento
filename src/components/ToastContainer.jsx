import { CheckCircle, XCircle, Info, X } from 'lucide-react';

const iconMap = {
  success: CheckCircle,
  error: XCircle,
  info: Info,
};

export default function ToastContainer({ toasts, onRemove }) {
  return (
    <div className="toast-container">
      {toasts.map(t => {
        const Icon = iconMap[t.type] || Info;
        return (
          <div key={t.id} className={`toast toast-${t.type}`}>
            <Icon size={18} />
            <div className="toast-content">{t.message}</div>
            {onRemove && (
              <button className="toast-close" onClick={() => onRemove(t.id)} title="Fechar">
                <X size={14} />
              </button>
            )}
            <div className="toast-progress">
              <div className="toast-progress-bar" />
            </div>
          </div>
        );
      })}
    </div>
  );
}
