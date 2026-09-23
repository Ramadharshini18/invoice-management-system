import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';

export { api };

const AppContext = createContext({});

export function AppProvider({ children }) {
  const [settings, setSettings] = useState({
    company_name: 'ByteForce Technologies',
    address: '123 Business Park, Tech City, TC 400001',
    phone: '+91 98765 43210',
    email: 'billing@byteforce.com',
    website: 'www.byteforce.com',
    gst_number: 'GST123456789',
    invoice_prefix: 'INV',
    starting_number: 1,
    next_number: 5,
    default_tax_rate: 18,
    default_payment_terms: '30',
    currency: 'INR',
    logo_path: ''
  });
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const refreshSettings = async () => {
    try {
      const res = await api.get('/api/settings');
      if (res.data.success) setSettings(res.data.data);
    } catch (err) { console.error('Failed to load settings', err); }
  };

  const refreshCustomers = async () => {
    try {
      const res = await api.get('/api/customers');
      if (res.data.success) setCustomers(res.data.data);
    } catch (err) { console.error('Failed to load customers', err); }
  };

  const refreshProducts = async () => {
    try {
      const res = await api.get('/api/products');
      if (res.data.success) setProducts(res.data.data);
    } catch (err) { console.error('Failed to load products', err); }
  };

  useEffect(() => {
    const init = async () => {
      await Promise.all([refreshSettings(), refreshCustomers(), refreshProducts()]);
      setLoading(false);
    };
    init();
  }, []);

  return (
    <AppContext.Provider value={{ settings, customers, products, loading, refreshSettings, refreshCustomers, refreshProducts }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
