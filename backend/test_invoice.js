(async () => {
  try {
    const res = await fetch('http://localhost:5000/api/invoices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        invoice_number: "INV-9999",
        invoice_date: "2026-09-23",
        customer_name: "Test",
        items: [{ product_name: "A", quantity: 1, unit_price: 1 }]
      })
    });
    const data = await res.json();
    console.log(data);
  } catch (err) {
    console.error(err);
  }
})();
