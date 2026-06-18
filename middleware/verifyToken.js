import jwt from "jsonwebtoken";

const verifyToken = (req, res, next) => {
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