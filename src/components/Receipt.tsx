import React from 'react';
import { 
  Printer, 
  Share2, 
  Download, 
  X, 
  Wrench,
  Check
} from 'lucide-react';
import { motion } from 'motion/react';
import { Sale } from '../types';
import { format } from 'date-fns';
import { cn } from '../lib/utils';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ConfirmDialog } from './ConfirmDialog';

interface ReceiptProps {
  sale: Sale;
  onClose: () => void;
  onVoid?: (id: string) => void;
}

export const ReceiptView: React.FC<ReceiptProps> = ({ sale, onClose, onVoid }) => {
  const [confirmVoid, setConfirmVoid] = React.useState(false);

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    try {
      const doc = new jsPDF();
      
      // Header
      doc.setFontSize(22);
      doc.setTextColor(15, 23, 42); // slate-900
      doc.text('ARMSTRONG GARAGE', 105, 30, { align: 'center' });
      
      doc.setFontSize(10);
      doc.setTextColor(249, 115, 22); // orange-500
      doc.text('PRECISION PARTS & PERFORMANCE', 105, 38, { align: 'center' });
      
      doc.setDrawColor(241, 245, 249); // slate-100
      doc.line(80, 42, 130, 42);
      
      // Info
      doc.setTextColor(100);
      doc.setFontSize(9);
      doc.text(`Transaction ID: ORDER-${sale.id.toUpperCase()}`, 14, 55);
      doc.text(`Date: ${format(sale.timestamp, 'MMM dd, yyyy · HH:mm')}`, 14, 60);
      
      if (sale.customerName) {
        doc.text(`Customer: ${sale.customerName}`, 14, 70);
        if (sale.customerPhone) doc.text(`Phone: ${sale.customerPhone}`, 14, 75);
      }
      
      // Table
      const tableRows = sale.items.map(item => [
        item.name,
        item.quantity.toString(),
        `KES ${item.price.toLocaleString()}`,
        `KES ${(item.price * item.quantity).toLocaleString()}`
      ]);
      
      autoTable(doc, {
        head: [['Item Designation', 'Qty', 'Unit Price', 'Total']],
        body: tableRows,
        startY: 85,
        theme: 'grid',
        headStyles: { fillColor: [15, 23, 42], fontSize: 9 },
        styles: { fontSize: 8 },
        columnStyles: {
          3: { halign: 'right' }
        }
      });
      
      const finalY = (doc as any).lastAutoTable?.finalY || 150;
      
      // Total
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Payment Method: ${sale.paymentMethod}`, 14, finalY + 10);
      
      doc.setFontSize(14);
      doc.setTextColor(15, 23, 42);
      doc.text(`Total Amount: KES ${sale.totalAmount.toLocaleString()}`, 196, finalY + 10, { align: 'right' });
      
      // Footer
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text('Thank you for choosing Armstrong Garage.', 105, finalY + 40, { align: 'center' });
      doc.text('v2.0 Performance Build', 105, finalY + 45, { align: 'center' });
      
      doc.save(`ARMSTRONG_RECEIPT_${sale.id.toUpperCase()}.pdf`);
    } catch (err) {
      console.error('PDF Generation Error:', err);
      alert('Failed to generate PDF. Please try printing instead.');
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Receipt #${sale.id}`,
          text: `Armstrong Garage Receipt for ${sale.customerName || 'Customer'}. Total: KES ${sale.totalAmount.toLocaleString()}`,
          url: window.location.href, // Or a specific receipt link if available
        });
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      alert('Sharing is not supported on this device/browser');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
      {/* Print styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-receipt, #printable-receipt * {
            visibility: visible;
          }
          #printable-receipt {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 20px;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header/Actions */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10 no-print">
          <div className="flex gap-2">
            <button 
              onClick={handlePrint}
              className="p-3 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-2xl transition-all flex items-center gap-2 font-bold text-xs"
            >
              <Printer className="w-4 h-4" />
              Print
            </button>
            <button 
              onClick={handleDownload}
              className="p-3 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-2xl transition-all flex items-center gap-2 font-bold text-xs"
            >
              <Download className="w-4 h-4" />
              Download
            </button>
            <button 
              onClick={handleShare}
              className="p-3 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-2xl transition-all flex items-center gap-2 font-bold text-xs"
            >
              <Share2 className="w-4 h-4" />
              Share
            </button>
          </div>
          <button 
            onClick={onClose}
            className="p-3 bg-slate-900 text-white hover:bg-slate-800 rounded-2xl transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Receipt Content */}
        <div id="printable-receipt" className="flex-1 overflow-y-auto p-10 bg-white">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center p-4 bg-orange-500 rounded-2xl mb-4 shadow-lg shadow-orange-200">
              <Wrench className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tighter uppercase italic">Armstrong Garage</h1>
            <p className="text-[10px] font-black text-orange-500 uppercase tracking-[0.3em] mb-4">Precision Parts & Performance</p>
            <div className="h-px w-20 bg-slate-100 mx-auto" />
          </div>

          <div className="grid grid-cols-2 gap-8 mb-10">
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Transaction ID</p>
              <p className="font-mono text-xs font-bold text-slate-900">ORDER-{sale.id.toUpperCase()}</p>
            </div>
            <div className="space-y-1 text-right">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Date & Time</p>
              <p className="text-xs font-bold text-slate-900">{format(sale.timestamp, 'MMM dd, yyyy · HH:mm')}</p>
            </div>
          </div>

          {(sale.customerName || sale.customerPhone) && (
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 mb-10">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Customer Details</p>
              <p className="font-bold text-slate-900">{sale.customerName || 'N/A'}</p>
              <p className="text-xs text-slate-500 font-medium">{sale.customerPhone || 'No contact provided'}</p>
            </div>
          )}

          <div className="space-y-6 mb-10">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Itemized Manifest</h4>
            <div className="space-y-4">
              {sale.items.map((item, idx) => (
                <div key={`${item.productId}-${idx}`} className="flex justify-between items-start group">
                  <div className="flex-1">
                    <p className="text-sm font-bold text-slate-900">{item.name}</p>
                    <p className="text-[10px] font-medium text-slate-400">
                      {item.quantity} units @ KES {item.price.toLocaleString()}
                    </p>
                  </div>
                  <p className="font-bold text-slate-900 text-sm">KES {(item.price * item.quantity).toLocaleString()}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t-2 border-dashed border-slate-100 pt-8 space-y-3">
            <div className="flex justify-between items-center">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Subtotal</p>
              <p className="font-bold text-slate-900">KES {sale.totalAmount.toLocaleString()}</p>
            </div>
            <div className="flex justify-between items-center">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Payment Method</p>
              <p className="font-black text-slate-900 text-xs italic bg-slate-50 px-3 py-1 rounded-lg">
                {sale.paymentMethod}
              </p>
            </div>
            <div className="flex justify-between items-center pt-4 mt-4 border-t border-slate-100">
              <p className="text-sm font-black text-slate-900 uppercase tracking-tighter">Grand Total</p>
              <p className="text-2xl font-black text-orange-600 tracking-tighter">KES {sale.totalAmount.toLocaleString()}</p>
            </div>
          </div>

          <div className="mt-16 text-center space-y-4">
            <div className="flex flex-col gap-3 no-print">
              <div className="inline-flex items-center justify-center gap-2 bg-emerald-50 text-emerald-600 px-4 py-2 rounded-full text-[10px] font-black tracking-widest border border-emerald-100">
                <Check className="w-3 h-3" />
                VERIFIED TRANSACTION
              </div>
              
              {onVoid && (
                <button 
                  onClick={() => setConfirmVoid(true)}
                  className="bg-rose-50 text-rose-500 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-100 transition-colors border border-rose-100 flex items-center justify-center gap-1.5"
                >
                  Void This Transaction
                </button>
              )}
            </div>
            <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
              Thank you for choosing Armstrong Garage.<br />
              All parts subject to standard warranty terms.<br />
              Generated via Armstrong POS System v2.0
            </p>
          </div>
        </div>

        <ConfirmDialog 
          isOpen={confirmVoid}
          onClose={() => setConfirmVoid(false)}
          onConfirm={() => {
            if (onVoid) {
              onVoid(sale.id);
              onClose();
            }
          }}
          title="Void Official Record?"
          message="This will strike the transaction from the ledger. Items will be returned to stock inventory. This action is final. Proceed?"
          confirmText="Yes, Void Transaction"
          variant="warning"
        />
      </motion.div>
    </div>
  );
};
