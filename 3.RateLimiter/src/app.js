import express from "express";
import cors from "cors";
import cookieParse from "cookie-parser";
import testRoutes from "./routes/test.route.js";

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParse());

app.use("/api/test", testRoutes);

app.get("/", (req, res) => {
  req.status(200).json({
    message: "App is running",
  });
});

export default app;
