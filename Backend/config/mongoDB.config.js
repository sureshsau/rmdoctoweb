import mongoose from "mongoose";
import dotenv from 'dotenv'
dotenv.config();

/* Fail fast instead of letting Mongoose buffer a request for 10s and then
   reject it — a dead connection should surface as an error, not a hang. */
const options = {
    serverSelectionTimeoutMS: 10_000,
};

/* Mongoose reconnects on its own once the driver has connected at least once,
   so these are purely for visibility when the socket drops in production. */
mongoose.connection.on("disconnected", () => {
    console.error("⚠️  MongoDB disconnected");
});
mongoose.connection.on("reconnected", () => {
    console.log("✅ MongoDB reconnected");
});
mongoose.connection.on("error", (err) => {
    console.error("❌ MongoDB error:", err.message);
});

/* The initial connect is the one Mongoose will NOT retry for us. Swallowing a
   failure here leaves the app listening with no database, so every route that
   touches Mongo answers 500 until someone restarts it — retry, then give up
   loudly. */
let connectdb = async (retries = 5) => {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            await mongoose.connect(process.env.MONGO_URI, options);
            console.log("connect to database");
            return;
        } catch (err) {
            console.error(
                `❌ MongoDB connect failed (attempt ${attempt}/${retries}):`,
                err.message
            );
            if (attempt === retries) throw err;
            await new Promise((r) => setTimeout(r, Math.min(attempt * 2000, 10_000)));
        }
    }
};
export default connectdb;
