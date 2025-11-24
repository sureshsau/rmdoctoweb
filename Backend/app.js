import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import connectdb from "./utils/DbConnect.js";
import userRouter from './routes/user.route.js'
import redis from './utils/RediesClient.js';
const app = express();

app.use(express.json());


app.use('/user', userRouter);


const port = process.env.PORT || 3000;
app.listen(port,()=>{
    connectdb();
    console.log(`app is listing on port ${port}`);
})