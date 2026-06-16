import { useState } from 'react';
import { CheckCircle } from 'lucide-react';

export default function PdfModal({ isOpen, onClose, onGenerate }) {
  const [config, setConfig] = useState({
    title: 'Relatório de Inventário Físico - Depósito',
    department: 'Almoxarifado Central',
    author: '',
    supervisor: '',
    includeNotes: true,
  });

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onGenerate(config);
    onClose();
  };

  const update = (field, value) => setConfig(prev => ({ ...prev, [field]: value }));

  return (
    <div className={`modal-overlay ${isOpen ? 'active' : ''}`} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-content glass-panel animate-scale">
        <div className="modal-header">
          <h2>Configurar Relatório PDF</h2>
          <button className="btn-close-modal" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-body">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="pdf-title">Título do Relatório</label>
              <input type="text" id="pdf-title" required value={config.title} onChange={e => update('title', e.target.value)} />
            </div>
            <div className="form-group">
              <label htmlFor="pdf-department">Departamento / Setor Responsável</label>
              <input type="text" id="pdf-department" value={config.department} onChange={e => update('department', e.target.value)} placeholder="Ex: Departamento de TI" />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="pdf-author">Responsável pelo Levantamento</label>
                <input type="text" id="pdf-author" required value={config.author} onChange={e => update('author', e.target.value)} placeholder="Nome do responsável" />
              </div>
              <div className="form-group">
                <label htmlFor="pdf-supervisor">Supervisor / Aprovador</label>
                <input type="text" id="pdf-supervisor" value={config.supervisor} onChange={e => update('supervisor', e.target.value)} placeholder="Nome do supervisor (opcional)" />
              </div>
            </div>
            <div className="form-group checkbox-group">
              <label className="checkbox-container">
                <input type="checkbox" checked={config.includeNotes} onChange={e => update('includeNotes', e.target.checked)} />
                <span className="checkmark"></span>
                Incluir campo de Observações no relatório
              </label>
            </div>
            <div className="form-actions-row">
              <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
              <button type="submit" className="btn btn-pdf">
                <CheckCircle size={18} />
                <span>Gerar e Baixar PDF</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
