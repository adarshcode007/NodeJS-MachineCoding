import "dotenv/config";
import express from "express";

import fileRoutes from "./routes/file.routes.js";
import errorHandler from "./middleware/error.middleware.js";

const app = express();

app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ success: true, message: "File Upload Service is running" });
});

app.use("/api/files", fileRoutes);

app.use(errorHandler);

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Server is running at port ${PORT}`);
});
