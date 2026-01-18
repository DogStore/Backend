import { Document } from "mongoose";
import { Request } from "express";

export interface IUserBase {
    name: string;
    email: string;
    password: string;
    phone?: string;
    role: 'user' | 'admin';
    profileImage?: string;
    isActive: boolean;
    pets: any[]; 
    addresses: any[]; 
    Token: string; 
    userImage?: string;
}

export interface IUser extends IUserBase, Document {
    matchPassword(enteredPassword: string): Promise<boolean>; 
}

export interface CustomerRequest extends Request {
    user?: IUser;
}