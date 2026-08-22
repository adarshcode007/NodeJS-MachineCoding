import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const connection = await mongoose.connect(process.env.MONGODB_URI);
    console.log("Mongo DB connected: ", connection);
  } catch (error) {
    console.log("Error connecting mongodb: ", error);
    process.exit(1);
  }
};

export default connectDB;
