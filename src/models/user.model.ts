import mongoose from "mongoose";
import bcrypt from 'bcryptjs'
import {IUser, IUserBase} from '../interfaces/user.interface.js'

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true,
  },

  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },

  password: {
    type: String,
    required: true,
    // minlength: 6,
  },
  userImage: { type: String, default: null },
  phone: String,

  role: {
    type: String,
    enum: ["user", "admin"],
    default: "user",
  },

  profileImage: String,
  
  isActive: { type: Boolean, default: true },

  pets: [
    {
      name: String,
      breed: String,
      age: Number,
      weight: Number,
      allergies: [String],
    },
  ],

  addresses: [
    {
      title: String,
      street: String,
      city: String,
      country: String,
      postalCode: String,
    },
  ],

  Token: {
    type: String,
    default: null
  }
});


userSchema.pre('save', async function (next) {

  if(!this.isModified('password')){
    return next()
  }

  try{
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  }catch(error){
    console.error("Error hashing password:", error);
    next(new Error("Password hashing failed.")); 
  }
})

userSchema.methods.matchPassword = async function (enteredPassword: string): Promise<boolean> {
    return await bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.model<IUser>("User", userSchema);
