import axios from 'axios';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

// Connect DB to generate a token for rmrider
const uri = process.env.MONGO_URI;

async function run() {
  await mongoose.connect(uri);
  const db = mongoose.connection.db;
  
  // Find a rider
  const order = await db.collection('laborders').findOne({ _id: new mongoose.Types.ObjectId('6a496e669dff5480bc8b627d') });
  const rider = await db.collection('users').findOne({ _id: order.collectionAgentId });
  if (!rider) {
    console.log("No rider found for order");
    process.exit(1);
  }
  
  // Create token
  const jwt = (await import('jsonwebtoken')).default;
  const token = jwt.sign({ id: rider._id, version: rider.appSessionVersion || 1, deviceType: 'app' }, process.env.JWT_SECRET);
  
  try {
    const res = await axios.post('http://localhost:5000/lab/order/verify-otp', {
      orderId: '6a496e669dff5480bc8b627d',
      otp: 267416
    }, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    console.log("Success:", res.data);
  } catch (err) {
    console.error("Error status:", err.response?.status);
    console.error("Error data:", err.response?.data);
  }
  process.exit(0);
}
run();
