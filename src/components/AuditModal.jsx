import { useState, useMemo } from 'react';
import { AlertTriangle, X, Edit3, ShieldAlert, CheckCircle } from 'lucide-react';
import { validateInventory } from '../utils/dataValidator';

export default function AuditModal({ isOpen, onClose, items, onEdit }) {
  const [filterSeverity, setFilterSeverity] = useState('all');

  const anomalies = useMemo(() => {
    return validateInventory(items || []);
  }, [items]);

  const filteredAnomalies = useMemo(() => {
    if (filterSeverity === 'all') return anomalies;
    return anomalies.filter(a => a.severity === filterSeverity);
  }, [anomalies, filterSeverity]);

  if (!isOpen) return null;

  return (
    <div className={`modal-overlay ${isOpen ? 'active' : ''}`} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-content modal-content-large glass-panel animate-scale">
        <div className="modal-header">
          <h2>
            <ShieldAlert size={22} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 8, color: 'var(--danger)' }} />
            Auditoria de Dados
          </h2>
          <button className="btn-close-modal" onClick={onClose}>&times;</button>
        </div>

        <div className="modal-body">
          <p className="doc-step-desc">
            O sistema varreu todos os itens cadastrados em busca de possíveis erros de registro, como campos obrigatórios vazios ou contradições entre estado e descrição.
          </p>

          {anomalies.length > 0 ? (
            <>
              <div className="filters-row" style={{ marginBottom: '1rem' }}>
                <select className="filter-select" value={filterSeverity} onChange={e => setFilterSeverity(e.target.value)}>
                  <option value="all">Todas as Severidades ({anomalies.length})</option>
                  <option value="high">Crítica ({anomalies.filter(a => a.severity === 'high').length})</option>
                  <option value="medium">Média ({anomalies.filter(a => a.severity === 'medium').length})</option>
                  <option value="low">Baixa ({anomalies.filter(a => a.severity === 'low').length})</option>
                </select>
              </div>

              <div className="table-container" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                <table className="inventory-table">
                  <thead>
                    <tr>
                      <th>Severidade</th>
                      <th>Patrimônio</th>
                      <th>Problema Encontrado</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAnomalies.map((anomaly, idx) => (
                      <tr key={idx}>
                        <td>
                          {anomaly.severity === 'high' && <span className="badge badge-damaged">Crítica</span>}
                          {anomaly.severity === 'medium' && <span className="badge badge-regular">Média</span>}
                          {anomaly.severity === 'low' && <span className="badge badge-good">Baixa</span>}
                        </td>
                        <td style={{ fontWeight: 'bold' }}>{anomaly.patrimony}</td>
                        <td style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <AlertTriangle size={16} color={anomaly.severity === 'high' ? 'var(--danger)' : 'var(--warning)'} />
                          {anomaly.message}
                        </td>
                        <td>
                          <button
                            className="btn-icon btn-edit"
                            title="Corrigir item"
                            onClick={() => {
                              onEdit(anomaly.item);
                              onClose();
                            }}
                          >
                            <Edit3 size={16} /> Corrigir
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="empty-state">
              <CheckCircle size={48} color="var(--success)" style={{ marginBottom: '1rem' }} />
              <h3>Tudo certo por aqui!</h3>
              <p>Nenhuma anomalia de dados ou erro de registro foi encontrado no seu inventário.</p>
            </div>
          )}

          <div className="doc-modal-footer" style={{ justifyContent: 'flex-end', marginTop: '1.5rem' }}>
            <button className="btn btn-secondary" onClick={onClose}>Fechar</button>
          </div>
        </div>
      </div>
    </div>
  );
}
