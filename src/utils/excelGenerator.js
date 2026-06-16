import * as XLSX from 'xlsx';

export function generateExcelReport(items) {
  // Formata os dados para a estrutura de planilha com cabeçalhos amigáveis
  const formattedData = items.map(item => ({
    'Patrimônio': item.patrimony,
    'Categoria': item.category,
    'Descrição / Modelo': item.description,
    'Estado': item.state,
    'Localização': item.location,
    'Observações': item.notes || ''
  }));

  // Cria a planilha a partir dos dados formatados
  const worksheet = XLSX.utils.json_to_sheet(formattedData);

  // Calcula a contagem de itens por categoria
  const categoryCounts = {};
  items.forEach(item => {
    categoryCounts[item.category] = (categoryCounts[item.category] || 0) + 1;
  });

  // Prepara o bloco de resumo com totais (deixando uma linha em branco após a tabela)
  const startRow = items.length + 3; // +1 cabeçalho +1 para 1-based index +1 linha em branco
  const summaryRows = [
    ['RESUMO DO INVENTÁRIO'],
    ['Categoria', 'Quantidade de Itens'],
    ...Object.entries(categoryCounts).map(([cat, count]) => [cat, count]),
    ['Total Geral', items.length]
  ];

  // Insere o resumo na planilha na coluna A
  XLSX.utils.sheet_add_aoa(worksheet, summaryRows, { origin: `A${startRow}` });

  // Define larguras padrão para cada coluna para melhorar o visual do Excel gerado
  worksheet['!cols'] = [
    { wch: 20 }, // Patrimônio / Categoria
    { wch: 20 }, // Categoria / Quantidade
    { wch: 45 }, // Descrição / Modelo
    { wch: 15 }, // Estado
    { wch: 25 }, // Localização
    { wch: 45 }  // Observações
  ];

  // Cria o workbook e adiciona a planilha
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Inventário');

  // Define um nome de arquivo amigável contendo a data atual
  const dateStr = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(workbook, `relatorio_inventario_${dateStr}.xlsx`);
}
