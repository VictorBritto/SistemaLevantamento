import { useState, useRef, useCallback } from 'react';
import { UploadCloud, FileCheck, X, ArrowLeft, ArrowRight, FileText, FileSpreadsheet, CheckCircle } from 'lucide-react';
import { readFile, autoDetectMapping, applyMapping, autoParseSimple } from '../utils/docParser';

const SYSTEM_FIELDS = [
  { key: 'patrimony', label: 'Patrimônio (obrigatório)' },
  { key: 'category', label: 'Categoria' },
  { key: 'description', label: 'Descrição / Modelo' },
  { key: 'state', label: 'Estado de Conservação' },
  { key: 'location', label: 'Localização' },
  { key: 'notes', label: 'Observações' },
  { key: '_ignore', label: '— Ignorar esta coluna —' },
];

export default function DocImportModal({ isOpen, onClose, onImport, onGeneratePdfDirect, showToast }) {
  const [step, setStep] = useState(1); // 1=upload, 2=mapping, 3=preview
  const [file, setFile] = useState(null);
  const [rawData, setRawData] = useState(null);
  const [mapping, setMapping] = useState({});
  const [parsedItems, setParsedItems] = useState([]);
  const [addToInventory, setAddToInventory] = useState(true);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const resetModal = useCallback(() => {
    setStep(1);
    setFile(null);
    setRawData(null);
    setMapping({});
    setParsedItems([]);
    setAddToInventory(true);
    setDragOver(false);
  }, []);

  const handleClose = () => {
    resetModal();
    onClose();
  };

  // STEP 1: File Upload
  const handleFileSelected = async (selectedFile) => {
    if (!selectedFile) return;
    const ext = selectedFile.name.split('.').pop().toLowerCase();
    if (!['txt', 'csv', 'xlsx', 'xls'].includes(ext)) {
      showToast('Formato de arquivo não suportado. Use .txt, .csv, .xlsx ou .xls', 'error');
      return;
    }
    setFile(selectedFile);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) handleFileSelected(droppedFile);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => setDragOver(false);

  const removeFile = () => {
    setFile(null);
    setRawData(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // STEP 2: Analyze and Map columns
  const analyzeFile = async () => {
    if (!file) return;
    try {
      const result = await readFile(file);
      setRawData(result);

      // Tenta parsing automático simples para documentos de 1-2 colunas
      if (result.rows.length > 0 && result.rows[0].length <= 2) {
        const simple = autoParseSimple(result.rows);
        if (simple && simple.length > 0) {
          setParsedItems(simple);
          setStep(3);
          showToast(`${simple.length} itens detectados automaticamente!`, 'success');
          return;
        }
      }

      // Detecção automática de colunas
      const detectedMapping = autoDetectMapping(result.headers);
      setMapping(detectedMapping);
      setStep(2);
      showToast(`${result.rows[0].length} colunas detectadas. Verifique o mapeamento.`, 'info');
    } catch (err) {
      showToast(err.message || 'Erro ao processar o arquivo.', 'error');
    }
  };

  // STEP 2 → 3: Apply mapping and preview
  const applyMappingAndPreview = () => {
    if (mapping.patrimony === undefined) {
      showToast('Você precisa definir qual coluna contém o Nº de Patrimônio.', 'error');
      return;
    }

    const items = applyMapping(rawData.rows, mapping, true);
    if (items.length === 0) {
      showToast('Nenhum item válido encontrado com o mapeamento selecionado.', 'error');
      return;
    }

    setParsedItems(items);
    setStep(3);
    showToast(`${items.length} itens prontos para importação!`, 'success');
  };

  // STEP 3: Confirm import
  const handleConfirm = () => {
    if (addToInventory) {
      onImport(parsedItems);
      showToast(`${parsedItems.length} itens importados com sucesso!`, 'success');
    }
    handleClose();
  };

  // STEP 3: Generate PDF directly from parsed items
  const handleDirectPdf = () => {
    onGeneratePdfDirect(parsedItems);
    showToast('PDF gerado a partir do documento importado!', 'success');
  };

  const handleMappingChange = (colIdx, field) => {
    setMapping(prev => {
      const next = { ...prev };
      // Remove qualquer campo já apontando para este index
      for (const [k, v] of Object.entries(next)) {
        if (v === colIdx) delete next[k];
      }
      if (field !== '_ignore') {
        next[field] = colIdx;
      }
      return next;
    });
  };

  const getMappedField = (colIdx) => {
    for (const [field, idx] of Object.entries(mapping)) {
      if (idx === colIdx) return field;
    }
    return '_ignore';
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  if (!isOpen) return null;

  return (
    <div className={`modal-overlay ${isOpen ? 'active' : ''}`} onClick={e => e.target === e.currentTarget && handleClose()}>
      <div className="modal-content modal-content-large glass-panel animate-scale">
        <div className="modal-header">
          <h2>
            <FileText size={22} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 8 }} />
            Importar Documento de Notas
          </h2>
          <button className="btn-close-modal" onClick={handleClose}>&times;</button>
        </div>

        <div className="modal-body">
          {/* === STEP 1: Upload === */}
          {step === 1 && (
            <div className="doc-step">
              <p className="doc-step-desc">
                Envie seu documento contendo a lista de patrimônios. O sistema irá analisar e separar automaticamente as informações.
              </p>
              <div className="supported-formats">
                <span className="format-badge"><FileText size={14} /> .TXT</span>
                <span className="format-badge"><FileSpreadsheet size={14} /> .CSV</span>
                <span className="format-badge"><FileSpreadsheet size={14} /> .XLSX / .XLS</span>
              </div>

              <div
                className={`doc-dropzone ${dragOver ? 'drag-over' : ''} ${file ? 'has-file' : ''}`}
                onClick={() => !file && fileInputRef.current?.click()}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
              >
                <div className="dropzone-icon">
                  <UploadCloud size={48} />
                </div>
                <h3>Arraste e solte seu arquivo aqui</h3>
                <p>ou clique para selecionar</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt,.csv,.xlsx,.xls"
                  style={{ display: 'none' }}
                  onChange={e => handleFileSelected(e.target.files[0])}
                />
              </div>

              {file && (
                <div className="doc-file-info">
                  <div className="file-info-content">
                    <FileCheck size={20} />
                    <div>
                      <strong>{file.name}</strong>
                      <span>{formatFileSize(file.size)}</span>
                    </div>
                  </div>
                  <button className="btn-icon btn-delete" title="Remover arquivo" onClick={removeFile}>
                    <X size={16} />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* === STEP 2: Mapping === */}
          {step === 2 && rawData && (
            <div className="doc-step">
              <p className="doc-step-desc">
                O sistema detectou <strong>{rawData.headers.length}</strong> colunas e <strong>{rawData.rows.length - 1}</strong> linhas de dados.
                Associe cada coluna ao campo correto:
              </p>
              <div className="doc-mapping-grid">
                {rawData.headers.map((header, idx) => {
                  // Mostra exemplo da primeira linha de dados
                  const exampleRow = rawData.rows[1];
                  const exampleVal = exampleRow ? String(exampleRow[idx] || '').slice(0, 40) : '';
                  return (
                    <div className="mapping-row" key={idx}>
                      <div className="mapping-source">
                        <span className="mapping-col-name">{String(header) || `Coluna ${idx + 1}`}</span>
                        {exampleVal && <span className="mapping-example">Ex: {exampleVal}</span>}
                      </div>
                      <div className="mapping-arrow">→</div>
                      <select
                        className="filter-select mapping-select"
                        value={getMappedField(idx)}
                        onChange={e => handleMappingChange(idx, e.target.value)}
                      >
                        {SYSTEM_FIELDS.map(f => (
                          <option key={f.key} value={f.key}>{f.label}</option>
                        ))}
                      </select>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* === STEP 3: Preview === */}
          {step === 3 && (
            <div className="doc-step">
              <div className="doc-preview-header">
                <h3>{parsedItems.length} itens encontrados</h3>
                <div className="doc-preview-actions">
                  <label className="checkbox-container">
                    <input type="checkbox" checked={addToInventory} onChange={e => setAddToInventory(e.target.checked)} />
                    <span className="checkmark"></span>
                    Adicionar itens ao inventário
                  </label>
                </div>
              </div>
              <div className="doc-preview-table-container">
                <table className="inventory-table doc-preview-table">
                  <thead>
                    <tr>
                      <th>Patrimônio</th>
                      <th>Categoria</th>
                      <th>Descrição</th>
                      <th>Estado</th>
                      <th>Localização</th>
                      <th>Obs.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedItems.slice(0, 100).map((item, idx) => (
                      <tr key={idx}>
                        <td style={{ fontWeight: 700, color: 'var(--primary)' }}>{item.patrimony}</td>
                        <td><span className="badge badge-category">{item.category}</span></td>
                        <td>{item.description}</td>
                        <td><span className={`badge ${
                          item.state === 'Excelente' ? 'badge-excellent' :
                          item.state === 'Bom' ? 'badge-good' :
                          item.state === 'Regular' ? 'badge-regular' : 'badge-damaged'
                        }`}>{item.state}</span></td>
                        <td>{item.location}</td>
                        <td>{item.notes}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {parsedItems.length > 100 && (
                  <p style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                    Mostrando 100 de {parsedItems.length} itens...
                  </p>
                )}
              </div>
            </div>
          )}

          {/* === Footer Navigation === */}
          <div className="doc-modal-footer">
            {step > 1 && (
              <button className="btn btn-secondary" onClick={() => setStep(prev => prev - 1)}>
                <ArrowLeft size={16} /> Voltar
              </button>
            )}
            <div className="doc-footer-right">
              <button className="btn btn-secondary" onClick={handleClose}>Cancelar</button>

              {step === 1 && (
                <button className="btn btn-primary" disabled={!file} onClick={analyzeFile}>
                  <span>Analisar Documento</span>
                  <ArrowRight size={16} />
                </button>
              )}

              {step === 2 && (
                <button className="btn btn-primary" onClick={applyMappingAndPreview}>
                  <span>Aplicar e Visualizar</span>
                  <ArrowRight size={16} />
                </button>
              )}

              {step === 3 && (
                <>
                  <button className="btn btn-pdf" onClick={handleDirectPdf}>
                    <FileText size={18} />
                    <span>Gerar PDF Direto</span>
                  </button>
                  <button className="btn btn-primary" onClick={handleConfirm}>
                    <CheckCircle size={18} />
                    <span>Confirmar Importação</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
