import express from "express";
import cors from "cors";
import userRoutes from "./routes/user.routes.js";
import groupRoutes from "./routes/group.routes.js";

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

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

export default app;
