import mongoose from 'mongoose';

async function run() {
    const uri = "mongodb+srv://rajeshmia8276_db_user:DcUCHrVPoSlixK2Z@rmdocto.buc7n12.mongodb.net/?appName=RMDOCTO";
    await mongoose.connect(uri);

    const db = mongoose.connection.useDb('test'); // The DB in the cluster
    const collection = db.collection('users');
    
    const user = await collection.findOne({ phone: "1234567891" });
    console.log(user);
    
    mongoose.disconnect();
}
run();
