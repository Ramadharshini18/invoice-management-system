import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Eye, Pencil, Trash2, Download, Copy, ChevronLeft, ChevronRight, Filter, X } from 'lucide-react';
import api from '../utils/api';
import { useApp } from '../context/AppContext';

import { formatCurrency, formatDate } from '../utils/calculations';
import { generateInvoicePDF } from '../utils/pdfGenerator';

const statusConfig = {
  Draft:   { color: 'bg-gray-100 text-gray-700',     dot: 'bg-gray-400' },
  Sent:    { color: 'bg-blue-100 text-blue-700',     dot: 'bg-blue-500' },
  Paid:    { color: 'bg-green-100 text-green-700',   dot: 'bg-green-500' },
  Pending: { color: 'bg-orange-100 text-orange-700', dot: 'bg-orange-500' },
  Overdue: { color: 'bg-red-100 text-red-700',       dot: 'bg-red-500' },
};

function StatusBadge({ status }) {
  const cfg = statusConfig[status] || statusConfig.Draft;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${cfg.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`}></span>
      {status}
    </span>
  );
}

const PAGE_SIZE = 10;

export default function Invoices() {
  const navigate = useNavigate();
  const { settings } = useApp();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [page, setPage] = useState(1);
  const [deleteModal, setDeleteModal] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => { fetchInvoices(); }, []);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/invoices');
      if (res.data.success) setInvoices(res.data.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const filtered = invoices
    .filter(inv => {
      const q = search.toLowerCase();
      const matchSearch = !q || inv.invoice_number?.toLowerCase().includes(q) || inv.customer_name?.toLowerCase().includes(q);
      const matchStatus = statusFilter === 'All' || inv.status === statusFilter;
      const matchFrom = !dateFrom || inv.invoice_date >= dateFrom;
      const matchTo = !dateTo || inv.invoice_date <= dateTo;
      return matchSearch && matchStatus && matchFrom && matchTo;
    })
    .sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.created_at) - new Date(a.created_at);
      if (sortBy === 'oldest') return new Date(a.created_at) - new Date(b.created_at);
      if (sortBy === 'amount-desc') return (b.grand_total || 0) - (a.grand_total || 0);
      if (sortBy === 'amount-asc')  return (a.grand_total || 0) - (b.grand_total || 0);
      return 0;
    });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleDelete = async () => {
    try {
      await api.delete(`/api/invoices/${deleteModal.id}`);
      setInvoices(prev => prev.filter(i => i.id !== deleteModal.id));
      setDeleteModal(null);
      showToast('Invoice deleted successfully');
    } catch (err) { showToast('Failed to delete invoice', 'error'); }
  };

  const handleDuplicate = async (inv) => {
    try {
      const detailRes = await api.get(`/api/invoices/${inv.id}`);
      const detail = detailRes.data.data;
      const numRes = await api.get('/api/invoices/next-number');
      const newNumber = numRes.data.data;
      const payload = {
        ...detail,
        id: undefined,
        invoice_number: newNumber,
        status: 'Draft',
        invoice_date: new Date().toISOString().split('T')[0],
        items: detail.items,
      };
      await api.post('/api/invoices', payload);
      showToast(`Invoice duplicated as ${newNumber}`);
      fetchInvoices();
    } catch (err) { showToast('Failed to duplicate invoice', 'error'); }
  };

  const handleDownloadPDF = async (inv) => {
    try {
      const res = await api.get(`/api/invoices/${inv.id}`);
      if (res.data.success) generateInvoicePDF(res.data.data, settings);
    } catch (err) { console.error(err); }
  };

  const counts = { Draft: 0, Sent: 0, Paid: 0, Pending: 0, Overdue: 0 };
  invoices.forEach(i => { if (counts[i.status] !== undefined) counts[i.status]++; });

  return (
    <div className="space-y-5">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 px-4 py-3 rounded-lg shadow-lg text-white text-sm font-medium flex items-center gap-2 ${toast.type === 'error' ? 'bg-red-500' : 'bg-green-500'}`}>
          {toast.msg}
          <button onClick={() => setToast(null)}><X size={14} /></button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold text-gray-800">All Invoices</h2>
        <button
          onClick={() => navigate('/invoices/new')}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg font-medium text-sm transition-colors"
        >
          <Plus size={16} /> Create Invoice
        </button>
      </div>

      {/* Status Summary */}
      <div className="grid grid-cols-5 gap-3">
        {Object.entries(counts).map(([status, count]) => (
          <button
            key={status}
            onClick={() => { setStatusFilter(statusFilter === status ? 'All' : status); setPage(1); }}
            className={`rounded-xl border p-3 text-center transition-all ${statusFilter === status ? 'border-blue-500 bg-blue-50' : 'border-gray-100 bg-white hover:border-gray-200'}`}
          >
            <div className="text-xl font-bold text-gray-800">{count}</div>
            <div className={`text-xs font-medium mt-0.5 ${statusConfig[status]?.color.split(' ')[1] || 'text-gray-500'}`}>{status}</div>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-48">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search invoices..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white min-w-32"
          >
            <option value="All">All Status</option>
            {['Draft','Sent','Paid','Pending','Overdue'].map(s => <option key={s}>{s}</option>)}
          </select>
          <input
            type="date"
            value={dateFrom}
            onChange={e => { setDateFrom(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="date"
            value={dateTo}
            onChange={e => { setDateTo(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="amount-desc">Amount: High → Low</option>
            <option value="amount-asc">Amount: Low → High</option>
          </select>
          {(search || statusFilter !== 'All' || dateFrom || dateTo) && (
            <button
              onClick={() => { setSearch(''); setStatusFilter('All'); setDateFrom(''); setDateTo(''); setPage(1); }}
              className="flex items-center gap-1 px-3 py-2 text-gray-500 hover:text-red-500 text-sm border border-gray-200 rounded-lg hover:border-red-200 transition-colors"
            >
              <X size={14} /> Clear
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : paginated.length === 0 ? (
          <div className="text-center py-16">
            <Filter size={40} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500 font-medium">No invoices found</p>
            <p className="text-gray-400 text-sm mt-1">Try adjusting your filters or create a new invoice</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                    <th className="text-left px-5 py-3">#</th>
                    <th className="text-left px-4 py-3">Invoice No</th>
                    <th className="text-left px-4 py-3">Customer</th>
                    <th className="text-left px-4 py-3">Date</th>
                    <th className="text-left px-4 py-3">Due Date</th>
                    <th className="text-right px-4 py-3">Amount</th>
                    <th className="text-center px-4 py-3">Status</th>
                    <th className="text-center px-5 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {paginated.map((inv, idx) => (
                    <tr key={inv.id} className="hover:bg-gray-50/70 transition-colors">
                      <td className="px-5 py-3.5 text-gray-400 text-sm">{(page - 1) * PAGE_SIZE + idx + 1}</td>
                      <td className="px-4 py-3.5">
                        <span className="font-semibold text-blue-600 text-sm">{inv.invoice_number}</span>
                      </td>
                      <td className="px-4 py-3.5 text-sm text-gray-700 font-medium">{inv.customer_name}</td>
                      <td className="px-4 py-3.5 text-sm text-gray-500">{formatDate(inv.invoice_date)}</td>
                      <td className="px-4 py-3.5 text-sm text-gray-500">{formatDate(inv.due_date)}</td>
                      <td className="px-4 py-3.5 text-sm font-semibold text-gray-800 text-right">
                        {formatCurrency(inv.grand_total, 'INR')}
                      </td>
                      <td className="px-4 py-3.5 text-center"><StatusBadge status={inv.status} /></td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-center gap-0.5">
                          <button onClick={() => navigate(`/invoices/${inv.id}/view`)} title="View"
                            className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors">
                            <Eye size={15} />
                          </button>
                          <button onClick={() => navigate(`/invoices/${inv.id}/edit`)} title="Edit"
                            className="p-1.5 rounded-lg hover:bg-amber-50 text-gray-400 hover:text-amber-600 transition-colors">
                            <Pencil size={15} />
                          </button>
                          <button onClick={() => handleDuplicate(inv)} title="Duplicate"
                            className="p-1.5 rounded-lg hover:bg-purple-50 text-gray-400 hover:text-purple-600 transition-colors">
                            <Copy size={15} />
                          </button>
                          <button onClick={() => handleDownloadPDF(inv)} title="Download PDF"
                            className="p-1.5 rounded-lg hover:bg-green-50 text-gray-400 hover:text-green-600 transition-colors">
                            <Download size={15} />
                          </button>
                          <button onClick={() => setDeleteModal(inv)} title="Delete"
                            className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
                <p className="text-sm text-gray-500">
                  Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition-colors"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${p === page ? 'bg-blue-600 text-white' : 'hover:bg-gray-100 text-gray-600'}`}
                    >
                      {p}
                    </button>
                  ))}
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="p-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition-colors"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Delete Modal */}
      {deleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
              <Trash2 size={22} className="text-red-500" />
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">Delete Invoice</h3>
            <p className="text-gray-500 text-sm mb-6">
              Are you sure you want to delete <strong>{deleteModal.invoice_number}</strong>? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteModal(null)}
                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 font-medium text-sm transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium text-sm transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
