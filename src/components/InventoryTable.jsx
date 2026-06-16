import { useState, useMemo } from 'react';
import { Search, FileText, FileSpreadsheet, Edit3, Trash2, ClipboardList, Database } from 'lucide-react';

const stateClasses = {
  'Excelente': 'badge-excellent',
  'Bom': 'badge-good',
  'Regular': 'badge-regular',
  'Ruim': 'badge-damaged',
};

export default function InventoryTable({ items, onEdit, onDelete, onLoadDemo, onGeneratePdf, onGenerateExcel }) {
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('all');
  const [filterState, setFilterState] = useState('all');

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return items.filter(item => {
      const matchesQuery = !q ||
        item.patrimony.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.location.toLowerCase().includes(q);
      const matchesCat = filterCat === 'all' || item.category === filterCat;
      const matchesState = filterState === 'all' || item.state === filterState;
      return matchesQuery && matchesCat && matchesState;
    });
  }, [items, search, filterCat, filterState]);

  return (
    <main className="inventory-section glass-panel">
      {/* Barra de Controle */}
      <div className="inventory-controls">
        <div className="search-box">
          <Search size={20} className="search-icon" />
          <input
            type="text"
            id="search-input"
            placeholder="Pesquisar por patrimônio, descrição ou localização..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className="filters-row">
          <select id="filter-category" className="filter-select" value={filterCat} onChange={e => setFilterCat(e.target.value)}>
            <option value="all">Todas as Categorias</option>
            <option value="Computador">Computadores</option>
            <option value="Monitor">Monitores</option>
            <option value="Impressora">Impressoras</option>
            <option value="Teclado/Mouse">Teclado & Mouse</option>
            <option value="Rede">Equipamento de Rede</option>
            <option value="Móveis">Móveis & Cadeiras</option>
            <option value="Outros">Outros</option>
          </select>

          <select id="filter-state" className="filter-select" value={filterState} onChange={e => setFilterState(e.target.value)}>
            <option value="all">Todos os Estados</option>
            <option value="Excelente">Excelente</option>
            <option value="Bom">Bom</option>
            <option value="Regular">Regular</option>
            <option value="Ruim">Ruim (Manutenção)</option>
          </select>

          <div className="filter-actions-group">
            <button id="btn-generate-pdf" className="btn btn-pdf" title="Gerar PDF Relatório" onClick={onGeneratePdf}>
              <FileText size={18} />
              <span>Gerar PDF</span>
            </button>

            <button id="btn-generate-excel" className="btn btn-excel" title="Exportar Excel" onClick={onGenerateExcel}>
              <FileSpreadsheet size={18} />
              <span>Exportar Excel</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tabela */}
      {filtered.length > 0 ? (
        <div className="table-container">
          <table className="inventory-table">
            <thead>
              <tr>
                <th className="col-patrimony">Patrimônio</th>
                <th className="col-category">Categoria</th>
                <th className="col-description">Descrição / Modelo</th>
                <th className="col-state">Estado</th>
                <th className="col-location">Localização</th>
                <th className="col-actions">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(item => (
                <tr key={item.patrimony}>
                  <td className="col-patrimony">{item.patrimony}</td>
                  <td className="col-category">
                    <span className="badge badge-category">{item.category}</span>
                  </td>
                  <td className="col-description">{item.description}</td>
                  <td className="col-state">
                    <span className={`badge ${stateClasses[item.state] || 'badge-good'}`}>{item.state}</span>
                  </td>
                  <td className="col-location">{item.location}</td>
                  <td className="col-actions">
                    <div className="action-buttons">
                      <button className="btn-icon btn-edit" title="Editar item" onClick={() => onEdit(item)}>
                        <Edit3 size={16} />
                      </button>
                      <button className="btn-icon btn-delete" title="Excluir item" onClick={() => onDelete(item.patrimony)}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-icon">
            <ClipboardList size={36} />
          </div>
          <h2>Nenhum item cadastrado</h2>
          <p>Comece a preencher o formulário ao lado para catalogar os patrimônios do seu depósito, ou carregue dados de demonstração para testar.</p>
          <button className="btn btn-secondary" onClick={onLoadDemo}>
            <Database size={18} />
            <span>Carregar Dados de Demonstração</span>
          </button>
        </div>
      )}
    </main>
  );
}
