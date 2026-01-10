📦 InventiEase: Smart Inventory & FEFO Management
InventiEase is a robust cross-platform mobile application built to modernize inventory tracking. Unlike traditional systems, InventiEase focuses on perishability management, ensuring that items nearing expiry are prioritized for sale or use, significantly reducing operational waste.

✨ Key Features
Smart Batch Tracking: Manage multiple batches of the same product with unique expiry dates and quantities.

FEFO Priority Dashboard: Automatically identifies and highlights items that need to be cleared first based on the "First-Expired-First-Out" principle.

Image Capture: Integrated camera functionality to snap product photos for instant visual identification.

Barcode Integration: Quick-scan capabilities for rapid inventory audits (supports EAN/UPC).

Real-time Analytics: Track "Critical" stock levels and total inventory value via a bento-style dashboard.

Dark Mode Support: Fully responsive UI that adapts to user system preferences.

🛠 Tech Stack
Frontend:

React Native (Expo) - Cross-platform mobile framework.

Axios - For asynchronous API communication.

Context API - Global state and theme management.

Backend:

Node.js & Express - Scalable RESTful API architecture.

MongoDB Atlas - Cloud-based NoSQL database for flexible product schemas.

Mongoose - Advanced data modeling and middleware for batch calculations.

🚀 Getting Started
Prerequisites
Node.js (v18+)

Expo Go app (for physical device testing)

MongoDB Atlas Account

Installation
Clone the Repository:

Bash

git clone https://github.com/yourusername/inventiease.git
cd inventiease
Setup Backend:

Bash

cd backend
npm install
# Create a .env file with your MONGO_URI and PORT
npm run dev
Setup Frontend:

Bash

cd frontend
npm install
# Create a .env file with EXPO_PUBLIC_API_URL=http://YOUR_IP:5000/api
npx expo start
📊 Database Schema (FEFO Optimized)
The system utilizes a nested Batch Schema within the Product model. This allows the system to calculate totalQuantity and nearestExpiry dynamically without redundant data entry.

JavaScript

// Example Batch Logic
{
  name: "Whole Milk",
  totalQuantity: 50,
  batches: [
    { qty: 20, expiry: "2026-02-10" }, // Targeted first
    { qty: 30, expiry: "2026-03-15" }
  ]
}
