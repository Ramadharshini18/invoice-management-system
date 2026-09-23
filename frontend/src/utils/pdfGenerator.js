/**
 * pdfGenerator.js
 * Generates a professional A4 invoice PDF using jsPDF + jsPDF-AutoTable.
 *
 * Usage:
 *   import { generateInvoicePDF } from './pdfGenerator'
 *   generateInvoicePDF(invoice, companySettings)
 */

import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { calcInvoiceTotals, formatCurrency, formatDate, amountToWords } from './calculations'

// ─── Theme ────────────────────────────────────────────────────
const BLUE       = [37, 99, 235]    // #2563eb primary-600
const BLUE_DARK  = [30, 64, 175]    // #1e40af primary-800
const BLUE_LIGHT = [239, 246, 255]  // #eff6ff primary-50
const GRAY_DARK  = [31, 41, 55]     // text-gray-800
const GRAY_MID   = [107, 114, 128]  // text-gray-500
const GRAY_LIGHT = [243, 244, 246]  // bg-gray-100
const WHITE      = [255, 255, 255]

// ─── Helpers ──────────────────────────────────────────────────

/** Set RGB fill color from array */
function setFill(doc, rgb) { doc.setFillColor(rgb[0], rgb[1], rgb[2]) }

/** Set RGB text color from array */
function setTextColor(doc, rgb) { doc.setTextColor(rgb[0], rgb[1], rgb[2]) }

/** Set RGB draw/stroke color */
function setDrawColor(doc, rgb) { doc.setDrawColor(rgb[0], rgb[1], rgb[2]) }

/** Draw a horizontal rule */
function hRule(doc, y, x1 = 14, x2 = 196, lw = 0.4) {
  doc.setLineWidth(lw)
  setDrawColor(doc, BLUE)
  doc.line(x1, y, x2, y)
}

/** Truncate a string to maxLen with ellipsis */
function trunc(str, maxLen = 40) {
  if (!str) return ''
  return str.length > maxLen ? str.slice(0, maxLen - 1) + '…' : str
}

/** Status badge color */
function statusColor(status) {
  switch ((status || '').toLowerCase()) {
    case 'paid':      return [220, 252, 231]  // green-100
    case 'overdue':   return [254, 226, 226]  // red-100
    case 'sent':      return [219, 234, 254]  // blue-100
    case 'cancelled': return [255, 237, 213]  // orange-100
    default:          return [243, 244, 246]  // gray-100
  }
}

function statusTextColor(status) {
  switch ((status || '').toLowerCase()) {
    case 'paid':      return [22,  163, 74]   // green-600
    case 'overdue':   return [220, 38,  38]   // red-600
    case 'sent':      return [37,  99,  235]  // blue-600
    case 'cancelled': return [234, 88,  12]   // orange-600
    default:          return [75,  85,  99]   // gray-600
  }
}

// ─── MAIN EXPORT ──────────────────────────────────────────────

/**
 * Generate and download an invoice PDF.
 *
 * @param {object} invoice   – Invoice data from the API
 * @param {object} settings  – Company settings (name, address, logo_path, gst, etc.)
 */
export async function generateInvoicePDF(invoice, settings = {}) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

  // Page dimensions
  const PAGE_W  = 210
  const PAGE_H  = 297
  const MARGIN  = 14
  const CONTENT = PAGE_W - MARGIN * 2  // 182mm

  // Company info (fall back to sensible defaults)
  const companyName    = settings.company_name    || 'ByteForce Technologies'
  const companyAddress = settings.address         || ''
  const companyCity    = settings.city            || ''
  const companyState   = settings.state           || ''
  const companyPhone   = settings.phone           || ''
  const companyEmail   = settings.email           || ''
  const companyGST     = settings.gst_number      || ''
  const companyPAN     = settings.pan_number      || ''
  const bankName       = settings.bank_name       || ''
  const bankAccount    = settings.bank_account    || ''
  const bankIFSC       = settings.bank_ifsc       || ''
  const logoPath       = settings.logo_path       || null

  // Invoice info
  const invoiceNum = invoice.invoice_number || `INV-${invoice.id || '0000'}`
  // Normalise customer — API returns flat fields on the invoice object
  const customer = {
    name:       invoice.customer_name    || invoice.customer?.name    || '',
    address:    invoice.customer_address || invoice.customer?.address || '',
    city:       invoice.customer_city    || invoice.customer?.city    || '',
    state:      invoice.customer_state   || invoice.customer?.state   || '',
    gst_number: invoice.customer_gst     || invoice.customer?.gst_number || '',
    email:      invoice.customer_email   || invoice.customer?.email   || '',
    phone:      invoice.customer_phone   || invoice.customer?.phone   || '',
  }
  const items  = (invoice.items || []).map(i => ({
    ...i,
    name:      i.product_name || i.name || '',
    item_name: i.product_name || i.name || '',
  }))
  const status = invoice.status || 'draft'

  const totals = calcInvoiceTotals(items, invoice.is_interstate || false)

  // ─── HEADER BAND ─────────────────────────────────────────────

  // Dark blue top bar
  setFill(doc, BLUE_DARK)
  doc.rect(0, 0, PAGE_W, 36, 'F')

  let logoEndX = MARGIN

  // Logo / Monogram
  if (logoPath && (logoPath.startsWith('data:') || logoPath.startsWith('http'))) {
    try {
      doc.addImage(logoPath, 'AUTO', MARGIN, 4, 28, 28)
      logoEndX = MARGIN + 32
    } catch (_) {
      logoEndX = _drawMonogram(doc, MARGIN, 4, companyName)
    }
  } else {
    logoEndX = _drawMonogram(doc, MARGIN, 4, companyName)
  }

  // Company name in header
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  setTextColor(doc, WHITE)
  doc.text(companyName.toUpperCase(), logoEndX + 2, 15)

  // Company tagline / address summary in header
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  setTextColor(doc, [186, 210, 255])
  const headerSub = [companyCity, companyState].filter(Boolean).join(', ')
  if (headerSub) doc.text(headerSub, logoEndX + 2, 22)
  if (companyGST) doc.text(`GSTIN: ${companyGST}`, logoEndX + 2, 28)

  // INVOICE label (right side of header)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(26)
  setTextColor(doc, WHITE)
  doc.text('INVOICE', PAGE_W - MARGIN, 18, { align: 'right' })
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  setTextColor(doc, [186, 210, 255])
  doc.text(`#${invoiceNum}`, PAGE_W - MARGIN, 26, { align: 'right' })

  let y = 42  // cursor below header band

  // ─── INVOICE META ROW ────────────────────────────────────────

  const metaBoxW = CONTENT / 4 - 2
  const metaData = [
    { label: 'Invoice Date', value: formatDate(invoice.invoice_date) },
    { label: 'Due Date',     value: formatDate(invoice.due_date)     },
    { label: 'Status',       value: (status).toUpperCase()           },
    { label: 'Currency',     value: invoice.currency || 'INR'        },
  ]

  metaData.forEach((m, i) => {
    const bx = MARGIN + i * (metaBoxW + 2.7)

    // box
    setFill(doc, i === 2 ? statusColor(status) : GRAY_LIGHT)
    doc.roundedRect(bx, y, metaBoxW, 14, 2, 2, 'F')

    // label
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    setTextColor(doc, GRAY_MID)
    doc.text(m.label, bx + 3, y + 5)

    // value
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    setTextColor(doc, i === 2 ? statusTextColor(status) : GRAY_DARK)
    doc.text(m.value || '—', bx + 3, y + 11)
  })

  y += 22

  // ─── BILL TO / COMPANY DETAILS ────────────────────────────────

  const colW = CONTENT / 2 - 4

  // Bill To box
  setFill(doc, BLUE_LIGHT)
  doc.roundedRect(MARGIN, y, colW, 38, 2, 2, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  setTextColor(doc, BLUE)
  doc.text('BILL TO', MARGIN + 4, y + 7)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  setTextColor(doc, GRAY_DARK)
  doc.text(trunc(customer.name || 'Customer', 32), MARGIN + 4, y + 14)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  setTextColor(doc, GRAY_MID)

  const billLines = [
    customer.address,
    [customer.city, customer.state].filter(Boolean).join(', '),
    customer.gst_number ? `GSTIN: ${customer.gst_number}` : null,
    customer.email,
    customer.phone,
  ].filter(Boolean)

  billLines.slice(0, 5).forEach((line, i) => {
    doc.text(trunc(line, 40), MARGIN + 4, y + 21 + i * 4.5)
  })

  // Company "From" box
  const fromX = MARGIN + colW + 8
  setFill(doc, GRAY_LIGHT)
  doc.roundedRect(fromX, y, colW, 38, 2, 2, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  setTextColor(doc, BLUE)
  doc.text('FROM', fromX + 4, y + 7)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  setTextColor(doc, GRAY_DARK)
  doc.text(trunc(companyName, 32), fromX + 4, y + 14)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  setTextColor(doc, GRAY_MID)

  const fromLines = [
    companyAddress,
    [companyCity, companyState].filter(Boolean).join(', '),
    companyPhone ? `Ph: ${companyPhone}` : null,
    companyEmail,
    companyGST ? `GSTIN: ${companyGST}` : null,
    companyPAN  ? `PAN: ${companyPAN}`   : null,
  ].filter(Boolean)

  fromLines.slice(0, 5).forEach((line, i) => {
    doc.text(trunc(line, 40), fromX + 4, y + 21 + i * 4.5)
  })

  y += 46

  // ─── ITEMS TABLE ─────────────────────────────────────────────

  const tableHead = [
    ['#', 'Item / Description', 'HSN', 'Qty', 'Unit', 'Unit Price', 'Disc%', 'GST%', 'Amount']
  ]

  const tableBody = items.map((item, idx) => {
    const lineTotal = (item.quantity || 0) * (item.unit_price || 0)
    const lineDisc  = lineTotal * ((item.discount || 0) / 100)
    const lineNet   = lineTotal - lineDisc
    const lineTax   = lineNet * ((item.tax_rate || 0) / 100)
    const lineAmt   = lineNet + lineTax

    return [
      String(idx + 1),
      item.description
        ? `${trunc(item.name || '', 22)}\n${trunc(item.description, 30)}`
        : trunc(item.name || item.item_name || '', 30),
      item.hsn_code || '',
      String(item.quantity || 0),
      item.unit || 'Nos',
      formatCurrency(item.unit_price || 0),
      item.discount ? `${item.discount}%` : '—',
      item.tax_rate ? `${item.tax_rate}%` : '—',
      formatCurrency(lineAmt),
    ]
  })

  autoTable(doc, {
    startY:        y,
    head:          tableHead,
    body:          tableBody,
    margin:        { left: MARGIN, right: MARGIN },
    tableWidth:    CONTENT,
    styles: {
      fontSize:   8,
      cellPadding: 3,
      overflow:   'linebreak',
      textColor:  GRAY_DARK,
    },
    headStyles: {
      fillColor:  BLUE,
      textColor:  WHITE,
      fontStyle:  'bold',
      fontSize:   8,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 255],
    },
    columnStyles: {
      0: { cellWidth: 8,  halign: 'center' },
      1: { cellWidth: 52 },
      2: { cellWidth: 16, halign: 'center' },
      3: { cellWidth: 12, halign: 'right'  },
      4: { cellWidth: 12, halign: 'center' },
      5: { cellWidth: 24, halign: 'right'  },
      6: { cellWidth: 14, halign: 'right'  },
      7: { cellWidth: 14, halign: 'right'  },
      8: { cellWidth: 30, halign: 'right'  },
    },
    didDrawPage: (data) => {
      // Repeat header on continuation pages
      _drawPageFooter(doc, PAGE_W, PAGE_H, MARGIN, invoiceNum, companyName)
    },
  })

  y = doc.lastAutoTable.finalY + 6

  // ─── TOTALS + BANK DETAILS ────────────────────────────────────

  // Check if we need a new page
  if (y > PAGE_H - 80) {
    doc.addPage()
    y = 14
  }

  const totalsX  = MARGIN + CONTENT * 0.55
  const totalsW  = CONTENT * 0.45

  // Totals panel background
  setFill(doc, GRAY_LIGHT)
  doc.roundedRect(totalsX, y, totalsW, invoice.is_interstate ? 58 : 62, 2, 2, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  setTextColor(doc, BLUE)
  doc.text('SUMMARY', totalsX + 4, y + 7)

  const totalsRows = [
    { label: 'Subtotal',        value: formatCurrency(totals.subtotal)       },
    { label: 'Discount (-)',     value: `- ${formatCurrency(totals.discountTotal)}` },
    { label: 'Taxable Amount',  value: formatCurrency(totals.taxableAmount)  },
    ...(invoice.is_interstate
      ? [{ label: `IGST`,       value: formatCurrency(totals.igst)           }]
      : [
          { label: `CGST`,      value: formatCurrency(totals.cgst)           },
          { label: `SGST`,      value: formatCurrency(totals.sgst)           },
        ]
    ),
  ]

  let ty = y + 14
  totalsRows.forEach(({ label, value }) => {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    setTextColor(doc, GRAY_MID)
    doc.text(label, totalsX + 4, ty)
    setTextColor(doc, GRAY_DARK)
    doc.text(value, totalsX + totalsW - 4, ty, { align: 'right' })
    ty += 7
  })

  // Grand Total highlight bar
  setFill(doc, BLUE)
  doc.roundedRect(totalsX, ty - 1, totalsW, 12, 2, 2, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  setTextColor(doc, WHITE)
  doc.text('GRAND TOTAL', totalsX + 4, ty + 6.5)
  doc.text(formatCurrency(totals.grandTotal), totalsX + totalsW - 4, ty + 6.5, { align: 'right' })

  // Amount in words (full width below totals)
  const wordsY = ty + 18
  doc.setFont('helvetica', 'italic')
  doc.setFontSize(8)
  setTextColor(doc, GRAY_MID)
  const words = amountToWords(totals.grandTotal)
  doc.text(`Amount in words: ${words}`, MARGIN, wordsY)

  // Bank details (left of totals)
  if (bankName || bankAccount) {
    const bankY = y
    const bankW = CONTENT * 0.52

    setFill(doc, BLUE_LIGHT)
    doc.roundedRect(MARGIN, bankY, bankW, 46, 2, 2, 'F')

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    setTextColor(doc, BLUE)
    doc.text('BANK DETAILS', MARGIN + 4, bankY + 8)

    const bankRows = [
      bankName    && `Bank:    ${bankName}`,
      bankAccount && `A/C No:  ${bankAccount}`,
      bankIFSC    && `IFSC:    ${bankIFSC}`,
    ].filter(Boolean)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8.5)
    setTextColor(doc, GRAY_DARK)
    bankRows.forEach((row, i) => {
      doc.text(row, MARGIN + 4, bankY + 16 + i * 7)
    })
  }

  // ─── NOTES / TERMS ────────────────────────────────────────────

  const notesY = wordsY + 8

  if (notesY < PAGE_H - 40) {
    hRule(doc, notesY, MARGIN, PAGE_W - MARGIN, 0.3)

    let notesCursor = notesY + 7

    if (invoice.notes) {
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(8)
      setTextColor(doc, GRAY_DARK)
      doc.text('Notes:', MARGIN, notesCursor)
      doc.setFont('helvetica', 'normal')
      setTextColor(doc, GRAY_MID)
      const noteLines = doc.splitTextToSize(invoice.notes, CONTENT)
      noteLines.slice(0, 3).forEach((line, i) => {
        doc.text(line, MARGIN, notesCursor + 5 + i * 4.5)
      })
      notesCursor += 5 + Math.min(noteLines.length, 3) * 4.5 + 4
    }

    if (invoice.payment_terms) {
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(8)
      setTextColor(doc, GRAY_DARK)
      doc.text('Payment Terms:', MARGIN, notesCursor)
      doc.setFont('helvetica', 'normal')
      setTextColor(doc, GRAY_MID)
      const termLines = doc.splitTextToSize(invoice.payment_terms, CONTENT)
      termLines.slice(0, 2).forEach((line, i) => {
        doc.text(line, MARGIN, notesCursor + 5 + i * 4.5)
      })
    }
  }

  // ─── PAGE FOOTER ─────────────────────────────────────────────

  _drawPageFooter(doc, PAGE_W, PAGE_H, MARGIN, invoiceNum, companyName)

  // ─── SAVE ─────────────────────────────────────────────────────

  doc.save(`${invoiceNum}.pdf`)
}

// ─── PRIVATE HELPERS ─────────────────────────────────────────

/**
 * Draw a geometric monogram when no logo is supplied.
 * Returns the right-edge X position.
 */
function _drawMonogram(doc, x, y, companyName) {
  const initials = companyName
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase() || 'AB'

  // Circle background
  setFill(doc, [59, 130, 246])  // primary-500
  doc.circle(x + 12, y + 14, 12, 'F')

  // Initials text
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  setTextColor(doc, WHITE)
  doc.text(initials, x + 12, y + 17.5, { align: 'center' })

  return x + 28
}

/**
 * Draw the page footer (page number + thank-you line).
 */
function _drawPageFooter(doc, pageW, pageH, margin, invoiceNum, companyName) {
  const y = pageH - 10

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  setTextColor(doc, [156, 163, 175])  // gray-400

  doc.text(`${companyName}  ·  ${invoiceNum}`, margin, y)
  doc.text('Thank you for your business!', pageW / 2, y, { align: 'center' })

  const pageCount = doc.internal.getNumberOfPages()
  const currentPage = doc.internal.getCurrentPageInfo().pageNumber
  doc.text(`Page ${currentPage} of ${pageCount}`, pageW - margin, y, { align: 'right' })
}
