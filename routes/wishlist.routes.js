import express from "express";
import Wishlist from "../models/Wishlist.js";
import { verifyToken } from "../middleware/verifyToken.js";

const router = express.Router();

// GET user's wishlist
router.get("/", verifyToken, async (req, res) => {
    try {
        const items = await Wishlist.find({ user: req.user.id })
            .populate("book")
            .sort({ createdAt: -1 });
        res.json({ items });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// POST add to wishlist
router.post("/", verifyToken, async (req, res) => {
    try {
        const { bookId } = req.body;
        const existing = await Wishlist.findOne({ user: req.user.id, book: bookId });
        if (existing) return res.status(400).json({ message: "Already in wishlist" });

        const item = await Wishlist.create({ user: req.user.id, book: bookId });
        res.status(201).json({ message: "Added to wishlist", item });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// DELETE remove from wishlist
router.delete("/:bookId", verifyToken, async (req, res) => {
    try {
        await Wishlist.findOneAndDelete({ user: req.user.id, book: req.params.bookId });
        res.json({ message: "Removed from wishlist" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// GET check if a book is wishlisted
router.get("/check/:bookId", verifyToken, async (req, res) => {
    try {
        const item = await Wishlist.findOne({ user: req.user.id, book: req.params.bookId });
        res.json({ isWishlisted: !!item });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;