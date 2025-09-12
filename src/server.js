import dotenv from "dotenv";
import app from "./app.js";
import mongoose from "mongoose";

dotenv.config();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

process.on("SIGINT", async () => {
  console.log("Shutting down gracefully...");
  await mongoose.connection.close();
  process.exit(0);
});
