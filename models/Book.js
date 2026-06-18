import mongoose from "mongoose";

const bookSchema = new mongoose.Schema({
    title: { type: String, required: true },
    author: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String, required: true },
    deliveryFee: { type: Number, required: true },
    coverImage: { type: String, required: true },
    status: { type: String, enum: ["pending_approval", "published", "unpublished"], default: "pending_approval" },
    isCheckedOut: { type: Boolean, default: false },
    librarian: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
}, { timestamps: true });

export default mongoose.model("Book", bookSchema);