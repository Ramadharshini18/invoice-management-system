import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Pencil, Printer, Download } from 'lucide-react';
import api from '../utils/api';
import { useApp } from '../context/AppContext';

import { formatCurrency, formatDate } from '../utils/calculations';
import { generateInvoicePDF } from '../utils/pdfGenerator';
import ABCLogo from '../components/ABCLogo';

const statusConfig = {
  Draft:   'bg-gray-100 text-gray-700',
  Sent:    'bg-blue-100 text-blue-700',
  Paid:    'bg-green-100 text-green-700',
  Pending: 'bg-orange-100 text-orange-700',
  Overdue: 'bg-red-100 text-red-700',
};

export default function InvoicePreview() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { settings } = useApp();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        const res = await api.get(`/api/invoices/${id}`);
        if (res.data.success) setInvoice(res.data.data);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetchInvoice();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!invoice) return <div className="text-center py-20 text-gray-500">Invoice not found.</div>;

  const handleDownload = () => generateInvoicePDF(invoice, settings);
  const handlePrint = () => window.print();

  return (
    <div className="max-w-4xl mx-auto pb-10">
      {/* Action Bar (hidden on print) */}
      <div className="flex items-center justify-between mb-6 no-print">
        <button
          onClick={() => navigate('/invoices')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 font-medium text-sm transition-colors"
        >
          <ArrowLeft size={16} /> Back to Invoices
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(`/invoices/${id}/edit`)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium text-sm transition-colors"
          >
            <Pencil size={14} /> Edit
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium text-sm transition-colors"
          >
            <Printer size={14} /> Print
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition-colors"
          >
            <Download size={14} /> Download PDF
          </button>
        </div>
      </div>

      {/* Invoice Card */}
      <div id="invoice-print" className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden print:shadow-none print:rounded-none print:border-0">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-700 to-blue-900 px-8 py-6 text-white">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden">
                {settings.logo_path ? (
                  <img src={`http://localhost:5000${settings.logo_path}`} alt="Logo" className="w-full h-full object-contain" />
                ) : (
                  <span className="text-blue-700 font-black text-lg">BT</span>
                )}
              </div>
              <div>
                <h2 className="text-xl font-bold">{settings.company_name || 'ABC Company'}</h2>
                <p className="text-blue-200 text-xs mt-1">{settings.address}</p>
                <p className="text-blue-200 text-xs">{settings.phone} · {settings.email}</p>
                <p className="text-blue-200 text-xs">GST: {settings.gst_number}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-black tracking-wider text-white/90">INVOICE</div>
              <div className="text-blue-200 text-sm mt-2 space-y-1">
                <p><span className="text-white font-semibold">{invoice.invoice_number}</span></p>
                <p>Date: {formatDate(invoice.invoice_date)}</p>
                <p>Due: {formatDate(invoice.due_date) || '—'}</p>
              </div>
              <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-semibold ${statusConfig[invoice.status] || 'bg-gray-100 text-gray-700'}`}>
                {invoice.status}
              </span>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="px-8 py-6 space-y-6">
          {/* Bill To */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Bill To</p>
              <p className="font-bold text-gray-800 text-base">{invoice.customer_name}</p>
              {invoice.contact_person && <p className="text-gray-600 text-sm">{invoice.contact_person}</p>}
              {invoice.customer_email && <p className="text-gray-500 text-sm">{invoice.customer_email}</p>}
              {invoice.customer_phone && <p className="text-gray-500 text-sm">{invoice.customer_phone}</p>}
              {invoice.customer_address && <p className="text-gray-500 text-sm mt-1">{invoice.customer_address}</p>}
              {invoice.customer_gst && <p className="text-gray-500 text-xs mt-1">GST: {invoice.customer_gst}</p>}
            </div>
            <div className="bg-gray-50 rounded-xl p-4 space-y-2">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Invoice Info</p>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Invoice No</span>
                <span className="font-semibold text-gray-800">{invoice.invoice_number}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Invoice Date</span>
                <span className="font-medium text-gray-700">{formatDate(invoice.invoice_date)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Due Date</span>
                <span className="font-medium text-gray-700">{formatDate(invoice.due_date) || '—'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Payment Terms</span>
                <span className="font-medium text-gray-700">
                  {invoice.payment_terms === '0' ? 'Due on Receipt' : `Net ${invoice.payment_terms}`}
                </span>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-blue-600 text-white text-xs font-semibold uppercase">
                  <th className="text-left px-4 py-3 rounded-l-lg">#</th>
                  <th className="text-left px-3 py-3">Item</th>
                  <th className="text-left px-3 py-3">Description</th>
                  <th className="text-center px-3 py-3">Qty</th>
                  <th className="text-center px-3 py-3">Unit</th>
                  <th className="text-right px-3 py-3">Unit Price</th>
                  <th className="text-right px-3 py-3">Disc%</th>
                  <th className="text-right px-3 py-3">Tax%</th>
                  <th className="text-right px-4 py-3 rounded-r-lg">Amount</th>
                </tr>
              </thead>
              <tbody>
                {(invoice.items || []).map((item, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/60'}>
                    <td className="px-4 py-3 text-gray-400 text-xs">{idx + 1}</td>
                    <td className="px-3 py-3 font-medium text-gray-800">{item.product_name}</td>
                    <td className="px-3 py-3 text-gray-500">{item.description || '—'}</td>
                    <td className="px-3 py-3 text-center text-gray-700">{item.quantity}</td>
                    <td className="px-3 py-3 text-center text-gray-500">{item.unit}</td>
                    <td className="px-3 py-3 text-right text-gray-700">{formatCurrency(item.unit_price, 'INR')}</td>
                    <td className="px-3 py-3 text-right text-gray-500">{item.discount}%</td>
                    <td className="px-3 py-3 text-right text-gray-500">{item.tax_rate}%</td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-800">{formatCurrency(item.total, 'INR')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-72 space-y-2">
              {[
                { label: 'Subtotal', value: invoice.subtotal },
                { label: 'Discount', value: invoice.discount_amount, negative: true },
                { label: 'Taxable Amount', value: invoice.taxable_amount },
                { label: 'CGST (9%)', value: invoice.cgst },
                { label: 'SGST (9%)', value: invoice.sgst },
              ].map(({ label, value, negative }) => (
                <div key={label} className="flex justify-between text-sm">
                  <span className="text-gray-500">{label}</span>
                  <span className={`font-medium ${negative && value > 0 ? 'text-red-500' : 'text-gray-700'}`}>
                    {negative && value > 0 ? '-' : ''}{formatCurrency(value, 'INR')}
                  </span>
                </div>
              ))}
              <div className="border-t-2 border-blue-200 pt-3 flex justify-between">
                <span className="font-bold text-gray-800 text-base">Grand Total</span>
                <span className="font-black text-blue-600 text-xl">{formatCurrency(invoice.grand_total, 'INR')}</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-100 pt-5 space-y-3">
            {invoice.notes && (
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Notes</p>
                <p className="text-gray-600 text-sm">{invoice.notes}</p>
              </div>
            )}
            {invoice.payment_terms && (
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Payment Terms</p>
                <p className="text-gray-600 text-sm">
                  {invoice.payment_terms === '0' ? 'Payment is due immediately upon receipt of this invoice.' : `Payment is due within ${invoice.payment_terms} days from the invoice date.`}
                </p>
              </div>
            )}
            <div className="text-center pt-4 border-t border-gray-100">
              <p className="text-gray-500 text-sm font-medium">Thank you for your business!</p>
              <p className="text-gray-400 text-xs mt-1">This is a computer generated invoice — {settings.company_name}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
