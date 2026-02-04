import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

dotenv.config();

// Define Admin model inline
const adminSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  email: { type: String, unique: true },
  createdAt: { type: Date, default: Date.now }
});

const Admin = mongoose.model('Admin', adminSchema);

async function createAdminUser() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✓ Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ username: 'admin' });
    if (existingAdmin) {
      console.log('✅ Admin user already exists');
      console.log('  Username:', existingAdmin.username);
      console.log('  Email:', existingAdmin.email || 'not set');
      await mongoose.disconnect();
      return;
    }

    // Create new admin
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const admin = await Admin.create({
      username: 'admin',
      password: hashedPassword,
      email: 'admin@example.com'
    });

    console.log('✅ Admin user created successfully');
    console.log('  Username:', admin.username);
    console.log('  Email:', admin.email);
    console.log('  Password: admin123 (hashed in database)');

    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

createAdminUser();
