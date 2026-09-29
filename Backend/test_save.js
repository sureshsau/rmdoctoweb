import mongoose from 'mongoose';
import USER from './models/user.model.js';

async function run() {
    const uri = "mongodb+srv://rajeshmia8276_db_user:DcUCHrVPoSlixK2Z@rmdocto.buc7n12.mongodb.net/?appName=RMDOCTO";
    await mongoose.connect(uri);

    const db = mongoose.connection.useDb('test'); 
    
    try {
        const user = await USER.findOne({ phone: "1234567891" });
        user.appSessionVersion += 1;
        user.lastLoginAt = new Date();
        await user.save();
        console.log("Saved successfully!");
    } catch (err) {
        console.error("Save error:", err);
    }
    
    mongoose.disconnect();
}
run();
