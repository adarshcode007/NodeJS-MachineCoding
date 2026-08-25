import app from "./app.js";
import dotenv from "dotenv";
import { connectRedis } from "./config/redis.js";

dotenv.config();

const PORT = process.env.PORT || 3001;

const startServer = async () => {
  try {
    await connectRedis();

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.log("Error starting the server: ", error);
    process.exit(1);
  }
};

startServer();
