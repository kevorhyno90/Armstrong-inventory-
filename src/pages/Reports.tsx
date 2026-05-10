import React from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Package, 
  Wallet, 
  ArrowUpRight, 
  ArrowDownRight,
  TrendingDown,
  Calendar,
  Filter,
  Download,
  FileText,
  ChevronLeft
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { localStore } from '../lib/localStore';
import { format, startOfDay, subDays, isSameDay, eachDayOfInterval } from 'date-fns';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const COLORS = ['#f97316', '#64748b', '#94a3b8', '#cbd5e1'];

export default function Reports() {
  const sales = localStore.getSales();
  const products = localStore.getProducts();
  const debtors = localStore.getDebtors();

  // Metrics
  const totalRevenue = sales.reduce((sum, s) => sum + s.totalAmount, 0);
  const totalCosts = sales.reduce((sum, s) => {
    return sum + s.items.reduce((itemSum, item) => {
      const p = products.find(prod => prod.id === item.productId);
      return itemSum + (p ? p.purchasePrice * item.quantity : 0);
    }, 0);
  }, 0);
  const totalProfit = totalRevenue - totalCosts;

  const inventoryCostValue = products.reduce((sum, p) => sum + (p.purchasePrice * p.stock), 0);
  const inventoryRetailValue = products.reduce((sum, p) => sum + (p.sellingPrice * p.stock), 0);
  const potentialProfit = inventoryRetailValue - inventoryCostValue;

  const totalOutstandingDebt = debtors.reduce((sum, d) => sum + d.balance, 0);

  // Sales trend (last 7 days)
  const last7Days = eachDayOfInterval({
    start: subDays(new Date(), 6),
    end: new Date()
  }).map(date => {
    const daySales = sales.filter(s => isSameDay(s.timestamp, date));
    return {
      date: format(date, 'MMM dd'),
      revenue: daySales.reduce((sum, s) => sum + s.totalAmount, 0),
      profit: daySales.reduce((sum, s) => {
        const rev = s.totalAmount;
        const cost = s.items.reduce((itemSum, item) => {
          const p = products.find(prod => prod.id === item.productId);
          return itemSum + (p ? p.purchasePrice * item.quantity : 0);
        }, 0);
        return sum + (rev - cost);
      }, 0)
    };
  });

  // Category distribution
  const categories = Array.from(new Set(products.map(p => p.category)));
  const categoryData = categories.map(cat => ({
    name: cat,
    value: products.filter(p => p.category === cat).reduce((sum, p) => sum + (p.stock * p.sellingPrice), 0)
  })).sort((a, b) => b.value - a.value).slice(0, 4);

  const handleDownloadFullReport = () => {
    try {
      const doc = new jsPDF();
      
      doc.setFontSize(22);
      doc.text('ARMSTRONG GARAGE - FULL SYSTEM AUDIT', 105, 20, { align: 'center' });
      
      doc.setFontSize(12);
      doc.text(`Generated on: ${format(new Date(), 'PPpp')}`, 105, 30, { align: 'center' });

      autoTable(doc, {
        head: [['Metric', 'Value']],
        body: [
          ['Total Gross Revenue', `KES ${totalRevenue.toLocaleString()}`],
          ['Total Estimated Profit', `KES ${totalProfit.toLocaleString()}`],
          ['Current Inventory Cost', `KES ${inventoryCostValue.toLocaleString()}`],
          ['Current Potential Revenue', `KES ${inventoryRetailValue.toLocaleString()}`],
          ['Total Outstanding Debt', `KES ${totalOutstandingDebt.toLocaleString()}`],
        ],
        startY: 40,
      });

      // Top Products
      const topProducts = products
        .map(p => {
          const sold = sales.reduce((sum, s) => {
            return sum + s.items.filter(i => i.productId === p.id).reduce((is, i) => is + i.quantity, 0);
          }, 0);
          return { ...p, sold };
        })
        .sort((a, b) => b.sold - a.sold)
        .slice(0, 5);

      const finalY1 = (doc as any).lastAutoTable?.finalY || 100;

      doc.text('TOP PERFORMING PRODUCTS', 14, finalY1 + 15);
      autoTable(doc, {
        head: [['Product', 'Brand', 'Units Sold', 'Total Revenue']],
        body: topProducts.map(p => [
          p.name, 
          p.brand, 
          p.sold.toString(), 
          `KES ${(p.sold * p.sellingPrice).toLocaleString()}`
        ]),
        startY: finalY1 + 20,
      });

      doc.save('ARMSTRONG_FULL_REPORT.pdf');
    } catch (err) {
      console.error('Audit PDF Error:', err);
      alert('Failed to generate audit report.');
    }
  };

  return (
    <div className="space-y-10 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => window.history.back()}
            className="p-3 bg-white border border-slate-200 hover:bg-slate-50 shadow-sm rounded-2xl text-slate-500 transition-all active:scale-95 group"
          >
            <ChevronLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
          </button>
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Business Intelligence</h1>
            <p className="text-slate-500 font-medium mt-1">Holistic performance overview for Armstrong Garage</p>
          </div>
        </div>
        <div className="flex gap-3">
           <button 
             onClick={handleDownloadFullReport}
             className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-200"
           >
             <Download className="w-4 h-4" />
             Download Audit
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-orange-50 -mr-8 -mt-8 rounded-full transition-transform group-hover:scale-110" />
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Total Revenue</p>
          <div className="flex items-end justify-between relative z-10">
            <div>
              <h3 className="text-3xl font-black text-slate-900 tracking-tighter">KES {totalRevenue.toLocaleString()}</h3>
              <div className="flex items-center gap-1 text-emerald-600 mt-1">
                <ArrowUpRight className="w-3 h-3" />
                <span className="text-[10px] font-bold">+12.5% this month</span>
              </div>
            </div>
            <div className="p-3 bg-orange-100 rounded-2xl">
              <TrendingUp className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 -mr-8 -mt-8 rounded-full transition-transform group-hover:scale-110" />
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Est. Net Profit</p>
          <div className="flex items-end justify-between relative z-10">
            <div>
              <h3 className="text-3xl font-black text-slate-900 tracking-tighter">KES {totalProfit.toLocaleString()}</h3>
              <p className="text-[10px] font-medium text-slate-400 mt-1 italic">Based on cost mapping</p>
            </div>
            <div className="p-3 bg-emerald-100 rounded-2xl">
              <ArrowUpRight className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-slate-50 -mr-8 -mt-8 rounded-full transition-transform group-hover:scale-110" />
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Inventory Assets</p>
          <div className="flex items-end justify-between relative z-10">
            <div>
              <h3 className="text-3xl font-black text-slate-900 tracking-tighter">KES {inventoryCostValue.toLocaleString()}</h3>
              <p className="text-[10px] font-bold text-slate-400 mt-1">EST. YIELD: KES {potentialProfit.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-slate-100 rounded-2xl">
              <Package className="w-6 h-6 text-slate-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-50 -mr-8 -mt-8 rounded-full transition-transform group-hover:scale-110" />
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Capital Out</p>
          <div className="flex items-end justify-between relative z-10">
            <div>
              <h3 className="text-3xl font-black text-slate-900 tracking-tighter">KES {totalOutstandingDebt.toLocaleString()}</h3>
              <div className="flex items-center gap-1 text-rose-600 mt-1">
                <TrendingDown className="w-3 h-3" />
                <span className="text-[10px] font-bold">In uncollected debts</span>
              </div>
            </div>
            <div className="p-3 bg-rose-100 rounded-2xl">
              <Wallet className="w-6 h-6 text-rose-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">Growth Trajectory</h3>
              <p className="text-xs font-medium text-slate-400">Revenue & Profit trend (Last 7 days)</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-orange-500" />
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Revenue</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-slate-900" />
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Profit</span>
              </div>
            </div>
          </div>
          
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={last7Days}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                  tickFormatter={value => `KES ${value / 1000}k`}
                />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '20px', 
                    border: 'none', 
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                    padding: '12px 16px'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#f97316" 
                  strokeWidth={4}
                  fillOpacity={1} 
                  fill="url(#colorRev)" 
                />
                <Area 
                  type="monotone" 
                  dataKey="profit" 
                  stroke="#0f172a" 
                  strokeWidth={4}
                  fillOpacity={0}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-slate-900 p-8 rounded-[3rem] text-white flex flex-col">
          <h3 className="text-xl font-black tracking-tight mb-2">Alpha Categories</h3>
          <p className="text-xs text-slate-400 mb-8 font-medium italic">Highest stock value distribution</p>
          
          <div className="flex-1 min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', fontSize: '12px' }}
                  itemStyle={{ color: '#fff' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-3 mt-4">
            {categoryData.map((cat, idx) => (
              <div key={cat.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx] }} />
                  <span className="text-xs font-bold text-slate-300">{cat.name}</span>
                </div>
                <span className="text-[10px] font-black">KES {cat.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
