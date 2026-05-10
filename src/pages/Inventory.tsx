import React from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit2, 
  Trash2, 
  AlertTriangle,
  Download,
  Upload,
  Database,
  Calculator,
  TrendingUp,
  FileSpreadsheet,
  Image as ImageIcon,
  ChevronLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { localStore } from '../lib/localStore';
import { Product } from '../types';
import { cn } from '../lib/utils';
import { format } from 'date-fns';

import { ConfirmDialog } from '../components/ConfirmDialog';

export default function Inventory() {
  const [products, setProducts] = React.useState<Product[]>([]);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingProduct, setEditingProduct] = React.useState<Product | null>(null);
  const [search, setSearch] = React.useState('');
  const [filterBrand, setFilterBrand] = React.useState('ALL');
  
  // Delete confirmation state
  const [confirmDelete, setConfirmDelete] = React.useState<{ isOpen: boolean; id: string | null }>({
    isOpen: false,
    id: null
  });
  
  // Pricing states
  const [purchasePrice, setPurchasePrice] = React.useState<number>(0);
  const [sellingPrice, setSellingPrice] = React.useState<number>(0);
  const [markup, setMarkup] = React.useState<number>(25); // Default 25% markup
  const [imageUrl, setImageUrl] = React.useState('');

  React.useEffect(() => {
    setProducts(localStore.getProducts());
  }, []);

  const brands = ['ALL', ...new Set(products.map(p => p.brand))];

  const handlePriceChange = (val: number, type: 'PURCHASE' | 'SELLING' | 'MARKUP') => {
    if (type === 'PURCHASE') {
      setPurchasePrice(val);
      setSellingPrice(Math.round(val * (1 + markup / 100)));
    } else if (type === 'SELLING') {
      setSellingPrice(val);
      if (purchasePrice > 0) {
        setMarkup(Math.round(((val - purchasePrice) / purchasePrice) * 100));
      }
    } else if (type === 'MARKUP') {
      setMarkup(val);
      setSellingPrice(Math.round(purchasePrice * (1 + val / 100)));
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const data = {
      name: formData.get('name') as string,
      brand: formData.get('brand') as string,
      purchasePrice: Number(formData.get('purchasePrice')),
      sellingPrice: Number(formData.get('sellingPrice')),
      stock: Number(formData.get('stock')),
      minStock: Number(formData.get('minStock')),
      category: formData.get('category') as string,
      imageUrl: formData.get('imageUrl') as string,
      updatedAt: Date.now(),
    };

    let updated;
    if (editingProduct) {
      updated = products.map(p => p.id === editingProduct.id ? { ...p, ...data } : p);
    } else {
      updated = [...products, { ...data, id: Math.random().toString(36).substr(2, 9), createdAt: Date.now() }];
    }

    setProducts(updated);
    localStore.saveProducts(updated);
    setIsModalOpen(false);
    setEditingProduct(null);
  };

  const deleteProduct = (id: string) => {
    const updated = products.filter(p => p.id !== id);
    setProducts(updated);
    localStore.saveProducts(updated);
  };

  const handleExport = () => {
    const data = localStore.exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ARMSTRONG_BACKUP_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (localStore.importData(content)) {
        setProducts(localStore.getProducts());
        alert('Data restored successfully!');
      } else {
        alert('Failed to restore data. Invalid file format.');
      }
    };
    reader.readAsText(file);
  };

  const filtered = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || 
                          p.brand.toLowerCase().includes(search.toLowerCase());
    const matchesBrand = filterBrand === 'ALL' || p.brand === filterBrand;
    return matchesSearch && matchesBrand;
  });

  const totalStockValue = products.reduce((sum, p) => sum + (p.purchasePrice * p.stock), 0);
  const potentialRevenue = products.reduce((sum, p) => sum + (p.sellingPrice * p.stock), 0);
  const totalPotentialProfit = potentialRevenue - totalStockValue;
  const outOfStockCount = products.filter(p => p.stock === 0).length;
  const lowStockCountTotal = products.filter(p => p.stock > 0 && p.stock <= p.minStock).length;

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
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Stock Manifest</h1>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
              <p className="text-slate-500 text-xs font-medium">Assets: <span className="font-bold text-slate-900">KES {totalStockValue.toLocaleString()}</span></p>
              <p className="text-slate-500 text-xs font-medium">Potential Profit: <span className="font-bold text-emerald-600">KES {totalPotentialProfit.toLocaleString()}</span></p>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                <p className="text-rose-600 text-xs font-bold uppercase tracking-tighter">{outOfStockCount} DEPLETED</p>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                <p className="text-orange-600 text-xs font-bold uppercase tracking-tighter">{lowStockCountTotal} CRITICAL</p>
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <label className="bg-white border border-slate-200 text-slate-600 px-4 py-2.5 rounded-xl font-bold text-sm hover:bg-slate-50 transition-all flex items-center gap-2 cursor-pointer shadow-sm">
            <Upload className="w-4 h-4" />
            Restore Data
            <input type="file" className="hidden" accept=".json" onChange={handleImport} />
          </label>
          <button 
            onClick={handleExport}
            className="bg-white border border-slate-200 text-slate-600 px-4 py-2.5 rounded-xl font-bold text-sm hover:bg-slate-50 transition-all flex items-center gap-2 shadow-sm"
          >
            <Database className="w-4 h-4" />
            Full Backup
          </button>
          <button 
            onClick={() => {
              setEditingProduct(null);
              setPurchasePrice(0);
              setSellingPrice(0);
              setMarkup(25);
              setImageUrl('');
              setIsModalOpen(true);
            }}
            className="bg-slate-900 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-xl shadow-slate-200 hover:bg-slate-800 transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add New Part
          </button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text"
            placeholder="Search by name, brand or category..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-transparent focus:bg-white focus:border-orange-500 rounded-xl text-sm transition-all outline-none"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-4">
          <select 
            className="px-4 py-2.5 bg-slate-50 border border-transparent focus:bg-white focus:border-orange-500 rounded-xl text-sm transition-all outline-none min-w-[140px] font-bold"
            value={filterBrand}
            onChange={e => setFilterBrand(e.target.value)}
          >
            {brands.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-slate-500">
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest leading-none">Part Display</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest leading-none">Designation & Brand</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest leading-none">Category</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-right leading-none">Stock</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-right leading-none">Retail</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-right leading-none">Yield (Profit)</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-center leading-none">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((product) => {
                const isLow = product.stock <= product.minStock;
                
                return (
                  <tr key={product.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      {product.imageUrl ? (
                        <div className="w-12 h-12 rounded-xl overflow-hidden border border-slate-100 shadow-sm">
                          <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100 shadow-sm text-slate-300">
                           <ImageIcon className="w-5 h-5" />
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-bold text-slate-900 leading-tight">{product.name}</p>
                        <div className="flex items-center gap-2">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{product.brand}</p>
                          <span className="text-[10px] text-slate-300">·</span>
                          <p className="text-[10px] font-medium text-slate-400 italic">Added {format(product.createdAt || Date.now(), 'MMM dd, yyyy')}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-600 text-[10px] font-bold uppercase tracking-widest leading-none border border-indigo-100">
                        {product.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <span className={cn("text-sm font-black", isLow ? "text-rose-600" : "text-slate-900")}>
                          {product.stock}
                        </span>
                        {isLow && <AlertTriangle className="w-3 h-3 text-rose-500 animate-bounce" />}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <p className="font-black text-slate-900">KES {product.sellingPrice.toLocaleString()}</p>
                      <p className="text-[10px] font-bold text-slate-400">COST: {product.purchasePrice.toLocaleString()}</p>
                      <p className="text-[9px] font-medium text-slate-300 mt-1 uppercase tracking-tighter">Updated {format(product.updatedAt, 'MMM dd')}</p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <p className="font-bold text-emerald-600">+{Math.round(((product.sellingPrice - product.purchasePrice) / product.purchasePrice) * 100)}%</p>
                      <p className="text-[10px] font-medium text-slate-400 italic">KES {(product.sellingPrice - product.purchasePrice).toLocaleString()} ea</p>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button 
                          onClick={() => { 
                            setEditingProduct(product); 
                            setPurchasePrice(product.purchasePrice);
                            setSellingPrice(product.sellingPrice);
                            setImageUrl(product.imageUrl || '');
                            setIsModalOpen(true); 
                          }}
                          className="p-2 hover:bg-white hover:shadow-sm rounded-lg text-slate-400 hover:text-orange-500 transition-all border border-transparent hover:border-slate-100"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => setConfirmDelete({ isOpen: true, id: product.id })}
                          className="p-2 bg-rose-50 text-rose-500 hover:bg-rose-100 rounded-lg transition-all border border-rose-100"
                          title="Delete Product"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { setIsModalOpen(false); setEditingProduct(null); }}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl p-8 max-h-[90vh] overflow-y-auto"
            >
              <h2 className="text-2xl font-extrabold text-slate-900 mb-6 flex items-center gap-3">
                <Calculator className="w-6 h-6 text-orange-500" />
                {editingProduct ? 'Edit Portfolio Entry' : 'New Part Registration'}
              </h2>
              <form onSubmit={handleSave} className="space-y-6">
                <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                  <div className="col-span-2 space-y-2">
                    <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest pl-1">Part Designation</label>
                    <input 
                      required
                      name="name"
                      defaultValue={editingProduct?.name}
                      placeholder="e.g. Brake Pads Rear"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 focus:bg-white focus:border-orange-500 rounded-xl outline-none transition-all font-bold"
                    />
                  </div>

                  <div className="col-span-2 space-y-2">
                    <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest pl-1">Image URL</label>
                    <input 
                      name="imageUrl"
                      value={imageUrl}
                      onChange={e => setImageUrl(e.target.value)}
                      placeholder="https://images.unsplash.com/..."
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 focus:bg-white focus:border-orange-500 rounded-xl outline-none transition-all font-bold"
                    />
                    {imageUrl && (
                      <div className="mt-2 w-20 h-20 rounded-xl overflow-hidden border border-slate-100 shadow-sm mx-auto">
                        <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest pl-1">Manufacturer</label>
                    <input 
                      required
                      name="brand"
                      defaultValue={editingProduct?.brand}
                      placeholder="e.g. TVS / Bajaj"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 focus:bg-white focus:border-orange-500 rounded-xl outline-none transition-all font-bold"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest pl-1">Assembly Category</label>
                    <input 
                      required
                      name="category"
                      defaultValue={editingProduct?.category}
                      placeholder="e.g. Engine / Brakes"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 focus:bg-white focus:border-orange-500 rounded-xl outline-none transition-all font-bold"
                    />
                  </div>

                  <div className="p-5 bg-slate-50 rounded-2xl col-span-2 space-y-6 border border-slate-200">
                    <div className="flex items-center justify-between">
                      <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Financial Logic</h4>
                      <div className="flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-200 rounded-full text-[10px] font-black text-orange-600">
                        <TrendingUp className="w-3 h-3" />
                        {markup}% MARKUP
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[9px] font-black uppercase text-slate-400 tracking-tighter">Purchase Cost</label>
                        <input 
                          required
                          type="number"
                          name="purchasePrice"
                          value={purchasePrice}
                          onChange={e => handlePriceChange(Number(e.target.value), 'PURCHASE')}
                          className="w-full px-4 py-3 bg-white border border-slate-200 focus:border-orange-500 rounded-xl outline-none transition-all font-black text-slate-900"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[9px] font-black uppercase text-slate-400 tracking-tighter">Target Selling Price</label>
                        <input 
                          required
                          type="number"
                          name="sellingPrice"
                          value={sellingPrice}
                          onChange={e => handlePriceChange(Number(e.target.value), 'SELLING')}
                          className="w-full px-4 py-3 bg-white border border-slate-200 focus:border-orange-500 rounded-xl outline-none transition-all font-black text-orange-600"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <label className="text-[9px] font-black uppercase text-slate-400 tracking-tighter">Adjust Margin</label>
                        <span className="text-[9px] font-black text-slate-900">PROFIT: KES {(sellingPrice - purchasePrice).toLocaleString()}</span>
                      </div>
                      <input 
                        type="range"
                        min="0"
                        max="100"
                        value={markup}
                        onChange={e => handlePriceChange(Number(e.target.value), 'MARKUP')}
                        className="w-full accent-orange-500 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest pl-1">Starting Stock</label>
                    <input 
                      required
                      type="number"
                      name="stock"
                      defaultValue={editingProduct?.stock}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 focus:bg-white focus:border-orange-500 rounded-xl outline-none transition-all font-bold"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest pl-1">Alert Threshold</label>
                    <input 
                      required
                      type="number"
                      name="minStock"
                      defaultValue={editingProduct?.minStock || 5}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 focus:bg-white focus:border-orange-500 rounded-xl outline-none transition-all font-bold"
                    />
                  </div>
                </div>

                <div className="pt-6 flex gap-3">
                  <button 
                    type="button"
                    onClick={() => { setIsModalOpen(false); setEditingProduct(null); }}
                    className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 font-black rounded-2xl transition-all uppercase tracking-widest text-xs"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-3 py-4 bg-slate-900 hover:bg-slate-800 text-white font-black rounded-2xl shadow-xl shadow-slate-200 transition-all uppercase tracking-widest text-xs"
                  >
                    Authorize Entry
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmDialog 
        isOpen={confirmDelete.isOpen}
        onClose={() => setConfirmDelete({ isOpen: false, id: null })}
        onConfirm={() => confirmDelete.id && deleteProduct(confirmDelete.id)}
        title="Sanitize Portfolio Entry?"
        message="This will permanently purge this item from the stock manifest. All historical records of this part designation will be severed. Are you absolutely certain?"
        confirmText="Yes, Execute Purge"
      />
    </div>
  );
}
