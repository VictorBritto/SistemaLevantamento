import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export async function generatePdfReport(items, config) {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;

  doc.setProperties({
    title: config.title,
    subject: 'Inventário de Patrimônios',
    author: config.author,
    creator: 'FHO-Levantamento',
  });

  const accentColor = [6, 182, 212];
  const primaryColor = [21, 34, 56]; // FHO Dark Blue
  const darkGray = [80, 80, 80];

  // Load FHO Logo
  let logoDataUrl = null;
  try {
    const response = await fetch('/fho-logo.png');
    if (response.ok) {
      const blob = await response.blob();
      logoDataUrl = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(blob);
      });
    }
  } catch (err) {
    console.warn('Não foi possível carregar a logo para o PDF', err);
  }

  const drawHeader = () => {
    // Top accent line
    doc.setFillColor(...accentColor);
    doc.rect(0, 0, pageWidth, 2, 'F');

    // Dark blue banner background
    doc.setFillColor(...primaryColor);
    doc.rect(0, 2, pageWidth, 24, 'F');

    let textStartX = margin;
    
    if (logoDataUrl) {
      doc.addImage(logoDataUrl, 'PNG', margin, 7, 35, 14);
      textStartX = margin + 40;
    }

    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(255, 255, 255);
    doc.text('FHO-LEVANTAMENTO', textStartX, 13);

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(200, 200, 200);
    doc.text('SISTEMA DE CONTROLE DE PATRIMÔNIO', textStartX, 18);

    const dateStr = new Date().toLocaleDateString('pt-BR');
    const timeStr = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    doc.text(`Gerado em: ${dateStr} às ${timeStr}`, pageWidth - margin, 13, { align: 'right' });

    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(...primaryColor);
    doc.text(config.title.toUpperCase(), margin, 34);

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...darkGray);
    doc.text(`Setor/Departamento: ${config.department || 'Geral'}`, margin, 40);
    doc.text(`Responsável pelo Inventário: ${config.author}`, margin, 45);

    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.5);
    doc.line(margin, 49, pageWidth - margin, 49);
  };

  const drawnPages = new Set();
  const drawPageAssets = () => {
    const currentPage = doc.internal.getNumberOfPages();
    if (drawnPages.has(currentPage)) return;
    drawnPages.add(currentPage);
    
    drawHeader();
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...darkGray);
    doc.text(`Página ${currentPage} de {total}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
    doc.text('FHO-Levantamento | Gerenciamento de Inventários Integrado', margin, pageHeight - 10);
  };

  // If no items, draw first page header
  if (items.length === 0) {
    drawPageAssets();
  }

  const totalItems = items.reduce((acc, i) => acc + (i.isVirtual ? i.quantity : 1), 0);
  const countComputers = items.filter(i => i.category === 'Computador').reduce((acc, i) => acc + (i.isVirtual ? i.quantity : 1), 0);
  const countMonitors = items.filter(i => i.category === 'Monitor').reduce((acc, i) => acc + (i.isVirtual ? i.quantity : 1), 0);

  const categories = [...new Set(items.map(i => i.category))].sort();

  let startY = 54;
  // If we haven't drawn the header yet, draw it (since we need it on first page before first table starts)
  drawPageAssets();

  for (const cat of categories) {
    const catItems = items.filter(i => i.category === cat);
    if (catItems.length === 0) continue;

    const tableColumns = [
      { header: 'Patrimônio', dataKey: 'patrimony' },
      { header: 'Descrição / Modelo', dataKey: 'description' },
      { header: 'Estado', dataKey: 'state' },
      { header: 'Localização', dataKey: 'location' },
    ];

    const tableRows = catItems.map(item => {
      let desc = item.description;
      if (config.includeNotes && item.notes) {
        desc += `\nObservações: ${item.notes}`;
      }
      return {
        patrimony: item.patrimony,
        description: desc,
        state: item.state,
        location: item.location,
      };
    });

    if (startY > pageHeight - 40) {
      doc.addPage();
      drawPageAssets();
      startY = 54;
    }

    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 44, 89);
    doc.text(`Categoria: ${cat.toUpperCase()}`, margin, startY);

    autoTable(doc, {
      columns: tableColumns,
      body: tableRows,
      startY: startY + 3,
      margin: { top: 54, bottom: 45, left: margin, right: margin },
      styles: {
        font: 'Helvetica',
        fontSize: 9,
        cellPadding: 3,
        overflow: 'linebreak',
        valign: 'middle',
      },
      headStyles: {
        fillColor: [15, 44, 89],
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 9,
        halign: 'center',
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      columnStyles: {
        patrimony: { cellWidth: 30, fontStyle: 'bold', halign: 'center' },
        description: { cellWidth: 'auto', halign: 'left' },
        state: { cellWidth: 25, halign: 'center' },
        location: { cellWidth: 40, halign: 'center' },
      },
      didDrawPage: () => {
        drawPageAssets();
      },
    });

    startY = (doc.lastAutoTable && doc.lastAutoTable.finalY) + 12 || startY + 20;
  }

  if (typeof doc.putTotalPages === 'function') {
    doc.putTotalPages('{total}');
  }

  const lastY = (doc.lastAutoTable && doc.lastAutoTable.finalY) || 50;

  if (lastY + 45 > pageHeight - 15) {
    doc.addPage();
    drawPageAssets();
    renderSummary(doc, 52, totalItems, countComputers, countMonitors, config, pageWidth, margin);
  } else {
    renderSummary(doc, lastY + 8, totalItems, countComputers, countMonitors, config, pageWidth, margin);
  }

  const safeTitle = config.title.toLowerCase().replace(/[^a-z0-9]/g, '_');
  doc.save(`relatorio_inventario_${safeTitle}.pdf`);
}

function renderSummary(doc, startY, total, computers, monitors, config, pageWidth, margin) {
  doc.setDrawColor(15, 44, 89);
  doc.setFillColor(240, 246, 255);
  doc.rect(margin, startY, pageWidth - margin * 2, 14, 'FD');

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 44, 89);
  doc.text(
    `RESUMO GERAL: Total de Itens: ${total}   |   Computadores: ${computers}   |   Monitores: ${monitors}   |   Outros: ${total - computers - monitors}`,
    margin + 6,
    startY + 9
  );

  const signatureY = startY + 28;
  const blockWidth = 55;

  doc.setDrawColor(180, 180, 180);
  doc.setLineWidth(0.5);
  doc.line(margin + 5, signatureY, margin + 5 + blockWidth + 10, signatureY);

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);
  doc.text(config.author, margin + 5, signatureY + 4);

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text('Responsável pelo Levantamento', margin + 5, signatureY + 8);

  if (config.supervisor) {
    const supX = pageWidth - margin - blockWidth - 10;
    doc.line(supX, signatureY, pageWidth - margin - 5, signatureY);

    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text(config.supervisor, supX, signatureY + 4);

    doc.setFont('Helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text('Supervisor Responsável', supX, signatureY + 8);
  }
}
