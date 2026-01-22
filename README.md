## 📦 SmartInventory & Expiry Tracker
Enterprise-Grade Stock Management with Intelligent Expiry Alerts
## 🚀 Overview
SmartInventory is a robust inventory management solution built to solve the "hidden waste" problem in retail and pharmacy. It features a high-performance Smart Scanner, real-time Expiry Alerts, and a secure Admin Control Suite.

### ✨ Key Features

🔍 Smart Scanner: Instant barcode recognition and automatic product registry lookups.

🔔 Alerts System: Color-coded urgency levels (Critical, High, Early) based on custom date thresholds.

🏗️ Bento Dashboard: High-level analytics showing total records vs. unique product types.

🔐 Admin Security: PIN-protected inventory management and sales data visualization.

🌓 Dynamic Theme: Full support for high-contrast Dark Mode and elegant Light Mode.

## 🛠️ Tech Stack
Frontend: React Native (Expo SDK 51)

Navigation: Expo Router (File-based routing)

State & Logic: Custom Hooks & Context API

Backend: Node.js with Express

Database: MongoDB via Mongoose

Styling: StyleSheet with Dynamic Theme Injection

### ⚙️ Installation & Setup
Follow these steps to get a local copy up and running.

1. Prerequisites
Install Node.js (LTS version)

Install Git

Install the Expo Go app on your iOS or Android device.

2. Clone the Repository
Bash

git clone https://github.com/yourusername/smart-inventory.git
cd smart-inventory
3. Install Dependencies
Bash

npm install
4. Environment Configuration
Create a .env file in the root directory and add your backend URL:

Code snippet

EXPO_PUBLIC_API_URL=https://your-api-endpoint.com/api
5. Launch the App
Bash

npx expo start
Scan the QR Code using your phone’s camera (iOS) or the Expo Go app (Android).

The app will bundle and open on your device!

## 📱 Folder Structure
Plaintext

.
├── app/                 # Expo Router (Pages)
│   ├── (tabs)/          # Main user navigation
│   ├── (admin)/         # Protected admin sector
│   └── _layout.tsx      # Root configuration
├── assets/              # Images, Fonts, Icons
├── components/          # Reusable UI elements
├── context/             # Theme & Global State
├── hooks/               # useAlerts, useInventory, etc.
└── utils/               # Formatter & Validation helpers

## 🛡️ Security Note
A 4-digit PIN system protects the Admin Panel.

Default PIN: 1234 (Can be updated in Admin Settings)

Session Guard: Navigating away from the Admin sector automatically locks the session.

🤝 Contributing
Fork the Project

Create your Feature Branch (git checkout -b feature/AmazingFeature)

Commit your Changes (git commit -m 'Add some AmazingFeature')

Push to the Branch (git push origin feature/AmazingFeature)

Open a Pull Request

📄 License
Distributed under the MIT License. See LICENSE for more information.
