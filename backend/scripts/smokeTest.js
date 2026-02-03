import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const API = 'http://localhost:5000/api';

async function run() {
  console.log('Starting smoke test...');

  // 1) Register team
  let res = await fetch(`${API}/team/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ teamId: 'SMOKETEST', password: 'pass123' })
  });
  const reg = await res.json();
  console.log('Register response:', reg.message || 'OK');
  const token = reg.token;

  // 2) Create Location and Question directly via DB (safer for smoke test)
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/event_cyber');
  const Location = (await import('../src/models/Location.js')).default;
  const Question = (await import('../src/models/Question.js')).default;

  await Location.create({ code: 'SMOKELOC', order: 1, category: 'ALL', answer: 'answer' });
  await Question.create({ step: 1, category: 'ALL', question: 'Smoke test Q?', correctAnswer: 'ok', options: ['ok','no'], points: 10 });
  console.log('Inserted location & question');

  // 3) Scan
  res = await fetch(`${API}/qr/scan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ qrCode: 'SMOKELOC' })
  });
  const scan = await res.json();
  console.log('Scan response:', scan);

  // 4) Verify correct answer
  res = await fetch(`${API}/qr/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ answer: 'ok', locationId: scan.locationId, questionId: scan.challenge?.id, timeTaken: 5 })
  });
  const verify = await res.json();
  console.log('Verify response:', verify);

  process.exit(0);
}

run().catch((err) => { console.error(err); process.exit(1); });