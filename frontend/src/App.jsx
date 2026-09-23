import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import Invoices from './pages/Invoices';
import InvoiceForm from './pages/InvoiceForm';
import InvoicePreview from './pages/InvoicePreview';
import Customers from './pages/Customers';
import Products from './pages/Products';
import Settings from './pages/Settings';

const pageTitles = {
  '/': 'Dashboard',
  '/invoices': 'Invoices',
  '/invoices/new': 'Create Invoice',
  '/customers': 'Customers',
  '/products': 'Products',
  '/settings': 'Settings',
};

function getTitle(pathname) {
  if (pathname === '/') return 'Dashboard';
  if (pathname.endsWith('/new')) return 'Create Invoice';
  if (pathname.includes('/edit')) return 'Edit Invoice';
  if (pathname.includes('/view')) return 'Invoice Preview';
  const base = '/' + pathname.split('/')[1];
  return pageTitles[base] || 'ABC Company';
}

function Layout() {
  const location = useLocation();
  const title = getTitle(location.pathname);

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <div className="ml-64 min-h-screen flex flex-col">
        <Header title={title} />
        <main className="flex-1 p-6">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/invoices" element={<Invoices />} />
            <Route path="/invoices/new" element={<InvoiceForm />} />
            <Route path="/invoices/:id/edit" element={<InvoiceForm />} />
            <Route path="/invoices/:id/view" element={<InvoicePreview />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/products" element={<Products />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <Layout />
    </AppProvider>
  );
}
