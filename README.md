# 📦 InventiEase
### *Smart Inventory & FEFO Management*

[![React Native](img.shields.io)](reactnative.dev)
[![Node.js](img.shields.io)](nodejs.org)
[![MongoDB](img.shields.io)](www.mongodb.com)

InventiEase is a robust cross-platform mobile application built to modernize inventory tracking. Unlike traditional systems, InventiEase focuses on **perishability management**, ensuring that items nearing expiry are prioritized, significantly reducing operational waste.

---

## ✨ Key Features

*   **🍱 Bento-Style Dashboard** – View "Critical" stock levels and total inventory value in a clean, modern grid.
*   **⏳ FEFO Priority** – Automatically highlights items to be cleared first based on the *"First-Expired-First-Out"* principle.
*   **📦 Smart Batch Tracking** – Manage multiple batches of the same product with unique expiry dates.
*   **📸 Image Capture** – Integrated camera functionality for instant visual identification of products.
*   **🔍 Barcode Integration** – Quick-scan capabilities for rapid inventory audits (EAN/UPC support).
*   **🌙 Dark Mode** – Fully responsive UI that adapts to user system preferences.

---

## 🛠 Tech Stack

Use code with caution.

Frontend	Backend	Database
React Native (Expo)	Node.js & Express	MongoDB Atlas
Axios (API)	RESTful Architecture	Mongoose (Modeling)
Context API (State)	Middleware Logic	Nested Batch Schemas
🚀 Getting Started
Prerequisites
Node.js (v18+)
Expo Go app (for physical device testing)
MongoDB Atlas Account
Installation
Clone the Repository
bash
git clone 

bash
github.com

bash

cd Inventory-Application

Setup Backend
bash
cd backend
npm install
# Create a .env file with your MONGO_URI and PORT
npm run dev

Setup Frontend
bash
cd frontend
npm install
# Create a .env file with EXPO_PUBLIC_API_URL=http://YOUR_IP:5000/api
npx expo start

📊 Database Schema (FEFO Optimized)
The system utilizes a nested Batch Schema within the Product model. This allows the system to calculate totalQuantity and nearestExpiry dynamically.
javascript
// Example Batch Logic
{
  name: "Whole Milk",
  totalQuantity: 50,
  batches: [
    { qty: 20, expiry: "2026-02-10" }, // Targeted first!
    { qty: 30, expiry: "2026-03-15" }
  ]
}

Created by Nelson - 2026
