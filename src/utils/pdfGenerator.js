import jsPDF from 'jspdf';
import 'jspdf-autotable';

export function generatePdfReport(items, config) {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;

  doc.setProperties({
    title: config.title,
    subject: 'Inventário de Patrimônios',
    author: config.author,
    creator: 'InvKeep System',
  });

  const accentColor = [6, 182, 212];
  const primaryColor = [21, 34, 56];
  const darkGray = [80, 80, 80];

  const drawHeader = () => {
    doc.setFillColor(...accentColor);
    doc.rect(0, 0, pageWidth, 4, 'F');

    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(...primaryColor);
    doc.text('INVKEEP', margin, 15);

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...darkGray);
    doc.text('SISTEMA DE CONTROLE DE PATRIMÔNIO', margin, 19);

    const dateStr = new Date().toLocaleDateString('pt-BR');
    const timeStr = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    doc.setFontSize(9);
    doc.text(`Gerado em: ${dateStr} às ${timeStr}`, pageWidth - margin, 15, { align: 'right' });

    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.5);
    doc.line(margin, 22, pageWidth - margin, 22);

    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(...primaryColor);
    doc.text(config.title.toUpperCase(), margin, 30);

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...darkGray);
    doc.text(`Setor/Departamento: ${config.department || 'Geral'}`, margin, 36);
    doc.text(`Responsável pelo Inventário: ${config.author}`, margin, 41);

    doc.line(margin, 45, pageWidth - margin, 45);
  };

  const totalItems = items.length;
  const countComputers = items.filter(i => i.category === 'Computador').length;
  const countMonitors = items.filter(i => i.category === 'Monitor').length;

  const tableColumns = [
    { header: 'Patrimônio', dataKey: 'patrimony' },
    { header: 'Categoria', dataKey: 'category' },
    { header: 'Descrição / Modelo', dataKey: 'description' },
    { header: 'Estado', dataKey: 'state' },
    { header: 'Localização', dataKey: 'location' },
  ];

  const tableRows = items.map(item => {
    let desc = item.description;
    if (config.includeNotes && item.notes) {
      desc += `\nObservações: ${item.notes}`;
    }
    return {
      patrimony: item.patrimony,
      category: item.category,
      description: desc,
      state: item.state,
      location: item.location,
    };
  });

  doc.autoTable({
    columns: tableColumns,
    body: tableRows,
    startY: 48,
    margin: { top: 48, bottom: 45, left: margin, right: margin },
    styles: {
      font: 'Helvetica',
      fontSize: 9,
      cellPadding: 3,
      overflow: 'linebreak',
      valign: 'middle',
    },
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 9,
      halign: 'left',
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      patrimony: { cellWidth: 28, fontStyle: 'bold' },
      category: { cellWidth: 25 },
      description: { cellWidth: 'auto' },
      state: { cellWidth: 20 },
      location: { cellWidth: 32 },
    },
    didDrawPage: (data) => {
      drawHeader();
      const currentPage = data.pageNumber;
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(...darkGray);
      doc.text(`Página ${currentPage} de [total]`, pageWidth / 2, pageHeight - 10, { align: 'center' });
      doc.text('InvKeep | Gerenciamento de Inventários Integrado', margin, pageHeight - 10);
    },
  });

  if (typeof doc.putTotalPages === 'function') {
    doc.putTotalPages('[total]');
  }

  const lastY = doc.lastAutoTable.finalY || 50;

  if (lastY + 45 > pageHeight - 15) {
    doc.addPage();
    drawHeader();
    renderSummary(doc, 48, totalItems, countComputers, countMonitors, config, pageWidth, margin);
  } else {
    renderSummary(doc, lastY + 8, totalItems, countComputers, countMonitors, config, pageWidth, margin);
  }

  const safeTitle = config.title.toLowerCase().replace(/[^a-z0-9]/g, '_');
  doc.save(`relatorio_inventario_${safeTitle}.pdf`);
}

function renderSummary(doc, startY, total, computers, monitors, config, pageWidth, margin) {
  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(248, 250, 252);
  doc.rect(margin, startY, pageWidth - margin * 2, 12, 'FD');

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59);
  doc.text(
    `RESUMO: Total Geral: ${total}   |   Computadores: ${computers}   |   Monitores: ${monitors}   |   Outros: ${total - computers - monitors}`,
    margin + 4,
    startY + 7.5
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
