import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.route.js";
import errorMiddleware from "./middlewares/error.middleware.js";

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use("/api/auth", authRoutes);

app.get("/health", (req, res) => {
  res.status(200).json({
    message: "server is healthy",
  });
});

app.use(errorMiddleware);

export default app;
