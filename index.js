import express from "express";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import authRoutes from "./routes/auth.js";
import userRouter from "./routes/user.js";
import cors from "cors";
const router = express.Router();

dotenv.config();

const app = express();
app.use(cors({
  origin: "http://localhost:3000" || "http://192.168.1.104:3000", // your frontend URL
  credentials: true, // if you're using cookies / sessions
}));
app.use(express.json());

export const supabase = createClient(
  process.env.SUPA_BASE_URI,
  process.env.SUPA_BASE_KEY
);

app.use("/auth", authRoutes);
app.use("/user", userRouter);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
