import jwt from "jsonwebtoken";
import { auth } from "../config/auth.js";
import { fromNodeHeaders } from "better-auth/node";

const verifyToken = async (req, res, next) => {
    // First try Better Auth session
    try {
        const session = await auth.api.getSession({
            headers: fromNodeHeaders(req.headers),
        });
        if (session?.user) {
            req.user = {
                id: session.user.id,
                email: session.user.email,
                role: session.user.role || "user",
            };
            return next();
        }
    } catch (e) { }

    // Fallback: JWT cookie
    const token = req.cookies?.token;
    if (!token) {
        return res.status(401).json({ message: "Unauthorized - No token" });
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ message: "Unauthorized - Invalid token" });
    }
};

const verifyAdmin = (req, res, next) => {
    if (req.user?.role !== "admin") {
        return res.status(403).json({ message: "Forbidden - Admin only" });
    }
    next();
};

const verifyLibrarian = (req, res, next) => {
    if (req.user?.role !== "librarian" && req.user?.role !== "admin") {
        return res.status(403).json({ message: "Forbidden - Librarian only" });
    }
    next();
};

export { verifyToken, verifyAdmin, verifyLibrarian };