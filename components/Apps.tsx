import React, { useState } from 'react';
import { ArrowLeft, FileText, Plus, Trash2, Printer, Settings } from 'lucide-react';
import { FadeIn } from './common/AnimatedComponents';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type AppId = 'HUB' | 'INVOICE';

interface AppsProps {
  items: any[];
  setItems: React.Dispatch<React.SetStateAction<any[]>>;
  userTokens: number;
  onUseToken: (amount: number) => void;
}

export const Apps: React.FC<AppsProps> = () => {
  const [currentApp, setCurrentApp] = useState<AppId>('HUB');

  const renderCurrentAppView = () => {
    switch (currentApp) {
      case 'INVOICE': return <InvoiceGeneratorView />;
      default: return null;
    }
  };

  return (
    <div className="flex flex-col h-full w-full">
      {currentApp === 'HUB' ? (
        <FadeIn className="space-y-8 h-full">
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Apps</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { id: 'INVOICE', label: 'Invoice Generator', icon: <FileText size={24} />, color: 'text-blue-500 bg-blue-500/10 border-blue-500/20', desc: 'Create professional invoices for your clients in seconds.' },
            ].map((app, i) => (
              <FadeIn key={app.id} delay={i * 0.1}>
                <button
                  onClick={() => setCurrentApp(app.id as AppId)}
                  className="w-full bg-card border border-border rounded-2xl p-6 text-left hover:border-primary/50 transition-all group relative overflow-hidden shadow-sm active:scale-95 h-full flex flex-col"
                >
                  <div className={`w-12 h-12 rounded-xl border flex items-center justify-center mb-4 ${app.color}`}>
                    {app.icon}
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-1">{app.label}</h3>
                  <p className="text-muted-foreground text-sm">{app.desc}</p>
                </button>
              </FadeIn>
            ))}
          </div>
        </FadeIn>
      ) : (
        <FadeIn className="flex flex-col h-full">
          <div className="flex items-center gap-4 mb-4 flex-shrink-0 print:hidden">
            <button
              onClick={() => setCurrentApp('HUB')}
              className="p-2 bg-card rounded-lg text-muted-foreground hover:text-foreground border border-border hover:border-primary/50 transition-all"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-2xl font-bold text-foreground capitalize">{currentApp.replace('_', ' ').toLowerCase()}</h1>
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto relative rounded-2xl border border-border overflow-hidden bg-card/50 backdrop-blur-sm print:overflow-visible print:border-none print:bg-white print:rounded-none">
            {renderCurrentAppView()}
          </div>
        </FadeIn>
      )}
    </div>
  );
};

const InvoiceGeneratorView: React.FC = () => {
  const [invoiceData, setInvoiceData] = useState({
    invoiceNumber: `INV-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
    date: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    fromName: '',
    fromEmail: '',
    fromAddress: '',
    toName: '',
    toEmail: '',
    toAddress: '',
    notes: 'Thank you for your business. Payment is due within 14 days.',
    currency: '$'
  });

  const [items, setItems] = useState([
    { id: 1, description: 'Design Services', quantity: 1, rate: 100 },
  ]);

  const addItem = () => {
    setItems([...items, { id: Date.now(), description: '', quantity: 1, rate: 0 }]);
  };

  const removeItem = (id: number) => {
    setItems(items.filter(i => i.id !== id));
  };

  const updateItem = (id: number, field: string, value: any) => {
    setItems(items.map(i => i.id === id ? { ...i, [field]: value } : i));
  };

  const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
  const tax = 0; // Keeping it simple for now
  const total = subtotal + tax;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="h-full flex flex-col md:flex-row print:block">
      {/* Editor Sidebar - Hidden in Print */}
      <div className="w-full md:w-[400px] bg-secondary/30 border-r border-border p-6 overflow-y-auto print:hidden space-y-6">
        <div>
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
            <Settings size={18} /> Settings
          </h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase">Invoice #</label>
                <Input value={invoiceData.invoiceNumber} onChange={e => setInvoiceData({ ...invoiceData, invoiceNumber: e.target.value })} />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase">Date</label>
                <Input type="date" value={invoiceData.date} onChange={e => setInvoiceData({ ...invoiceData, date: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase">Due Date</label>
              <Input type="date" value={invoiceData.dueDate} onChange={e => setInvoiceData({ ...invoiceData, dueDate: e.target.value })} />
            </div>
          </div>
        </div>

        <div className="border-t border-border pt-6">
          <h3 className="font-bold text-lg mb-4">From (You)</h3>
          <div className="space-y-4">
            <Input placeholder="Your Name / Business" value={invoiceData.fromName} onChange={e => setInvoiceData({ ...invoiceData, fromName: e.target.value })} />
            <Input placeholder="Email" value={invoiceData.fromEmail} onChange={e => setInvoiceData({ ...invoiceData, fromEmail: e.target.value })} />
            <textarea
              className="w-full bg-background border border-border rounded-md p-2 text-sm min-h-[80px]"
              placeholder="Address"
              value={invoiceData.fromAddress}
              onChange={e => setInvoiceData({ ...invoiceData, fromAddress: e.target.value })}
            />
          </div>
        </div>

        <div className="border-t border-border pt-6">
          <h3 className="font-bold text-lg mb-4">To (Client)</h3>
          <div className="space-y-4">
            <Input placeholder="Client Name" value={invoiceData.toName} onChange={e => setInvoiceData({ ...invoiceData, toName: e.target.value })} />
            <Input placeholder="Client Email" value={invoiceData.toEmail} onChange={e => setInvoiceData({ ...invoiceData, toEmail: e.target.value })} />
            <textarea
              className="w-full bg-background border border-border rounded-md p-2 text-sm min-h-[80px]"
              placeholder="Client Address"
              value={invoiceData.toAddress}
              onChange={e => setInvoiceData({ ...invoiceData, toAddress: e.target.value })}
            />
          </div>
        </div>
      </div>

      {/* Preview Area */}
      <div className="flex-1 bg-secondary/50 p-6 md:p-12 overflow-y-auto print:p-0 print:bg-white print:overflow-visible">
        <div className="max-w-[800px] mx-auto bg-card border border-border rounded-xl shadow-sm min-h-[1000px] p-8 md:p-12 print:shadow-none print:border-none print:bg-white text-foreground print:text-black">

          {/* Invoice Header */}
          <div className="flex justify-between items-start mb-12">
            <div>
              <h1 className="text-4xl font-black tracking-tighter mb-2 text-primary print:text-black">INVOICE</h1>
              <p className="text-muted-foreground print:text-gray-500 font-medium">#{invoiceData.invoiceNumber}</p>
            </div>
            <div className="text-right">
              <h2 className="font-bold text-xl mb-1">{invoiceData.fromName || 'Your Name'}</h2>
              <p className="text-sm text-muted-foreground print:text-gray-600 whitespace-pre-line">{invoiceData.fromAddress}</p>
              <p className="text-sm text-muted-foreground print:text-gray-600 mt-1">{invoiceData.fromEmail}</p>
            </div>
          </div>

          {/* Bill To & Details */}
          <div className="flex justify-between items-start mb-16 gap-8">
            <div>
              <p className="text-xs font-bold text-muted-foreground print:text-gray-500 uppercase tracking-wider mb-2">Bill To</p>
              <h3 className="font-bold text-lg mb-1">{invoiceData.toName || 'Client Name'}</h3>
              <p className="text-sm text-muted-foreground print:text-gray-600 whitespace-pre-line">{invoiceData.toAddress || 'Client Address'}</p>
              <p className="text-sm text-muted-foreground print:text-gray-600 mt-1">{invoiceData.toEmail}</p>
            </div>
            <div className="text-right space-y-2">
              <div>
                <p className="text-xs font-bold text-muted-foreground print:text-gray-500 uppercase tracking-wider">Date Issued</p>
                <p className="font-medium">{new Date(invoiceData.date).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-muted-foreground print:text-gray-500 uppercase tracking-wider">Due Date</p>
                <p className="font-medium">{new Date(invoiceData.dueDate).toLocaleDateString()}</p>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="mb-8">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-primary/10 print:border-black">
                  <th className="text-left py-3 text-xs font-black uppercase text-muted-foreground print:text-gray-500 w-[50%]">Description</th>
                  <th className="text-center py-3 text-xs font-black uppercase text-muted-foreground print:text-gray-500 w-[15%]">Qty</th>
                  <th className="text-right py-3 text-xs font-black uppercase text-muted-foreground print:text-gray-500 w-[15%]">Rate</th>
                  <th className="text-right py-3 text-xs font-black uppercase text-muted-foreground print:text-gray-500 w-[20%]">Amount</th>
                  <th className="w-[5%] print:hidden"></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-b border-border print:border-gray-200 group">
                    <td className="py-2.5">
                      <input
                        className="w-full bg-transparent border-none focus:ring-0 p-0 font-medium placeholder:text-muted-foreground print:placeholder:text-transparent"
                        placeholder="Item Description"
                        value={item.description}
                        onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                      />
                    </td>
                    <td className="py-2.5">
                      <input
                        className="w-full bg-transparent border-none focus:ring-0 p-0 text-center placeholder:text-muted-foreground print:placeholder:text-transparent"
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value))}
                      />
                    </td>
                    <td className="py-2.5">
                      <input
                        className="w-full bg-transparent border-none focus:ring-0 p-0 text-right placeholder:text-muted-foreground print:placeholder:text-transparent"
                        type="number"
                        value={item.rate}
                        onChange={(e) => updateItem(item.id, 'rate', parseFloat(e.target.value))}
                      />
                    </td>
                    <td className="py-2.5 text-right font-medium">
                      {invoiceData.currency}{(item.quantity * item.rate).toFixed(2)}
                    </td>
                    <td className="text-right print:hidden">
                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="mt-4 print:hidden">
              <Button variant="outline" size="sm" onClick={addItem} className="gap-2 text-xs">
                <Plus size={14} /> Add Item
              </Button>
            </div>
          </div>

          {/* Totals */}
          <div className="flex flex-col items-end gap-2 mb-16 border-t border-border pt-4 print:border-gray-200">
            <div className="flex justify-between w-[200px] text-sm">
              <span className="text-muted-foreground print:text-gray-500">Subtotal</span>
              <span className="font-medium">{invoiceData.currency}{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between w-[200px] text-sm">
              <span className="text-muted-foreground print:text-gray-500">Tax</span>
              <span className="font-medium">{invoiceData.currency}0.00</span>
            </div>
            <div className="flex justify-between w-[200px] text-lg font-bold border-t border-border mt-2 pt-2 print:border-black">
              <span>Total</span>
              <span>{invoiceData.currency}{total.toFixed(2)}</span>
            </div>
          </div>

          {/* Footer / Notes */}
          <div className="text-sm">
            <h4 className="font-bold text-xs uppercase text-muted-foreground print:text-gray-500 mb-2">Notes & Terms</h4>
            <textarea
              className="w-full bg-transparent border-none resize-none focus:ring-0 p-0 text-muted-foreground print:text-gray-600 h-20"
              value={invoiceData.notes}
              onChange={(e) => setInvoiceData({ ...invoiceData, notes: e.target.value })}
            />
          </div>

        </div>

        {/* Print Action FAB (Mobile/Desktop) */}
        <div className="fixed bottom-8 right-8 print:hidden">
          <Button onClick={handlePrint} size="lg" className="rounded-full shadow-2xl gap-2 font-bold px-6">
            <Printer size={20} /> Print / Save PDF
          </Button>
        </div>
      </div>
    </div>
  );
};
