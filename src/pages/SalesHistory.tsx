import React from 'react';
import { 
  Download,
  Search,
  ArrowUpRight,
  Filter,
  FileSpreadsheet,
  Package,
  Calendar,
  FileText,
  ChevronLeft,
  TrendingUp,
  DollarSign,
  Trash2
} from 'lucide-react';
import { localStore } from '../lib/localStore';
import { Sale, Debtor, Product } from '../types';
import { format } from 'date-fns';
import { cn } from '../lib/utils';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

import { ReceiptView } from '../components/Receipt';
import { AnimatePresence } from 'motion/react';

import { ConfirmDialog } from '../components/ConfirmDialog';

export default function SalesHistory() {
  const [sales, setSales] = React.useState<Sale[]>([]);
  const [debtors, setDebtors] = React.useState<Debtor[]>([]);
  const [products, setProducts] = React.useState<Product[]>([]);
  const [search, setSearch] = React.useState('');
  const [selectedSale, setSelectedSale] = React.useState<Sale | null>(null);

  // Delete confirmation state
  const [confirmVoid, setConfirmVoid] = React.useState<{ isOpen: boolean; id: string | null }>({
    isOpen: false,
    id: null
  });

  const deleteSale = (id: string) => {
    const saleToDelete = sales.find(s => s.id === id);
    if (!saleToDelete) return;

    const updated = sales.filter(s => s.id !== id);
    setSales(updated);
    localStore.saveSales(updated);

    // Return items to stock
    const updatedProducts = products.map(p => {
      const soldItem = saleToDelete.items.find(item => item.productId === p.id);
      if (soldItem) {
        return { ...p, stock: p.stock + soldItem.quantity };
      }
      return p;
    });
    setProducts(updatedProducts);
    localStore.saveProducts(updatedProducts);

    // Handle debt sale deletion
    if (saleToDelete.paymentMethod === 'DEBT') {
      const updatedDebtors = debtors.map(d => {
        if (d.sales.some(s => s.id === id)) {
          const newSales = d.sales.filter(s => s.id !== id);
          const newTotalDebt = d.totalDebt - saleToDelete.totalAmount;
          const newBalance = newTotalDebt - d.paidAmount;
          return {
            ...d,
            sales: newSales,
            totalDebt: newTotalDebt,
            balance: newBalance,
            status: (newBalance <= 0 ? 'CLEARED' : 'PENDING') as any,
            updatedAt: Date.now()
          };
        }
        return d;
      });
      setDebtors(updatedDebtors);
      localStore.saveDebtors(updatedDebtors);
    }
  };

  React.useEffect(() => {
    setSales(localStore.getSales());
    setDebtors(localStore.getDebtors());
    setProducts(localStore.getProducts());
  }, []);

  const sortedSales = [...sales].sort((a, b) => b.timestamp - a.timestamp);

  const exportPDF = () => {
    const doc = new jsPDF() as any;
    
    doc.setFontSize(20);
    doc.text('Armstrong Garage - Sales Ledger', 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Generated on: ${format(new Date(), 'PPP p')}`, 14, 30);
    
    const tableRows = filtered.map(sale => [
      sale.id.toUpperCase(),
      format(sale.timestamp, 'MMM dd, yyyy HH:mm'),
      sale.customerName || 'Walk-in',
      sale.items.map(i => `${i.name} (x${i.quantity})`).join(', '),
      `KES ${sale.totalAmount.toLocaleString()}`,
      sale.paymentMethod
    ]);

    autoTable(doc, {
      head: [['ID', 'Date', 'Customer', 'Items', 'Total', 'Payment']],
      body: tableRows,
      startY: 40,
      theme: 'grid',
      headStyles: { fillStyle: [15, 23, 42] },
      styles: { fontSize: 8 }
    });

    doc.save(`ARMSTRONG_LEDGER_${format(Date.now(), 'yyyyMMdd')}.pdf`);
  };

  const exportCSV = () => {
    if (sales.length === 0) return;
    
    const headers = ['Sale ID', 'Date', 'Customer', 'Items', 'Total', 'Payment Method'];
    const rows = sales.map(sale => [
      sale.id.toUpperCase(),
      format(sale.timestamp, 'yyyy-MM-dd HH:mm'),
      sale.customerName || 'Walk-in',
      sale.items.map(i => `${i.name} (x${i.quantity})`).join('; '),
      sale.totalAmount,
      sale.paymentMethod
    ]);

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `MOTOSPARE_HISTORY_${format(Date.now(), 'yyyyMMdd')}.csv`);
    link.click();
  };

  const filtered = sortedSales.filter(sale => 
    (sale.customerName || '').toLowerCase().includes(search.toLowerCase()) ||
    sale.id.toLowerCase().includes(search.toLowerCase())
  );

  const todaySales = sales.filter(s => format(s.timestamp, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd'));
  const todayTotal = todaySales.reduce((sum, s) => sum + s.totalAmount, 0);
  const todayMpesa = todaySales.filter(s => s.paymentMethod === 'MPESA').reduce((sum, s) => sum + s.totalAmount, 0);
  const todayCash = todaySales.filter(s => s.paymentMethod === 'CASH').reduce((sum, s) => sum + s.totalAmount, 0);

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => window.history.back()}
            className="p-3 bg-white border border-slate-200 hover:bg-slate-50 shadow-sm rounded-2xl text-slate-500 transition-all active:scale-95 group"
          >
            <ChevronLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
          </button>
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Sales Ledger</h1>
            <p className="text-slate-500 text-sm font-medium">Historical audit of all transactions</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={exportCSV}
            className="bg-white border border-slate-200 text-slate-600 px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-slate-50 transition-all flex items-center gap-2"
          >
            <FileSpreadsheet className="w-4 h-4" />
            CSV
          </button>
          <button 
            onClick={exportPDF}
            className="bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-xl shadow-emerald-100 hover:bg-emerald-700 transition-all flex items-center gap-2"
          >
            <FileText className="w-4 h-4" />
            Download PDF Report
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900 p-6 rounded-[2rem] text-white">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Today's Total</p>
          <div className="flex items-end justify-between">
            <h3 className="text-2xl font-black">KES {todayTotal.toLocaleString()}</h3>
            <div className="p-2 bg-white/10 rounded-xl">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">M-Pesa Collections</p>
          <div className="flex items-end justify-between">
            <h3 className="text-2xl font-black text-slate-900">KES {todayMpesa.toLocaleString()}</h3>
            <div className="p-2 bg-emerald-50 rounded-xl">
              <ArrowUpRight className="w-5 h-5 text-emerald-600" />
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Cash on Hand</p>
          <div className="flex items-end justify-between">
            <h3 className="text-2xl font-black text-slate-900">KES {todayCash.toLocaleString()}</h3>
            <div className="p-2 bg-blue-50 rounded-xl">
              <DollarSign className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text"
            placeholder="Search by customer name or transaction ID..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-transparent focus:bg-white focus:border-orange-500 rounded-xl text-sm transition-all outline-none"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <button className="px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-sm font-bold text-slate-600 transition-all flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          This Month
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-slate-500">
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest">Transaction ID</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest">Client / Details</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest">Items Manifest</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-right">Revenue</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((sale) => (
                <tr 
                  key={sale.id} 
                  className="hover:bg-slate-50/50 transition-colors group"
                >
                  <td onClick={() => setSelectedSale(sale)} className="px-6 py-6 align-top cursor-pointer">
                    <p className="font-mono text-[10px] text-slate-400 font-bold mb-1">#{sale.id.toUpperCase()}</p>
                    <p className="text-xs font-bold text-slate-900">{format(sale.timestamp, 'MMM dd, yyyy')}</p>
                    <p className="text-[10px] text-slate-400 font-bold tracking-tighter">{format(sale.timestamp, 'HH:mm')}</p>
                  </td>
                  <td onClick={() => setSelectedSale(sale)} className="px-6 py-6 align-top cursor-pointer">
                    <div className="flex items-center gap-3 mb-1">
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500">
                        {sale.customerName?.[0] || 'W'}
                      </div>
                      <p className="font-bold text-slate-900">{sale.customerName || 'Walk-in Customer'}</p>
                    </div>
                    <div className={cn(
                      "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest",
                      sale.paymentMethod === 'MPESA' ? "bg-emerald-50 text-emerald-600" : "bg-blue-50 text-blue-600"
                    )}>
                      <div className={cn("w-1 h-1 rounded-full", sale.paymentMethod === 'MPESA' ? "bg-emerald-500" : "bg-blue-500")} />
                      {sale.paymentMethod}
                    </div>
                  </td>
                  <td onClick={() => setSelectedSale(sale)} className="px-6 py-6 align-top cursor-pointer">
                    <div className="flex flex-wrap gap-2">
                       {sale.items.map((item, idx) => (
                        <div key={idx} className="bg-slate-50 border border-slate-100 px-2 py-1 rounded text-[10px] font-medium text-slate-600">
                          {item.name} <span className="text-slate-400 font-bold">x{item.quantity}</span>
                        </div>
                      ))}
                    </div>
                  </td>
                  <td onClick={() => setSelectedSale(sale)} className="px-6 py-6 text-right align-top cursor-pointer">
                    <p className="text-lg font-black text-slate-900">KES {sale.totalAmount.toLocaleString()}</p>
                    <div className="flex items-center justify-end gap-1 text-[9px] font-black text-emerald-500 uppercase tracking-widest">
                       CONFIRMED
                    </div>
                  </td>
                  <td className="px-6 py-6 text-center align-middle">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setConfirmVoid({ isOpen: true, id: sale.id });
                      }}
                      className="p-2.5 bg-rose-50 text-rose-500 hover:bg-rose-100 rounded-xl transition-all border border-rose-100 shadow-sm"
                      title="Void Transaction"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-20 text-center font-medium text-slate-400 italic">
                    No transaction history found in this period.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {selectedSale && (
          <ReceiptView 
            sale={selectedSale} 
            onClose={() => setSelectedSale(null)} 
            onVoid={(id) => deleteSale(id)}
          />
        )}
      </AnimatePresence>

      <ConfirmDialog 
        isOpen={confirmVoid.isOpen}
        onClose={() => setConfirmVoid({ isOpen: false, id: null })}
        onConfirm={() => confirmVoid.id && deleteSale(confirmVoid.id)}
        title="Strike this Transaction?"
        message="Executing this void will purge the sale from the ledger and recalculate stock levels. This action is recorded in the system audit logs. Proceed?"
        confirmText="Void Record"
        variant="warning"
      />
    </div>
  );
}
