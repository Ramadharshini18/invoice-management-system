# ABC Company Invoice Management System

A professional, full-featured Invoice Management System for ABC Company.

## Quick Start

**Option 1: Double-click `run.bat`**
This will automatically install dependencies and start both servers.

**Option 2: Manual start**

```bash
# Terminal 1 - Backend
cd backend
npm install
node server.js

# Terminal 2 - Frontend
cd frontend
npm install
npm run dev
```

Open your browser at: **http://localhost:5173**

## Requirements

- Node.js 18+ (https://nodejs.org/)
- npm (comes with Node.js)

## Tech Stack

- **Frontend**: React 18 + Vite + Tailwind CSS
- **Backend**: Node.js + Express
- **Database**: SQLite (persistent, no setup required)
- **PDF**: jsPDF + AutoTable

## Features

- Dashboard with revenue stats
- Invoice creation with real-time calculations
- Customer management
- Product/service catalog
- PDF download (A4 format)
- Persistent data storage

## API Endpoints

- `GET/POST /api/invoices`
- `GET/PUT/DELETE /api/invoices/:id`
- `GET/POST /api/customers`
- `GET/PUT/DELETE /api/customers/:id`
- `GET/POST /api/products`
- `GET/PUT/DELETE /api/products/:id`
- `GET/PUT /api/settings`
- `POST /api/settings/logo`
