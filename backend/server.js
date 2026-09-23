const express = require('express');
const cors = require('cors');
const path = require('path');

// Initialise database (runs schema + seeds on first boot)
require('./db');

const customersRouter = require('./routes/customers');
const productsRouter  = require('./routes/products');
const invoicesRouter  = require('./routes/invoices');
const settingsRouter  = require('./routes/settings');

const app  = express();
const PORT = 5000;

// ─── Middleware ───────────────────────────────────────────────────────────────

app.use(cors({
  origin: (origin, callback) => {
    // Allow any localhost origin (any port) or no origin (curl/Postman)
    if (!origin || /^http:\/\/localhost(:\d+)?$/.test(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS: origin not allowed'));
    }
  },
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded logo files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ─── Routes ───────────────────────────────────────────────────────────────────

app.use('/api/customers', customersRouter);
app.use('/api/products',  productsRouter);
app.use('/api/invoices',  invoicesRouter);
app.use('/api/settings',  settingsRouter);

// ─── Health Check ─────────────────────────────────────────────────────────────

app.get('/api/health', (_req, res) => {
  res.json({ success: true, message: 'ABC Company Invoice API is running.' });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────

app.use((err, _req, res, _next) => {
  console.error('[ERROR]', err.message);
  res.status(500).json({ success: false, message: err.message || 'Internal server error' });
});

// ─── Start ────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`ABC Company Invoice API running on port ${PORT}`);
});
