import { Document } from "mongoose";
import { Request } from "express";

// Define the interface for the base properties of the user document
export interface IUserBase {
    name: string;
    email: string;
    password: string;
    phone?: string;
    role: 'user' | 'admin';
    profileImage?: string;
    isActive: boolean;
    
    // Note: It's good practice to define specific types for nested arrays later!
    pets: any[]; 
    addresses: any[]; 
    tokens: any[]; 
}

// Define the interface for the full Mongoose document, which includes the methods
export interface IUser extends IUserBase, Document {
    // Add the custom instance method here so TypeScript knows it exists on the fetched document
    matchPassword(enteredPassword: string): Promise<boolean>; 
}

// extend the user interface for request object
export interface CustomerRequest extends Request {
    user?: IUser; // make user optional to handle unauthenticated requests
}