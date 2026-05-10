import React from 'react';
import { 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  CreditCard, 
  Banknote, 
  User,
  Package,
  CheckCircle2,
  Receipt,
  Users,
  Phone,
  ChevronLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { localStore } from '../lib/localStore';
import { Product, SaleItem, Sale, Debtor } from '../types';
import { cn } from '../lib/utils';

import { ReceiptView } from '../components/Receipt';

export default function POS() {
  const [products, setProducts] = React.useState<Product[]>([]);
  const [cart, setCart] = React.useState<SaleItem[]>([]);
  const [search, setSearch] = React.useState('');
  const [customerName, setCustomerName] = React.useState('');
  const [customerPhone, setCustomerPhone] = React.useState('');
  const [paymentMethod, setPaymentMethod] = React.useState<'CASH' | 'MPESA' | 'DEBT'>('CASH');
  const [isSuccess, setIsSuccess] = React.useState(false);
  const [lastSale, setLastSale] = React.useState<Sale | null>(null);

  React.useEffect(() => {
    setProducts(localStore.getProducts());
  }, []);

  const addToCart = (product: Product) => {
    if (product.stock === 0) return;
    
    setCart(prev => {
      const existing = prev.find(item => item.productId === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) return prev;
        return prev.map(item => 
          item.productId === product.id 
            ? { ...item, quantity: item.quantity + 1 } 
            : item
        );
      }
      return [...prev, {
        productId: product.id,
        name: product.name,
        price: product.sellingPrice,
        quantity: 1
      }];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.productId === id) {
        const product = products.find(p => p.id === id);
        const newQty = item.quantity + delta;
        if (newQty < 1) return item;
        if (product && newQty > product.stock) return item;
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.productId !== id));
  };

  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleCheckout = () => {
    if (cart.length === 0) return;
    if (paymentMethod === 'DEBT' && (!customerName || !customerPhone)) {
      alert('Please provide customer name and phone for debt records.');
      return;
    }

    const sale: Sale = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
      items: cart,
      totalAmount: total,
      paymentMethod,
      customerName,
      customerPhone,
      processedBy: 'Manager',
    };

    // Update stock
    const updatedProducts = products.map(p => {
      const cartItem = cart.find(item => item.productId === p.id);
      if (cartItem) {
        return { ...p, stock: p.stock - cartItem.quantity };
      }
      return p;
    });

    localStore.saveSales([...localStore.getSales(), sale]);
    localStore.saveProducts(updatedProducts);
    setProducts(updatedProducts);
    setLastSale(sale);

    // Automatic low stock reminders
    const existingReminders = localStore.getReminders();
    const newReminders = [...existingReminders];
    let remindersAdded = false;

    updatedProducts.forEach(p => {
      if (p.stock <= p.minStock) {
        // Check if a reminder for this product already exists and is pending
        const exists = existingReminders.some(r => r.type === 'STOCK' && r.title.includes(p.name) && r.status === 'PENDING');
        if (!exists) {
          newReminders.push({
            id: Math.random().toString(36).substr(2, 9),
            title: `RESTOCK: ${p.name}`,
            description: `${p.name} (${p.brand}) is below minimum stock level (${p.stock} remaining).`,
            dueDate: Date.now() + 86400000,
            type: 'STOCK',
            status: 'PENDING',
            updatedAt: Date.now()
          });
          remindersAdded = true;
        }
      }
    });

    if (remindersAdded) {
      localStore.saveReminders(newReminders);
    }

    // If payment method is DEBT, create or update debtor
    if (paymentMethod === 'DEBT') {
      const existingDebtors = localStore.getDebtors();
      const debtorIndex = existingDebtors.findIndex(d => d.phone === customerPhone);
      
      if (debtorIndex >= 0) {
        const debtor = existingDebtors[debtorIndex];
        debtor.totalDebt += total;
        debtor.balance += total;
        debtor.sales.push(sale);
        debtor.status = 'PENDING';
        debtor.updatedAt = Date.now();
      } else {
        const debtorId = `DBT-${Math.floor(1000 + Math.random() * 9000)}`;
        const newDebtor: Debtor = {
          id: debtorId,
          name: customerName,
          phone: customerPhone,
          totalDebt: total,
          paidAmount: 0,
          balance: total,
          status: 'PENDING',
          sales: [sale],
          payments: [],
          createdAt: Date.now(),
          updatedAt: Date.now()
        };
        existingDebtors.push(newDebtor);
      }
      localStore.saveDebtors(existingDebtors);
    }
    
    setCart([]);
    setCustomerName('');
    setCustomerPhone('');
    setPaymentMethod('CASH');
    setIsSuccess(true);
    setTimeout(() => setIsSuccess(false), 3000);
  };

  const filtered = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.brand.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-8 h-[calc(100vh-140px)] pb-10">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => window.history.back()}
          className="p-3 bg-white border border-slate-200 hover:bg-slate-50 shadow-sm rounded-2xl text-slate-500 transition-all active:scale-95 group"
        >
          <ChevronLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
        </button>
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Terminal POS</h1>
          <p className="text-slate-500 text-sm font-medium">Process Armstrong Garage parts sales</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1 overflow-hidden">
      {/* Product Selection */}
      <div className="lg:col-span-7 flex flex-col gap-6 overflow-hidden">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
          <Search className="w-5 h-5 text-slate-400" />
          <input 
            type="text"
            placeholder="Search Armstrong inventory by name or brand..."
            className="flex-1 text-sm bg-transparent outline-none font-medium"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className="flex-1 overflow-y-auto pr-2 grid grid-cols-2 sm:grid-cols-3 gap-4 pb-4">
          {filtered.map((product) => (
            <button
              key={product.id}
              onClick={() => addToCart(product)}
              disabled={product.stock === 0}
              className={cn(
                "p-4 bg-white border border-slate-200 rounded-2xl text-left hover:shadow-md hover:border-orange-200 transition-all group relative",
                product.stock === 0 && "opacity-50 grayscale"
              )}
            >
              <div className="flex justify-between items-start mb-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{product.brand}</span>
                {product.stock <= 5 && product.stock > 0 && (
                  <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                )}
              </div>
              {product.imageUrl && (
                <div className="w-full h-20 mb-3 rounded-xl overflow-hidden border border-slate-50 bg-slate-50">
                  <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                </div>
              )}
              <p className="font-bold text-slate-900 line-clamp-2 mb-2 h-10 leading-tight group-hover:text-orange-600 truncate">{product.name}</p>
              <div className="flex items-center justify-between mt-auto pt-2 border-t border-slate-50">
                <p className="text-xs font-bold text-slate-900">KES {product.sellingPrice.toLocaleString()}</p>
                <div className={cn(
                  "px-2 py-0.5 rounded-md text-[10px] font-black tracking-tighter",
                  product.stock > 10 ? "bg-slate-100 text-slate-400" : "bg-orange-50 text-orange-600"
                )}>
                  {product.stock} IN STOCK
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Cart & Checkout */}
      <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col overflow-hidden relative">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-orange-500" />
            <h3 className="font-bold text-slate-900">Transaction Manifest</h3>
          </div>
          <span className="text-xs font-bold px-2 py-1 bg-slate-100 text-slate-500 rounded-lg">{cart.length} ITEMS</span>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {cart.map((item) => (
            <div key={item.productId} className="flex items-center gap-4 group">
              <div className="flex-1">
                <p className="text-sm font-bold text-slate-900 leading-tight">{item.name}</p>
                <p className="text-xs text-slate-400">KES {item.price.toLocaleString()} per unit</p>
              </div>
              <div className="flex items-center gap-3 bg-slate-50 p-1 rounded-xl">
                <button 
                  onClick={() => updateQuantity(item.productId, -1)}
                  className="p-1 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-slate-100 shadow-sm"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <span className="text-sm font-bold w-6 text-center">{item.quantity}</span>
                <button 
                  onClick={() => updateQuantity(item.productId, 1)}
                  className="p-1 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-slate-100 shadow-sm"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
              <button 
                onClick={() => removeFromCart(item.productId)}
                className="p-2 text-slate-300 hover:text-rose-500 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          {cart.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full py-12 text-slate-300">
              <Package className="w-12 h-12 mb-2 opacity-20" />
              <p className="text-sm font-medium">Draft is empty</p>
            </div>
          )}
        </div>

        <div className="p-6 bg-slate-50 space-y-6">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3 bg-white p-3 rounded-2xl border border-slate-200">
                <User className="w-4 h-4 text-slate-400" />
                <input 
                  placeholder="Customer Name"
                  className="flex-1 text-sm bg-transparent outline-none font-medium"
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-3 bg-white p-3 rounded-2xl border border-slate-200">
                <Phone className="w-4 h-4 text-slate-400" />
                <input 
                  placeholder="Phone Number"
                  className="flex-1 text-sm bg-transparent outline-none font-medium"
                  value={customerPhone}
                  onChange={e => setCustomerPhone(e.target.value)}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-3">
              <button 
                onClick={() => setPaymentMethod('CASH')}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 py-3 rounded-2xl font-bold text-[10px] transition-all border",
                  paymentMethod === 'CASH' ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                )}
              >
                <Banknote className="w-4 h-4" />
                CASH
              </button>
              <button 
                onClick={() => setPaymentMethod('MPESA')}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 py-3 rounded-2xl font-bold text-[10px] transition-all border",
                  paymentMethod === 'MPESA' ? "bg-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-100" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                )}
              >
                <CreditCard className="w-4 h-4" />
                M-PESA
              </button>
              <button 
                onClick={() => setPaymentMethod('DEBT')}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 py-3 rounded-2xl font-bold text-[10px] transition-all border",
                  paymentMethod === 'DEBT' ? "bg-rose-600 text-white border-rose-600 shadow-lg shadow-rose-100" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                )}
              >
                <Users className="w-4 h-4" />
                ISSUED DEBT
              </button>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-slate-200">
            <div className="flex justify-between items-center">
              <span className="text-sm font-bold text-slate-500">Total Payable</span>
              <span className="text-2xl font-black text-slate-900 tracking-tighter">KES {total.toLocaleString()}</span>
            </div>
            <button 
              onClick={handleCheckout}
              disabled={cart.length === 0}
              className="w-full bg-orange-500 text-white py-5 rounded-2xl font-extrabold text-sm tracking-widest uppercase shadow-xl shadow-orange-100 hover:bg-orange-600 hover:-translate-y-0.5 transition-all active:translate-y-0 disabled:grayscale disabled:opacity-50 disabled:translate-y-0"
            >
              Complete Sale Entry
            </button>
          </div>
        </div>

        <AnimatePresence>
          {isSuccess && (
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="absolute inset-0 bg-white/95 backdrop-blur-sm z-20 flex flex-col items-center justify-center p-8 text-center"
            >
              <div className="bg-emerald-100 p-4 rounded-full mb-4">
                <CheckCircle2 className="w-12 h-12 text-emerald-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Sale Recorded</h2>
              <p className="text-sm text-slate-500 mb-6">Inventory has been updated successfully.</p>
              <div className="flex flex-col gap-2 w-full max-w-xs">
                <button 
                  onClick={() => setIsSuccess(false)}
                  className="bg-orange-500 text-white px-8 py-4 rounded-2xl font-bold text-sm shadow-lg shadow-orange-100"
                >
                  View Receipt
                </button>
                <button 
                  onClick={() => {
                    setIsSuccess(false);
                    setLastSale(null);
                  }}
                  className="bg-slate-100 text-slate-600 px-8 py-4 rounded-2xl font-bold text-sm hover:bg-slate-200 transition-all"
                >
                  Skip to Next Ticket
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {lastSale && !isSuccess && (
            <ReceiptView 
              sale={lastSale} 
              onClose={() => setLastSale(null)} 
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  </div>
  );
}
