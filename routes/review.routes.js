import express from "express";
import Review from "../models/Review.js";
import Delivery from "../models/Delivery.js";
import { verifyToken } from "../middleware/verifyToken.js";

const router = express.Router();

// GET reviews for a book
router.get("/:bookId", async (req, res) => {
    try {
        const reviews = await Review.find({ book: req.params.bookId })
            .populate("user", "name photo")
            .sort({ createdAt: -1 });
        res.json({ reviews });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// POST add review (only if delivered)
router.post("/", verifyToken, async (req, res) => {
    try {
        const { bookId, rating, comment } = req.body;

        const delivery = await Delivery.findOne({
            book: bookId,
            user: req.user.id,
            status: "delivered",
        });
        if (!delivery) {
            return res.status(403).json({ message: "You can only review books you have received" });
        }

        const existing = await Review.findOne({ book: bookId, user: req.user.id });
        if (existing) {
            return res.status(400).json({ message: "You have already reviewed this book" });
        }

        const review = await Review.create({
            book: bookId,
            user: req.user.id,
            rating: Number(rating),
            comment,
        });

        const populated = await review.populate("user", "name photo");
        res.status(201).json({ message: "Review added", review: populated });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// PUT edit review
router.put("/:id", verifyToken, async (req, res) => {
    try {
        const review = await Review.findById(req.params.id);
        if (!review) return res.status(404).json({ message: "Review not found" });
        if (review.user.toString() !== req.user.id) {
            return res.status(403).json({ message: "Forbidden" });
        }
        const updated = await Review.findByIdAndUpdate(
            req.params.id,
            { rating: req.body.rating, comment: req.body.comment },
            { new: true }
        ).populate("user", "name photo");
        res.json({ message: "Review updated", review: updated });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// DELETE review
router.delete("/:id", verifyToken, async (req, res) => {
    try {
        const review = await Review.findById(req.params.id);
        if (!review) return res.status(404).json({ message: "Review not found" });
        if (review.user.toString() !== req.user.id && req.user.role !== "admin") {
            return res.status(403).json({ message: "Forbidden" });
        }
        await Review.findByIdAndDelete(req.params.id);
        res.json({ message: "Review deleted" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// GET my reviews
router.get("/user/my-reviews", verifyToken, async (req, res) => {
    try {
        const reviews = await Review.find({ user: req.user.id })
            .populate("book", "title coverImage")
            .sort({ createdAt: -1 });
        res.json({ reviews });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;