import express from "express";
import authRoutes from "./routes/auth.routes.js";
import errorMiddleware from "./middlewares/error.middleware.js";
import todoRoutes from "./routes/todo.routes.js";

const app = express();

app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/todos", todoRoutes);

app.get("/health", (req, res) => {
  res.status(200).json({
    message: "Server is healthy",
  });
});

app.use(errorMiddleware);

export default app;
