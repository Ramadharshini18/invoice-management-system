import React, { useState, useEffect } from 'react';
import { Package, Plus, Search, Pencil, Trash2, X } from 'lucide-react';
import api from '../utils/api';
import { useApp } from '../context/AppContext';

const CATS = ['Electronics','Software','Services','Stationery','Hardware','Other'];

export default function Products() {
  const { refreshProducts } = useApp();
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [errors, setErrors] = useState({});

  // Individual field states — no re-render cascade
  const [fName, setFName] = useState('');
  const [fSku, setFSku] = useState('');
  const [fDesc, setFDesc] = useState('');
  const [fCat, setFCat] = useState('Electronics');
  const [fUnit, setFUnit] = useState('pcs');
  const [fPrice, setFPrice] = useState(0);
  const [fTax, setFTax] = useState(18);

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const r = await api.get('/api/products');
      if (r.data.success) setProducts(r.data.data);
    } catch (e) { console.error(e); }
  };

  const toast_ = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

  const openAdd = () => {
    setEditId(null); setErrors({});
    setFName(''); setFSku(''); setFDesc(''); setFCat('Electronics');
    setFUnit('pcs'); setFPrice(0); setFTax(18);
    setShowModal(true);
  };

  const openEdit = (p) => {
    setEditId(p.id); setErrors({});
    setFName(p.name || ''); setFSku(p.sku || ''); setFDesc(p.description || '');
    setFCat(p.category || 'Electronics'); setFUnit(p.unit || 'pcs');
    setFPrice(p.price ?? 0); setFTax(p.tax_rate ?? 18);
    setShowModal(true);
  };

  const validate = () => {
    const e = {};
    if (!fName.trim()) e.name = 'Product name is required';
    if (Number(fPrice) < 0) e.price = 'Price cannot be negative';
    setErrors(e);
    return !Object.keys(e).length;
  };

  const save = async () => {
    if (!validate()) return;
    setSaving(true);
    const body = { name: fName, sku: fSku, description: fDesc, category: fCat, unit: fUnit, price: Number(fPrice), tax_rate: Number(fTax) };
    try {
      if (editId) await api.put(`/api/products/${editId}`, body);
      else await api.post('/api/products', body);
      setShowModal(false); load(); refreshProducts();
      toast_(editId ? 'Product updated' : 'Product added');
    } catch (e) { toast_(e.response?.data?.message || 'Failed to save', 'error'); }
    finally { setSaving(false); }
  };

  const del = async () => {
    try {
      await api.delete(`/api/products/${deleteTarget.id}`);
      setDeleteTarget(null); load(); refreshProducts();
      toast_('Product deleted');
    } catch (e) { toast_('Failed to delete', 'error'); }
  };

  const filtered = products.filter(p => {
    const q = search.toLowerCase();
    return (!q || p.name?.toLowerCase().includes(q) || p.sku?.toLowerCase().includes(q))
      && (catFilter === 'All' || p.category === catFilter);
  });

  const fmt = (v) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 }).format(v || 0);
  const cls = `w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500`;

  return (
    <div className="space-y-5">
      {toast && <div className={`fixed top-6 right-6 z-50 px-4 py-3 rounded-lg shadow-lg text-white text-sm font-medium flex items-center gap-2 ${toast.type === 'error' ? 'bg-red-500' : 'bg-green-500'}`}>{toast.msg}<button onClick={() => setToast(null)}><X size={14} /></button></div>}

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div><h2 className="text-xl font-bold text-gray-800">Products & Services</h2><p className="text-gray-500 text-sm">{products.length} total items</p></div>
        <button onClick={openAdd} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg font-medium text-sm"><Plus size={16} />Add Product</button>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input type="text" placeholder="Search products..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
        <select value={catFilter} onChange={e => setCatFilter(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="All">All Categories</option>
          {CATS.map(c => <option key={c}>{c}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-16"><Package size={40} className="mx-auto text-gray-300 mb-3" /><p className="text-gray-500">No products found</p><button onClick={openAdd} className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">Add Product</button></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase border-b border-gray-100">
                <th className="text-left px-5 py-3">#</th><th className="text-left px-4 py-3">Product</th><th className="text-left px-4 py-3">SKU</th><th className="text-left px-4 py-3">Category</th><th className="text-left px-4 py-3">Unit</th><th className="text-right px-4 py-3">Price</th><th className="text-right px-4 py-3">Tax</th><th className="text-center px-4 py-3">Actions</th>
              </tr></thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((p, i) => (
                  <tr key={p.id} className="hover:bg-gray-50/70">
                    <td className="px-5 py-3.5 text-gray-400 text-sm">{i+1}</td>
                    <td className="px-4 py-3.5"><p className="font-semibold text-gray-800 text-sm">{p.name}</p>{p.description && <p className="text-gray-400 text-xs truncate max-w-xs">{p.description}</p>}</td>
                    <td className="px-4 py-3.5 text-sm font-mono text-gray-500">{p.sku||'—'}</td>
                    <td className="px-4 py-3.5"><span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">{p.category||'—'}</span></td>
                    <td className="px-4 py-3.5 text-sm text-gray-500">{p.unit}</td>
                    <td className="px-4 py-3.5 text-sm font-semibold text-gray-800 text-right">{fmt(p.price)}</td>
                    <td className="px-4 py-3.5 text-sm text-gray-500 text-right">{p.tax_rate}%</td>
                    <td className="px-4 py-3.5"><div className="flex items-center justify-center gap-1">
                      <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg hover:bg-amber-50 text-gray-400 hover:text-amber-600"><Pencil size={15} /></button>
                      <button onClick={() => setDeleteTarget(p)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500"><Trash2 size={15} /></button>
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
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-800">{editId ? 'Edit Product' : 'Add Product'}</h3>
              <button onClick={() => setShowModal(false)} className="p-2 rounded-lg hover:bg-gray-100"><X size={18} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Product Name <span className="text-red-500">*</span></label>
                <input className={`${cls} ${errors.name ? 'border-red-400' : ''}`} value={fName} onChange={e => setFName(e.target.value)} placeholder="Business Laptop" />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">SKU</label>
                  <input className={cls} value={fSku} onChange={e => setFSku(e.target.value)} placeholder="LAP-001" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Category</label>
                  <select className={`${cls} bg-white`} value={fCat} onChange={e => setFCat(e.target.value)}>{CATS.map(c => <option key={c}>{c}</option>)}</select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Description</label>
                <textarea className={`${cls} resize-none`} rows={2} value={fDesc} onChange={e => setFDesc(e.target.value)} placeholder="Product description..." />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Unit</label>
                  <input className={cls} value={fUnit} onChange={e => setFUnit(e.target.value)} placeholder="pcs" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Price (₹) <span className="text-red-500">*</span></label>
                  <input type="number" min="0" step="0.01" className={`${cls} ${errors.price ? 'border-red-400' : ''}`} value={fPrice} onChange={e => setFPrice(e.target.value)} />
                  {errors.price && <p className="text-red-500 text-xs mt-1">{errors.price}</p>}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Tax Rate (%)</label>
                  <input type="number" min="0" max="100" step="0.01" className={cls} value={fTax} onChange={e => setFTax(e.target.value)} />
                </div>
              </div>
            </div>
            <div className="flex gap-3 px-6 py-4 border-t border-gray-100">
              <button onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 font-medium text-sm">Cancel</button>
              <button onClick={save} disabled={saving} className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm flex items-center justify-center gap-2">
                {saving && <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full inline-block"></span>}
                {editId ? 'Save Changes' : 'Add Product'}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4"><Trash2 size={22} className="text-red-500" /></div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">Delete Product</h3>
            <p className="text-gray-500 text-sm mb-6">Delete <strong>{deleteTarget.name}</strong>? This cannot be undone.</p>
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
