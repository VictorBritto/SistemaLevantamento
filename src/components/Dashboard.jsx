import { Package, Laptop, Monitor, AlertTriangle } from 'lucide-react';

const cards = [
  { id: 'total', label: 'Total de Itens', key: 'total', icon: Package, accent: 'total' },
  { id: 'computers', label: 'Computadores', key: 'computers', icon: Laptop, accent: 'computers' },
  { id: 'monitors', label: 'Monitores', key: 'monitors', icon: Monitor, accent: 'monitors' },
  { id: 'damaged', label: 'Em Manutenção/Ruim', key: 'damaged', icon: AlertTriangle, accent: 'state-alert' },
];

export default function Dashboard({ metrics }) {
  return (
    <section className="dashboard-metrics">
      {cards.map(card => {
        const Icon = card.icon;
        return (
          <div key={card.id} className="metric-card glass-panel" id={`card-${card.id}`}>
            <div className={`metric-icon ${card.accent}`}>
              <Icon size={24} />
            </div>
            <div className="metric-info">
              <h3>{card.label}</h3>
              <p className="metric-value">{metrics[card.key]}</p>
            </div>
          </div>
        );
      })}
    </section>
  );
}
