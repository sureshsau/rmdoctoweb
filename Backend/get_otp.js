import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const uri = process.env.MONGO_URI;
mongoose.connect(uri)
  .then(async () => {
    const db = mongoose.connection.db;
    const order = await db.collection('laborders').findOne({ _id: new mongoose.Types.ObjectId('6a496e669dff5480bc8b627d') });
    console.log("Order found:", !!order);
    if (order) {
      console.log("OTP:", order.otp);
      console.log("Status:", order.orderStatus);
    }
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
