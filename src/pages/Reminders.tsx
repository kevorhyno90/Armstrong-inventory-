import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Calendar, 
  Trash2, 
  Clock, 
  X,
  Check,
  Bell,
  CheckCircle2,
  AlertCircle,
  ChevronLeft
} from 'lucide-react';
import { localStore } from '../lib/localStore';
import { Reminder } from '../types';
import { format } from 'date-fns';
import { cn } from '../lib/utils';

import { ConfirmDialog } from '../components/ConfirmDialog';

export default function Reminders() {
  const [reminders, setReminders] = React.useState<Reminder[]>([]);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [newReminder, setNewReminder] = React.useState<Partial<Reminder>>({
    type: 'GENERAL',
    status: 'PENDING'
  });

  // Delete confirmation state
  const [confirmDelete, setConfirmDelete] = React.useState<{ isOpen: boolean; id: string | null }>({
    isOpen: false,
    id: null
  });

  React.useEffect(() => {
    setReminders(localStore.getReminders());
  }, []);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReminder.title || !newReminder.dueDate) return;

    const reminder: Reminder = {
      id: Math.random().toString(36).substr(2, 9),
      title: newReminder.title,
      description: newReminder.description || '',
      dueDate: new Date(newReminder.dueDate).getTime(),
      type: newReminder.type as any,
      status: 'PENDING',
      updatedAt: Date.now()
    };

    const updated = [...reminders, reminder];
    setReminders(updated);
    localStore.saveReminders(updated);
    setIsModalOpen(false);
    setNewReminder({ type: 'GENERAL', status: 'PENDING' });
  };

  const toggleStatus = (id: string) => {
    const updated = reminders.map(r => 
      r.id === id ? { ...r, status: (r.status === 'PENDING' ? 'COMPLETED' : 'PENDING') as any, updatedAt: Date.now() } : r
    );
    setReminders(updated);
    localStore.saveReminders(updated);
  };

  const deleteReminder = (id: string) => {
    const updated = reminders.filter(r => r.id !== id);
    setReminders(updated);
    localStore.saveReminders(updated);
  };

  const pending = reminders.filter(r => r.status === 'PENDING').sort((a,b) => a.dueDate - b.dueDate);
  const completed = reminders.filter(r => r.status === 'COMPLETED').sort((a,b) => b.dueDate - a.dueDate);

  const categories = [
    { id: 'GENERAL', color: 'bg-slate-100 text-slate-600' },
    { id: 'STOCK', color: 'bg-orange-100 text-orange-600' },
    { id: 'MAINTENANCE', color: 'bg-indigo-100 text-indigo-600' },
    { id: 'CUSTOMER', color: 'bg-emerald-100 text-emerald-600' },
  ] as const;

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
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Follow-ups & Alerts</h1>
            <p className="text-slate-500 text-sm font-medium">Managing {pending.length} active shop tasks</p>
          </div>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-slate-900 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-xl shadow-slate-200 hover:bg-slate-800 transition-all flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Create New Task
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Pending Tasks */}
        <div className="space-y-6">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Active Reminders
          </h3>
          
          <div className="space-y-4">
            {pending.map((reminder) => (
              <motion.div 
                layout
                key={reminder.id} 
                className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all group relative overflow-hidden"
              >
                <div className="flex justify-between items-start mb-4">
                  <span className={cn(
                    "px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest",
                    categories.find(c => c.id === reminder.type)?.color
                  )}>
                    {reminder.type}
                  </span>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => toggleStatus(reminder.id)}
                      className="p-1.5 hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 rounded-lg transition-colors border border-transparent hover:border-emerald-100"
                    >
                      <CheckCircle2 className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => setConfirmDelete({ isOpen: true, id: reminder.id })}
                      className="p-1.5 bg-rose-50 text-rose-500 hover:bg-rose-100 rounded-lg transition-colors border border-rose-100"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                <h4 className="text-lg font-bold text-slate-900 mb-2 leading-tight uppercase tracking-tight">{reminder.title}</h4>
                <p className="text-sm text-slate-500 mb-6 line-clamp-2 font-medium">{reminder.description}</p>
                <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                  <div className="flex items-center gap-2 px-2 py-1 bg-slate-50 rounded-lg">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-[10px] font-bold text-slate-600 uppercase tracking-tighter">Due: {format(reminder.dueDate, 'MMM dd, yyyy')}</span>
                  </div>
                  <p className="text-[9px] font-mono text-slate-300 font-bold">UID: {reminder.id.toUpperCase()}</p>
                </div>
              </motion.div>
            ))}
            {pending.length === 0 && (
              <div className="py-20 text-center border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50">
                <Bell className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                <p className="text-slate-400 font-medium italic">No pending tasks for today.</p>
              </div>
            )}
          </div>
        </div>

        {/* Completed Tasks */}
        <div className="space-y-6">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            Recently Completed
          </h3>
          <div className="space-y-3">
            {completed.map((reminder) => (
              <div key={reminder.id} className="bg-slate-100/50 border border-slate-200 p-4 rounded-xl flex items-center justify-between group opacity-70 hover:opacity-100 transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 shrink-0">
                    <Check className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 line-through decoration-slate-300">{reminder.title}</h4>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Marked complete on {format(reminder.updatedAt || Date.now(), 'MMM dd, HH:mm')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                   <button 
                    onClick={() => toggleStatus(reminder.id)}
                    className="text-[9px] font-black text-slate-400 hover:text-orange-500 underline uppercase tracking-widest"
                   >
                    Restore
                   </button>
                   <button 
                    onClick={() => setConfirmDelete({ isOpen: true, id: reminder.id })}
                    className="p-1.5 bg-rose-50 text-rose-500 hover:bg-rose-100 rounded-lg transition-colors border border-rose-100"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
            {completed.length === 0 && (
              <p className="text-center py-12 text-slate-300 text-sm font-medium italic">Completed tasks will appear here.</p>
            )}
          </div>
        </div>
      </div>

      {/* Modal */}
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
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl p-8"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight leading-none shrink-0">New Task Directive</h3>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleCreate} className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest pl-1">Directive Subject</label>
                    <input 
                      required
                      placeholder="e.g. Call customer for service follow-up"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 focus:bg-white focus:border-orange-500 rounded-xl outline-none transition-all font-medium"
                      value={newReminder.title || ''}
                      onChange={e => setNewReminder({...newReminder, title: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest pl-1">Details & Narrative</label>
                    <textarea 
                      rows={3}
                      placeholder="Enter specific instructions or context..."
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 focus:bg-white focus:border-orange-500 rounded-xl outline-none transition-all font-medium resize-none"
                      value={newReminder.description || ''}
                      onChange={e => setNewReminder({...newReminder, description: e.target.value})}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest pl-1">Category</label>
                      <select
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-100 focus:bg-white focus:border-orange-500 rounded-xl outline-none transition-all font-bold text-xs"
                        value={newReminder.type}
                        onChange={e => setNewReminder({...newReminder, type: e.target.value as any})}
                      >
                        {categories.map(cat => (
                          <option key={cat.id} value={cat.id}>{cat.id}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest pl-1">Deadline Date</label>
                       <input 
                         type="date"
                         required
                         value={newReminder.dueDate || ''}
                         className="w-full px-4 py-3 bg-slate-50 border border-slate-100 focus:bg-white focus:border-orange-500 rounded-xl outline-none transition-all font-medium text-sm"
                         onChange={e => setNewReminder({...newReminder, dueDate: e.target.value})}
                       />
                    </div>
                  </div>
                </div>

                <div className="pt-6">
                  <button 
                    type="submit"
                    className="w-full bg-slate-900 text-white font-bold py-4 rounded-2xl uppercase tracking-widest text-sm hover:bg-slate-800 transition-all shadow-xl shadow-slate-100 active:translate-y-0.5"
                  >
                    Post Directive
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
        onConfirm={() => confirmDelete.id && deleteReminder(confirmDelete.id)}
        title="Discard Task?"
        message="This will remove this directive from your follow-up list. Use this if the task is no longer relevant or was posted in error."
        confirmText="Discard Directive"
      />
    </div>
  );
}
