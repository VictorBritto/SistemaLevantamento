import { useState, useEffect } from 'react';
import { Hash, Tag, Info, Activity, MapPin, PlusCircle } from 'lucide-react';

const CATEGORIES = [
  { value: '', label: 'Selecione uma categoria...' },
  { value: 'Computador', label: 'Computador' },
  { value: 'Monitor', label: 'Monitor' },
  { value: 'Impressora', label: 'Impressora' },
  { value: 'Teclado/Mouse', label: 'Teclado & Mouse' },
  { value: 'Rede', label: 'Equipamento de Rede' },
  { value: 'Móveis', label: 'Móveis & Cadeiras' },
  { value: 'Outros', label: 'Outros' },
];

const STATES = [
  { value: 'Excelente', label: 'Excelente' },
  { value: 'Bom', label: 'Bom' },
  { value: 'Regular', label: 'Regular' },
  { value: 'Ruim', label: 'Ruim (Manutenção)' },
];

export default function ItemForm({ onSubmit, editingItem, onCancelEdit, isDuplicate, showToast }) {
  const [form, setForm] = useState({
    patrimony: '', category: '', description: '', state: 'Excelente', location: '', notes: ''
  });
  const [patError, setPatError] = useState('');

  useEffect(() => {
    if (editingItem) {
      setForm({ ...editingItem });
    } else {
      setForm({ patrimony: '', category: '', description: '', state: 'Excelente', location: '', notes: '' });
      setPatError('');
    }
  }, [editingItem]);

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));

    if (field === 'patrimony') {
      const upper = value.trim().toUpperCase();
      if (upper && isDuplicate(upper, editingItem?.patrimony)) {
        setPatError('Este número de patrimônio já está em uso.');
      } else {
        setPatError('');
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const patrimonyVal = form.patrimony.trim().toUpperCase();

    if (!patrimonyVal || !form.category || !form.description.trim() || !form.location.trim()) {
      showToast('Preencha todos os campos obrigatórios.', 'error');
      return;
    }

    if (isDuplicate(patrimonyVal, editingItem?.patrimony)) {
      setPatError('Este número de patrimônio já está cadastrado.');
      return;
    }

    const item = {
      patrimony: patrimonyVal,
      category: form.category,
      description: form.description.trim(),
      state: form.state,
      location: form.location.trim(),
      notes: form.notes.trim(),
    };

    onSubmit(item);
    if (!editingItem) {
      setForm({ patrimony: '', category: '', description: '', state: 'Excelente', location: '', notes: '' });
    }
    setPatError('');
  };

  const isEditing = !!editingItem;

  return (
    <aside className={`form-sidebar glass-panel ${isEditing ? 'editing' : ''}`}>
      <div className="sidebar-header">
        <h2>{isEditing ? 'Editar Item' : 'Cadastrar Novo Item'}</h2>
        <p>{isEditing ? `Editando patrimônio ${editingItem.patrimony}` : 'Adicione as informações do patrimônio'}</p>
      </div>

      <form onSubmit={handleSubmit} autoComplete="off" id="item-form">
        <div className="form-group">
          <label htmlFor="item-patrimony">Nº de Patrimônio <span className="required">*</span></label>
          <div className="input-with-icon">
            <Hash size={18} />
            <input
              type="text" id="item-patrimony" required
              placeholder="Ex: PAT-001045"
              value={form.patrimony}
              onChange={e => handleChange('patrimony', e.target.value)}
              style={patError ? { borderColor: 'var(--danger)', boxShadow: '0 0 0 3px rgba(239,68,68,0.15)' } : {}}
            />
          </div>
          {patError && <span className="error-msg visible">{patError}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="item-category">Categoria <span className="required">*</span></label>
          <div className="input-with-icon">
            <Tag size={18} />
            <select id="item-category" required value={form.category} onChange={e => handleChange('category', e.target.value)}>
              {CATEGORIES.map(c => (
                <option key={c.value} value={c.value} disabled={c.value === ''}>{c.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="item-description">Descrição / Modelo <span className="required">*</span></label>
          <div className="input-with-icon">
            <Info size={18} />
            <input
              type="text" id="item-description" required
              placeholder="Ex: Dell OptiPlex 3080 i5 8GB"
              value={form.description}
              onChange={e => handleChange('description', e.target.value)}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="item-state">Estado <span className="required">*</span></label>
            <div className="input-with-icon">
              <Activity size={18} />
              <select id="item-state" required value={form.state} onChange={e => handleChange('state', e.target.value)}>
                {STATES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="item-location">Localização <span className="required">*</span></label>
            <div className="input-with-icon">
              <MapPin size={18} />
              <input
                type="text" id="item-location" required
                placeholder="Ex: Almoxarifado"
                value={form.location}
                onChange={e => handleChange('location', e.target.value)}
                list="locations-list"
              />
              <datalist id="locations-list">
                <option value="Depósito Principal" />
                <option value="Almoxarifado" />
                <option value="TI / Suporte" />
                <option value="Administração" />
                <option value="Recepção" />
                <option value="Sala de Reuniões" />
              </datalist>
            </div>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="item-notes">Observações Adicionais</label>
          <textarea
            id="item-notes" rows={3}
            placeholder="Informações extras, número de série, etc. (opcional)"
            value={form.notes}
            onChange={e => handleChange('notes', e.target.value)}
          />
        </div>

        <div className="form-actions">
          <button type="submit" className="btn btn-primary btn-block">
            <PlusCircle size={18} />
            <span>{isEditing ? 'Salvar Alterações' : 'Cadastrar Item'}</span>
          </button>
          {isEditing && (
            <button type="button" className="btn btn-cancel btn-block" onClick={onCancelEdit}>
              Cancelar Edição
            </button>
          )}
        </div>
      </form>
    </aside>
  );
}
