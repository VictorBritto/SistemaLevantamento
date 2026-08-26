import { useState, useRef, useCallback } from 'react';
import { UploadCloud, FileCheck, X, ArrowLeft, ArrowRight, Layers, FileSpreadsheet, CheckCircle } from 'lucide-react';
import { readFile, autoDetectMapping, applyMapping } from '../utils/docParser';
import { mergeDatasets } from '../utils/dataValidator';

const SYSTEM_FIELDS = [
  { key: 'patrimony', label: 'Patrimônio (obrigatório)' },
  { key: 'category', label: 'Categoria' },
  { key: 'description', label: 'Descrição / Modelo' },
  { key: 'state', label: 'Estado de Conservação' },
  { key: 'location', label: 'Localização' },
  { key: 'notes', label: 'Observações' },
  { key: '_ignore', label: '— Ignorar esta coluna —' },
];

export default function MergeSpreadsheetsModal({ isOpen, onClose, onImport, showToast }) {
  const [step, setStep] = useState(1);
  const [file1, setFile1] = useState(null);
  const [file2, setFile2] = useState(null);
  
  const [rawData1, setRawData1] = useState(null);
  const [rawData2, setRawData2] = useState(null);
  
  const [mapping1, setMapping1] = useState({});
  const [mapping2, setMapping2] = useState({});
  
  const [mergedItems, setMergedItems] = useState([]);

  const fileInput1Ref = useRef(null);
  const fileInput2Ref = useRef(null);

  const resetModal = useCallback(() => {
    setStep(1);
    setFile1(null);
    setFile2(null);
    setRawData1(null);
    setRawData2(null);
    setMapping1({});
    setMapping2({});
    setMergedItems([]);
  }, []);

  const handleClose = () => {
    resetModal();
    onClose();
  };

  const handleFileSelected = async (file, setFileObj, setRawDataObj, setMappingObj) => {
    if (!file) return;
    const ext = file.name.split('.').pop().toLowerCase();
    if (!['txt', 'csv', 'xlsx', 'xls'].includes(ext)) {
      showToast('Formato não suportado. Use .txt, .csv, .xlsx ou .xls', 'error');
      return;
    }
    setFileObj(file);
    try {
      const result = await readFile(file);
      setRawDataObj(result);
      setMappingObj(autoDetectMapping(result.headers));
      showToast(`${file.name} carregado com sucesso.`, 'success');
    } catch (err) {
      showToast(err.message || 'Erro ao processar arquivo.', 'error');
    }
  };

  // STEP 2: Preview merged results
  const generatePreview = () => {
    if (!rawData1 || !rawData2) return;
    
    if (mapping1.patrimony === undefined) {
      showToast('Defina a coluna "Patrimônio" para a Planilha 1.', 'error');
      return;
    }
    if (mapping2.patrimony === undefined) {
      showToast('Defina a coluna "Patrimônio" para a Planilha 2.', 'error');
      return;
    }

    const items1 = applyMapping(rawData1.rows, mapping1, true);
    const items2 = applyMapping(rawData2.rows, mapping2, true);

    const merged = mergeDatasets(items1, items2);
    
    if (merged.length === 0) {
      showToast('Nenhum item válido encontrado.', 'error');
      return;
    }

    setMergedItems(merged);
    setStep(2);
    showToast(`${merged.length} itens unificados prontos para importação!`, 'success');
  };

  const handleConfirm = () => {
    onImport(mergedItems);
    showToast(`${mergedItems.length} itens unificados importados com sucesso!`, 'success');
    handleClose();
  };

  const handleMappingChange = (colIdx, field, setMapping) => {
    setMapping(prev => {
      const next = { ...prev };
      for (const [k, v] of Object.entries(next)) {
        if (v === colIdx) delete next[k];
      }
      if (field !== '_ignore') {
        next[field] = colIdx;
      }
      return next;
    });
  };

  const getMappedField = (colIdx, mapping) => {
    for (const [field, idx] of Object.entries(mapping)) {
      if (idx === colIdx) return field;
    }
    return '_ignore';
  };

  const renderMapping = (rawData, mapping, setMapping, title) => (
    <div className="doc-mapping-section" style={{ marginBottom: '2rem' }}>
      <h4>{title}</h4>
      <div className="doc-mapping-grid">
        {rawData.headers.map((header, idx) => {
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
                value={getMappedField(idx, mapping)}
                onChange={e => handleMappingChange(idx, e.target.value, setMapping)}
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
  );

  if (!isOpen) return null;

  return (
    <div className={`modal-overlay ${isOpen ? 'active' : ''}`} onClick={e => e.target === e.currentTarget && handleClose()}>
      <div className="modal-content modal-content-large glass-panel animate-scale">
        <div className="modal-header">
          <h2>
            <Layers size={22} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 8 }} />
            Mesclar Duas Planilhas
          </h2>
          <button className="btn-close-modal" onClick={handleClose}>&times;</button>
        </div>

        <div className="modal-body">
          {step === 1 && (
            <div className="doc-step">
              <p className="doc-step-desc">
                Selecione as duas planilhas que deseja unificar. A Planilha 2 atualizará e complementará as informações da Planilha 1.
              </p>
              
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                {/* Planilha 1 */}
                <div className="doc-dropzone" onClick={() => !file1 && fileInput1Ref.current?.click()} style={{ flex: 1, padding: '1.5rem' }}>
                  <input
                    ref={fileInput1Ref}
                    type="file"
                    accept=".txt,.csv,.xlsx,.xls"
                    style={{ display: 'none' }}
                    onChange={e => handleFileSelected(e.target.files[0], setFile1, setRawData1, setMapping1)}
                  />
                  {file1 ? (
                    <div className="doc-file-info" style={{ margin: 0, justifyContent: 'center' }}>
                      <FileCheck size={20} color="var(--primary)" />
                      <div><strong>Planilha 1 (Base):</strong><br/>{file1.name}</div>
                      <button className="btn-icon btn-delete" onClick={(e) => { e.stopPropagation(); setFile1(null); setRawData1(null); }}>
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <>
                      <UploadCloud size={32} />
                      <h4 style={{ margin: '10px 0' }}>Planilha 1 (Base)</h4>
                      <p style={{ fontSize: '0.85rem' }}>Clique para selecionar</p>
                    </>
                  )}
                </div>

                {/* Planilha 2 */}
                <div className="doc-dropzone" onClick={() => !file2 && fileInput2Ref.current?.click()} style={{ flex: 1, padding: '1.5rem' }}>
                  <input
                    ref={fileInput2Ref}
                    type="file"
                    accept=".txt,.csv,.xlsx,.xls"
                    style={{ display: 'none' }}
                    onChange={e => handleFileSelected(e.target.files[0], setFile2, setRawData2, setMapping2)}
                  />
                  {file2 ? (
                    <div className="doc-file-info" style={{ margin: 0, justifyContent: 'center' }}>
                      <FileCheck size={20} color="var(--primary)" />
                      <div><strong>Planilha 2 (Adicional):</strong><br/>{file2.name}</div>
                      <button className="btn-icon btn-delete" onClick={(e) => { e.stopPropagation(); setFile2(null); setRawData2(null); }}>
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <>
                      <UploadCloud size={32} />
                      <h4 style={{ margin: '10px 0' }}>Planilha 2 (Atualização)</h4>
                      <p style={{ fontSize: '0.85rem' }}>Clique para selecionar</p>
                    </>
                  )}
                </div>
              </div>

              {rawData1 && renderMapping(rawData1, mapping1, setMapping1, "Mapeamento da Planilha 1")}
              {rawData2 && renderMapping(rawData2, mapping2, setMapping2, "Mapeamento da Planilha 2")}

            </div>
          )}

          {step === 2 && (
            <div className="doc-step">
              <div className="doc-preview-header">
                <h3>{mergedItems.length} itens após a mesclagem</h3>
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
                    {mergedItems.slice(0, 50).map((item, idx) => (
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
                {mergedItems.length > 50 && (
                  <p style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-secondary)' }}>
                    Mostrando 50 de {mergedItems.length} itens...
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="doc-modal-footer">
            {step > 1 && (
              <button className="btn btn-secondary" onClick={() => setStep(prev => prev - 1)}>
                <ArrowLeft size={16} /> Voltar
              </button>
            )}
            <div className="doc-footer-right">
              <button className="btn btn-secondary" onClick={handleClose}>Cancelar</button>

              {step === 1 && (
                <button className="btn btn-primary" disabled={!file1 || !file2} onClick={generatePreview}>
                  <span>Gerar Pré-visualização</span>
                  <ArrowRight size={16} />
                </button>
              )}

              {step === 2 && (
                <button className="btn btn-primary" onClick={handleConfirm}>
                  <CheckCircle size={18} />
                  <span>Importar Unificados</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
