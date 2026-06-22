// Run once to create admin: node src/seed.js
require('dotenv').config();
const connect = require('./db/connect');
const User = require('./models/User');

(async () => {
  await connect();
  const exists = await User.findOne({ email: 'admin@pawncalc.com' });
  if (exists) { console.log('Admin already exists'); process.exit(0); }
  await User.create({ name: 'Admin', email: 'admin@pawncalc.com', password: 'admin123', role: 'admin' });
  console.log('✅ Admin created: admin@pawncalc.com / admin123');
  process.exit(0);
})();
