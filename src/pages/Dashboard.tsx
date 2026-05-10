import React from 'react';
import { 
  TrendingUp, 
  Package, 
  AlertTriangle, 
  ChevronRight, 
  ArrowUpRight, 
  ArrowDownRight, 
  Plus, 
  Clock,
  Users,
  CreditCard,
  Target,
  BarChart3,
  Trash2
} from 'lucide-react';
import { motion } from 'motion/react';
import { localStore } from '../lib/localStore';
import { Product, Sale, Reminder } from '../types';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { format, subDays, isSameDay } from 'date-fns';

function StatCard({ title, value, icon: Icon, trend, trendValue, color }: any) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("p-8 rounded-[2.5rem] shadow-sm relative overflow-hidden", color)}
    >
      <div className="relative z-10 flex flex-col h-full justify-between">
        <div className="flex justify-between items-start mb-6">
          <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md border border-white/10">
            <Icon className="w-6 h-6" />
          </div>
          {trend && (
            <div className={cn(
              "flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black tracking-widest backdrop-blur-md",
              trend === 'up' ? "bg-emerald-400 text-emerald-950" : "bg-rose-400 text-rose-950"
            )}>
              {trend === 'up' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
              {trendValue}%
            </div>
          )}
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-80 mb-1">{title}</p>
          <p className="text-2xl font-black tracking-tight leading-none">{value}</p>
        </div>
      </div>
      <Icon className="absolute bottom-[-20px] right-[-20px] w-32 h-32 opacity-5 pointer-events-none rotate-12" />
    </motion.div>
  );
}

export default function Dashboard() {
  const [products, setProducts] = React.useState<Product[]>([]);
  const [sales, setSales] = React.useState<Sale[]>([]);
  const [reminders, setReminders] = React.useState<Reminder[]>([]);
  const [debtors, setDebtors] = React.useState<any[]>([]);

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
    const currentProducts = localStore.getProducts();
    const updatedProducts = currentProducts.map(p => {
      const soldItem = saleToDelete.items.find(item => item.productId === p.id);
      if (soldItem) {
        return { ...p, stock: p.stock + soldItem.quantity };
      }
      return p;
    });
    setProducts(updatedProducts);
    localStore.saveProducts(updatedProducts);

    // If it was a DEBT sale, update the debtor
    if (saleToDelete.paymentMethod === 'DEBT') {
      const currentDebtors = localStore.getDebtors();
      const updatedDebtors = currentDebtors.map(d => {
        const hasSale = d.sales.some(s => s.id === id);
        if (hasSale) {
          const newSales = d.sales.filter(s => s.id !== id);
          const newTotalDebt = d.totalDebt - saleToDelete.totalAmount;
          const newBalance = newTotalDebt - d.paidAmount;
          return {
            ...d,
            sales: newSales,
            totalDebt: newTotalDebt,
            balance: newBalance,
            status: (newBalance <= 0 && d.paidAmount > 0 ? 'CLEARED' : (newBalance <= 0 ? 'CLEARED' : 'PENDING')) as any,
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
    setProducts(localStore.getProducts());
    setSales(localStore.getSales());
    setReminders(localStore.getReminders());
    setDebtors(localStore.getDebtors());
  }, []);

  const totalRevenue = sales.reduce((sum, s) => sum + s.totalAmount, 0);
  const totalStockValue = products.reduce((sum, p) => sum + (p.purchasePrice * p.stock), 0);
  const totalOutstanding = debtors.reduce((sum, d) => sum + d.balance, 0);
  
  const lowStockCount = products.filter(p => p.stock <= p.minStock).length;
  const pendingReminders = reminders.filter(r => r.status === 'PENDING').length;

  // Prepare chart data for last 7 days
  const chartData = Array.from({ length: 7 }).map((_, i) => {
    const date = subDays(new Date(), 6 - i);
    const daySales = sales.filter(s => isSameDay(new Date(s.timestamp), date));
    return {
      name: format(date, 'EEE'),
      revenue: daySales.reduce((sum, s) => sum + s.totalAmount, 0),
    };
  });

  return (
    <div className="space-y-10 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">System Intel</h1>
          <p className="text-slate-500 font-medium mt-1 uppercase text-[10px] tracking-[0.2em]">Operational Overview · {format(new Date(), 'MMMM dd, yyyy')}</p>
        </div>
        <div className="flex gap-3">
          <Link 
            to="/reports"
            className="bg-white text-slate-900 border border-slate-200 px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center gap-2 shadow-xl shadow-slate-100"
          >
            <BarChart3 className="w-4 h-4 text-orange-500" />
            Insights
          </Link>
          <Link 
            to="/pos"
            className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-bold text-sm shadow-2xl shadow-slate-200 hover:bg-slate-800 transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Launch Terminal
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Gross Revenue" 
          value={`KES ${totalRevenue.toLocaleString()}`}
          icon={TrendingUp}
          trend="up"
          trendValue="12.5"
          color="bg-orange-500 text-white"
        />
        <StatCard 
          title="Inventory Assets" 
          value={`KES ${totalStockValue.toLocaleString()}`}
          icon={Package}
          color="bg-white border border-slate-100 text-slate-900"
        />
        <Link to="/debt" className="block transition-transform hover:scale-[1.02]">
          <StatCard 
            title="Active Credit" 
            value={`KES ${totalOutstanding.toLocaleString()}`}
            icon={Users}
            color="bg-rose-600 text-white"
          />
        </Link>
        <StatCard 
          title="Critical Alerts" 
          value={pendingReminders}
          icon={AlertTriangle}
          color="bg-orange-100 text-orange-600 border border-orange-200"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm transition-all hover:shadow-xl hover:border-slate-200">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Revenue Trajectory</h2>
              <p className="text-slate-400 text-xs font-medium uppercase tracking-widest mt-1">Last 7 Sessions</p>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-xl border border-slate-100 font-bold text-xs text-slate-600">
              <Target className="w-3 h-3 text-orange-500" />
              STATUS: OPTIMAL
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                  tickFormatter={(value) => `K${value / 1000}k`}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 800 }}
                  cursor={{ stroke: '#f97316', strokeWidth: 2, strokeDasharray: '4 4' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#f97316" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorRev)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white overflow-hidden relative group">
            <div className="relative z-10">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Stock Health</p>
              <h3 className="text-3xl font-black mb-6 leading-tight">{lowStockCount} Items require <span className="text-orange-500">immediate</span> attention</h3>
              <Link 
                to="/inventory" 
                className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 px-6 py-3 rounded-2xl font-bold text-xs transition-all backdrop-blur-md border border-white/10"
              >
                Audit Inventory <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-125 transition-transform duration-700">
               <AlertTriangle className="w-32 h-32" />
            </div>
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
             <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-black text-slate-900 tracking-tight">Recent Sales</h3>
                <Link to="/history" className="text-[10px] font-black text-slate-400 hover:text-slate-900 uppercase tracking-widest transition-colors">View All</Link>
             </div>
             <div className="space-y-4">
                {sales.slice(-4).reverse().map(sale => (
                  <div key={sale.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100/50">
                    <div className="flex items-center gap-3">
                       <div className="p-2 bg-white rounded-xl text-slate-400 shadow-sm">
                          <CreditCard className="w-4 h-4" />
                       </div>
                       <div>
                          <p className="text-xs font-bold text-slate-900">Sale #{sale.id.slice(-4)}</p>
                          <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">{format(sale.timestamp, 'hh:mm a')}</p>
                       </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <p className="font-black text-slate-900 text-sm italic mr-2">KES {sale.totalAmount.toLocaleString()}</p>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setConfirmVoid({ isOpen: true, id: sale.id });
                        }}
                        className="p-2 bg-rose-50 text-rose-500 hover:bg-rose-100 rounded-xl transition-all border border-rose-100 shadow-sm"
                        title="Void"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
             </div>
          </div>
        </div>
      </div>

      <ConfirmDialog 
        isOpen={confirmVoid.isOpen}
        onClose={() => setConfirmVoid({ isOpen: false, id: null })}
        onConfirm={() => confirmVoid.id && deleteSale(confirmVoid.id)}
        title="Void Transaction?"
        message="This will strike this transaction from the records and return all associated items to the inventory manifest. Are you authorized to proceed?"
        confirmText="Void & Restock"
        variant="warning"
      />
    </div>
  );
}
