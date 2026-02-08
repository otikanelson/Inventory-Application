# 📦 InventEase - AI-Powered Inventory Management System

**Version:** 2.0.5 (Production Ready)  
**Status:** ✅ Ready for Deployment  
**Platform:** Android & iOS  
**Last Updated:** February 8, 2026

---

## 🎯 Overview

InventEase is a cutting-edge mobile inventory management application that combines artificial intelligence with intuitive design to help businesses reduce waste, prevent stockouts, and maximize profitability. Built specifically for retail businesses, grocery stores, pharmacies, and any organization dealing with perishable goods.

### Key Differentiators
- **AI-Powered Predictions**: Forecast demand and identify risks before they happen
- **Mobile-First**: Manage inventory anywhere, anytime
- **FEFO Management**: First Expired, First Out automation
- **Proactive Alerts**: Get notified when action is needed
- **Comprehensive Analytics**: Make data-driven decisions

---

## ✨ Core Features

### 1. Smart Dashboard
- Real-time inventory overview
- AI-powered urgent items highlighting
- Quick access to all major features
- Key metrics at a glance

### 2. Barcode Scanner
- Instant product lookup
- Add new products by scanning
- Quick stock updates
- Rapid scan mode for high-volume operations

### 3. Inventory Management
- Complete product catalog with images
- Batch tracking with expiry dates
- Real-time stock levels
- Category organization
- AI risk indicators

### 4. FEFO (First Expired, First Out)
- Automatic sorting by expiry date
- AI-powered risk sorting
- Recommended discount percentages
- One-tap access to expiring products

### 5. AI Prediction System
- Demand forecasting (7, 14, 30 days)
- Risk scores (0-100) for each product
- Stockout date predictions
- Actionable recommendations
- Sales velocity tracking

### 6. Admin Dashboard
- Advanced analytics and reporting
- Sales performance tracking
- Category insights
- Prediction accuracy monitoring
- PIN-protected security

### 7. Alerts System
- Configurable expiry alerts
- Real-time notifications
- Customizable thresholds
- Alert history tracking

---

## 🛠 Tech Stack

### Frontend
- **Framework**: React Native 0.81 with Expo SDK 54
- **Navigation**: Expo Router (file-based)
- **State Management**: React Context API
- **UI Components**: React Native Paper
- **HTTP Client**: Axios
- **Storage**: AsyncStorage
- **Camera**: Expo Camera
- **Image Handling**: Expo Image Picker

### Backend
- **Runtime**: Node.js 18
- **Framework**: Express 5.2
- **Database**: MongoDB 6.0 with Mongoose
- **Real-time**: Socket.IO
- **Image Storage**: Cloudinary
- **Caching**: Node-cache
- **Security**: Helmet, CORS, JWT

### AI/ML
- **Custom JavaScript ML Engine**
- Moving average calculations
- Velocity-based forecasting
- Risk scoring algorithms
- Trend analysis

---

## 🚀 Getting Started

### Prerequisites
- Node.js v18 or higher
- npm or yarn
- MongoDB Atlas account (or local MongoDB)
- Cloudinary account (for image uploads)
- Expo CLI (`npm install -g expo-cli`)
- EAS CLI (`npm install -g eas-cli`)

### Installation

#### 1. Clone Repository
```bash
git clone https://github.com/otikanelson/Inventory-Application.git
cd Inventory-Application
```

#### 2. Setup Backend
```bash
cd backend
npm install

# Create .env file with:
# MONGO_URI=your_mongodb_connection_string
# PORT=5000
# CLOUDINARY_CLOUD_NAME=your_cloud_name
# CLOUDINARY_API_KEY=your_api_key
# CLOUDINARY_API_SECRET=your_api_secret

npm run dev
```

#### 3. Setup Frontend
```bash
# From root directory
npm install

# Create .env file with:
# EXPO_PUBLIC_API_URL=http://YOUR_IP:5000/api

npx expo start
```

#### 4. Run on Device
- Install Expo Go on your mobile device
- Scan QR code from terminal
- App will load on your device

---

## 📱 Building for Production

### Android APK
```bash
eas build --platform android --profile production
```

### iOS (TestFlight)
```bash
eas build --platform ios --profile production
```

**Note:** iOS builds require Apple Developer account ($99/year)

See `BUILD_AND_DEPLOY.md` for complete build instructions.

---

## 📚 Documentation

### For Developers
- **BUILD_AND_DEPLOY.md** - Complete build and deployment guide
- **TESTING_GUIDE.md** - Comprehensive testing procedures (58 test cases)
- This README - Technical overview and setup

### For Business/Clients
- **PROJECT_PRESENTATION.md** - Complete project documentation (50+ pages)
- **PROJECT_PRESENTATION_GUIDE.md** - How to present to clients
- **IOS_DISTRIBUTION_GUIDE.md** - iPhone distribution options

---

## 🧪 Testing

### Run Complete Test Suite
Follow the comprehensive testing guide:
```bash
# See TESTING_GUIDE.md for 58 detailed test cases covering:
# - Dashboard functionality
# - Barcode scanning
# - Inventory management
# - AI predictions
# - Admin features
# - Performance testing
# - Error handling
# - Edge cases
```

### Quick Smoke Test
1. Launch app
2. Add a product via scanner
3. View in inventory
4. Check FEFO page
5. Review AI predictions
6. Access admin dashboard

---

## 📊 Database Schema

### Product Model
```javascript
{
  name: String,
  category: String,
  barcode: String,
  isPerishable: Boolean,
  batches: [{
    batchNumber: String,
    quantity: Number,
    expiryDate: Date,
    price: Number
  }],
  totalQuantity: Number, // Calculated
  image: String,
  createdAt: Date,
  updatedAt: Date
}
```

### Sale Model
```javascript
{
  product: ObjectId,
  quantity: Number,
  price: Number,
  date: Date,
  batchNumber: String
}
```

### Prediction Model
```javascript
{
  product: ObjectId,
  riskScore: Number,
  metrics: {
    velocity: Number,
    daysToStockout: Number,
    confidence: Number
  },
  forecast: {
    next7Days: Number,
    next14Days: Number,
    next30Days: Number
  },
  recommendations: [String],
  lastUpdated: Date
}
```

---

## 🔐 Security Features

- PIN-protected admin panel
- Auto-logout after inactivity
- Secure API endpoints
- Input validation
- HTTPS encryption
- JWT authentication
- Environment variable protection

---

## 🎨 Design System

### Color Palette
- **Primary**: Blue (#007AFF)
- **Critical**: Red (#FF3B30)
- **Warning**: Orange (#FF9500)
- **Caution**: Yellow (#FFCC00)
- **Success**: Green (#34C759)
- **Background**: Dark (#000000) / Light (#FFFFFF)

### Typography
- **Headers**: System Bold
- **Body**: System Regular
- **Monospace**: Courier (for codes)

---

## 📈 Performance Metrics

- **App Launch**: < 2 seconds
- **Barcode Scan**: < 1 second
- **API Response**: < 200ms average
- **AI Prediction**: < 100ms per product
- **Image Upload**: < 3 seconds

---

## 🤝 Contributing

This is a production project. For feature requests or bug reports:
1. Document the issue clearly
2. Include steps to reproduce
3. Provide screenshots if applicable
4. Note device and OS version

---

## 📄 License

ISC License - See LICENSE file for details

---

## 👥 Authors

- **Developer**: [Your Name]
- **Project**: InventEase v2.0.5
- **Repository**: https://github.com/otikanelson/Inventory-Application

---

## 🎉 Project Status

### ✅ Completed Features
- [x] Dashboard with AI insights
- [x] Barcode scanner
- [x] Inventory management
- [x] Product management
- [x] FEFO sorting
- [x] AI prediction engine
- [x] Alerts system
- [x] Admin dashboard
- [x] Admin settings
- [x] Dark/light mode
- [x] Image uploads
- [x] Batch tracking
- [x] Sales tracking
- [x] Analytics
- [x] Export functionality

### 🚀 Ready For
- Production deployment
- Client presentation
- App store submission
- User testing
- Commercial use

---

## 📞 Support

For questions, issues, or feature requests:
- **Email**: [your-email]
- **GitHub Issues**: https://github.com/otikanelson/Inventory-Application/issues
- **Documentation**: See docs folder

---

## 🙏 Acknowledgments

- Expo team for excellent mobile framework
- MongoDB for flexible database solution
- Cloudinary for image management
- React Native community

---

**Built with ❤️ for businesses that want to reduce waste and maximize profits**

---

*Last Updated: February 8, 2026*  
*Version: 2.0.5*  
*Status: Production Ready* ✅
