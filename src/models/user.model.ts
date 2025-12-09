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
      title: String, // e.g., "Home", "Office"
      street: String,
      city: String,
      country: String,
      postalCode: String,
    },
  ],

  // You might store tokens if you use refresh tokens or logout feature
  Token: {
    type: String,
    default: null
  }
});


userSchema.pre('save', async function (next) {

  // check whether the password has been modified yet
  if(!this.isModified('password')){
    return next()
  }

  try{
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  }catch(error){
    console.error("Error hashing password:", error);
    next(new Error("Password hashing failed.")); // Pass error to Mongoose   
  }
})

userSchema.methods.matchPassword = async function (enteredPassword: string): Promise<boolean> {
    // 'this.password' refers to the HASHED password in the database
    return await bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.model<IUser>("User", userSchema);
