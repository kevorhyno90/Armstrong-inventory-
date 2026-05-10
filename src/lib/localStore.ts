import { Product, Sale, Reminder, BackupData, Debtor } from '../types';

const STORAGE_KEYS = {
  PRODUCTS: 'moto_products_v2',
  SALES: 'moto_sales_v2',
  REMINDERS: 'moto_reminders_v2',
  DEBTORS: 'moto_debtors_v2'
};

const getFromStorage = <T>(key: string, defaultValue: T): T => {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : defaultValue;
};

const saveToStorage = (key: string, data: any) => {
  localStorage.setItem(key, JSON.stringify(data));
};

export const localStore = {
  getProducts: () => {
    const data = getFromStorage<Product[]>(STORAGE_KEYS.PRODUCTS, []);
    if (data.length === 0) {
      const sampleData: Product[] = [
        { id: '1', name: 'Brake Pads (Rear)', category: 'Brakes', brand: 'TVS', purchasePrice: 600, sellingPrice: 850, stock: 15, minStock: 5, updatedAt: Date.now(), createdAt: Date.now() - 864000000, imageUrl: 'https://images.unsplash.com/photo-1485965120184-a220f721d03e?auto=format&fit=crop&q=80&w=200' },
        { id: '2', name: 'Engine Oil (1L)', category: 'Engine', brand: 'Shell Advance', purchasePrice: 700, sellingPrice: 950, stock: 24, minStock: 10, updatedAt: Date.now(), createdAt: Date.now() - 764000000, imageUrl: 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&q=80&w=200' },
        { id: '3', name: 'Chain Kit', category: 'Engine', brand: 'Bajaj', purchasePrice: 1500, sellingPrice: 2200, stock: 3, minStock: 5, updatedAt: Date.now(), createdAt: Date.now() - 664000000 },
        { id: '4', name: 'Clutch Cable', category: 'Electrical', brand: 'Generic', purchasePrice: 200, sellingPrice: 350, stock: 12, minStock: 5, updatedAt: Date.now(), createdAt: Date.now() - 564000000 },
        { id: '5', name: 'Spark Plug', category: 'Engine', brand: 'NGK', purchasePrice: 250, sellingPrice: 400, stock: 45, minStock: 15, updatedAt: Date.now(), createdAt: Date.now() - 464000000 },
      ];
      saveToStorage(STORAGE_KEYS.PRODUCTS, sampleData);
      return sampleData;
    }
    return data;
  },
  saveProducts: (items: Product[]) => saveToStorage(STORAGE_KEYS.PRODUCTS, items),
  
  getSales: () => {
    const data = getFromStorage<Sale[]>(STORAGE_KEYS.SALES, []);
    if (data.length === 0) {
      const sampleSales: Sale[] = [
        { id: 's1', items: [{ productId: '1', name: 'Brake Pads', quantity: 1, price: 850 }], totalAmount: 850, paymentMethod: 'CASH', timestamp: Date.now() - 3600000, processedBy: 'Admin' },
        { id: 's2', items: [{ productId: '2', name: 'Engine Oil', quantity: 2, price: 950 }], totalAmount: 1900, paymentMethod: 'MPESA', timestamp: Date.now() - 7200000, processedBy: 'Admin' }
      ];
      saveToStorage(STORAGE_KEYS.SALES, sampleSales);
      return sampleSales;
    }
    return data;
  },
  saveSales: (sales: Sale[]) => saveToStorage(STORAGE_KEYS.SALES, sales),
  
  getReminders: () => {
    const data = getFromStorage<Reminder[]>(STORAGE_KEYS.REMINDERS, []);
    if (data.length === 0) {
      const sampleReminders: Reminder[] = [
        { id: 'r1', title: 'Restock Chain Kits', description: 'Stock level is below 5 units', dueDate: Date.now() + 86400000, type: 'STOCK', status: 'PENDING', updatedAt: Date.now() },
        { id: 'r2', title: 'Call Customer: John', description: 'Inquire if the engine overhaul was successful', dueDate: Date.now() + 172800000, type: 'CUSTOMER', status: 'PENDING', updatedAt: Date.now() }
      ];
      saveToStorage(STORAGE_KEYS.REMINDERS, sampleReminders);
      return sampleReminders;
    }
    return data;
  },
  saveReminders: (reminders: Reminder[]) => saveToStorage(STORAGE_KEYS.REMINDERS, reminders),

  getDebtors: () => getFromStorage<Debtor[]>(STORAGE_KEYS.DEBTORS, []),
  saveDebtors: (debtors: Debtor[]) => saveToStorage(STORAGE_KEYS.DEBTORS, debtors),

  exportData: (): string => {
    const backup: BackupData = {
      products: localStore.getProducts(),
      sales: localStore.getSales(),
      reminders: localStore.getReminders(),
      debtors: localStore.getDebtors(),
      version: '2.0.0',
      exportedAt: Date.now()
    };
    return JSON.stringify(backup, null, 2);
  },

  importData: (json: string): boolean => {
    try {
      const data = JSON.parse(json) as BackupData;
      if (data.products && data.sales && data.reminders) {
        localStore.saveProducts(data.products);
        localStore.saveSales(data.sales);
        localStore.saveReminders(data.reminders);
        if (data.debtors) {
          localStore.saveDebtors(data.debtors);
        }
        return true;
      }
      return false;
    } catch (e) {
      console.error('Import failed', e);
      return false;
    }
  }
};
