import { ShieldCheck, Download, Upload, FileScan, Trash2 } from 'lucide-react';

export default function Header({ onExportBackup, onImportBackup, onImportDoc, onClearAll }) {
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
          <h1>InvKeep</h1>
          <span>Controle de Inventário e Patrimônio</span>
        </div>
      </div>

      <div className="header-actions">
        <button className="btn btn-import-doc" title="Importar Documento de Notas" onClick={onImportDoc}>
          <FileScan size={18} />
          <span>Importar Documento</span>
        </button>
        <button className="btn btn-cancel" title="Limpar Todo o Inventário" onClick={onClearAll}>
          <Trash2 size={18} />
          <span>Limpar Tudo</span>
        </button>
        <button className="btn btn-secondary" title="Exportar Backup (JSON)" onClick={onExportBackup}>
          <Download size={18} />
          <span>Exportar JSON</span>
        </button>
        <button className="btn btn-secondary" title="Importar Backup (JSON)" onClick={handleImportClick}>
          <Upload size={18} />
          <span>Importar JSON</span>
        </button>
      </div>
    </header>
  );
}
