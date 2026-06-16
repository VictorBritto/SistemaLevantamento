import * as XLSX from 'xlsx';

// Palavras-chave para detecção automática de colunas
const FIELD_KEYWORDS = {
  patrimony: ['patrimonio', 'patrimônio', 'pat', 'codigo', 'código', 'cod', 'id', 'numero', 'número', 'tombamento', 'tomb', 'nº', 'n°', 'plaqueta'],
  category: ['categoria', 'tipo', 'classe', 'group', 'grupo', 'item', 'equipamento'],
  description: ['descricao', 'descrição', 'modelo', 'especificacao', 'especificação', 'nome', 'detalhe', 'marca', 'produto', 'material'],
  state: ['estado', 'condicao', 'condição', 'conservacao', 'conservação', 'status', 'situacao', 'situação'],
  location: ['localizacao', 'localização', 'local', 'sala', 'setor', 'departamento', 'ambiente', 'predio', 'prédio', 'bloco', 'andar'],
  notes: ['observacao', 'observação', 'obs', 'nota', 'notas', 'complemento', 'informacao', 'informação', 'detalhe adicional'],
};

// Categorias conhecidas para detecção automática
const CATEGORY_KEYWORDS = {
  'Computador': ['computador', 'desktop', 'notebook', 'laptop', 'pc', 'cpu', 'micro', 'workstation', 'all-in-one', 'all in one', 'thin client'],
  'Monitor': ['monitor', 'tela', 'display', 'lcd', 'led'],
  'Impressora': ['impressora', 'printer', 'multifuncional', 'scanner', 'copiadora'],
  'Teclado/Mouse': ['teclado', 'mouse', 'keyboard', 'combo', 'periférico', 'periferico'],
  'Rede': ['switch', 'roteador', 'router', 'access point', 'ap', 'modem', 'rack', 'patch panel', 'firewall', 'hub'],
  'Móveis': ['mesa', 'cadeira', 'armário', 'armario', 'estante', 'gaveteiro', 'arquivo', 'bancada', 'móvel', 'movel'],
};

// Estado: mapeamento de termos
const STATE_MAP = {
  'excelente': 'Excelente',
  'otimo': 'Excelente',
  'ótimo': 'Excelente',
  'novo': 'Excelente',
  'bom': 'Bom',
  'ok': 'Bom',
  'regular': 'Regular',
  'medio': 'Regular',
  'médio': 'Regular',
  'razoavel': 'Regular',
  'razoável': 'Regular',
  'ruim': 'Ruim',
  'pessimo': 'Ruim',
  'péssimo': 'Ruim',
  'mau': 'Ruim',
  'defeito': 'Ruim',
  'quebrado': 'Ruim',
  'danificado': 'Ruim',
  'manutencao': 'Ruim',
  'manutenção': 'Ruim',
  'inservível': 'Ruim',
  'inservivel': 'Ruim',
};

/**
 * Lê um arquivo e retorna os dados crus como array de arrays (linhas × colunas)
 */
export function readFile(file) {
  return new Promise((resolve, reject) => {
    const ext = file.name.split('.').pop().toLowerCase();
    const reader = new FileReader();

    reader.onerror = () => reject(new Error('Erro ao ler o arquivo'));

    if (ext === 'xlsx' || ext === 'xls') {
      reader.onload = (e) => {
        try {
          const wb = XLSX.read(e.target.result, { type: 'array' });
          const sheet = wb.Sheets[wb.SheetNames[0]];
          const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
          // Remove linhas completamente vazias
          const cleaned = data.filter(row => row.some(cell => String(cell).trim() !== ''));
          resolve({ rows: cleaned, headers: cleaned[0] || [], type: 'excel' });
        } catch (err) {
          reject(new Error('Falha ao processar o arquivo Excel: ' + err.message));
        }
      };
      reader.readAsArrayBuffer(file);
    } else if (ext === 'csv') {
      reader.onload = (e) => {
        try {
          const text = e.target.result;
          const rows = parseCSV(text);
          const cleaned = rows.filter(row => row.some(cell => cell.trim() !== ''));
          resolve({ rows: cleaned, headers: cleaned[0] || [], type: 'csv' });
        } catch (err) {
          reject(new Error('Falha ao processar CSV: ' + err.message));
        }
      };
      reader.readAsText(file, 'utf-8');
    } else {
      // TXT - tenta vários separadores
      reader.onload = (e) => {
        try {
          const text = e.target.result;
          const rows = parseTXT(text);
          const cleaned = rows.filter(row => row.some(cell => cell.trim() !== ''));
          resolve({ rows: cleaned, headers: cleaned[0] || [], type: 'txt' });
        } catch (err) {
          reject(new Error('Falha ao processar TXT: ' + err.message));
        }
      };
      reader.readAsText(file, 'utf-8');
    }
  });
}

function parseCSV(text) {
  const lines = text.split(/\r?\n/);
  // Detecta o separador mais comum
  const sep = detectSeparator(lines[0] || '');
  return lines.map(line => splitLine(line, sep));
}

function parseTXT(text) {
  const lines = text.split(/\r?\n/);
  // Detectar se é tabulado, separado por ; , | ou espaços múltiplos
  const sep = detectSeparator(lines[0] || '');
  return lines.map(line => splitLine(line, sep));
}

function detectSeparator(line) {
  const counts = { '\t': 0, ';': 0, ',': 0, '|': 0 };
  for (const ch of line) {
    if (ch in counts) counts[ch]++;
  }
  // Pega o separador com maior ocorrência
  let best = '\t';
  let max = 0;
  for (const [sep, count] of Object.entries(counts)) {
    if (count > max) { max = count; best = sep; }
  }
  // Se nenhum separador encontrado, tenta espaços múltiplos
  if (max === 0) return '  '; // double space como fallback
  return best;
}

function splitLine(line, sep) {
  if (sep === '  ') {
    // Split por 2+ espaços
    return line.split(/\s{2,}/).map(s => s.trim());
  }
  // Respeita aspas para CSV
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === sep && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

/**
 * Detecta automaticamente qual coluna corresponde a qual campo
 */
export function autoDetectMapping(headers) {
  const mapping = {};
  const usedIndices = new Set();

  // Normaliza os headers
  const normalizedHeaders = headers.map(h => 
    String(h).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
  );

  // Para cada campo do sistema, tenta encontrar a melhor coluna
  for (const [field, keywords] of Object.entries(FIELD_KEYWORDS)) {
    let bestIdx = -1;
    let bestScore = 0;

    normalizedHeaders.forEach((header, idx) => {
      if (usedIndices.has(idx)) return;
      for (const kw of keywords) {
        const normalizedKw = kw.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        if (header.includes(normalizedKw)) {
          const score = normalizedKw.length; // Quanto mais longo o match, mais específico
          if (score > bestScore) {
            bestScore = score;
            bestIdx = idx;
          }
        }
      }
    });

    if (bestIdx >= 0) {
      mapping[field] = bestIdx;
      usedIndices.add(bestIdx);
    }
  }

  return mapping;
}

/**
 * Detecta a categoria de um item baseado na descrição
 */
export function detectCategory(text) {
  const lower = text.toLowerCase();
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const kw of keywords) {
      if (lower.includes(kw)) return category;
    }
  }
  return 'Outros';
}

/**
 * Detecta o estado de conservação a partir de texto
 */
export function detectState(text) {
  const lower = text.toLowerCase().trim();
  if (STATE_MAP[lower]) return STATE_MAP[lower];
  // Tenta busca parcial
  for (const [key, value] of Object.entries(STATE_MAP)) {
    if (lower.includes(key)) return value;
  }
  return 'Bom';
}

/**
 * Aplica o mapeamento de colunas aos dados crus e retorna itens formatados
 */
export function applyMapping(rows, mapping, hasHeader = true) {
  const dataRows = hasHeader ? rows.slice(1) : rows;

  return dataRows
    .map(row => {
      const patrimony = mapping.patrimony !== undefined ? String(row[mapping.patrimony] || '').trim().toUpperCase() : '';
      if (!patrimony) return null; // Sem patrimônio = linha inválida

      const rawDescription = mapping.description !== undefined ? String(row[mapping.description] || '').trim() : '';
      const rawCategory = mapping.category !== undefined ? String(row[mapping.category] || '').trim() : '';
      const rawState = mapping.state !== undefined ? String(row[mapping.state] || '').trim() : '';
      const rawLocation = mapping.location !== undefined ? String(row[mapping.location] || '').trim() : '';
      const rawNotes = mapping.notes !== undefined ? String(row[mapping.notes] || '').trim() : '';

      return {
        patrimony,
        category: rawCategory || detectCategory(rawDescription || patrimony),
        description: rawDescription || patrimony,
        state: rawState ? detectState(rawState) : 'Bom',
        location: rawLocation || 'Depósito',
        notes: rawNotes,
      };
    })
    .filter(Boolean); // Remove nulls
}

/**
 * Tenta um parsing totalmente automático para documentos simples
 * (uma coluna por linha, ou patrimônio + descrição)
 */
export function autoParseSimple(rows) {
  // Se cada linha tem apenas 1 ou 2 colunas
  const isSingleColumn = rows.every(r => r.length <= 2);

  if (!isSingleColumn) return null;

  // Flatten rows to array of strings, filtering out completely empty rows
  const lines = rows.map(r => String(r[0] || '').trim()).filter(Boolean);

  // Check if it is a grouped list (contains "total" line, case-insensitive)
  const isGrouped = lines.some(line => /total/i.test(line));

  if (isGrouped) {
    const items = [];
    let currentCategory = 'Outros';

    for (const line of lines) {
      const clean = line.trim();
      if (!clean) continue;

      // Check if it's a total line
      if (/total/i.test(clean)) {
        continue; // Skip total line
      }

      // Check if it is a patrimony number
      const isNum = /^\d+$/.test(clean) || /^[A-Za-z]+[-_]?\d+$/.test(clean);

      if (isNum) {
        const patrimony = clean.toUpperCase();
        
        // Normalize the category to match system categories if possible
        let matchedCategory = 'Outros';
        const lowerCat = currentCategory.toLowerCase();
        
        if (lowerCat.includes('computador') || lowerCat.includes('notebook') || lowerCat.includes('pc') || lowerCat.includes('laptop')) {
          matchedCategory = 'Computador';
        } else if (lowerCat.includes('monitor') || lowerCat.includes('tela') || lowerCat.includes('display')) {
          matchedCategory = 'Monitor';
        } else if (lowerCat.includes('impressora') || lowerCat.includes('multifuncional')) {
          matchedCategory = 'Impressora';
        } else if (lowerCat.includes('teclado') || lowerCat.includes('mouse')) {
          matchedCategory = 'Teclado/Mouse';
        } else if (lowerCat.includes('rede') || lowerCat.includes('switch') || lowerCat.includes('roteador')) {
          matchedCategory = 'Rede';
        } else if (lowerCat.includes('moveis') || lowerCat.includes('móveis') || lowerCat.includes('cadeira') || lowerCat.includes('mesa')) {
          matchedCategory = 'Móveis';
        } else {
          matchedCategory = currentCategory.charAt(0).toUpperCase() + currentCategory.slice(1);
        }

        items.push({
          patrimony,
          category: matchedCategory,
          description: `${currentCategory} nº ${patrimony}`,
          state: 'Bom',
          location: 'Depósito',
          notes: '',
        });
      } else {
        // It's a new category header!
        currentCategory = clean;
      }
    }
    return items;
  }

  // Fallback to simple flat list parsing
  return rows
    .filter(r => r[0] && String(r[0]).trim())
    .map(r => {
      const val = String(r[0]).trim().toUpperCase();
      const desc = r[1] ? String(r[1]).trim() : '';
      return {
        patrimony: val,
        category: detectCategory(desc || val),
        description: desc || val,
        state: 'Bom',
        location: 'Depósito',
        notes: '',
      };
    });
}
