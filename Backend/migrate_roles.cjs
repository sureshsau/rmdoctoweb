const { MongoClient } = require('mongodb');

async function run() {
  const uri = "mongodb+srv://rajeshmia8276_db_user:DcUCHrVPoSlixK2Z@rmdocto.buc7n12.mongodb.net/?appName=RMDOCTO";
  
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db('test');
    
    // Update users: replace 'rmrider' with 'delivery_partner' in roles array
    const usersCollection = db.collection('users');
    
    // update dashboard
    let res = await usersCollection.updateMany(
      { dashboard: "rmrider" },
      { $set: { dashboard: "delivery_partner" } }
    );
    console.log(`Updated dashboard for ${res.modifiedCount} users`);
    
    // update roles array
    // MongoDB array update: replace element
    res = await usersCollection.updateMany(
      { roles: "rmrider" },
      { $set: { "roles.$": "delivery_partner" } }
    );
    console.log(`Updated roles array for ${res.modifiedCount} users`);
    
    // We should also handle cases where 'rmrider' is in the roles array multiple times (not common, but possible),
    // or use $pull and $addToSet? Or just update all. The positional operator `$` updates the first matching element.
    
    // update offers
    const offersCollection = db.collection('offers');
    res = await offersCollection.updateMany(
      { targetRoles: "rmrider" },
      { $set: { "targetRoles.$": "delivery_partner" } }
    );
    console.log(`Updated offers targetRoles for ${res.modifiedCount} offers`);

  } catch (e) {
    console.error(e);
  } finally {
    await client.close();
  }
}
run().catch(console.error);
