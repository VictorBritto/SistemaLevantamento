import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'invkeep_items';

const DEMO_ITEMS = [
  { patrimony: 'PAT-000101', category: 'Computador', description: 'Desktop Dell OptiPlex 3080 i5 8GB RAM 256GB SSD', state: 'Excelente', location: 'Depósito Principal', notes: 'Funcionando perfeitamente' },
  { patrimony: 'PAT-000102', category: 'Computador', description: 'Notebook Lenovo ThinkPad L14 i7 16GB RAM 512GB', state: 'Bom', location: 'TI / Suporte', notes: 'Carregador incluso, bateria com boa saúde' },
  { patrimony: 'PAT-000201', category: 'Monitor', description: 'Monitor LG UltraWide 29 IPS Full HD', state: 'Excelente', location: 'Depósito Principal', notes: 'Acompanha cabo HDMI e fonte bivolt' },
  { patrimony: 'PAT-000202', category: 'Monitor', description: 'Monitor Samsung T350 24 IPS 75Hz', state: 'Regular', location: 'Administração', notes: 'Leve risco na carcaça traseira' },
  { patrimony: 'PAT-000301', category: 'Impressora', description: 'Impressora Laser HP Neverstop 1000a Monocromática', state: 'Ruim', location: 'Almoxarifado', notes: 'Necessita troca de cilindro de imagem' },
  { patrimony: 'PAT-000401', category: 'Teclado/Mouse', description: 'Combo Mouse e Teclado Sem Fio Logitech MK270', state: 'Bom', location: 'Recepção', notes: 'Receptor USB incluso' },
  { patrimony: 'PAT-000501', category: 'Rede', description: 'Switch TP-Link 24 Portas Gigabit Easy Smart', state: 'Excelente', location: 'TI / Suporte', notes: 'Instalado no rack central' },
];

export function useInventory() {
  const [items, setItems] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addItem = useCallback((item) => {
    setItems(prev => {
      const exists = prev.some(i => i.patrimony.toUpperCase() === item.patrimony.toUpperCase());
      if (exists) return prev;
      return [item, ...prev];
    });
  }, []);

  const updateItem = useCallback((oldPatrimony, newItem) => {
    setItems(prev => prev.map(i =>
      i.patrimony.toUpperCase() === oldPatrimony.toUpperCase() ? newItem : i
    ));
  }, []);

  const deleteItem = useCallback((patrimony) => {
    setItems(prev => prev.filter(i => i.patrimony.toUpperCase() !== patrimony.toUpperCase()));
  }, []);

  const isDuplicate = useCallback((patrimony, excludePatrimony = null) => {
    return items.some(i =>
      i.patrimony.toUpperCase() === patrimony.toUpperCase() &&
      (!excludePatrimony || excludePatrimony.toUpperCase() !== patrimony.toUpperCase())
    );
  }, [items]);

  const loadDemoData = useCallback(() => {
    setItems(prev => {
      const map = new Map();
      prev.forEach(i => map.set(i.patrimony.toUpperCase(), i));
      DEMO_ITEMS.forEach(i => map.set(i.patrimony.toUpperCase(), i));
      return Array.from(map.values());
    });
  }, []);

  const importItems = useCallback((newItems) => {
    setItems(prev => {
      const map = new Map();
      prev.forEach(i => map.set(i.patrimony.toUpperCase(), i));
      newItems.forEach(i => map.set(i.patrimony.toUpperCase(), i));
      return Array.from(map.values());
    });
  }, []);

  const exportBackup = useCallback(() => {
    const dataStr = JSON.stringify(items, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_inventario_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [items]);

  const importBackup = useCallback((jsonData) => {
    try {
      const parsed = JSON.parse(jsonData);
      if (!Array.isArray(parsed)) throw new Error('invalid');
      const valid = parsed.every(i => i && i.patrimony && i.category && i.description && i.state && i.location);
      if (!valid) throw new Error('invalid format');
      importItems(parsed);
      return { success: true, count: parsed.length };
    } catch {
      return { success: false };
    }
  }, [importItems]);

  const clearInventory = useCallback(() => {
    if (window.confirm('Tem certeza que deseja apagar TODOS os itens do inventário? Esta ação não pode ser desfeita.')) {
      setItems([]);
      localStorage.removeItem(STORAGE_KEY);
      return true;
    }
    return false;
  }, []);

  const metrics = {
    total: items.reduce((acc, i) => acc + (i.isVirtual ? i.quantity : 1), 0),
    computers: items.filter(i => i.category === 'Computador').reduce((acc, i) => acc + (i.isVirtual ? i.quantity : 1), 0),
    monitors: items.filter(i => i.category === 'Monitor').reduce((acc, i) => acc + (i.isVirtual ? i.quantity : 1), 0),
    damaged: items.filter(i => i.state === 'Ruim').reduce((acc, i) => acc + (i.isVirtual ? i.quantity : 1), 0),
  };

  return {
    items,
    metrics,
    addItem,
    updateItem,
    deleteItem,
    isDuplicate,
    loadDemoData,
    importItems,
    exportBackup,
    importBackup,
    clearInventory,
  };
}
