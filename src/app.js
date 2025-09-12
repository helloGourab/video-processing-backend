import express from "express";
import cors from "cors";
import morgan from "morgan";
import connectDB from "./config/db.js";
import videoRoutes from "./routes/videoRoutes.js";

const app = express();

app.get("/health", (req, res) => res.send("OK"));

// Middlewares
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

connectDB();

// Routes
app.use("/api/videos", videoRoutes);

export default app;
