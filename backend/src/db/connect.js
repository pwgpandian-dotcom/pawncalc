const mongoose = require('mongoose');

// Strip any query params that have no value (e.g. "retryWrites=" or "retryWrites")
function cleanUri(uri) {
  if (!uri || !uri.includes('?')) return uri;
  const [base, query] = uri.split('?');
  const valid = query.split('&').filter(p => {
    const [k, v] = p.split('=');
    return k && v && v.trim() !== '';
  });
  return valid.length ? `${base}?${valid.join('&')}` : base;
}

const connect = async () => {
  let uri = cleanUri(process.env.MONGO_URI);

  // In dev mode, if local MongoDB is unreachable, spin up an in-memory instance
  if (process.env.NODE_ENV !== 'production') {
    try {
      await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
      console.log('MongoDB connected');
      return;
    } catch {
      console.log('Local MongoDB unavailable — starting in-memory MongoDB...');
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const mongod = await MongoMemoryServer.create();
      uri = mongod.getUri();
      console.log('In-memory MongoDB started at', uri);
    }
  }

  try {
    await mongoose.connect(uri);
    console.log('MongoDB connected');
  } catch (err) {
    console.error('MongoDB connection failed:', err.message);
    process.exit(1);
  }
};

module.exports = connect;
