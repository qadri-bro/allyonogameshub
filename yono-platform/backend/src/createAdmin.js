import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import {Admin} from './models.js';
const {MONGODB_URI,ADMIN_EMAIL,ADMIN_PASSWORD}=process.env;
if(!MONGODB_URI) throw new Error('Set MONGODB_URI in backend/.env before creating an admin.');
const email=ADMIN_EMAIL?.trim().toLowerCase();
if(!email) throw new Error('Set ADMIN_EMAIL in backend/.env before creating an admin.');
if(!ADMIN_PASSWORD||ADMIN_PASSWORD.length<12) throw new Error('Set ADMIN_PASSWORD in backend/.env to a password at least 12 characters long.');

try{
  await mongoose.connect(MONGODB_URI);
  const passwordHash=await bcrypt.hash(ADMIN_PASSWORD,12);
  await Admin.findOneAndUpdate({email},{email,passwordHash},{upsert:true,new:true});
  console.log(`Admin ready: ${email}`);
}finally{
  if(mongoose.connection.readyState!==0) await mongoose.disconnect();
}
