import React, { useState, useEffect } from 'react';
import { Users, Plus, Search, Pencil, Trash2, X, FileText } from 'lucide-react';
import api from '../utils/api';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';

export default function Customers() {
  const navigate = useNavigate();
  const { refreshCustomers } = useApp();
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  // Individual field states — no object merging = no lag
  const [fCompany, setFCompany] = useState('');
  const [fContact, setFContact] = useState('');
  const [fEmail, setFEmail] = useState('');
  const [fPhone, setFPhone] = useState('');
  const [fAddress, setFAddress] = useState('');
  const [fCity, setFCity] = useState('');
  const [fState, setFState] = useState('');
  const [fCountry, setFCountry] = useState('India');
  const [fPostal, setFPostal] = useState('');
  const [fGst, setFGst] = useState('');
  const [errors, setErrors] = useState({});

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const r = await api.get('/api/customers');
      if (r.data.success) setCustomers(r.data.data);
    } catch (e) { console.error(e); }
  };

  const toast_ = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

  const openAdd = () => {
    setEditId(null); setErrors({});
    setFCompany(''); setFContact(''); setFEmail(''); setFPhone('');
    setFAddress(''); setFCity(''); setFState(''); setFCountry('India');
    setFPostal(''); setFGst('');
    setShowModal(true);
  };

  const openEdit = (c) => {
    setEditId(c.id); setErrors({});
    setFCompany(c.company_name || ''); setFContact(c.contact_person || '');
    setFEmail(c.email || ''); setFPhone(c.phone || '');
    setFAddress(c.address || ''); setFCity(c.city || '');
    setFState(c.state || ''); setFCountry(c.country || 'India');
    setFPostal(c.postal_code || ''); setFGst(c.gst_number || '');
    setShowModal(true);
  };

  const validate = () => {
    const e = {};
    if (!fCompany.trim()) e.company = 'Company name is required';
    setErrors(e);
    return !Object.keys(e).length;
  };

  const save = async () => {
    if (!validate()) return;
    setSaving(true);
    const body = { company_name: fCompany, contact_person: fContact, email: fEmail, phone: fPhone, address: fAddress, city: fCity, state: fState, country: fCountry, postal_code: fPostal, gst_number: fGst };
    try {
      if (editId) await api.put(`/api/customers/${editId}`, body);
      else await api.post('/api/customers', body);
      setShowModal(false); load(); refreshCustomers();
      toast_(editId ? 'Customer updated' : 'Customer added');
    } catch (e) { toast_(e.response?.data?.message || 'Failed to save', 'error'); }
    finally { setSaving(false); }
  };

  const del = async () => {
    try {
      await api.delete(`/api/customers/${deleteTarget.id}`);
      setDeleteTarget(null); load(); refreshCustomers();
      toast_('Customer deleted');
    } catch (e) { toast_('Failed to delete', 'error'); }
  };

  const filtered = customers.filter(c => !search || c.company_name?.toLowerCase().includes(search.toLowerCase()) || c.email?.toLowerCase().includes(search.toLowerCase()));
  const cls = `w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500`;

  return (
    <div className="space-y-5">
      {toast && <div className={`fixed top-6 right-6 z-50 px-4 py-3 rounded-lg shadow-lg text-white text-sm font-medium flex items-center gap-2 ${toast.type === 'error' ? 'bg-red-500' : 'bg-green-500'}`}>{toast.msg}<button onClick={() => setToast(null)}><X size={14} /></button></div>}

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div><h2 className="text-xl font-bold text-gray-800">Customers</h2><p className="text-gray-500 text-sm">{customers.length} total</p></div>
        <button onClick={openAdd} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg font-medium text-sm"><Plus size={16} />Add Customer</button>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <div className="relative max-w-sm"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input type="text" placeholder="Search customers..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-16"><Users size={40} className="mx-auto text-gray-300 mb-3" /><p className="text-gray-500">No customers found</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase border-b border-gray-100">
                <th className="text-left px-5 py-3">#</th><th className="text-left px-4 py-3">Company</th><th className="text-left px-4 py-3">Contact</th><th className="text-left px-4 py-3">Email</th><th className="text-left px-4 py-3">Phone</th><th className="text-left px-4 py-3">City</th><th className="text-left px-4 py-3">GST</th><th className="text-center px-4 py-3">Actions</th>
              </tr></thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((c, i) => (
                  <tr key={c.id} className="hover:bg-gray-50/70">
                    <td className="px-5 py-3.5 text-gray-400 text-sm">{i+1}</td>
                    <td className="px-4 py-3.5"><div className="flex items-center gap-2"><div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center"><span className="text-blue-600 font-bold text-xs">{c.company_name?.charAt(0)}</span></div><span className="font-semibold text-gray-800 text-sm">{c.company_name}</span></div></td>
                    <td className="px-4 py-3.5 text-sm text-gray-600">{c.contact_person||'—'}</td>
                    <td className="px-4 py-3.5 text-sm text-gray-500">{c.email||'—'}</td>
                    <td className="px-4 py-3.5 text-sm text-gray-500">{c.phone||'—'}</td>
                    <td className="px-4 py-3.5 text-sm text-gray-500">{c.city||'—'}</td>
                    <td className="px-4 py-3.5 text-xs font-mono text-gray-500">{c.gst_number||'—'}</td>
                    <td className="px-4 py-3.5"><div className="flex items-center justify-center gap-1">
                      <button onClick={() => navigate('/invoices')} title="View Invoices" className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600"><FileText size={15} /></button>
                      <button onClick={() => openEdit(c)} title="Edit" className="p-1.5 rounded-lg hover:bg-amber-50 text-gray-400 hover:text-amber-600"><Pencil size={15} /></button>
                      <button onClick={() => setDeleteTarget(c)} title="Delete" className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500"><Trash2 size={15} /></button>
                    </div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-800">{editId ? 'Edit Customer' : 'Add Customer'}</h3>
              <button onClick={() => setShowModal(false)} className="p-2 rounded-lg hover:bg-gray-100"><X size={18} /></button>
            </div>
            <div className="p-6 grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Company Name <span className="text-red-500">*</span></label>
                <input className={`${cls} ${errors.company ? 'border-red-400' : 'border-gray-200'}`} value={fCompany} onChange={e => setFCompany(e.target.value)} placeholder="XYZ Technologies" />
                {errors.company && <p className="text-red-500 text-xs mt-1">{errors.company}</p>}
              </div>
              {[
                [fContact, setFContact, 'Contact Person', 'John Doe'],
                [fEmail,   setFEmail,   'Email',          'john@example.com'],
                [fPhone,   setFPhone,   'Phone',          '+91 98765 43210'],
                [fGst,     setFGst,     'GST Number',     'GST123456789'],
              ].map(([val, set, label, ph]) => (
                <div key={label}>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">{label}</label>
                  <input className={`${cls} border-gray-200`} value={val} onChange={e => set(e.target.value)} placeholder={ph} />
                </div>
              ))}
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Address</label>
                <input className={`${cls} border-gray-200`} value={fAddress} onChange={e => setFAddress(e.target.value)} placeholder="Street address" />
              </div>
              {[
                [fCity,    setFCity,    'City',        'Mumbai'],
                [fState,   setFState,   'State',       'Maharashtra'],
                [fCountry, setFCountry, 'Country',     'India'],
                [fPostal,  setFPostal,  'Postal Code', '400001'],
              ].map(([val, set, label, ph]) => (
                <div key={label}>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">{label}</label>
                  <input className={`${cls} border-gray-200`} value={val} onChange={e => set(e.target.value)} placeholder={ph} />
                </div>
              ))}
            </div>
            <div className="flex gap-3 px-6 py-4 border-t border-gray-100">
              <button onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 font-medium text-sm">Cancel</button>
              <button onClick={save} disabled={saving} className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm flex items-center justify-center gap-2">
                {saving && <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full inline-block"></span>}
                {editId ? 'Save Changes' : 'Add Customer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4"><Trash2 size={22} className="text-red-500" /></div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">Delete Customer</h3>
            <p className="text-gray-500 text-sm mb-6">Delete <strong>{deleteTarget.company_name}</strong>? This cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 font-medium text-sm">Cancel</button>
              <button onClick={del} className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium text-sm">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
