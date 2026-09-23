/**
 * calculations.js
 * Pure utility functions for invoice arithmetic.
 * No side-effects – safe to import anywhere (component, PDF generator, tests).
 */

// ─────────────────────────────────────────────────────────────
// LINE-ITEM HELPERS
// ─────────────────────────────────────────────────────────────

/**
 * Calculate the net total of a single line item after discount.
 *
 * @param {number} qty       - Quantity
 * @param {number} price     - Unit price
 * @param {number} discount  - Discount percentage (0-100)
 * @returns {number}
 */
export function calcLineTotal(qty, price, discount = 0) {
  const subtotal    = (qty || 0) * (price || 0)
  const discountAmt = subtotal * ((discount || 0) / 100)
  return subtotal - discountAmt
}

/**
 * Calculate the tax amount for a single line item.
 *
 * @param {number} qty       - Quantity
 * @param {number} price     - Unit price
 * @param {number} discount  - Discount percentage (0-100)
 * @param {number} taxRate   - GST / tax percentage (0-100)
 * @returns {number}
 */
export function calcLineTax(qty, price, discount = 0, taxRate = 0) {
  const net = calcLineTotal(qty, price, discount)
  return net * ((taxRate || 0) / 100)
}

/**
 * Full amount for a line (after discount + after tax).
 *
 * @param {number} qty
 * @param {number} price
 * @param {number} discount
 * @param {number} taxRate
 * @returns {number}
 */
export function calcLineGrossTotal(qty, price, discount = 0, taxRate = 0) {
  const net = calcLineTotal(qty, price, discount)
  const tax = net * ((taxRate || 0) / 100)
  return net + tax
}

// ─────────────────────────────────────────────────────────────
// INVOICE-LEVEL TOTALS
// ─────────────────────────────────────────────────────────────

/**
 * Compute all totals from an array of invoice line items.
 *
 * Each item should have:
 *   quantity   {number}
 *   unit_price {number}
 *   discount   {number}  – percentage, 0-100
 *   tax_rate   {number}  – GST percentage, 0-100
 *
 * Returns:
 *   subtotal       – sum of (qty × price) before any deductions
 *   discountTotal  – total discount rupees
 *   taxableAmount  – subtotal − discountTotal
 *   taxTotal       – total GST amount
 *   cgst           – Central GST (taxTotal / 2) for intra-state
 *   sgst           – State  GST (taxTotal / 2) for intra-state
 *   igst           – Integrated GST (taxTotal)  for inter-state (default 0)
 *   grandTotal     – taxableAmount + taxTotal
 *
 * @param {Array<object>} items
 * @param {boolean}       [isInterstate=false]  – if true, igst = taxTotal, cgst/sgst = 0
 * @returns {{
 *   subtotal: number,
 *   discountTotal: number,
 *   taxableAmount: number,
 *   taxTotal: number,
 *   cgst: number,
 *   sgst: number,
 *   igst: number,
 *   grandTotal: number
 * }}
 */
export function calcInvoiceTotals(items = [], isInterstate = false) {
  let subtotal      = 0
  let discountTotal = 0
  let taxTotal      = 0

  ;(items || []).forEach((item) => {
    const qty        = Number(item.quantity   || 0)
    const price      = Number(item.unit_price || 0)
    const discount   = Number(item.discount   || 0)
    const taxRate    = Number(item.tax_rate   || 0)

    const lineSubtotal  = qty * price
    const lineDiscount  = lineSubtotal * (discount / 100)
    const lineAfterDisc = lineSubtotal - lineDiscount
    const lineTax       = lineAfterDisc * (taxRate / 100)

    subtotal      += lineSubtotal
    discountTotal += lineDiscount
    taxTotal      += lineTax
  })

  const taxableAmount = subtotal - discountTotal
  const grandTotal    = taxableAmount + taxTotal

  const cgst = isInterstate ? 0 : taxTotal / 2
  const sgst = isInterstate ? 0 : taxTotal / 2
  const igst = isInterstate ? taxTotal : 0

  return {
    subtotal:      round2(subtotal),
    discountTotal: round2(discountTotal),
    taxableAmount: round2(taxableAmount),
    taxTotal:      round2(taxTotal),
    cgst:          round2(cgst),
    sgst:          round2(sgst),
    igst:          round2(igst),
    grandTotal:    round2(grandTotal),
  }
}

// ─────────────────────────────────────────────────────────────
// FORMATTING HELPERS
// ─────────────────────────────────────────────────────────────

/**
 * Format a number as Indian Rupee currency string.
 *
 * @param {number} amount
 * @param {string} [currency='INR']
 * @returns {string}  e.g. "₹1,23,456.00"
 */
export function formatCurrency(amount, currency = 'INR') {
  return new Intl.NumberFormat('en-IN', {
    style:                 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount || 0)
}

/**
 * Format a date string/object to DD/MM/YYYY (Indian locale).
 *
 * @param {string|Date|null} dateStr
 * @returns {string}
 */
export function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return String(dateStr)
  return d.toLocaleDateString('en-IN', {
    day:   '2-digit',
    month: '2-digit',
    year:  'numeric',
  })
}

/**
 * Format a date to YYYY-MM-DD (HTML date input value).
 *
 * @param {string|Date|null} dateStr
 * @returns {string}
 */
export function toInputDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return ''
  const yyyy = d.getFullYear()
  const mm   = String(d.getMonth() + 1).padStart(2, '0')
  const dd   = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

/**
 * Return the number of days until/since a due date.
 * Negative → overdue.
 *
 * @param {string|Date} dueDateStr
 * @returns {number}
 */
export function daysUntilDue(dueDateStr) {
  if (!dueDateStr) return null
  const due  = new Date(dueDateStr)
  const now  = new Date()
  const diff = due.getTime() - now.getTime()
  return Math.round(diff / (1000 * 60 * 60 * 24))
}

/**
 * Convert a number to words (Indian system) for invoice totals line.
 * E.g. 12345.50 → "Twelve Thousand Three Hundred Forty-Five and Fifty Paise Only"
 *
 * @param {number} amount
 * @returns {string}
 */
export function amountToWords(amount) {
  if (amount === null || amount === undefined || isNaN(amount)) return ''

  const ones = [
    '', 'One', 'Two', 'Three', 'Four', 'Five',
    'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen',
    'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen',
  ]
  const tens = [
    '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty',
    'Sixty', 'Seventy', 'Eighty', 'Ninety',
  ]

  function convertHundred(n) {
    let str = ''
    if (n >= 100) {
      str += ones[Math.floor(n / 100)] + ' Hundred '
      n %= 100
    }
    if (n >= 20) {
      str += tens[Math.floor(n / 10)] + ' '
      n %= 10
    }
    if (n > 0) str += ones[n] + ' '
    return str.trim()
  }

  function convertIndian(n) {
    if (n === 0) return 'Zero'
    let str = ''
    if (n >= 10000000) {
      str += convertHundred(Math.floor(n / 10000000)) + ' Crore '
      n %= 10000000
    }
    if (n >= 100000) {
      str += convertHundred(Math.floor(n / 100000)) + ' Lakh '
      n %= 100000
    }
    if (n >= 1000) {
      str += convertHundred(Math.floor(n / 1000)) + ' Thousand '
      n %= 1000
    }
    if (n > 0) {
      str += convertHundred(n)
    }
    return str.trim()
  }

  const rupees = Math.floor(amount)
  const paise  = Math.round((amount - rupees) * 100)

  let result = convertIndian(rupees) + ' Rupee' + (rupees !== 1 ? 's' : '')
  if (paise > 0) {
    result += ' and ' + convertIndian(paise) + ' Paise'
  }
  return result + ' Only'
}

// ─────────────────────────────────────────────────────────────
// INTERNAL HELPERS
// ─────────────────────────────────────────────────────────────

/** Round to 2 decimal places. */
function round2(n) {
  return Math.round((n + Number.EPSILON) * 100) / 100
}
