import express from "express";
import cors from "cors";
import userRoutes from "./routes/user.routes.js";
import groupRoutes from "./routes/group.routes.js";
import { errorMiddleware } from "./middleware/error.middleware.js";

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/users", userRoutes);
app.use("/api/groups", groupRoutes);

app.get("/health", (req, res) => {
  res.status(200).json({
    message: "Server is healthy",
  });
});

app.use(errorMiddleware);

export default app;
