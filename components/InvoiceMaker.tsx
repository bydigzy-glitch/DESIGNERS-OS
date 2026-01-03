
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, X, Download, Printer } from 'lucide-react';
import { Button } from './ui/button';

interface InvoiceItem {
    id: string;
    description: string;
    quantity: number;
    rate: number;
}

export const InvoiceMaker: React.FC = () => {
    const [clientName, setClientName] = useState('');
    const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
    const [invoiceNumber, setInvoiceNumber] = useState(`INV-${Math.floor(Math.random() * 10000)}`);
    const [items, setItems] = useState<InvoiceItem[]>([
        { id: '1', description: 'Design Consultation', quantity: 1, rate: 150 }
    ]);

    const addItem = () => {
        setItems([...items, { id: Date.now().toString(), description: '', quantity: 1, rate: 0 }]);
    };

    const updateItem = (id: string, field: keyof InvoiceItem, value: any) => {
        setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));
    };

    const removeItem = (id: string) => {
        setItems(items.filter(item => item.id !== id));
    };

    const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
    const tax = subtotal * 0.1; // 10% tax example
    const total = subtotal + tax;

    return (
        <div className="flex flex-col h-full bg-white text-black p-6 font-sans">
            {/* Swiss Style Header */}
            <div className="flex justify-between items-start mb-12 border-b-2 border-black pb-8">
                <div>
                    <div className="text-4xl font-black tracking-tighter mb-1 uppercase">DESIGNERS OS</div>
                    <div className="text-[10px] font-bold tracking-[0.2em] uppercase text-gray-500">Professional Studio Services</div>
                </div>
                <div className="text-right">
                    <div className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">Date</div>
                    <input
                        type="date"
                        value={invoiceDate}
                        aria-label="Invoice Date"
                        onChange={(e) => setInvoiceDate(e.target.value)}
                        className="text-sm font-bold bg-transparent border-none p-0 text-right focus:ring-0 w-32"
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-12 mb-12">
                <div>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Bill To</div>
                    <textarea
                        placeholder="Client Name & Address"
                        aria-label="Client Name & Address"
                        value={clientName}
                        onChange={(e) => setClientName(e.target.value)}
                        className="w-full text-sm font-bold bg-transparent border-none p-0 focus:ring-0 resize-none h-20 placeholder:text-gray-300"
                    />
                </div>
                <div className="text-right">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Invoice No.</div>
                    <input
                        type="text"
                        value={invoiceNumber}
                        aria-label="Invoice Number"
                        onChange={(e) => setInvoiceNumber(e.target.value)}
                        className="text-3xl font-black tracking-tighter bg-transparent border-none p-0 text-right focus:ring-0 w-full"
                    />
                </div>
            </div>

            {/* Items Table */}
            <div className="flex-1 overflow-auto">
                <div className="grid grid-cols-12 gap-4 border-b border-gray-200 pb-2 mb-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                    <div className="col-span-7">Description</div>
                    <div className="col-span-1 text-center">Qty</div>
                    <div className="col-span-2 text-right">Rate</div>
                    <div className="col-span-2 text-right">Amount</div>
                </div>
                <div className="space-y-4 mb-8">
                    {items.map(item => (
                        <div key={item.id} className="grid grid-cols-12 gap-4 items-center group">
                            <div className="col-span-7">
                                <input
                                    type="text"
                                    value={item.description}
                                    placeholder="Service description"
                                    aria-label="Service description"
                                    onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                                    className="w-full text-sm font-medium bg-transparent border-none p-0 focus:ring-0 placeholder:text-gray-200"
                                />
                            </div>
                            <div className="col-span-1">
                                <input
                                    type="number"
                                    value={item.quantity}
                                    aria-label="Quantity"
                                    onChange={(e) => updateItem(item.id, 'quantity', parseInt(e.target.value) || 0)}
                                    className="w-full text-sm font-bold bg-transparent border-none p-0 text-center focus:ring-0"
                                />
                            </div>
                            <div className="col-span-2">
                                <input
                                    type="number"
                                    value={item.rate}
                                    aria-label="Rate"
                                    onChange={(e) => updateItem(item.id, 'rate', parseInt(e.target.value) || 0)}
                                    className="w-full text-sm font-bold bg-transparent border-none p-0 text-right focus:ring-0"
                                />
                            </div>
                            <div className="col-span-2 text-right text-sm font-bold relative">
                                ${(item.quantity * item.rate).toLocaleString()}
                                <button
                                    onClick={() => removeItem(item.id)}
                                    aria-label="Remove item"
                                    className="absolute -right-6 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 text-red-500 hover:scale-110 transition-all"
                                >
                                    <X size={12} />
                                </button>
                            </div>
                        </div>
                    ))}
                    <button
                        onClick={addItem}
                        aria-label="Add new invoice item"
                        className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-primary hover:text-primary/80 transition-colors mt-4"
                    >
                        <Plus size={12} /> Add Item
                    </button>
                </div>
            </div>

            {/* Summary */}
            <div className="border-t-2 border-black pt-6">
                <div className="flex justify-end gap-12 mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Subtotal</span>
                    <span className="text-sm font-bold w-24 text-right">${subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-end gap-12 mb-4">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Tax (10%)</span>
                    <span className="text-sm font-bold w-24 text-right">${tax.toLocaleString()}</span>
                </div>
                <div className="flex justify-end gap-12 items-baseline">
                    <span className="text-lg font-black uppercase tracking-tighter">Total Due</span>
                    <span className="text-4xl font-black tracking-tighter w-40 text-right">${total.toLocaleString()}</span>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-8 flex gap-4 no-print">
                <Button variant="outline" aria-label="Export Invoice as PDF" className="flex-1 bg-black text-white hover:bg-gray-800 border-none rounded-none font-bold uppercase tracking-widest text-[10px] py-6">
                    <Download size={14} className="mr-2" /> Export PDF
                </Button>
                <Button variant="outline" aria-label="Print Invoice" className="bg-gray-100 text-black hover:bg-gray-200 border-none rounded-none font-bold uppercase tracking-widest text-[10px] py-6 px-12">
                    <Printer size={14} />
                </Button>
            </div>
        </div>
    );
};
