import express from 'express';
import dotenv from 'dotenv';
dotenv.config();
import connectdb from "./utils/DbConnect.js";
import redis from './utils/RediesClient.js';
const app = express();

app.use(express.json());





const port = process.env.PORT || 3000;
app.listen(port,()=>{
    connectdb();
    console.log(`app is listing on port ${port}`);
})