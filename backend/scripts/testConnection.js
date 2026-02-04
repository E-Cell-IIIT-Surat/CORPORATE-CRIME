import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

console.log('\n🔍 ENVIRONMENT CHECK');
console.log('==================');
console.log('✓ NODE_ENV:', process.env.NODE_ENV || 'not set');
console.log('✓ MONGO_URI:', process.env.MONGO_URI ? '✓ SET' : '✗ NOT SET');
console.log('✓ JWT_SECRET:', process.env.JWT_SECRET ? '✓ SET' : '✗ NOT SET');

if (!process.env.MONGO_URI) {
  console.error('\n❌ MONGO_URI is not set! Add it to Vercel environment variables.');
  process.exit(1);
}

console.log('\n🔗 TESTING MONGODB CONNECTION');
console.log('============================');

try {
  await mongoose.connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 30000,
    maxPoolSize: 5,
    minPoolSize: 0,
    retryWrites: true,
    retryReads: true,
    connectTimeoutMS: 10000,
    family: 4,
    authSource: "admin",
  });

  console.log('✅ MongoDB Connection: SUCCESS');
  console.log('📊 Database:', mongoose.connection.name);
  console.log('🏢 Host:', mongoose.connection.host);

  // Test a basic operation
  const collections = await mongoose.connection.db.listCollections().toArray();
  console.log('📚 Collections:', collections.map(c => c.name).join(', '));

  mongoose.disconnect();
  console.log('\n✅ All checks passed!');
} catch (error) {
  console.error('❌ Connection Failed:', error.message);
  console.error('\n⚠️  TROUBLESHOOTING:');
  console.error('1. Check if MONGO_URI is correct in Vercel environment variables');
  console.error('2. Whitelist Vercel IPs in MongoDB: https://www.vercel.com/docs/concepts/edge-network/regions');
  console.error('3. Or allow access from anywhere (0.0.0.0/0) for testing');
  process.exit(1);
}
