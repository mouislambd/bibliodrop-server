# BiblioDrop — Server

This is the backend API for BiblioDrop, an online book delivery management platform. It handles authentication, book listings, delivery requests, reviews, and admin operations.

## Live URL
https://bibliodrop-server.onrender.com

## Key Features
- JWT-protected REST API with role-based access (User, Librarian, Admin)
- Authentication via Better Auth (Email/Password + Google OAuth)
- Book CRUD with admin approval workflow
- Stripe payment integration for delivery fees
- Delivery status tracking (Pending → Dispatched → Delivered)
- Verified review system (only after delivery completion)
- Wishlist management
- Admin analytics endpoints (users, books, revenue, transactions)

## Tech Stack
- Node.js + Express.js
- MongoDB + Mongoose
- Better Auth (MongoDB adapter)
- Stripe
- JWT + bcrypt.js

## npm Packages Used
- express
- mongoose
- better-auth
- mongodb
- stripe
- jsonwebtoken
- bcryptjs
- cors
- cookie-parser
- dotenv
- nodemon (dev)

## Getting Started

```bash
npm install
npm run dev
```

## Environment Variables

Create a `.env` file in the root with:

```
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
STRIPE_SECRET_KEY=your_stripe_secret_key
BETTER_AUTH_SECRET=your_better_auth_secret
BETTER_AUTH_URL=your_backend_url
CLIENT_URL=your_frontend_url
IMGBB_API_KEY=your_imgbb_key
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```