import('dotenv/config').then(async () => {
  const mongoose = (await import('mongoose')).default;
  const User = (await import('./models/user.model.js')).default;
  
  try {
    await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI);
    const result = await User.updateMany(
      { kycStatus: 'VERIFIED' },
      { $set: { kycStatus: 'verified' } }
    );
    console.log('Fixed VERIFIED to verified:', result.modifiedCount);

    const result2 = await User.updateMany(
      { kycStatus: 'PENDING' },
      { $set: { kycStatus: 'pending' } }
    );
    console.log('Fixed PENDING to pending:', result2.modifiedCount);

  } finally {
    mongoose.disconnect();
  }
});
