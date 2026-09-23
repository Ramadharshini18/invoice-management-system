# ByteForce Technology – Invoice Management System

A web-based Invoice Management System developed by **ByteForce Technology** for **ABC Company** to simplify and centralize the complete invoice management process.

## About the Project

The Invoice Management System helps businesses manage invoices, customers, and products from a single platform. It reduces the need for manual invoice preparation and scattered files by providing a centralized system for creating, managing, tracking, and generating professional invoices.

The system automatically calculates invoice amounts, taxes, discounts, and totals, reducing calculation errors and saving time.

## What the System Does

- Creates and manages invoices
- Manages customer information
- Manages products and services
- Automatically calculates subtotal, discount, tax, and grand total
- Allows users to view, edit, and delete invoices
- Tracks invoice information and status
- Generates professional A4 PDF invoices
- Allows invoices to be downloaded and printed
- Stores invoice data persistently
- Provides a dashboard for monitoring invoice information and revenue

## Key Features

### Dashboard
Provides an overview of invoice-related information and revenue statistics.

### Customer Management
Users can add, view, edit, and manage customer details used for invoice generation.

### Product Management
Users can manage products or services, including their prices and tax rates.

### Invoice Creation
Users can select customers, add products, specify quantities and prices, and create invoices.

### Automatic Calculations
The system automatically calculates:

- Subtotal
- Discount
- GST/Tax
- Final invoice amount

### Invoice Management
Users can:

- View invoices
- Search invoices
- Edit invoices
- Delete invoices
- Track invoice information

### PDF Invoice Generation
The system generates professionally formatted A4 invoices that can be downloaded or printed.

## System Workflow

```text
Login
   ↓
Dashboard
   ↓
Manage Customers / Products
   ↓
Create Invoice
   ↓
Automatic Calculation
   ↓
Save Invoice
   ↓
View / Edit Invoice
   ↓
Generate PDF
   ↓
Download / Print
```

## Tech Stack

### Frontend
- React 18
- Vite
- Tailwind CSS

### Backend
- Node.js
- Express.js

### Database
- SQLite

### PDF Generation
- jsPDF
- AutoTable

### Development Tools
- Visual Studio Code
- Git
- GitHub
- npm

## Project Structure

```text
invoice-management-system/
│
├── backend/
├── frontend/
├── screenshots/
├── README.md
├── run.bat
└── test_product.js
```

## Quick Start

### Option 1: Using `run.bat`

Double-click:

```text
run.bat
```

This starts the required backend and frontend services.

### Option 2: Manual Setup

#### Start the Backend

```bash
cd backend
npm install
node server.js
```

#### Start the Frontend

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

Open the application at:

```text
http://localhost:5173
```

## API Endpoints

### Invoices

```text
GET    /api/invoices
POST   /api/invoices
GET    /api/invoices/:id
PUT    /api/invoices/:id
DELETE /api/invoices/:id
```

### Customers

```text
GET    /api/customers
POST   /api/customers
GET    /api/customers/:id
PUT    /api/customers/:id
DELETE /api/customers/:id
```

### Products

```text
GET    /api/products
POST   /api/products
GET    /api/products/:id
PUT    /api/products/:id
DELETE /api/products/:id
```

### Settings

```text
GET  /api/settings
PUT  /api/settings
POST /api/settings/logo
```

# Prototype Screenshots

## Dashboard

<img width="1912" height="875" alt="Dashboard" src="https://github.com/user-attachments/assets/7e6bd660-5e9a-4960-ae3e-bcbe4c1347de" />

## Customer Management

<img width="389" height="337" alt="Add Customer" src="https://github.com/user-attachments/assets/628375b0-e0e0-4d0a-a6ef-368a19c79226" />

<img width="1884" height="863" alt="Customers" src="https://github.com/user-attachments/assets/bee55b26-abb5-456f-8480-ae655ed14b9c" />

## Product Management

<img width="1879" height="847" alt="Products" src="https://github.com/user-attachments/assets/82e6e1fd-af26-4c25-afdf-21b0d6889496" />

<img width="282" height="284" alt="Add Product" src="https://github.com/user-attachments/assets/4df5b9a6-6ef3-45da-a331-b048328c8ec8" />

## Create Invoice

<img width="1874" height="838" alt="Invoice" src="https://github.com/user-attachments/assets/040add07-43f4-45fa-bb42-62c1ddffad45" />

<img width="649" height="629" alt="Create Invoice" src="https://github.com/user-attachments/assets/e5446b96-554c-469b-ab05-39f76f1b99cd" />

## Invoice Preview

<img width="1898" height="878" alt="Invoice Preview" src="https://github.com/user-attachments/assets/204ba472-3706-4a52-b0cc-6d7446a53591" />

## Project Objective

The objective of this project is to provide a simple, centralized, and efficient solution for managing the complete invoice lifecycle — from customer and product management to invoice creation, automatic calculations, tracking, and professional PDF generation.

---

**Developed by ByteForce Technology**
