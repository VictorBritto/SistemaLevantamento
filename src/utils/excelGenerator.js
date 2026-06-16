import ExcelJS from 'exceljs';

export async function generateExcelReport(items) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Inventário');

  // Mantém as linhas de grade visíveis na planilha
  worksheet.views = [{ showGridLines: true }];

  // 1. Tenta carregar e adicionar a logo da FHO no cabeçalho
  try {
    const response = await fetch('/fho-logo.png');
    if (response.ok) {
      const arrayBuffer = await response.arrayBuffer();
      const imageId = workbook.addImage({
        buffer: arrayBuffer,
        extension: 'png',
      });
      // Adiciona a imagem no quadrante A2:B4
      worksheet.addImage(imageId, 'A2:B4');
    }
  } catch (err) {
    console.warn('Não foi possível carregar a logo da FHO para o Excel:', err);
  }

  // 2. Título do Relatório (Coluna D a F)
  worksheet.mergeCells('D2:F2');
  const titleCell = worksheet.getCell('D2');
  titleCell.value = 'FHO-LEVANTAMENTO - SISTEMA DE INVENTÁRIO PATRIMONIAL';
  titleCell.font = { name: 'Arial', size: 13, bold: true, color: { argb: 'FF0F2C59' } };
  titleCell.alignment = { vertical: 'middle' };

  worksheet.mergeCells('D3:F3');
  const subCell = worksheet.getCell('D3');
  subCell.value = 'FHO | Fundação Hermínio Ometto';
  subCell.font = { name: 'Arial', size: 10, italic: true, color: { argb: 'FF475569' } };
  subCell.alignment = { vertical: 'middle' };

  worksheet.mergeCells('D4:F4');
  const metaCell = worksheet.getCell('D4');
  const totalQty = items.reduce((acc, i) => acc + (i.isVirtual ? i.quantity : 1), 0);
  metaCell.value = `Relatório gerado em: ${new Date().toLocaleDateString('pt-BR')} | Total Físico de Itens: ${totalQty}`;
  metaCell.font = { name: 'Arial', size: 8.5, color: { argb: 'FF64748B' } };
  metaCell.alignment = { vertical: 'middle' };

  // Ajusta altura das linhas de cabeçalho superior
  worksheet.getRow(2).height = 20;
  worksheet.getRow(3).height = 18;
  worksheet.getRow(4).height = 18;

  // 3. Cabeçalho da Tabela (Linha 6)
  const headers = ['Patrimônio', 'Categoria', 'Descrição / Modelo', 'Estado', 'Localização', 'Observações'];
  const startRow = 6;
  const headerRow = worksheet.getRow(startRow);
  headerRow.values = headers;
  headerRow.height = 26;

  // Estilização do cabeçalho da tabela com Azul Corporativo FHO
  headerRow.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF0F2C59' } // Azul Escuro
    };
    cell.font = {
      name: 'Arial',
      size: 10,
      bold: true,
      color: { argb: 'FFFFFFFF' } // Texto Branco
    };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      bottom: { style: 'medium', color: { argb: 'FF0F2C59' } },
      right: { style: 'thin', color: { argb: 'FFCBD5E1' } }
    };
  });

  // 4. Preenche as linhas de dados da tabela (Linha 7 em diante)
  let currentRowIdx = startRow + 1;
  items.forEach((item, idx) => {
    const row = worksheet.getRow(currentRowIdx);
    
    let desc = item.description;
    if (item.isVirtual && item.notes) {
      desc += `\n(${item.notes})`;
    }
    
    row.values = [
      item.patrimony,
      item.category,
      desc,
      item.state,
      item.location,
      item.isVirtual ? `Lote agrupado de ${item.quantity} itens` : (item.notes || '')
    ];
    row.height = item.isVirtual ? 32 : 22; // Altura maior para lotes virtuais

    // Cores alternadas nas linhas e bordas suaves
    const isEven = idx % 2 === 0;
    const bgColor = isEven ? 'FFF8FAFC' : 'FFFFFFFF'; // Alterna entre cinza suave e branco

    row.eachCell((cell, colIdx) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: bgColor }
      };
      cell.font = { name: 'Arial', size: 9, color: { argb: 'FF334155' } };
      
      // Estilo destacado para a coluna Patrimônio
      if (colIdx === 1) {
        cell.font = { 
          name: 'Arial', 
          size: 9, 
          bold: true, 
          color: { argb: item.isVirtual ? 'FF8B5CF6' : 'FF06B6D4' } // Roxo para virtual, Ciano para real
        };
      }

      // Alinhamento das células
      if (colIdx === 1 || colIdx === 2 || colIdx === 4 || colIdx === 5) {
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      } else {
        cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
      }

      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
      };
    });
    currentRowIdx++;
  });

  // 5. Bloco de Resumo com Totais Físicos Reais (Linha N+2)
  currentRowIdx += 2; // Linha em branco
  
  // Título do Resumo
  worksheet.mergeCells(`A${currentRowIdx}:C${currentRowIdx}`);
  const summaryTitleCell = worksheet.getCell(`A${currentRowIdx}`);
  summaryTitleCell.value = 'RESUMO DO INVENTÁRIO (POR CATEGORIA)';
  summaryTitleCell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF0F2C59' } };
  summaryTitleCell.alignment = { vertical: 'middle' };
  worksheet.getRow(currentRowIdx).height = 22;
  currentRowIdx++;

  // Cabeçalho da tabela de resumo
  const summaryHeaderRow = worksheet.getRow(currentRowIdx);
  summaryHeaderRow.values = ['Categoria', 'Quantidade Física Total', '', '', '', ''];
  worksheet.mergeCells(`B${currentRowIdx}:C${currentRowIdx}`);
  summaryHeaderRow.height = 20;
  
  summaryHeaderRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF475569' } };
  summaryHeaderRow.getCell(1).font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FFFFFFFF' } };
  summaryHeaderRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
  
  summaryHeaderRow.getCell(2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF475569' } };
  summaryHeaderRow.getCell(2).font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FFFFFFFF' } };
  summaryHeaderRow.getCell(2).alignment = { horizontal: 'center', vertical: 'middle' };
  currentRowIdx++;

  // Calcula totais físicos acumulando os lotes virtuais
  const categoryTotals = {};
  items.forEach(item => {
    const qty = item.isVirtual ? item.quantity : 1;
    categoryTotals[item.category] = (categoryTotals[item.category] || 0) + qty;
  });

  Object.entries(categoryTotals).forEach(([cat, count]) => {
    const row = worksheet.getRow(currentRowIdx);
    row.values = [cat, count, '', '', '', ''];
    worksheet.mergeCells(`B${currentRowIdx}:C${currentRowIdx}`);
    row.height = 18;

    row.getCell(1).font = { name: 'Arial', size: 9 };
    row.getCell(1).alignment = { horizontal: 'left', vertical: 'middle' };
    row.getCell(1).border = {
      top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
    };

    row.getCell(2).font = { name: 'Arial', size: 9, bold: true };
    row.getCell(2).alignment = { horizontal: 'center', vertical: 'middle' };
    row.getCell(2).border = {
      top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
    };
    currentRowIdx++;
  });

  // Linha de Total Geral no Resumo
  const totalRow = worksheet.getRow(currentRowIdx);
  totalRow.values = ['Total Geral', totalQty, '', '', '', ''];
  worksheet.mergeCells(`B${currentRowIdx}:C${currentRowIdx}`);
  totalRow.height = 20;

  totalRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFCBD5E1' } };
  totalRow.getCell(1).font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FF0F2C59' } };
  totalRow.getCell(1).alignment = { horizontal: 'left', vertical: 'middle' };
  
  totalRow.getCell(2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFCBD5E1' } };
  totalRow.getCell(2).font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FF0F2C59' } };
  totalRow.getCell(2).alignment = { horizontal: 'center', vertical: 'middle' };

  // Define as larguras das colunas para visualização organizada
  worksheet.getColumn(1).width = 25; // Patrimônio
  worksheet.getColumn(2).width = 20; // Categoria
  worksheet.getColumn(3).width = 45; // Descrição
  worksheet.getColumn(4).width = 15; // Estado
  worksheet.getColumn(5).width = 25; // Localização
  worksheet.getColumn(6).width = 30; // Observações

  // 6. Faz o download do arquivo .xlsx no navegador
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `relatorio_inventario_${new Date().toISOString().slice(0, 10)}.xlsx`;
  anchor.click();
  window.URL.revokeObjectURL(url);
}
