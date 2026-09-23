const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const db = new DatabaseSync(path.join(__dirname, 'invoice.db'));
db.exec("UPDATE settings SET company_name='ByteForce Technologies', email='billing@byteforce.com', website='www.byteforce.com' WHERE id=1");
const s = db.prepare('SELECT company_name, email, website FROM settings WHERE id=1').get();
console.log('Updated:', JSON.stringify(s));
