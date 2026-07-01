import mongoose from "mongoose";

const deliverySchema = new mongoose.Schema({
    book: { type: mongoose.Schema.Types.ObjectId, ref: "Book", required: true },
    user: { type: String, required: true },
    librarian: { type: String, required: true },
    deliveryFee: { type: Number, required: true },
    status: { type: String, enum: ["pending", "dispatched", "delivered"], default: "pending" },
    transactionId: { type: String, required: true },
    stripeSessionId: { type: String },
}, { timestamps: true });

export default mongoose.model("Delivery", deliverySchema);