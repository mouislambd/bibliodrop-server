import express from "express";
import Delivery from "../models/Delivery.js";
import Book from "../models/Book.js";
import { verifyToken, verifyLibrarian, verifyAdmin } from "../middleware/verifyToken.js";

const router = express.Router();

const getStripe = async () => {
    const { default: Stripe } = await import("stripe");
    return new Stripe(process.env.STRIPE_SECRET_KEY);
};

// POST create stripe checkout session
router.post("/create-checkout-session", verifyToken, async (req, res) => {
    try {
        const stripe = await getStripe();
        const { bookId } = req.body;
        const book = await Book.findById(bookId);
        if (!book) return res.status(404).json({ message: "Book not found" });
        // if (book.isCheckedOut) return res.status(400).json({ message: "Book is already checked out" });

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            line_items: [{
                price_data: {
                    currency: "usd",
                    product_data: {
                        name: `Delivery fee for: ${book.title}`,
                        images: [book.coverImage],
                    },
                    unit_amount: Math.round(book.deliveryFee * 100),
                },
                quantity: 1,
            }],
            mode: "payment",
            success_url: `${process.env.CLIENT_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}&bookId=${bookId}`,
            cancel_url: `${process.env.CLIENT_URL}/books/${bookId}`,
            metadata: { bookId, userId: req.user.id },
        });

        res.json({ url: session.url, sessionId: session.id });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// POST confirm delivery after payment
router.post("/confirm", verifyToken, async (req, res) => {
    try {
        const stripe = await getStripe();
        const { sessionId, bookId } = req.body;

        const session = await stripe.checkout.sessions.retrieve(sessionId);
        if (session.payment_status !== "paid") {
            return res.status(400).json({ message: "Payment not completed" });
        }

        const book = await Book.findById(bookId);
        if (!book) return res.status(404).json({ message: "Book not found" });

        const existing = await Delivery.findOne({ stripeSessionId: sessionId });
        if (existing) return res.status(400).json({ message: "Delivery already created" });

        const delivery = await Delivery.create({
            book: bookId,
            user: req.user.id,
            librarian: book.librarian,
            deliveryFee: book.deliveryFee,
            status: "pending",
            transactionId: session.payment_intent,
            stripeSessionId: sessionId,
        });

        await Book.findByIdAndUpdate(bookId, { isCheckedOut: true });
        res.status(201).json({ message: "Delivery request created", delivery });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// GET user's delivery history
router.get("/my-deliveries", verifyToken, async (req, res) => {
    try {
        const deliveries = await Delivery.find({ user: req.user.id })
            .populate("book", "title coverImage category")
            .populate("librarian", "name email")
            .sort({ createdAt: -1 });
        res.json({ deliveries });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// GET librarian's deliveries
router.get("/librarian-deliveries", verifyToken, verifyLibrarian, async (req, res) => {
    try {
        const deliveries = await Delivery.find({ librarian: req.user.id })
            .populate("book", "title coverImage")
            .populate("user", "name email")
            .sort({ createdAt: -1 });
        res.json({ deliveries });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// GET all deliveries (admin)
router.get("/all", verifyToken, async (req, res) => {
    try {
        const deliveries = await Delivery.find()
            .populate("book", "title")
            .populate("user", "name email")
            .populate("librarian", "name email")
            .sort({ createdAt: -1 });
        res.json({ deliveries });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// PATCH update delivery status (librarian)
router.patch("/:id/status", verifyToken, verifyLibrarian, async (req, res) => {
    try {
        const { status } = req.body;
        const allowed = ["pending", "dispatched", "delivered"];
        if (!allowed.includes(status)) {
            return res.status(400).json({ message: "Invalid status" });
        }
        const delivery = await Delivery.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        );
        if (!delivery) return res.status(404).json({ message: "Delivery not found" });
        res.json({ message: "Status updated", delivery });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});
// GET all deliveries / transactions (admin only)
router.get("/all", verifyToken, verifyAdmin, async (req, res) => {
    try {
        const deliveries = await Delivery.find()
            .populate("book", "title")
            .populate("user", "name email")
            .populate("librarian", "name email")
            .sort({ createdAt: -1 });
        res.json({ deliveries });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});
// GET check if user can review
router.get("/can-review/:bookId", verifyToken, async (req, res) => {
    try {
        const delivery = await Delivery.findOne({
            book: req.params.bookId,
            user: req.user.id,
            status: "delivered",
        });
        res.json({ canReview: !!delivery });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;