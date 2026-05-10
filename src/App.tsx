import React from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Package, 
  ShoppingCart, 
  Bell, 
  History, 
  Menu,
  X,
  LayoutDashboard,
  Wrench,
  ChevronLeft,
  BarChart3,
  Users,
  Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { cn } from './lib/utils';

// Pages
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const Inventory = React.lazy(() => import('./pages/Inventory'));
const POS = React.lazy(() => import('./pages/POS'));
const Reminders = React.lazy(() => import('./pages/Reminders'));
const SalesHistory = React.lazy(() => import('./pages/SalesHistory'));
const DebtManagement = React.lazy(() => import('./pages/DebtManagement'));
const Reports = React.lazy(() => import('./pages/Reports'));

const Sidebar = ({ isOpen, setOpen, isInstallable, onInstall }: { isOpen: boolean; setOpen: (v: boolean) => void; isInstallable?: boolean; onInstall?: () => void }) => {
  const location = useLocation();
  
  const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/inventory', icon: Package, label: 'Inventory' },
    { to: '/pos', icon: ShoppingCart, label: 'Sales' },
    { to: '/reports', icon: BarChart3, label: 'Reports' },
    { to: '/debt', icon: Users, label: 'Debtors' },
    { to: '/history', icon: History, label: 'Ledger' },
    { to: '/reminders', icon: Bell, label: 'Reminders' },
  ];

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      <aside className={cn(
        "fixed top-0 left-0 bottom-0 w-72 bg-slate-900 border-r border-white/5 z-50 transition-transform duration-300 transform",
        isOpen ? "translate-x-0" : "-translate-x-full",
        "flex flex-col shadow-2xl lg:shadow-none"
      )}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-12 pl-2">
            <div className="flex items-center gap-3">
              <div className="bg-orange-500 p-2.5 rounded-xl shadow-lg shadow-orange-500/20 rotate-3 transition-transform hover:rotate-0">
                <Wrench className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-black tracking-tighter text-white italic uppercase">Armstrong</h1>
                <p className="text-[10px] font-black text-orange-500 uppercase tracking-[0.3em] leading-none mt-1">Garage Hub</p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="lg:hidden p-2 hover:bg-white/10 rounded-lg transition-colors">
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>

          <nav className="space-y-1.5 flex-1 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4 ml-3">Operations</p>
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => {
                  if (window.innerWidth < 1024) setOpen(false);
                }}
                className={cn(
                  "flex items-center gap-3 px-5 py-4 rounded-2xl text-sm font-black transition-all group relative overflow-hidden",
                  location.pathname === item.to 
                    ? "bg-white/10 text-white shadow-xl" 
                    : "text-slate-400 hover:bg-white/5 hover:text-white"
                )}
              >
                {location.pathname === item.to && (
                  <motion.div 
                    layoutId="activeTab"
                    className="absolute left-0 top-0 bottom-0 w-1 bg-orange-500"
                  />
                )}
                <item.icon className={cn(
                  "w-5 h-5 transition-all group-hover:scale-110",
                  location.pathname === item.to ? "text-orange-500 scale-110" : "text-slate-500"
                )} />
                <span className="tracking-tight">{item.label}</span>
              </Link>
            ))}
          </nav>
        </div>

        <div className="mt-auto p-6 flex flex-col gap-4">
          {isInstallable && (
            <button 
              onClick={onInstall}
              className="flex items-center justify-center gap-3 w-full py-4 bg-orange-500 rounded-2xl text-white text-xs font-black uppercase tracking-widest hover:bg-orange-600 transition-all shadow-xl shadow-orange-500/20 active:scale-95"
            >
              <Download className="w-4 h-4" />
              Install App
            </button>
          )}

          <div className="p-5 bg-white/5 rounded-[2rem] border border-white/5 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">System Authorized</span>
            </div>
            <p className="text-[10px] font-medium text-slate-500 italic opacity-80">v2.0 Performance Build</p>
          </div>
        </div>
      </aside>
    </>
  );
};

const Header = ({ setSidebarOpen, isSidebarOpen }: { setSidebarOpen: (v: boolean) => void; isSidebarOpen: boolean }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const isHome = location.pathname === '/';

  return (
    <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-30 px-6 flex items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => setSidebarOpen(!isSidebarOpen)}
          className="p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl text-slate-500 transition-all active:scale-95"
        >
          <Menu className="w-6 h-6" />
        </button>

        {!isHome && (
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all hover:-translate-x-1 shadow-lg shadow-slate-100"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </button>
        )}
      </div>
      
      <div className="flex-1 px-4 hidden sm:block">
        <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest">
           {location.pathname === '/' ? 'Dashboard Overview' : location.pathname.substring(1)}
        </h2>
      </div>

      <div className="flex items-center gap-4">
        <div className="text-right hidden sm:block">
          <p className="text-sm font-bold text-slate-900">{format(new Date(), 'EEEE, do MMM')}</p>
          <p className="text-[10px] font-bold text-orange-500 uppercase tracking-tighter text-right">Shop Authority</p>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center border border-slate-200 shadow-xl shadow-slate-100 overflow-hidden p-2">
           <Wrench className="w-full h-full text-orange-500" />
        </div>
      </div>
    </header>
  );
};

export default function App() {
  const [isSidebarOpen, setSidebarOpen] = React.useState(true);
  const [deferredPrompt, setDeferredPrompt] = React.useState<any>(null);
  const [isInstallable, setIsInstallable] = React.useState(false);

  React.useEffect(() => {
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    });

    window.addEventListener('appinstalled', () => {
      setIsInstallable(false);
      setDeferredPrompt(null);
    });
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstallable(false);
      setDeferredPrompt(null);
    }
  };

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-[#fafafa] flex">
        <Sidebar isOpen={isSidebarOpen} setOpen={setSidebarOpen} isInstallable={isInstallable} onInstall={handleInstallClick} />
        
        <div className={cn(
          "flex-1 flex flex-col min-w-0 transition-all duration-300",
          isSidebarOpen ? "lg:pl-72" : "pl-0"
        )}>
          <Header setSidebarOpen={setSidebarOpen} isSidebarOpen={isSidebarOpen} />

          <main className="flex-1 p-4 md:p-10 max-w-[1600px] mx-auto w-full">
            <React.Suspense fallback={
              <div className="flex items-center justify-center h-[50vh]">
                <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
              </div>
            }>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/inventory" element={<Inventory />} />
                <Route path="/pos" element={<POS />} />
                <Route path="/history" element={<SalesHistory />} />
                <Route path="/reminders" element={<Reminders />} />
                <Route path="/debt" element={<DebtManagement />} />
                <Route path="/reports" element={<Reports />} />
              </Routes>
            </React.Suspense>
          </main>
        </div>
      </div>
    </BrowserRouter>
  );
}
