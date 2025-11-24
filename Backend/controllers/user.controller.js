import express from express;
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import USER from '../models/user.schema';



export const Register = async(req,res)=>{
    let {name, email, phone, passwordHash, role, permissions, status} =  req.body;
    if(!name || !email || !phone || !passwordHash || !role || !permissions || !status){
        return res.status(400).json({error: "Please fill all required filled"});
    }
    const existingUser = await USER.findOne({email: email});
    if(existingUser){
        return res.status(400).json({error: "User already exists"});
    }
    const hashPass = await bcrypt.hash(passwordHash, 10);
    

}

export const login = async(req,res)=>{
    
}