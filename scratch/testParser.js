import fs from 'fs';
import { autoParseSimple } from '../src/utils/docParser.js';
import { generateExcelReport } from '../src/utils/excelGenerator.js';

// Simulando a leitura de linhas do arquivo de texto
try {
  const content = fs.readFileSync('../scratch_inventory.txt', 'utf-8');
  const rows = content.split(/\r?\n/).map(line => [line]);

  console.log("Linhas lidas do arquivo:", rows.length);

  const result = autoParseSimple(rows);

  console.log("Itens processados pelo parser:", result ? result.length : "null");
  
  if (result) {
    console.log("\nPrimeiros 3 itens:");
    console.log(result.slice(0, 3));

    console.log("\nÚltimos 3 itens:");
    console.log(result.slice(-3));

    // Verifica se "Total" ou nomes de categoria viraram patrimônio
    const categoriesAsPatrimony = result.filter(item => 
      item.patrimony.toLowerCase().includes('total') || 
      item.patrimony.toLowerCase().includes('monitor') ||
      item.patrimony.toLowerCase().includes('computador')
    );
    
    console.log("\nItens inválidos detectados como patrimônio:", categoriesAsPatrimony.length);
    if (categoriesAsPatrimony.length > 0) {
      console.log(categoriesAsPatrimony);
    } else {
      console.log("Sucesso: Nenhuma linha de cabeçalho ou total foi convertida em patrimônio!");
    }

    // Verifica a divisão de categorias
    const counts = {};
    result.forEach(item => {
      counts[item.category] = (counts[item.category] || 0) + 1;
    });
    console.log("\nDistribuição de categorias:", counts);

    // Testar a geração do Excel
    console.log("\nTestando a geração do Excel...");
    generateExcelReport(result);
    
    const dateStr = new Date().toISOString().slice(0, 10);
    const expectedFilename = `relatorio_inventario_${dateStr}.xlsx`;
    if (fs.existsSync(expectedFilename)) {
      console.log(`Sucesso: Arquivo Excel '${expectedFilename}' gerado no disco!`);
      // Apagar o arquivo gerado de teste
      fs.unlinkSync(expectedFilename);
    } else {
      console.log(`Erro: Arquivo Excel '${expectedFilename}' não foi encontrado.`);
    }
  }
} catch (err) {
  console.error("Erro no teste:", err);
}
