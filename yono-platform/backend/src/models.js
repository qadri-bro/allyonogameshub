import mongoose from 'mongoose';
const gameSchema = new mongoose.Schema({
  name:{type:String,required:true,trim:true}, slug:{type:String,required:true,unique:true},
  category:{type:String,default:'Featured'}, description:{type:String,default:''},
  signupBonus:{type:String,default:''}, minWithdrawal:{type:String,default:''},
  version:{type:String,default:'1.0.0'}, size:{type:String,default:''},
  thumbnail:{type:String,default:''}, apkPath:{type:String,default:''},
  referralUrl:{type:String,default:''}, status:{type:String,enum:['draft','published'],default:'draft'},
  isFeatured:{type:Boolean,default:false}, clicks:{type:Number,default:0}
},{timestamps:true});
export const Game=mongoose.model('Game',gameSchema);
const adminSchema=new mongoose.Schema({email:{type:String,unique:true,lowercase:true,trim:true},passwordHash:String},{timestamps:true});
export const Admin=mongoose.model('Admin',adminSchema);
