import { ShieldCheck, Download, Upload, FileScan, Trash2, Layers, ShieldAlert, Sun, Moon } from 'lucide-react';
import { useTheme } from './ThemeProvider';

export default function Header({ onExportBackup, onImportBackup, onImportDoc, onMergeDocs, onAudit, onClearAll }) {
  const { theme, toggleTheme } = useTheme();

  const handleImportClick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => onImportBackup(ev.target.result);
      reader.readAsText(file);
    };
    input.click();
  };

  return (
    <header className="app-header">
      <div className="logo-area">
        <div className="logo-icon">
          <ShieldCheck size={24} color="white" />
        </div>
        <div className="logo-text">
          <h1>FHO-Levantamento</h1>
          <span>Controle de Inventário e Patrimônio</span>
        </div>
      </div>

      <div className="header-actions">
        {/* Primary Actions */}
        <div className="header-actions-group">
          <button className="btn btn-audit" title="Auditar Inventário" onClick={onAudit}>
            <ShieldAlert size={18} />
            <span>Auditoria</span>
          </button>
          <button className="btn btn-merge" title="Mesclar Planilhas" onClick={onMergeDocs}>
            <Layers size={18} />
            <span>Mesclar Planilhas</span>
          </button>
          <button className="btn btn-import-doc" title="Importar Documento de Notas" onClick={onImportDoc}>
            <FileScan size={18} />
            <span>Importar Documento</span>
          </button>
        </div>

        <div className="header-divider" />

        {/* Secondary Actions */}
        <div className="header-actions-group">
          <button className="btn btn-secondary" title="Exportar Backup (JSON)" onClick={onExportBackup}>
            <Download size={18} />
            <span>Exportar</span>
          </button>
          <button className="btn btn-secondary" title="Importar Backup (JSON)" onClick={handleImportClick}>
            <Upload size={18} />
            <span>Importar</span>
          </button>
          <button className="btn btn-ghost-danger" title="Limpar Todo o Inventário" onClick={onClearAll}>
            <Trash2 size={18} />
          </button>
        </div>

        <div className="header-divider" />

        {/* Theme Toggle */}
        <button
          className="btn-theme-toggle"
          title={theme === 'light' ? 'Ativar modo escuro' : 'Ativar modo claro'}
          onClick={toggleTheme}
        >
          {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
        </button>
      </div>
    </header>
  );
}
