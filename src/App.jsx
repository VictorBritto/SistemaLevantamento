import { useState, useCallback } from 'react';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import ItemForm from './components/ItemForm';
import InventoryTable from './components/InventoryTable';
import PdfModal from './components/PdfModal';
import DocImportModal from './components/DocImportModal';
import ToastContainer from './components/ToastContainer';
import { useInventory } from './hooks/useInventory';
import { useToast } from './hooks/useToast';
import { generatePdfReport } from './utils/pdfGenerator';
import { generateExcelReport } from './utils/excelGenerator';

export default function App() {
  const {
    items, metrics,
    addItem, updateItem, deleteItem, isDuplicate,
    loadDemoData, importItems, exportBackup, importBackup,
    clearInventory,
  } = useInventory();

  const { toasts, showToast } = useToast();

  const [editingItem, setEditingItem] = useState(null);
  const [pdfModalOpen, setPdfModalOpen] = useState(false);
  const [docModalOpen, setDocModalOpen] = useState(false);

  // Item Form Submit
  const handleFormSubmit = useCallback((item) => {
    if (editingItem) {
      updateItem(editingItem.patrimony, item);
      showToast(`Patrimônio ${item.patrimony} atualizado com sucesso!`, 'success');
      setEditingItem(null);
    } else {
      addItem(item);
      showToast(`Patrimônio ${item.patrimony} cadastrado com sucesso!`, 'success');
    }
  }, [editingItem, addItem, updateItem, showToast]);

  // Edit Item
  const handleEdit = useCallback((item) => {
    setEditingItem(item);
    // Scroll form into view on mobile
    document.querySelector('.form-sidebar')?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Delete Item
  const handleDelete = useCallback((patrimony) => {
    if (window.confirm(`Tem certeza que deseja excluir o patrimônio: ${patrimony}?`)) {
      if (editingItem?.patrimony.toUpperCase() === patrimony.toUpperCase()) {
        setEditingItem(null);
      }
      deleteItem(patrimony);
      showToast(`Patrimônio ${patrimony} excluído.`, 'info');
    }
  }, [deleteItem, editingItem, showToast]);

  // Cancel Edit
  const handleCancelEdit = useCallback(() => setEditingItem(null), []);

  // Load Demo
  const handleLoadDemo = useCallback(() => {
    loadDemoData();
    showToast('Dados de demonstração carregados!', 'success');
  }, [loadDemoData, showToast]);

  // Export Backup
  const handleExportBackup = useCallback(() => {
    if (items.length === 0) {
      showToast('Não há itens para exportar.', 'error');
      return;
    }
    exportBackup();
    showToast('Backup exportado com sucesso!', 'success');
  }, [items, exportBackup, showToast]);

  // Import Backup
  const handleImportBackup = useCallback((jsonData) => {
    const result = importBackup(jsonData);
    if (result.success) {
      showToast(`Importação concluída: ${result.count} itens processados.`, 'success');
    } else {
      showToast('Arquivo JSON inválido ou mal formatado.', 'error');
    }
  }, [importBackup, showToast]);

  // Clear Inventory
  const handleClearInventory = useCallback(() => {
    const cleared = clearInventory();
    if (cleared) {
      showToast('Todo o inventário foi apagado.', 'info');
    }
  }, [clearInventory, showToast]);

  // PDF
  const handleGeneratePdf = useCallback(() => {
    if (items.length === 0) {
      showToast('Adicione itens antes de gerar o PDF.', 'error');
      return;
    }
    setPdfModalOpen(true);
  }, [items, showToast]);

  const handlePdfGenerate = useCallback(async (config) => {
    try {
      await generatePdfReport(items, config);
      showToast('PDF gerado com sucesso!', 'success');
    } catch (err) {
      console.error('Erro ao gerar PDF:', err);
      showToast('Falha ao gerar o PDF: ' + err.message, 'error');
    }
  }, [items, showToast]);

  // Excel
  const handleGenerateExcel = useCallback(() => {
    if (items.length === 0) {
      showToast('Adicione itens antes de gerar o Excel.', 'error');
      return;
    }
    try {
      generateExcelReport(items);
      showToast('Excel gerado com sucesso!', 'success');
    } catch (err) {
      showToast('Falha ao gerar o Excel: ' + err.message, 'error');
    }
  }, [items, showToast]);

  // Doc Import
  const handleDocImport = useCallback((newItems) => {
    importItems(newItems);
  }, [importItems]);

  const handleDocPdfDirect = useCallback(async (docItems) => {
    const config = {
      title: 'Relatório de Inventário - Documento Importado',
      department: 'Depósito',
      author: 'Responsável',
      supervisor: '',
      includeNotes: true,
    };
    try {
      await generatePdfReport(docItems, config);
      showToast('PDF gerado com sucesso!', 'success');
    } catch (err) {
      console.error('Erro ao gerar PDF Direto:', err);
      showToast('Falha ao gerar o PDF: ' + err.message, 'error');
    }
  }, [showToast]);

  return (
    <>
      <ToastContainer toasts={toasts} />

      <div className="app-container">
        <Header
          onExportBackup={handleExportBackup}
          onImportBackup={handleImportBackup}
          onImportDoc={() => setDocModalOpen(true)}
          onClearAll={handleClearInventory}
        />

        <Dashboard metrics={metrics} />

        <div className="main-layout">
          <ItemForm
            onSubmit={handleFormSubmit}
            editingItem={editingItem}
            onCancelEdit={handleCancelEdit}
            isDuplicate={isDuplicate}
            showToast={showToast}
          />

          <InventoryTable
            items={items}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onLoadDemo={handleLoadDemo}
            onGeneratePdf={handleGeneratePdf}
            onGenerateExcel={handleGenerateExcel}
          />
        </div>
      </div>

      <PdfModal
        isOpen={pdfModalOpen}
        onClose={() => setPdfModalOpen(false)}
        onGenerate={handlePdfGenerate}
      />

      <DocImportModal
        isOpen={docModalOpen}
        onClose={() => setDocModalOpen(false)}
        onImport={handleDocImport}
        onGeneratePdfDirect={handleDocPdfDirect}
        showToast={showToast}
      />
    </>
  );
}
