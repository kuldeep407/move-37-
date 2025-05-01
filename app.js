import express from "express";
import path from "path";
import videoRoutes from "./routes/videoRoutes.js";
import { fileURLToPath } from "url";
import { connectDB } from "./config/db.js";
import dotenv from 'dotenv';
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/processed", express.static(path.join(__dirname, "processed")));

app.use("/api/videos", videoRoutes);

app.get("/", (req, res) => {
  console.log("Server is running...");
  res.send("WORKING");
});

connectDB();

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
