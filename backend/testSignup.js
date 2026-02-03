import mongoose from 'mongoose';
import Team from './src/models/Team.js';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

dotenv.config();

async function testSignup() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Test creating a team
    const hashedPassword = await bcrypt.hash('password123', 10);
    const team = await Team.create({
      name: 'testteam123',
      password: hashedPassword,
      category: 'A',
      score: 0,
      currentStep: 1
    });

    console.log('✅ Team created successfully:', team);
    
    // Test finding team
    const foundTeam = await Team.findOne({ name: 'testteam123' });
    console.log('✅ Team found:', foundTeam);
    
    // Test password comparison
    const isMatch = await bcrypt.compare('password123', foundTeam.password);
    console.log('✅ Password match:', isMatch);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Full error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

testSignup();
