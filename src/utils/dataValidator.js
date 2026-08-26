/**
 * Validate the inventory for possible anomalies.
 */
export function validateInventory(items) {
  const anomalies = [];

  items.forEach(item => {
    // 1. Missing fields
    if (!item.category || item.category === 'Outros' || item.category === '') {
      anomalies.push({
        patrimony: item.patrimony,
        issueType: 'missing_field',
        message: 'Categoria não definida ou genérica',
        severity: 'low',
        item
      });
    }

    if (!item.description || item.description.trim() === '') {
      anomalies.push({
        patrimony: item.patrimony,
        issueType: 'missing_field',
        message: 'Descrição ausente',
        severity: 'high',
        item
      });
    }

    if (!item.location || item.location.trim() === '') {
      anomalies.push({
        patrimony: item.patrimony,
        issueType: 'missing_field',
        message: 'Localização ausente',
        severity: 'medium',
        item
      });
    }

    // 2. State mismatch
    const descLower = item.description.toLowerCase();
    const notesLower = (item.notes || '').toLowerCase();
    const badWords = ['quebrado', 'defeito', 'trincado', 'não liga', 'ruim', 'manutenção', 'manutencao', 'sucata'];
    const goodWords = ['novo', 'lacrado', 'excelente', 'perfeito'];

    const hasBadWord = badWords.some(w => descLower.includes(w) || notesLower.includes(w));
    const hasGoodWord = goodWords.some(w => descLower.includes(w) || notesLower.includes(w));

    if (hasBadWord && (item.state === 'Excelente' || item.state === 'Bom')) {
      anomalies.push({
        patrimony: item.patrimony,
        issueType: 'state_mismatch',
        message: `Estado listado como '${item.state}', mas o texto sugere danos.`,
        severity: 'high',
        item
      });
    }

    if (hasGoodWord && (item.state === 'Ruim' || item.state === 'Regular')) {
      anomalies.push({
        patrimony: item.patrimony,
        issueType: 'state_mismatch',
        message: `Estado listado como '${item.state}', mas o texto sugere estar novo/excelente.`,
        severity: 'medium',
        item
      });
    }
  });

  return anomalies;
}

/**
 * Merge two datasets (spreadsheets).
 * addItems (Planilha 2) overwrites baseItems (Planilha 1) for non-empty fields.
 */
export function mergeDatasets(baseItems, addItems) {
  const mergedMap = new Map();

  // Load base items
  baseItems.forEach(item => {
    mergedMap.set(item.patrimony.toUpperCase(), { ...item });
  });

  // Apply additive items
  addItems.forEach(addItem => {
    const key = addItem.patrimony.toUpperCase();
    if (mergedMap.has(key)) {
      const baseItem = mergedMap.get(key);
      
      // Update fields if the new one is not empty
      const mergedItem = { ...baseItem };
      
      if (addItem.category && addItem.category !== 'Outros') mergedItem.category = addItem.category;
      if (addItem.description) mergedItem.description = addItem.description;
      if (addItem.state) mergedItem.state = addItem.state;
      if (addItem.location) mergedItem.location = addItem.location;
      
      // Append notes if both exist and are different
      if (addItem.notes) {
        if (baseItem.notes && baseItem.notes !== addItem.notes) {
          mergedItem.notes = `${baseItem.notes} | ${addItem.notes}`;
        } else {
          mergedItem.notes = addItem.notes;
        }
      }
      
      mergedMap.set(key, mergedItem);
    } else {
      // It's a new item
      mergedMap.set(key, { ...addItem });
    }
  });

  return Array.from(mergedMap.values());
}
