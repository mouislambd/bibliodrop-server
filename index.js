import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import bookRoutes from "./routes/book.routes.js";
import deliveryRoutes from "./routes/delivery.routes.js";
import reviewRoutes from "./routes/review.routes.js";
import userRoutes from "./routes/user.routes.js";
import authRoutes from "./routes/auth.routes.js";
import { auth } from "./config/auth.js";
import { toNodeHandler } from "better-auth/node";
import wishlistRoutes from "./routes/wishlist.routes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

connectDB();

app.use(cors({
    origin: [
        process.env.CLIENT_URL,
        "http://localhost:3000",
        "https://bibliodrop-client-sand.vercel.app",
        "https://bibliodrop-client-git-main-tanhaislammou097-2792s-projects.vercel.app"
    ],
    credentials: true,
}));

// Better Auth — BEFORE express.json()
app.all("/api/auth/*splat", toNodeHandler(auth));

app.use(express.json());
app.use(cookieParser());

// Routes
app.use("/api/user-auth", authRoutes);
app.use("/api/books", bookRoutes);
app.use("/api/deliveries", deliveryRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/users", userRoutes);
app.use("/api/wishlist", wishlistRoutes);


app.get("/", (req, res) => {
    res.json({ message: "BiblioDrop Server is running! 📚" });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});