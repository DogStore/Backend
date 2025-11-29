import mongoose from 'mongoose'
import dotenv from 'dotenv'

dotenv.config();

const connectDB = async (): Promise<void> => {
    try{
        const connection = await mongoose.connect(process.env.MONGO_URL as string);
        console.log(`MongoDB is Connected ${connection.connection.host}`)
    }catch(err: any){
        console.log(`There is problem with database ${err.message}` )
    }
}

export default connectDB();