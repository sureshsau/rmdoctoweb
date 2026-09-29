import('dotenv/config').then(async () => {
  const mongoose = (await import('mongoose')).default;
  try {
    await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI);
    console.log('Connected to DB');

    const result = await mongoose.connection.collection('medicineorders').updateMany(
      {},
      { $rename: { 'deliveryAgentId': 'deliveryCommunityPartnerId', 'marketingAgentId': 'blockCoordinatorId' } }
    );
    console.log('Migrated medicineorders:', result);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    mongoose.disconnect();
  }
});
