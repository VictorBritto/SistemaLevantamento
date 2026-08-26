import { useState, useEffect, useRef } from 'react';
import { Package, Laptop, Monitor, AlertTriangle } from 'lucide-react';

const cards = [
  { id: 'total', label: 'Total de Itens', key: 'total', icon: Package, accent: 'total' },
  { id: 'computers', label: 'Computadores', key: 'computers', icon: Laptop, accent: 'computers' },
  { id: 'monitors', label: 'Monitores', key: 'monitors', icon: Monitor, accent: 'monitors' },
  { id: 'damaged', label: 'Em Manutenção/Ruim', key: 'damaged', icon: AlertTriangle, accent: 'state-alert' },
];

// Animated counter hook
function useAnimatedCounter(target, duration = 800) {
  const [value, setValue] = useState(0);
  const prevTarget = useRef(0);

  useEffect(() => {
    const start = prevTarget.current;
    const end = target;
    prevTarget.current = target;

    if (start === end) {
      setValue(end);
      return;
    }

    const startTime = performance.now();

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(start + (end - start) * eased);
      setValue(current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [target, duration]);

  return value;
}

function MetricCard({ card, value, total }) {
  const Icon = card.icon;
  const animatedValue = useAnimatedCounter(value);
  const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
  const isDamaged = card.id === 'damaged';
  const isTotal = card.id === 'total';

  return (
    <div
      className={`metric-card glass-panel ${isDamaged && value > 0 ? 'has-alerts' : ''}`}
      id={`card-${card.id}`}
    >
      <div className={`metric-icon ${card.accent}`}>
        <Icon size={24} />
      </div>
      <div className="metric-info">
        <h3>{card.label}</h3>
        <p className="metric-value">{animatedValue}</p>
        {!isTotal && (
          <div className="metric-sparkline">
            <div
              className="metric-sparkline-fill"
              style={{ width: `${percentage}%` }}
            />
          </div>
        )}
        {isTotal && (
          <div className="metric-sparkline">
            <div
              className="metric-sparkline-fill"
              style={{ width: '100%' }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default function Dashboard({ metrics }) {
  return (
    <section className="dashboard-metrics">
      {cards.map(card => (
        <MetricCard
          key={card.id}
          card={card}
          value={metrics[card.key]}
          total={metrics.total}
        />
      ))}
    </section>
  );
}
