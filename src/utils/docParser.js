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
 */
function parseLineType(line) {
  const clean = line.trim();
  if (!clean) return { type: 'empty' };

  // Check if first word is numeric (patrimony number)
  const firstWord = clean.split(/\s+/)[0];
  const isPatrimonyNumber = /^\d+$/.test(firstWord) || /^[A-Za-z]+[-_]?\d+$/.test(firstWord);

  if (isPatrimonyNumber) {
    // Check if it has notes after a separator (e.g. "039930 - gabinete")
    const match = clean.match(/^([A-Za-z0-9-_]+)\s*[-–—:]\s*(.+)$/);
    if (match) {
      return {
        type: 'item',
        patrimony: match[1].toUpperCase(),
        note: match[2].trim()
      };
    } else {
      return {
        type: 'item',
        patrimony: clean.toUpperCase(),
        note: ''
      };
    }
  }

  // Check if it is a total line or header with calculation
  const hasDelimiter = clean.includes('=') || clean.includes(':');
  if (hasDelimiter) {
    const sep = clean.includes('=') ? '=' : ':';
    let beforeText = clean.substring(0, clean.indexOf(sep)).trim();
    let afterText = clean.substring(clean.indexOf(sep) + 1).replace(/\|/g, '').trim();

    // If there are multiple '=' or it has calculations (e.g. "funcionando = 12+9... = 178")
    if (clean.split('=').length > 2) {
      const idx = clean.lastIndexOf('=');
      beforeText = clean.substring(0, idx).trim();
      afterText = clean.substring(idx + 1).replace(/\|/g, '').trim();
    }

    if (/^\d+$/.test(afterText)) {
      const total = parseInt(afterText, 10);

      // Check if it is a summary total line for the previous block
      if (/^total/i.test(beforeText)) {
        return {
          type: 'summary_total',
          total: total
        };
      }

      // It is a header with count total
      let name = beforeText;
      let expression = '';
      if (beforeText.includes('=')) {
        const parts2 = beforeText.split('=');
        name = parts2[0].trim();
        expression = parts2[1].trim();
      }

      return {
        type: 'header_with_qty',
        name: name,
        expression: expression,
        total: total
      };
    }
  }

  // General text line (like "Monitor", "Notebook")
  return {
    type: 'header_plain',
    name: clean
  };
}

function generateVirtualPatrimony(name) {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function detectStateFromName(name) {
  const lower = name.toLowerCase();
  if (lower.includes('descarte') || lower.includes('ruim') || lower.includes('quebrado') || lower.includes('danificado') || lower.includes('manutencao') || lower.includes('manutenção')) {
    return 'Ruim';
  }
  if (lower.includes('excelente') || lower.includes('otimo') || lower.includes('ótimo') || lower.includes('novo')) {
    return 'Excelente';
  }
  return 'Bom';
}

function normalizeCategory(categoryName) {
  const lowerCat = categoryName.toLowerCase();
  if (lowerCat.includes('computador') || lowerCat.includes('notebook') || lowerCat.includes('pc') || lowerCat.includes('laptop')) {
    return 'Computador';
  } else if (lowerCat.includes('monitor') || lowerCat.includes('tela') || lowerCat.includes('display')) {
    return 'Monitor';
  } else if (lowerCat.includes('impressora') || lowerCat.includes('multifuncional')) {
    return 'Impressora';
  } else if (lowerCat.includes('teclado') || lowerCat.includes('mouse') || lowerCat.includes('combo')) {
    return 'Teclado/Mouse';
  } else if (lowerCat.includes('rede') || lowerCat.includes('switch') || lowerCat.includes('roteador')) {
    return 'Rede';
  } else if (lowerCat.includes('moveis') || lowerCat.includes('móveis') || lowerCat.includes('cadeira') || lowerCat.includes('mesa') || lowerCat.includes('armario') || lowerCat.includes('armário')) {
    return 'Móveis';
  } else {
    return categoryName.charAt(0).toUpperCase() + categoryName.slice(1);
  }
}

export function autoParseSimple(rows) {
  const isSingleColumn = rows.every(r => r.length <= 2);

  if (!isSingleColumn) return null;

  // Flatten rows to array of strings, filtering out completely empty rows
  const lines = rows.map(r => String(r[0] || '').trim()).filter(Boolean);

  // Fallback to simple flat list if it has multiple filled columns or only numeric lines
  const hasMultipleColumns = rows.some(r => r[1] && String(r[1]).trim() !== '');
  const hasTextLines = lines.some(line => {
    const clean = line.trim();
    const isNum = /^\d+$/.test(clean) || /^[A-Za-z]+[-_]?\d+$/.test(clean);
    return !isNum;
  });

  if (hasMultipleColumns || !hasTextLines) {
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

  // Grouped stream parser with lookahead
  const parsedLines = lines.map(line => parseLineType(line)).filter(l => l.type !== 'empty');
  const items = [];
  let currentCategory = 'Outros';

  for (let i = 0; i < parsedLines.length; i++) {
    const current = parsedLines[i];

    if (current.type === 'summary_total') {
      continue; // Skip group sum totals
    }

    if (current.type === 'item') {
      const category = normalizeCategory(currentCategory);
      items.push({
        patrimony: current.patrimony,
        category: category,
        description: current.note ? `${currentCategory} (${current.note})` : `${currentCategory} nº ${current.patrimony}`,
        state: 'Bom',
        location: 'Depósito',
        notes: current.note ? `Observação original: ${current.note}` : '',
      });
      continue;
    }

    if (current.type === 'header_plain') {
      currentCategory = current.name;
      continue;
    }

    if (current.type === 'header_with_qty') {
      // Lookahead to see if there are any item codes listed below this header
      let hasItemsUnderneath = false;
      for (let j = i + 1; j < parsedLines.length; j++) {
        const next = parsedLines[j];
        if (next.type === 'header_plain' || next.type === 'header_with_qty') {
          break; // Stop at next header
        }
        if (next.type === 'item') {
          hasItemsUnderneath = true;
          break;
        }
      }

      if (hasItemsUnderneath) {
        currentCategory = current.name;
      } else {
        // Virtual batch item
        const descName = current.name;
        const matchedCategory = normalizeCategory(descName);
        const patrimony = generateVirtualPatrimony(descName);
        
        items.push({
          patrimony,
          category: matchedCategory,
          description: `${descName} (Lote de ${current.total} itens)`,
          state: detectStateFromName(descName),
          location: 'Depósito',
          notes: current.expression ? `Detalhamento: ${current.expression} = ${current.total} itens.` : `Lote com ${current.total} itens.`,
          isVirtual: true,
          quantity: current.total
        });
      }
    }
  }

  return items.length > 0 ? items : null;
}
