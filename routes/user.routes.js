import express from "express";
import User from "../models/User.js";
import { verifyToken, verifyAdmin } from "../middleware/verifyToken.js";
import jwt from "jsonwebtoken";

const router = express.Router();

// GET all users (admin)
router.get("/", verifyToken, verifyAdmin, async (req, res) => {
    try {
        const users = await User.find().select("-password").sort({ createdAt: -1 });
        res.json({ users });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// PATCH change user role (admin)
router.patch("/:id/role", verifyToken, verifyAdmin, async (req, res) => {
    try {
        const { role } = req.body;
        const user = await User.findByIdAndUpdate(
            req.params.id,
            { role },
            { new: true }
        ).select("-password");
        if (!user) return res.status(404).json({ message: "User not found" });
        res.json({ message: "Role updated", user });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// DELETE user (admin)
router.delete("/:id", verifyToken, verifyAdmin, async (req, res) => {
    try {
        await User.findByIdAndDelete(req.params.id);
        res.json({ message: "User deleted" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// GET admin stats
router.get("/admin/stats", verifyToken, verifyAdmin, async (req, res) => {
    try {
        const User = (await import("../models/User.js")).default;
        const Book = (await import("../models/Book.js")).default;
        const Delivery = (await import("../models/Delivery.js")).default;

        const totalUsers = await User.countDocuments();
        const totalBooks = await Book.countDocuments({ status: "published" });
        const totalDeliveries = await Delivery.countDocuments();
        const revenueData = await Delivery.aggregate([
            { $group: { _id: null, total: { $sum: "$deliveryFee" } } }
        ]);
        const totalRevenue = revenueData[0]?.total || 0;

        const booksByCategory = await Book.aggregate([
            { $match: { status: "published" } },
            { $group: { _id: "$category", count: { $sum: 1 } } }
        ]);

        res.json({ totalUsers, totalBooks, totalDeliveries, totalRevenue, booksByCategory });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});
// Update role for Better Auth users (no JWT needed)
router.patch("/update-role", async (req, res) => {
    try {
        const { email, role } = req.body;

        // Admin protection
        const finalRole = (role === "admin" && email !== "admin@gmail.com") ? "user" : role;

        const user = await User.findOneAndUpdate(
            { email },
            { role: finalRole },  // role এর জায়গায় finalRole
            { new: true }
        
        ).select("-password");
        if (!user) return res.status(404).json({ message: "User not found" });
        res.json({ message: "Role updated", user });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Google user এর জন্য JWT token বানাও
router.post("/google-token", async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: "User not found" });

        const token = jwt.sign(
            { id: user._id, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        res.json({ message: "Token created", user });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;