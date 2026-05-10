import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { cn } from '../lib/utils';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm Destruction',
  cancelText = 'Safety First (Cancel)',
  variant = 'danger'
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl p-8 overflow-hidden"
          >
            <div className="flex justify-between items-start mb-6">
              <div className={cn(
                "p-4 rounded-2xl",
                variant === 'danger' ? "bg-rose-50 text-rose-600" : 
                variant === 'warning' ? "bg-orange-50 text-orange-600" : "bg-blue-50 text-blue-600"
              )}>
                {variant === 'danger' ? <Trash2 className="w-6 h-6" /> : 
                 variant === 'warning' ? <AlertTriangle className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="space-y-4 mb-8">
              <h3 className="text-2xl font-black text-slate-900 tracking-tight leading-tight text-balance">
                {title}
              </h3>
              <p className="text-slate-500 font-medium leading-relaxed">
                {message}
              </p>
            </div>

            <div className="flex gap-4">
              <button
                onClick={onClose}
                className="flex-1 py-4 bg-slate-100 text-slate-600 font-black rounded-2xl hover:bg-slate-200 transition-all uppercase tracking-widest text-[10px]"
              >
                {cancelText}
              </button>
              <button
                onClick={() => {
                  onConfirm();
                  onClose();
                }}
                className={cn(
                  "flex-[2] py-4 text-white font-black rounded-2xl transition-all shadow-xl uppercase tracking-widest text-[10px]",
                  variant === 'danger' ? "bg-rose-600 hover:bg-rose-700 shadow-rose-100" : 
                  variant === 'warning' ? "bg-orange-500 hover:bg-orange-600 shadow-orange-100" : "bg-blue-600 hover:bg-blue-700 shadow-blue-100"
                )}
              >
                {confirmText}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
