import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Save, X } from 'lucide-react';
import api from '../utils/api';
import { useApp } from '../context/AppContext';

import { calcInvoiceTotals, formatCurrency } from '../utils/calculations';

const today = new Date().toISOString().split('T')[0];
const emptyItem = () => ({ product_name: '', description: '', quantity: 1, unit: 'pcs', unit_price: 0, discount: 0, tax_rate: 18, total: 0 });

export default function InvoiceForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { settings, customers, products } = useApp();
  const isEdit = Boolean(id);

  // Separate states to prevent cross-field re-renders
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(today);
  const [dueDate, setDueDate] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('30');
  const [status, setStatus] = useState('Draft');
  const [notes, setNotes] = useState('Thank you for doing business with ABC Company.');
  const [customerId, setCustomerId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [customerGst, setCustomerGst] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [items, setItems] = useState([emptyItem()]);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const totals = useMemo(() => calcInvoiceTotals(items), [items]);

  useEffect(() => {
    if (!isEdit) fetchNextNumber();
    else loadInvoice();
  }, [id]);

  const fetchNextNumber = async () => {
    try {
      const res = await api.get('/api/invoices/next-number');
      if (res.data.success) setInvoiceNumber(res.data.data.nextNumber);
    } catch (err) { console.error(err); }
  };

  const loadInvoice = async () => {
    try {
      const res = await api.get(`/api/invoices/${id}`);
      if (res.data.success) {
        const inv = res.data.data;
        setInvoiceNumber(inv.invoice_number || '');
        setInvoiceDate(inv.invoice_date || today);
        setDueDate(inv.due_date || '');
        setPaymentTerms(inv.payment_terms || '30');
        setStatus(inv.status || 'Draft');
        setNotes(inv.notes || '');
        setCustomerId(inv.customer_id || '');
        setCustomerName(inv.customer_name || '');
        setCustomerEmail(inv.customer_email || '');
        setCustomerPhone(inv.customer_phone || '');
        setCustomerAddress(inv.customer_address || '');
        setShippingAddress(inv.shipping_address || '');
        setCustomerGst(inv.customer_gst || '');
        setContactPerson(inv.contact_person || '');
        setItems(inv.items && inv.items.length > 0 ? inv.items : [emptyItem()]);
      }
    } catch (err) { console.error(err); }
  };

  const handleCustomerSelect = useCallback((custId) => {
    setCustomerId(custId);
    if (!custId) { setCustomerName(''); setCustomerEmail(''); setCustomerPhone(''); setCustomerAddress(''); setCustomerGst(''); setContactPerson(''); return; }
    const cust = customers.find(c => String(c.id) === String(custId));
    if (cust) {
      const addr = [cust.address, cust.city, cust.state, cust.postal_code, cust.country].filter(Boolean).join(', ');
      setCustomerName(cust.company_name || '');
      setCustomerEmail(cust.email || '');
      setCustomerPhone(cust.phone || '');
      setCustomerAddress(addr);
      setCustomerGst(cust.gst_number || '');
      setContactPerson(cust.contact_person || '');
    }
  }, [customers]);

  const handleProductSelect = useCallback((idx, productId) => {
    const prod = products.find(p => String(p.id) === String(productId));
    if (!prod) return;
    setItems(prev => prev.map((item, i) => {
      if (i !== idx) return item;
      const updated = { ...item, product_name: prod.name, description: prod.description || '', unit_price: prod.price || 0, unit: prod.unit || 'pcs', tax_rate: prod.tax_rate || 18 };
      const lineSubtotal = updated.quantity * updated.unit_price;
      updated.total = lineSubtotal - (lineSubtotal * updated.discount / 100);
      return updated;
    }));
  }, [products]);

  const updateItem = useCallback((idx, field, value) => {
    setItems(prev => prev.map((item, i) => {
      if (i !== idx) return item;
      const updated = { ...item, [field]: value };
      const lineSubtotal = (updated.quantity || 0) * (updated.unit_price || 0);
      updated.total = lineSubtotal - (lineSubtotal * (updated.discount || 0) / 100);
      return updated;
    }));
  }, []);

  const addItem = useCallback(() => setItems(prev => [...prev, emptyItem()]), []);
  const removeItem = useCallback((idx) => setItems(prev => prev.filter((_, i) => i !== idx)), []);

  const getFormPayload = (statusOverride) => ({
    invoice_number: invoiceNumber,
    invoice_date: invoiceDate,
    due_date: dueDate,
    payment_terms: paymentTerms,
    status: statusOverride || status,
    notes,
    customer_id: customerId,
    customer_name: customerName,
    customer_email: customerEmail,
    customer_phone: customerPhone,
    customer_address: customerAddress,
    shipping_address: shippingAddress,
    customer_gst: customerGst,
    contact_person: contactPerson,
    items,
    subtotal: totals.subtotal,
    discount_amount: totals.discountTotal,
    taxable_amount: totals.taxableAmount,
    cgst: totals.cgst,
    sgst: totals.sgst,
    igst: totals.igst,
    grand_total: totals.grandTotal,
  });

  const validate = () => {
    const e = {};
    if (!customerName || !String(customerName).trim()) e.customer_name = 'Customer name is required';
    if (!invoiceDate) e.invoice_date = 'Invoice date is required';
    if (!invoiceNumber || !String(invoiceNumber).trim()) e.invoice_number = 'Invoice number is required';
    if (items.length === 0) e.items = 'At least one item is required';
    items.forEach((item, i) => {
      if (!item.product_name || !String(item.product_name).trim()) e[`item_${i}_name`] = 'Item name required';
      if ((item.quantity || 0) <= 0) e[`item_${i}_qty`] = 'Qty must be > 0';
      if ((item.unit_price || 0) < 0) e[`item_${i}_price`] = 'Price cannot be negative';
    });
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const save = async (statusOverride) => {
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = getFormPayload(statusOverride);
      if (isEdit) await api.put(`/api/invoices/${id}`, payload);
      else await api.post('/api/invoices', payload);
      setToast({ msg: `Invoice ${isEdit ? 'updated' : 'created'} successfully!`, type: 'success' });
      setTimeout(() => navigate('/invoices'), 1200);
    } catch (err) {
      setToast({ msg: 'Failed to save invoice. Please try again.', type: 'error' });
    } finally { setSaving(false); }
  };

  const inputCls = (errKey) =>
    `w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors[errKey] ? 'border-red-400 bg-red-50' : 'border-gray-200'}`;

  return (
    <div className="max-w-6xl mx-auto space-y-5 pb-10">
      {toast && (
        <div className={`fixed top-6 right-6 z-50 px-4 py-3 rounded-lg shadow-lg text-white text-sm font-medium flex items-center gap-2 ${toast.type === 'error' ? 'bg-red-500' : 'bg-green-500'}`}>
          {toast.msg}<button onClick={() => setToast(null)}><X size={14} /></button>
        </div>
      )}

      {/* Top Bar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/invoices')} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <ArrowLeft size={18} className="text-gray-600" />
          </button>
          <h2 className="text-xl font-bold text-gray-800">{isEdit ? 'Edit Invoice' : 'Create Invoice'}</h2>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => save('Draft')} disabled={saving}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium text-sm transition-colors flex items-center gap-2">
            <Save size={15} /> Save as Draft
          </button>
          <button onClick={() => save()} disabled={saving}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition-colors flex items-center gap-2">
            {saving ? <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full inline-block"></span> : <Save size={15} />}
            {isEdit ? 'Update Invoice' : 'Save Invoice'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* LEFT */}
        <div className="lg:col-span-2 space-y-5">
          {/* Company Banner */}
          <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl p-5 text-white">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden">
                {settings.logo_path ? (
                  <img src={`http://localhost:5000${settings.logo_path}`} alt="Logo" className="w-full h-full object-contain" />
                ) : (
                  <span className="text-blue-700 font-black text-base">BT</span>
                )}
              </div>
              <div>
                <h3 className="text-lg font-bold">{settings.company_name}</h3>
                <p className="text-blue-200 text-xs mt-1">{settings.address}</p>
                <p className="text-blue-200 text-xs">{settings.phone} · {settings.email}</p>
                <p className="text-blue-200 text-xs">GST: {settings.gst_number}</p>
              </div>
            </div>
          </div>

          {/* Customer Section */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
            <h3 className="font-semibold text-gray-800 text-sm border-b border-gray-100 pb-3">Customer Information</h3>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Select Existing Customer</label>
              <select value={customerId} onChange={e => handleCustomerSelect(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                <option value="">-- Select customer --</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.company_name}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Company Name <span className="text-red-500">*</span></label>
                <input className={inputCls('customer_name')} value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="XYZ Technologies" />
                {errors.customer_name && <p className="text-red-500 text-xs mt-1">{errors.customer_name}</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Contact Person</label>
                <input className={inputCls('')} value={contactPerson} onChange={e => setContactPerson(e.target.value)} placeholder="John Doe" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Email</label>
                <input type="email" className={inputCls('')} value={customerEmail} onChange={e => setCustomerEmail(e.target.value)} placeholder="john@example.com" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Phone</label>
                <input className={inputCls('')} value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} placeholder="+91 98765 43210" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Billing Address</label>
                <textarea className={`${inputCls('')} resize-none`} rows={3} value={customerAddress} onChange={e => setCustomerAddress(e.target.value)} placeholder="Street, City, State, PIN" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Shipping Address</label>
                <textarea className={`${inputCls('')} resize-none`} rows={3} value={shippingAddress} onChange={e => setShippingAddress(e.target.value)} placeholder="Same as billing or different" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">GST / VAT Number</label>
              <input className={inputCls('')} value={customerGst} onChange={e => setCustomerGst(e.target.value)} placeholder="GST123456789" />
            </div>
          </div>

          {/* Items Table */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
            <h3 className="font-semibold text-gray-800 text-sm border-b border-gray-100 pb-3">Products / Services</h3>
            {errors.items && <p className="text-red-500 text-xs">{errors.items}</p>}
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[700px]">
                <thead>
                  <tr className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase">
                    <th className="text-left px-3 py-2 rounded-l-lg w-6">#</th>
                    <th className="text-left px-2 py-2 w-40">Product</th>
                    <th className="text-left px-2 py-2">Description</th>
                    <th className="text-center px-2 py-2 w-14">Qty</th>
                    <th className="text-center px-2 py-2 w-14">Unit</th>
                    <th className="text-right px-2 py-2 w-22">Price</th>
                    <th className="text-right px-2 py-2 w-14">Disc%</th>
                    <th className="text-right px-2 py-2 w-14">Tax%</th>
                    <th className="text-right px-2 py-2 w-22 rounded-r-lg">Total</th>
                    <th className="w-6"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {items.map((item, idx) => (
                    <ItemRow
                      key={idx}
                      idx={idx}
                      item={item}
                      products={products}
                      error={errors}
                      onProductSelect={handleProductSelect}
                      onUpdate={updateItem}
                      onRemove={removeItem}
                      canRemove={items.length > 1}
                    />
                  ))}
                </tbody>
              </table>
            </div>
            <button onClick={addItem}
              className="flex items-center gap-2 text-blue-600 hover:text-blue-700 border border-dashed border-blue-300 hover:border-blue-500 rounded-lg px-4 py-2 text-sm font-medium transition-colors w-full justify-center">
              <Plus size={16} /> Add Item
            </button>
          </div>

          {/* Notes */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h3 className="font-semibold text-gray-800 text-sm border-b border-gray-100 pb-3 mb-4">Notes</h3>
            <textarea className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={3} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Thank you for doing business with us." />
          </div>
        </div>

        {/* RIGHT */}
        <div className="space-y-5">
          {/* Invoice Details */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
            <h3 className="font-semibold text-gray-800 text-sm border-b border-gray-100 pb-3">Invoice Details</h3>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Invoice Number <span className="text-red-500">*</span></label>
              <input className={inputCls('invoice_number')} value={invoiceNumber} readOnly placeholder="INV-0001" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Invoice Date <span className="text-red-500">*</span></label>
              <input type="date" className={inputCls('invoice_date')} value={invoiceDate} onChange={e => setInvoiceDate(e.target.value)} />
              {errors.invoice_date && <p className="text-red-500 text-xs mt-1">{errors.invoice_date}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Due Date</label>
              <input type="date" className={inputCls('')} value={dueDate} onChange={e => setDueDate(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Payment Terms</label>
              <select className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                value={paymentTerms} onChange={e => setPaymentTerms(e.target.value)}>
                <option value="0">Due on Receipt</option>
                <option value="15">Net 15</option>
                <option value="30">Net 30</option>
                <option value="45">Net 45</option>
                <option value="60">Net 60</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Status</label>
              <select className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                value={status} onChange={e => setStatus(e.target.value)}>
                {['Draft','Sent','Paid','Pending','Overdue'].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {/* Totals */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-3">
            <h3 className="font-semibold text-gray-800 text-sm border-b border-gray-100 pb-3">Invoice Summary</h3>
            {[
              { label: 'Subtotal', value: totals.subtotal },
              { label: 'Discount', value: totals.discountTotal, neg: true },
              { label: 'Taxable Amount', value: totals.taxableAmount },
              { label: 'CGST (9%)', value: totals.cgst },
              { label: 'SGST (9%)', value: totals.sgst },
              { label: 'IGST (0%)', value: totals.igst },
            ].map(({ label, value, neg }) => (
              <div key={label} className="flex justify-between text-sm">
                <span className="text-gray-500">{label}</span>
                <span className={`font-medium ${neg && value > 0 ? 'text-red-500' : 'text-gray-700'}`}>
                  {neg && value > 0 ? '-' : ''}{formatCurrency(Math.abs(value), 'INR')}
                </span>
              </div>
            ))}
            <div className="border-t border-gray-200 pt-3 flex justify-between">
              <span className="font-bold text-gray-800">Grand Total</span>
              <span className="font-bold text-blue-600 text-lg">{formatCurrency(totals.grandTotal, 'INR')}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Memoized row to prevent re-rendering all rows when one changes
const ItemRow = React.memo(function ItemRow({ idx, item, products, error, onProductSelect, onUpdate, onRemove, canRemove }) {
  return (
    <tr>
      <td className="px-3 py-2 text-gray-400 text-xs">{idx + 1}</td>
      <td className="px-2 py-2">
        <select value="" onChange={e => onProductSelect(idx, e.target.value)}
          className="w-full text-xs border border-gray-200 rounded px-2 py-1 mb-1 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white">
          <option value="">Pick product...</option>
          {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <input
          className={`w-full text-xs border rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 ${error[`item_${idx}_name`] ? 'border-red-400' : 'border-gray-200'}`}
          value={item.product_name}
          onChange={e => onUpdate(idx, 'product_name', e.target.value)}
          placeholder="Item name"
        />
      </td>
      <td className="px-2 py-2">
        <input className="w-full text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
          value={item.description} onChange={e => onUpdate(idx, 'description', e.target.value)} placeholder="Description" />
      </td>
      <td className="px-2 py-2">
        <input type="number" min="0.01" step="0.01"
          className={`w-full text-xs text-center border rounded px-1 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 ${error[`item_${idx}_qty`] ? 'border-red-400' : 'border-gray-200'}`}
          value={item.quantity} onChange={e => onUpdate(idx, 'quantity', parseFloat(e.target.value) || 0)} />
      </td>
      <td className="px-2 py-2">
        <input className="w-full text-xs text-center border border-gray-200 rounded px-1 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
          value={item.unit} onChange={e => onUpdate(idx, 'unit', e.target.value)} />
      </td>
      <td className="px-2 py-2">
        <input type="number" min="0" step="0.01"
          className={`w-full text-xs text-right border rounded px-1 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 ${error[`item_${idx}_price`] ? 'border-red-400' : 'border-gray-200'}`}
          value={item.unit_price} onChange={e => onUpdate(idx, 'unit_price', parseFloat(e.target.value) || 0)} />
      </td>
      <td className="px-2 py-2">
        <input type="number" min="0" max="100" step="0.01"
          className="w-full text-xs text-right border border-gray-200 rounded px-1 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
          value={item.discount} onChange={e => onUpdate(idx, 'discount', parseFloat(e.target.value) || 0)} />
      </td>
      <td className="px-2 py-2">
        <input type="number" min="0" max="100" step="0.01"
          className="w-full text-xs text-right border border-gray-200 rounded px-1 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
          value={item.tax_rate} onChange={e => onUpdate(idx, 'tax_rate', parseFloat(e.target.value) || 0)} />
      </td>
      <td className="px-2 py-2 text-right text-xs font-semibold text-gray-700">
        {formatCurrency(item.total, 'INR')}
      </td>
      <td className="px-2 py-2 text-center">
        <button onClick={() => onRemove(idx)} disabled={!canRemove}
          className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 disabled:opacity-30 transition-colors">
          <Trash2 size={13} />
        </button>
      </td>
    </tr>
  );
});
