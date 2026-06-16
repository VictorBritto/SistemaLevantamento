import { CheckCircle, XCircle, Info } from 'lucide-react';

const iconMap = {
  success: CheckCircle,
  error: XCircle,
  info: Info,
};

export default function ToastContainer({ toasts }) {
  return (
    <div className="toast-container">
      {toasts.map(t => {
        const Icon = iconMap[t.type] || Info;
        return (
          <div key={t.id} className={`toast toast-${t.type}`}>
            <Icon size={18} />
            <div className="toast-content">{t.message}</div>
          </div>
        );
      })}
    </div>
  );
}
