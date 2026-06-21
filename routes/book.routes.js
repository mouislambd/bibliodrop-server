import express from "express";
import Book from "../models/Book.js";
import { verifyToken, verifyAdmin, verifyLibrarian } from "../middleware/verifyToken.js";
const router = express.Router();

// GET all published books (public) with search, filter, pagination
router.get("/", async (req, res) => {
    try {
        const { search, category, minFee, maxFee, availability, page = 1, limit = 9 } = req.query;
        const query = { status: "published" };

        if (search) query.title = { $regex: search, $options: "i" };
        if (category) query.category = category;
        if (availability === "available") query.isCheckedOut = false;
        if (availability === "unavailable") query.isCheckedOut = true;
        if (minFee || maxFee) {
            query.deliveryFee = {};
            if (minFee) query.deliveryFee.$gte = Number(minFee);
            if (maxFee) query.deliveryFee.$lte = Number(maxFee);
        }

        const total = await Book.countDocuments(query);
        const books = await Book.find(query)
            .populate("librarian", "name email photo")
            .skip((page - 1) * limit)
            .limit(Number(limit))
            .sort({ createdAt: -1 });

        res.json({ books, total, page: Number(page), totalPages: Math.ceil(total / limit) });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// GET featured books (latest 6 published)
router.get("/featured", async (req, res) => {
    try {
        const books = await Book.find({ status: "published" })
            .populate("librarian", "name photo")
            .sort({ createdAt: -1 })
            .limit(6);
        res.json({ books });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// GET librarian's own books
router.get("/librarian/my-books", verifyToken, verifyLibrarian, async (req, res) => {
    try {
        const books = await Book.find({ librarian: req.user.id }).sort({ createdAt: -1 });
        res.json({ books });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// GET all pending approval books (admin)
router.get("/admin/all-pending", verifyToken, verifyAdmin, async (req, res) => {
    try {
        const books = await Book.find({ status: "pending_approval" })
            .populate("librarian", "name email")
            .sort({ createdAt: -1 });
        res.json({ books });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// GET all books (admin)
router.get("/admin/all-books", verifyToken, verifyAdmin, async (req, res) => {
    try {
        const books = await Book.find().populate("librarian", "name email").sort({ createdAt: -1 });
        res.json({ books });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// GET single book
router.get("/:id", async (req, res) => {
    try {
        const book = await Book.findById(req.params.id)
            .populate("librarian", "name email photo");
        if (!book) return res.status(404).json({ message: "Book not found" });
        res.json({ book });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// POST add book (librarian only)
router.post("/", verifyToken, verifyLibrarian, async (req, res) => {
    try {
        const { title, author, description, category, deliveryFee, coverImage } = req.body;
        const book = await Book.create({
            title, author, description, category,
            deliveryFee: Number(deliveryFee),
            coverImage,
            librarian: req.user.id,
            status: "pending_approval",
        });
        res.status(201).json({ message: "Book added successfully", book });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// PUT update book (librarian only)
router.put("/:id", verifyToken, verifyLibrarian, async (req, res) => {
    try {
        const book = await Book.findById(req.params.id);
        if (!book) return res.status(404).json({ message: "Book not found" });
        if (book.librarian.toString() !== req.user.id && req.user.role !== "admin") {
            return res.status(403).json({ message: "Forbidden" });
        }
        const updated = await Book.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json({ message: "Book updated", book: updated });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// DELETE book
router.delete("/:id", verifyToken, async (req, res) => {
    try {
        const book = await Book.findById(req.params.id);
        if (!book) return res.status(404).json({ message: "Book not found" });
        if (book.librarian.toString() !== req.user.id && req.user.role !== "admin") {
            return res.status(403).json({ message: "Forbidden" });
        }
        await Book.findByIdAndDelete(req.params.id);
        res.json({ message: "Book deleted" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// PATCH toggle publish/unpublish (librarian)
router.patch("/:id/toggle-publish", verifyToken, verifyLibrarian, async (req, res) => {
    try {
        const book = await Book.findById(req.params.id);
        if (!book) return res.status(404).json({ message: "Book not found" });
        if (book.status === "pending_approval") {
            return res.status(400).json({ message: "Cannot publish a pending approval book" });
        }
        book.status = book.status === "published" ? "unpublished" : "published";
        await book.save();
        res.json({ message: `Book ${book.status}`, book });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// PATCH admin approve book
router.patch("/:id/approve", verifyToken, verifyAdmin, async (req, res) => {
    try {
        const book = await Book.findByIdAndUpdate(
            req.params.id,
            { status: "published" },
            { new: true }
        );
        if (!book) return res.status(404).json({ message: "Book not found" });
        res.json({ message: "Book approved and published", book });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;