import 'dotenv/config';
import mongoose from 'mongoose';
import {Game} from './models.js';

if(!process.env.MONGODB_URI)throw new Error('MONGODB_URI is required.');
await mongoose.connect(process.env.MONGODB_URI);

const existingCount=await Game.countDocuments();
if(existingCount){
  console.log(`Skipped: ${existingCount} game listing(s) already exist.`);
}else{
  const games=[
    {name:'IND Bingo',slug:'ind-bingo',category:'Bingo',description:'Popular for simple bingo-style gameplay.',signupBonus:'Approx. ₹25',minWithdrawal:'Around ₹100',status:'published'},
    {name:'My 777 Yono',slug:'my-777-yono',category:'Featured',description:'Slots and card-style games in one app.',signupBonus:'Approx. ₹30',minWithdrawal:'Around ₹100',status:'published'},
    {name:'Bet 213 Slots',slug:'bet-213-slots',category:'Slots',description:'Focused on slots and spin-style gameplay.',signupBonus:'Approx. ₹30',minWithdrawal:'Around ₹100',status:'published'},
    {name:'Spin 101',slug:'spin-101',category:'Slots',description:'Spin-focused listing; check the current operator details.',signupBonus:'Approx. ₹30',minWithdrawal:'Around ₹100',status:'published'},
    {name:'ICIC Games',slug:'icic-games',category:'Card games',description:'Mixed card games, slots and other modes.',signupBonus:'Approx. ₹50',minWithdrawal:'Around ₹100',status:'published'},
    {name:'Bingo 101',slug:'bingo-101',category:'Bingo',description:'Simple bingo-based interface.',signupBonus:'Approx. ₹25',minWithdrawal:'Around ₹100',status:'published'}
  ];
  await Game.insertMany(games);
  console.log(`Seeded ${games.length} starter listings. Add an approved download link or APK in the admin panel before enabling downloads.`);
}

await mongoose.disconnect();
