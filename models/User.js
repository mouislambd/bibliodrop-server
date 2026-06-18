import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String },
    photo: { type: String, default: "" },
    role: { type: String, enum: ["user", "librarian", "admin"], default: "user" },
    provider: { type: String, default: "email" },
}, { timestamps: true });

export default mongoose.model("User", userSchema);