export interface Product {
  id: string;
  name: string;
  category: string;
  brand: string;
  purchasePrice: number;
  sellingPrice: number;
  stock: number;
  minStock: number;
  updatedAt: number;
  createdAt: number;
  imageUrl?: string;
}

export interface SaleItem {
  productId: string;
  name: string;
  quantity: number;
  price: number;
}

export interface Sale {
  id: string;
  customerName?: string;
  customerPhone?: string;
  items: SaleItem[];
  totalAmount: number;
  paymentMethod: 'CASH' | 'MPESA' | 'DEBT';
  timestamp: number;
  processedBy: string;
}

export interface Payment {
  id: string;
  amount: number;
  timestamp: number;
  method: 'CASH' | 'MPESA';
}

export interface Debtor {
  id: string;
  name: string;
  phone: string;
  totalDebt: number;
  paidAmount: number;
  balance: number;
  status: 'PENDING' | 'CLEARED';
  sales: Sale[];
  payments: Payment[];
  createdAt: number;
  updatedAt: number;
}

export type ReminderType = 'STOCK' | 'MAINTENANCE' | 'CUSTOMER' | 'GENERAL';

export interface Reminder {
  id: string;
  title: string;
  description: string;
  dueDate: number;
  type: ReminderType;
  status: 'PENDING' | 'COMPLETED' | 'DISMISSED';
  relatedEntityId?: string;
  updatedAt: number;
}

export interface BackupData {
  products: Product[];
  sales: Sale[];
  reminders: Reminder[];
  debtors: Debtor[];
  version: string;
  exportedAt: number;
}
