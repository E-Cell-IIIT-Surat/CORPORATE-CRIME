import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Location from '../src/models/Location.js';
import Question from '../src/models/Question.js';
import Clue from '../src/models/Clue.js';

dotenv.config();

const insertTestData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing test data (optional)
    await Location.deleteMany({});
    await Question.deleteMany({});
    await Clue.deleteMany({});
    console.log('🗑️  Cleared old test data');

    // Insert test Location with QR code
    const location = await Location.create({
      code: 'TEST-QR-001',
      order: 1,
      category: 'ALL',
      pdfContent: 'This is test PDF content for location 1',
      answer: 'ADMIN_ANSWER'
    });
    console.log('✅ Location created:', location.code);

    // Insert test Question for step 1
    const question = await Question.create({
      step: 1,
      category: 'ALL',
      question: 'What is 2 + 2?',
      options: ['3', '4', '5', '6'],
      correctAnswer: '4',
      points: 100,
      imageUrl: null
    });
    console.log('✅ Question created for step 1');

    // Insert test Clue for step 1 (current step when starting)
    const clueStep1 = await Clue.create({
      step: 1,
      category: 'ALL',
      text: 'Scan the QR code TEST-QR-001 to begin your mission',
      imageUrl: null
    });
    console.log('✅ Clue created for step 1');

    // Insert test Clue for step 2 (after completing step 1)
    const clueStep2 = await Clue.create({
      step: 2,
      category: 'ALL',
      text: 'Look for the next location near the entrance',
      imageUrl: null
    });
    console.log('✅ Clue created for step 2');

    console.log('\n🎉 Test data inserted successfully!');
    console.log('\n📱 QR Code to scan: TEST-QR-001');
    console.log('You can generate a QR code for this text at: https://www.qr-code-generator.com/');
    
    mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

insertTestData();
