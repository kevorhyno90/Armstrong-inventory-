import React from 'react';
import { 
  Users, 
  Search, 
  Plus, 
  Phone, 
  CreditCard, 
  History, 
  X,
  CheckCircle2,
  DollarSign,
  ArrowUpRight,
  ChevronLeft,
  Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { localStore } from '../lib/localStore';
import { Debtor, Sale } from '../types';
import { format } from 'date-fns';
import { cn } from '../lib/utils';

import { ConfirmDialog } from '../components/ConfirmDialog';

export default function DebtManagement() {
  const [debtors, setDebtors] = React.useState<Debtor[]>([]);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const [selectedDebtor, setSelectedDebtor] = React.useState<Debtor | null>(null);
  const [viewingHistory, setViewingHistory] = React.useState<Debtor | null>(null);
  const [paymentAmount, setPaymentAmount] = React.useState<number>(0);
  const [paymentMethod, setPaymentMethod] = React.useState<'CASH' | 'MPESA'>('CASH');
  const [newDebtorData, setNewDebtorData] = React.useState({ name: '', phone: '', amount: 0 });

  // Delete confirmation state
  const [confirmDelete, setConfirmDelete] = React.useState<{ 
    isOpen: boolean; 
    type: 'DEBTOR' | 'PAYMENT'; 
    id: string | null;
    paymentId?: string;
  }>({
    isOpen: false,
    type: 'DEBTOR',
    id: null
  });

  React.useEffect(() => {
    setDebtors(localStore.getDebtors());
  }, []);

  const totalDebt = debtors.reduce((sum, d) => sum + d.balance, 0);

  const handleAddDebtor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDebtorData.name || !newDebtorData.phone || newDebtorData.amount <= 0) return;

    const debtorId = `DBT-${Math.floor(1000 + Math.random() * 9000)}`;
    const newDebtor: Debtor = {
      id: debtorId,
      name: newDebtorData.name,
      phone: newDebtorData.phone,
      totalDebt: newDebtorData.amount,
      paidAmount: 0,
      balance: newDebtorData.amount,
      status: 'PENDING',
      sales: [],
      payments: [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    const updated = [...debtors, newDebtor];
    setDebtors(updated);
    localStore.saveDebtors(updated);
    setIsModalOpen(false);
    setNewDebtorData({ name: '', phone: '', amount: 0 });
  };

  const handleRepayment = () => {
    if (!selectedDebtor || paymentAmount <= 0) return;

    const newPayment = {
      id: Math.random().toString(36).substr(2, 9),
      amount: paymentAmount,
      timestamp: Date.now(),
      method: paymentMethod
    };

    const updated = debtors.map(d => {
      if (d.id === selectedDebtor.id) {
        const newPaidAmount = d.paidAmount + paymentAmount;
        const newBalance = d.totalDebt - newPaidAmount;
        const newPayments = [...(d.payments || []), newPayment];
        return {
          ...d,
          paidAmount: newPaidAmount,
          balance: newBalance,
          payments: newPayments,
          status: newBalance <= 0 ? 'CLEARED' : 'PENDING',
          updatedAt: Date.now()
        };
      }
      return d;
    });

    setDebtors(updated as Debtor[]);
    localStore.saveDebtors(updated as Debtor[]);
    setSelectedDebtor(null);
    setPaymentAmount(0);
  };

  const deletePayment = (debtorId: string, paymentId: string) => {
    const updated = debtors.map(d => {
      if (d.id === debtorId) {
        const paymentToDelete = d.payments.find(p => p.id === paymentId);
        if (!paymentToDelete) return d;

        const newPayments = d.payments.filter(p => p.id !== paymentId);
        const newPaidAmount = d.paidAmount - paymentToDelete.amount;
        const newBalance = d.totalDebt - newPaidAmount;

        const updatedDebtor = {
          ...d,
          paidAmount: newPaidAmount,
          balance: newBalance,
          payments: newPayments,
          status: newBalance <= 0 ? 'CLEARED' : 'PENDING',
          updatedAt: Date.now()
        };
        
        if (viewingHistory?.id === debtorId) setViewingHistory(updatedDebtor);
        return updatedDebtor;
      }
      return d;
    });

    setDebtors(updated);
    localStore.saveDebtors(updated);
  };

  const handleDeleteDebtor = (id: string) => {
    const updated = debtors.filter(d => d.id !== id);
    setDebtors(updated);
    localStore.saveDebtors(updated);
  };

  const filtered = debtors.filter(d => 
    d.name.toLowerCase().includes(search.toLowerCase()) || 
    d.phone.includes(search)
  );

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
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Credit & Debtors</h1>
            <p className="text-slate-500 text-sm font-medium underline decoration-rose-200">Total Outstanding: KES {totalDebt.toLocaleString()}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-slate-900 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-xl shadow-slate-200 hover:bg-slate-800 transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add New Record
          </button>
          <div className="bg-white px-4 py-2 rounded-xl border border-slate-200 flex items-center gap-3">
            <Users className="w-5 h-5 text-slate-400" />
            <span className="text-sm font-bold text-slate-900">{debtors.length} ACTIVE DEBTORS</span>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
        <Search className="w-5 h-5 text-slate-400" />
        <input 
          type="text"
          placeholder="Search by debtor name or phone number..."
          className="flex-1 text-sm bg-transparent outline-none font-medium"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((debtor) => (
          <motion.div 
            layout
            key={debtor.id}
            className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all group"
          >
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center text-white font-bold text-lg">
                    {debtor.name[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 tracking-widest leading-none">{debtor.id}</p>
                    <p className="text-[10px] font-bold text-slate-300 uppercase tracking-tighter mt-1">Issued {format(debtor.createdAt, 'MMM dd, yyyy')}</p>
                  </div>
                </div>
                <span className={cn(
                  "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                  debtor.status === 'CLEARED' ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-600"
                )}>
                  {debtor.status}
                </span>
              </div>
              
              <div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">{debtor.name}</h3>
                <div className="flex items-center gap-2 text-slate-400 text-sm font-medium">
                  <Phone className="w-3 h-3" />
                  {debtor.phone}
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 py-4 border-y border-slate-50">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Issued</p>
                    <p className="font-bold text-slate-900">KES {debtor.totalDebt.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Balance Due</p>
                    <p className="font-black text-rose-600 text-right">KES {debtor.balance.toLocaleString()}</p>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest">
                    <span className="text-slate-400">Repayment Progress</span>
                    <span className="text-emerald-600">{Math.round((debtor.paidAmount / debtor.totalDebt) * 100)}%</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${(debtor.paidAmount / debtor.totalDebt) * 100}%` }}
                      className="h-full bg-emerald-500 rounded-full"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button 
                  onClick={() => setSelectedDebtor(debtor)}
                  disabled={debtor.status === 'CLEARED'}
                  className="flex-1 bg-slate-900 text-white py-3 rounded-2xl font-bold text-xs hover:bg-slate-800 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <DollarSign className="w-3.5 h-3.5" />
                  Repay
                </button>
                <button 
                  onClick={() => setViewingHistory(debtor)}
                  className="p-3 bg-slate-50 text-slate-400 hover:text-slate-900 rounded-2xl transition-all border border-slate-100 hover:border-slate-200"
                >
                  <History className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => setConfirmDelete({ isOpen: true, type: 'DEBTOR', id: debtor.id })}
                  className="p-3 bg-rose-50 text-rose-500 hover:bg-rose-100 rounded-2xl transition-all border border-rose-100"
                  title="Delete Record"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}

        {filtered.length === 0 && (
          <div className="col-span-full py-20 text-center text-slate-400 font-medium italic border-2 border-dashed border-slate-100 rounded-3xl">
            No debtor records found.
          </div>
        )}
      </div>

      {/* History Modal */}
      <AnimatePresence>
        {viewingHistory && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setViewingHistory(null)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: 100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 100, opacity: 0 }}
              className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
            >
              <div className="p-8 border-b border-slate-100 shrink-0">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">Payment Timeline</h3>
                    <p className="text-slate-500 text-sm font-medium">{viewingHistory.name} · {viewingHistory.id}</p>
                  </div>
                  <button onClick={() => setViewingHistory(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                    <X className="w-5 h-5 text-slate-400" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Cleared</p>
                    <p className="text-lg font-black text-emerald-600">KES {viewingHistory.paidAmount.toLocaleString()}</p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Remaining</p>
                    <p className="text-lg font-black text-rose-600">KES {viewingHistory.balance.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-6">
                <div>
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Installment History</h4>
                  <div className="space-y-4">
                    {viewingHistory.payments?.length > 0 ? (
                      viewingHistory.payments.slice().reverse().map((payment) => (
                        <div key={payment.id} className="flex items-center gap-4 group">
                          <div className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                            payment.method === 'MPESA' ? "bg-emerald-50 text-emerald-600" : "bg-slate-50 text-slate-600"
                          )}>
                            <DollarSign className="w-5 h-5" />
                          </div>
                          <div className="flex-1 border-b border-slate-50 pb-4 group-last:border-0 group-last:pb-0">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-bold text-slate-900">Installment via {payment.method}</p>
                                <p className="text-xs text-slate-400 font-medium">{format(payment.timestamp, 'MMM dd, yyyy · hh:mm a')}</p>
                              </div>
                              <div className="flex items-center gap-3">
                                <p className="font-black text-slate-900">KES {payment.amount.toLocaleString()}</p>
                                <button 
                                  onClick={() => setConfirmDelete({ 
                                    isOpen: true, 
                                    type: 'PAYMENT', 
                                    id: viewingHistory.id, 
                                    paymentId: payment.id 
                                  })}
                                  className="p-2 bg-rose-50 text-rose-500 hover:bg-rose-100 rounded-lg transition-all border border-rose-100"
                                  title="Delete Payment"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-10 text-center text-slate-400 font-medium italic bg-slate-50 rounded-2xl border-2 border-dashed border-slate-100">
                        No installments recorded yet.
                      </div>
                    )}
                  </div>
                </div>

                <div>
                   <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Linked Sales (Credit Issued)</h4>
                   <div className="space-y-3">
                     {viewingHistory.sales.slice().reverse().map((sale) => (
                       <div key={sale.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                         <div className="flex justify-between items-center mb-1">
                           <div className="flex items-center gap-3">
                              <CreditCard className="w-4 h-4 text-slate-400" />
                              <span className="text-xs font-bold text-slate-900">{sale.id}</span>
                           </div>
                           <span className="text-xs font-black text-slate-900">KES {sale.totalAmount.toLocaleString()}</span>
                         </div>
                         <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                           {format(sale.timestamp, 'MMM dd, yyyy · HH:mm')}
                         </p>
                       </div>
                     ))}
                   </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Repayment Modal */}
      <AnimatePresence>
        {selectedDebtor && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedDebtor(null)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-8"
            >
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <DollarSign className="w-8 h-8 text-emerald-600" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">Record Repayment</h3>
                <p className="text-slate-500 text-sm">Customer: {selectedDebtor.name}</p>
              </div>

              <div className="space-y-6">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex justify-between">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Outstanding</span>
                  <span className="text-sm font-black text-rose-600">KES {selectedDebtor.balance.toLocaleString()}</span>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Payment Method</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      onClick={() => setPaymentMethod('CASH')}
                      className={cn(
                        "py-3 rounded-xl font-bold text-xs border transition-all",
                        paymentMethod === 'CASH' ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                      )}
                    >
                      CASH
                    </button>
                    <button 
                      onClick={() => setPaymentMethod('MPESA')}
                      className={cn(
                        "py-3 rounded-xl font-bold text-xs border transition-all",
                        paymentMethod === 'MPESA' ? "bg-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-100" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                      )}
                    >
                      M-PESA
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Amount Paid (KES)</label>
                  <input 
                    type="number"
                    autoFocus
                    className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent focus:border-emerald-500 focus:bg-white rounded-2xl outline-none text-2xl font-black text-slate-900 transition-all"
                    value={paymentAmount || ''}
                    onChange={e => setPaymentAmount(Number(e.target.value))}
                  />
                </div>

                <div className="pt-4 flex gap-4">
                  <button 
                    onClick={() => setSelectedDebtor(null)}
                    className="flex-1 py-4 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleRepayment}
                    className="flex-2 py-4 bg-emerald-600 text-white font-bold rounded-2xl hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-100"
                  >
                    Confirm Payment
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Debtor Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-8"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">New Credit Record</h3>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              <form onSubmit={handleAddDebtor} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest pl-1">Customer Name</label>
                  <input 
                    required
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 focus:bg-white focus:border-slate-900 rounded-xl outline-none transition-all font-bold"
                    value={newDebtorData.name}
                    onChange={e => setNewDebtorData({...newDebtorData, name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest pl-1">Phone Number</label>
                  <input 
                    required
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 focus:bg-white focus:border-slate-900 rounded-xl outline-none transition-all font-bold"
                    value={newDebtorData.phone}
                    onChange={e => setNewDebtorData({...newDebtorData, phone: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest pl-1">Initial Debt Amount (KES)</label>
                  <input 
                    required
                    type="number"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 focus:bg-white focus:border-slate-900 rounded-xl outline-none transition-all font-bold"
                    value={newDebtorData.amount || ''}
                    onChange={e => setNewDebtorData({...newDebtorData, amount: Number(e.target.value)})}
                  />
                </div>
                <button 
                  type="submit"
                  className="w-full py-4 mt-4 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-all shadow-xl shadow-slate-200"
                >
                  Create Credit Record
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmDialog 
        isOpen={confirmDelete.isOpen}
        onClose={() => setConfirmDelete({ ...confirmDelete, isOpen: false })}
        onConfirm={() => {
          if (confirmDelete.type === 'DEBTOR' && confirmDelete.id) {
            handleDeleteDebtor(confirmDelete.id);
          } else if (confirmDelete.type === 'PAYMENT' && confirmDelete.id && confirmDelete.paymentId) {
            deletePayment(confirmDelete.id, confirmDelete.paymentId);
          }
        }}
        title={confirmDelete.type === 'DEBTOR' ? "Purge Debtor Portfolio?" : "Void Payment Installment?"}
        message={confirmDelete.type === 'DEBTOR' 
          ? "This will permanently erase this customer's credit record and all linked payment history. This action is irreversible."
          : "Strike this payment from the record? This will inversely adjust the customer's outstanding balance."
        }
        confirmText={confirmDelete.type === 'DEBTOR' ? "Confirm Purge" : "Void Payment"}
      />
    </div>
  );
}
