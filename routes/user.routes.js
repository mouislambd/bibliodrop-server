import express from "express";
import User from "../models/User.js";
import { verifyToken, verifyAdmin } from "../middleware/verifyToken.js";

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

export default router;