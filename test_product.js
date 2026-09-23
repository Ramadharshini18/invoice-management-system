const http = require('http');

const data = JSON.stringify({ name: 'Test Product', price: 500, tax_rate: 18, category: 'Electronics', unit: 'pcs' });
const options = {
  hostname: 'localhost', port: 5000, path: '/api/products', method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Content-Length': data.length }
};
const req = http.request(options, res => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => console.log('STATUS:', res.statusCode, '\nBODY:', body));
});
req.on('error', e => console.error('ERROR:', e.message));
req.write(data);
req.end();
