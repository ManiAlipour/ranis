import mongoose from "mongoose";

const getMongoUri = (): string => {
  const uri = process.env.MONGODB_URI ?? process.env.MONGO_URI;

  if (!uri) {
    throw new Error(
      "Missing MongoDB connection string. Set MONGODB_URI in the environment.",
    );
  }

  return uri;
};

export const connectDB = async () => {
  const { connection } = await mongoose.connect(getMongoUri());
  console.log(`MongoDB connected: ${connection.host}`);
  return connection;
};

export const disconnectDB = async () => {
  await mongoose.disconnect();
};

export default connectDB;
