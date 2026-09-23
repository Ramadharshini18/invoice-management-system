import React, { useState, useEffect } from 'react';
import { Save, Upload, Building2, FileText, X, CheckCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import api from '../utils/api';

export default function Settings() {
  const { refreshSettings } = useApp();
  const [tab, setTab] = useState('company');

  // Company fields — individual state = no cross-field re-renders
  const [companyName, setCompanyName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [gstNumber, setGstNumber] = useState('');

  // Invoice settings
  const [invoicePrefix, setInvoicePrefix] = useState('INV');
  const [startingNumber, setStartingNumber] = useState(1);
  const [nextNumber, setNextNumber] = useState(5);
  const [defaultTaxRate, setDefaultTaxRate] = useState(18);
  const [defaultPaymentTerms, setDefaultPaymentTerms] = useState('30');
  const [currency, setCurrency] = useState('INR');
  const [logoPath, setLogoPath] = useState('');

  const [logoPreview, setLogoPreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => { fetchSettings(); }, []);

  const fetchSettings = async () => {
    try {
      const res = await api.get('/api/settings');
      if (res.data.success) {
        const s = res.data.data;
        setCompanyName(s.company_name || '');
        setAddress(s.address || '');
        setPhone(s.phone || '');
        setEmail(s.email || '');
        setWebsite(s.website || '');
        setGstNumber(s.gst_number || '');
        setInvoicePrefix(s.invoice_prefix || 'INV');
        setStartingNumber(s.starting_number || 1);
        setNextNumber(s.next_number || 5);
        setDefaultTaxRate(s.default_tax_rate || 18);
        setDefaultPaymentTerms(s.default_payment_terms || '30');
        setCurrency(s.currency || 'INR');
        setLogoPath(s.logo_path || '');
        if (s.logo_path) setLogoPreview(`/uploads/${s.logo_path.replace(/.*\/uploads\//, '')}`);
      }
    } catch (err) { console.error('Settings fetch error:', err); }
  };

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        company_name: companyName, address, phone, email, website,
        gst_number: gstNumber, invoice_prefix: invoicePrefix,
        starting_number: Number(startingNumber), next_number: Number(nextNumber),
        default_tax_rate: Number(defaultTaxRate),
        default_payment_terms: String(defaultPaymentTerms),
        currency, logo_path: logoPath
      };
      const res = await api.put('/api/settings', payload);
      if (res.data.success) {
        showToast('Settings saved successfully!');
        refreshSettings();
      } else {
        showToast(res.data.message || 'Failed to save', 'error');
      }
    } catch (err) {
      console.error('Save error:', err);
      showToast('Failed to save settings: ' + (err.response?.data?.message || err.message), 'error');
    } finally { setSaving(false); }
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('logo', file);
    try {
      const res = await api.post('/api/settings/logo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data.success) {
        setLogoPreview(res.data.logoUrl);
        setLogoPath(res.data.logo_path);
        showToast('Logo uploaded!');
        refreshSettings();
      }
    } catch (err) { showToast('Failed to upload logo', 'error'); }
  };

  const cls = 'w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {toast && (
        <div className={`fixed top-6 right-6 z-50 px-4 py-3 rounded-lg shadow-lg text-white text-sm font-medium flex items-center gap-2 ${toast.type === 'error' ? 'bg-red-500' : 'bg-green-500'}`}>
          <CheckCircle size={16} />{toast.msg}
          <button onClick={() => setToast(null)}><X size={14} /></button>
        </div>
      )}

      <div>
        <h2 className="text-xl font-bold text-gray-800">Settings</h2>
        <p className="text-gray-500 text-sm mt-0.5">Manage your company and invoice preferences</p>
      </div>

      {/* Tabs */}
      <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
        {[{ key:'company', label:'Company Information', icon: Building2 }, { key:'invoice', label:'Invoice Settings', icon: FileText }].map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${tab === key ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-800'}`}>
            <Icon size={15} />{label}
          </button>
        ))}
      </div>

      {tab === 'company' && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-5">
          <h3 className="font-semibold text-gray-800 border-b border-gray-100 pb-3">Company Information</h3>

          {/* Logo upload */}
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50 overflow-hidden flex-shrink-0">
              {logoPreview
                ? <img src={logoPreview} alt="Logo" className="w-full h-full object-contain" onError={() => setLogoPreview(null)} />
                : <div className="w-10 h-10 bg-blue-700 rounded-lg flex items-center justify-center"><span className="text-white font-black text-xs">BT</span></div>
              }
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-1">Company Logo</p>
              <p className="text-xs text-gray-500 mb-2">PNG, JPG or SVG · Max 5MB</p>
              <label className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors">
                <Upload size={14} />Upload Logo
                <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
              </label>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Company Name</label>
              <input className={cls} value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="ABC Company" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Address</label>
              <textarea className={`${cls} resize-none`} rows={2} value={address} onChange={e => setAddress(e.target.value)} placeholder="123 Business Park..." />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Phone</label>
              <input className={cls} value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 98765 43210" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Email</label>
              <input type="email" className={cls} value={email} onChange={e => setEmail(e.target.value)} placeholder="billing@company.com" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Website</label>
              <input className={cls} value={website} onChange={e => setWebsite(e.target.value)} placeholder="www.company.com" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">GST / VAT Number</label>
              <input className={cls} value={gstNumber} onChange={e => setGstNumber(e.target.value)} placeholder="GST123456789" />
            </div>
          </div>

          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium text-sm transition-colors">
            {saving ? <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full inline-block"></span> : <Save size={15} />}
            Save Company Info
          </button>
        </div>
      )}

      {tab === 'invoice' && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-5">
          <h3 className="font-semibold text-gray-800 border-b border-gray-100 pb-3">Invoice Settings</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Invoice Prefix</label>
              <input className={cls} value={invoicePrefix} onChange={e => setInvoicePrefix(e.target.value)} placeholder="INV" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Starting Number</label>
              <input type="number" min="1" className={cls} value={startingNumber} onChange={e => setStartingNumber(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Default Tax Rate (%)</label>
              <input type="number" min="0" max="100" step="0.01" className={cls} value={defaultTaxRate} onChange={e => setDefaultTaxRate(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Default Payment Terms</label>
              <select className={`${cls} bg-white`} value={defaultPaymentTerms} onChange={e => setDefaultPaymentTerms(e.target.value)}>
                <option value="0">Due on Receipt</option>
                <option value="15">Net 15</option>
                <option value="30">Net 30</option>
                <option value="45">Net 45</option>
                <option value="60">Net 60</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Currency</label>
              <select className={`${cls} bg-white`} value={currency} onChange={e => setCurrency(e.target.value)}>
                <option value="INR">INR — Indian Rupee (₹)</option>
                <option value="USD">USD — US Dollar ($)</option>
                <option value="EUR">EUR — Euro (€)</option>
                <option value="GBP">GBP — British Pound (£)</option>
              </select>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
            <p className="text-blue-800 text-sm font-semibold mb-1">Next Invoice Number</p>
            <p className="text-blue-600 text-xs">
              Next invoice: <strong className="text-blue-800 font-mono text-sm">
                {(invoicePrefix || 'INV').toUpperCase()}-{String(nextNumber || startingNumber || 1).padStart(4, '0')}
              </strong>
            </p>
          </div>

          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium text-sm transition-colors">
            {saving ? <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full inline-block"></span> : <Save size={15} />}
            Save Invoice Settings
          </button>
        </div>
      )}
    </div>
  );
}
