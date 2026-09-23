import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, CheckCircle, Clock, Edit3, TrendingUp, Plus, Eye, Pencil, Download, ArrowUpRight } from 'lucide-react';
import api from '../utils/api';
import { useApp } from '../context/AppContext';
import { formatCurrency, formatDate } from '../utils/calculations';
import { generateInvoicePDF } from '../utils/pdfGenerator';


const statusConfig = {
  Draft:   { color: 'bg-gray-100 text-gray-700',   dot: 'bg-gray-400' },
  Sent:    { color: 'bg-blue-100 text-blue-700',   dot: 'bg-blue-500' },
  Paid:    { color: 'bg-green-100 text-green-700', dot: 'bg-green-500' },
  Pending: { color: 'bg-orange-100 text-orange-700', dot: 'bg-orange-500' },
  Overdue: { color: 'bg-red-100 text-red-700',     dot: 'bg-red-500' },
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

function StatCard({ title, value, icon: Icon, color, bg, trend }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}>
        <Icon size={22} className={color} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-gray-500 text-sm font-medium truncate">{title}</p>
        <p className="text-2xl font-bold text-gray-800 mt-0.5">{value}</p>
      </div>
      {trend && (
        <div className="flex items-center gap-1 text-green-600 text-xs font-medium">
          <ArrowUpRight size={14} />
          {trend}
        </div>
      )}
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { settings } = useApp();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      const res = await api.get('/api/invoices');
      if (res.data.success) setInvoices(res.data.data);
    } catch (err) {
      console.error('Failed to load invoices', err);
    } finally {
      setLoading(false);
    }
  };

  const stats = {
    total: invoices.length,
    draft: invoices.filter(i => i.status === 'Draft').length,
    paid: invoices.filter(i => i.status === 'Paid').length,
    pending: invoices.filter(i => i.status === 'Pending' || i.status === 'Overdue').length,
    revenue: invoices.filter(i => i.status === 'Paid').reduce((s, i) => s + (i.grand_total || 0), 0),
  };

  const recent = [...invoices].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 10);

  const handleDownloadPDF = async (inv) => {
    try {
      const res = await api.get(`/api/invoices/${inv.id}`);
      if (res.data.success) generateInvoicePDF(res.data.data, settings);
    } catch (err) { console.error('PDF error', err); }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Row */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Welcome back 👋</h2>
          <p className="text-gray-500 text-sm mt-1">Here's your business overview</p>
        </div>
        <button
          onClick={() => navigate('/invoices/new')}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg font-medium text-sm transition-colors shadow-sm shadow-blue-200"
        >
          <Plus size={16} />
          Create Invoice
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
        <StatCard title="Total Invoices" value={stats.total} icon={FileText}     color="text-blue-600"   bg="bg-blue-50"   trend={stats.total > 0 ? '+' + stats.total : null} />
        <StatCard title="Draft"          value={stats.draft} icon={Edit3}        color="text-gray-600"   bg="bg-gray-100"  />
        <StatCard title="Paid"           value={stats.paid}  icon={CheckCircle}  color="text-green-600"  bg="bg-green-50"  />
        <StatCard title="Pending"        value={stats.pending} icon={Clock}      color="text-orange-500" bg="bg-orange-50" />
        <StatCard
          title="Total Revenue"
          value={formatCurrency(stats.revenue, settings.currency)}
          icon={TrendingUp}
          color="text-purple-600"
          bg="bg-purple-50"
        />
      </div>

      {/* Recent Invoices */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-base font-semibold text-gray-800">Recent Invoices</h3>
          <button
            onClick={() => navigate('/invoices')}
            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            View All →
          </button>
        </div>

        {recent.length === 0 ? (
          <div className="text-center py-16">
            <FileText size={40} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500 font-medium">No invoices yet</p>
            <p className="text-gray-400 text-sm mt-1">Create your first invoice to get started</p>
            <button
              onClick={() => navigate('/invoices/new')}
              className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              Create Invoice
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="text-left px-6 py-3">Invoice #</th>
                  <th className="text-left px-4 py-3">Customer</th>
                  <th className="text-left px-4 py-3">Date</th>
                  <th className="text-left px-4 py-3">Due Date</th>
                  <th className="text-right px-4 py-3">Amount</th>
                  <th className="text-center px-4 py-3">Status</th>
                  <th className="text-center px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recent.map((inv) => (
                  <tr key={inv.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-3.5">
                      <span className="font-semibold text-blue-600 text-sm">{inv.invoice_number}</span>
                    </td>
                    <td className="px-4 py-3.5 text-sm text-gray-700 font-medium">{inv.customer_name}</td>
                    <td className="px-4 py-3.5 text-sm text-gray-500">{formatDate(inv.invoice_date)}</td>
                    <td className="px-4 py-3.5 text-sm text-gray-500">{formatDate(inv.due_date)}</td>
                    <td className="px-4 py-3.5 text-sm font-semibold text-gray-800 text-right">
                      {formatCurrency(inv.grand_total, 'INR')}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <StatusBadge status={inv.status} />
                    </td>
                    <td className="px-6 py-3.5">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => navigate(`/invoices/${inv.id}/view`)}
                          title="View"
                          className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-500 hover:text-blue-600 transition-colors"
                        >
                          <Eye size={15} />
                        </button>
                        <button
                          onClick={() => navigate(`/invoices/${inv.id}/edit`)}
                          title="Edit"
                          className="p-1.5 rounded-lg hover:bg-amber-50 text-gray-500 hover:text-amber-600 transition-colors"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => handleDownloadPDF(inv)}
                          title="Download PDF"
                          className="p-1.5 rounded-lg hover:bg-green-50 text-gray-500 hover:text-green-600 transition-colors"
                        >
                          <Download size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Status Breakdown */}
      {invoices.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {['Draft', 'Sent', 'Paid', 'Pending', 'Overdue'].map(status => {
            const count = invoices.filter(i => i.status === status).length;
            const cfg = statusConfig[status];
            return (
              <div key={status} className="bg-white border border-gray-100 rounded-xl p-4 text-center shadow-sm">
                <div className={`inline-flex w-8 h-8 rounded-full ${cfg.dot} bg-opacity-20 items-center justify-center mb-2`}>
                  <span className={`w-2.5 h-2.5 rounded-full ${cfg.dot}`}></span>
                </div>
                <div className="text-xl font-bold text-gray-800">{count}</div>
                <div className="text-xs text-gray-500 font-medium mt-0.5">{status}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
