import express from "express";
import cacheRoutes from "./routes/cache.route.js";

const app = express();

app.use(express.json());

app.use("/cache", cacheRoutes);

app.use(errorMiddleware);

export default app;
