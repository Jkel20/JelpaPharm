# JELPAPHARM Pharmacy Management System

A comprehensive pharmacy management system designed specifically for JELPAPHARM, featuring modern React Native mobile technologies with Expo integration, web support, and advanced PDF generation capabilities.

## 🎯 **100% COMPLETE PROJECT - EXPO & WEB SUPPORT**

This project has been fully converted to React Native with Expo integration and now includes all requested features including PDF generation and web accessibility:

### ✅ **FULLY IMPLEMENTED FEATURES**

#### 1. **Technology Stack** ✅
- **Backend**: Node.js with TypeScript, Express.js
- **Frontend**: React Native with TypeScript + Expo (Mobile & Web App)
- **Database**: MongoDB Atlas with Mongoose ODM
- **UI Framework**: React Native Paper with Ghanaian styling
- **PDF Generation**: Cross-platform PDF generation for reports and receipts

#### 2. **Database Schema** ✅
- **User Model**: Complete user management with roles (admin, pharmacist, cashier)
- **Inventory Model**: Comprehensive drug management with expiry tracking
- **Sales Model**: Complete sales tracking with receipt generation
- **Alerts Model**: Low stock and expiry notifications

#### 3. **Security Implementation** ✅
- **JWT Authentication** with role-based access control
- **Password hashing** with bcrypt
- **Rate limiting** to prevent brute force attacks
- **Input validation** and sanitization
- **CORS protection** and security headers
- **NoSQL injection prevention**

#### 4. **Core Features** ✅
- **Inventory Management**: Complete CRUD operations with stock tracking
- **Sales Management**: Transaction processing with receipt generation
- **User Management**: Multi-role system with privileges
- **Alerts System**: Low stock and expiry notifications
- **Reports**: Daily, weekly, monthly, and annual reporting
- **Dashboard**: Real-time metrics and analytics

#### 5. **Ghanaian Market Adaptation** ✅
- **Currency**: GH₵ (Ghanaian Cedi) throughout the system
- **Phone Numbers**: Ghanaian format validation (+233 or 0XXXXXXXXX)
- **Payment Methods**: Includes mobile money (common in Ghana)
- **Address Fields**: Ghanaian regions and postal codes

#### 6. **React Native + Expo Features** ✅
- **Cross-Platform Support**: Works on iOS, Android, and Web
- **Mobile-First Design**: Optimized for mobile devices
- **Password Visibility Toggle**: Users can view passwords entered
- **Enhanced Error Handling**: User-friendly error messages
- **Responsive Design**: Works on all screen sizes
- **PDF Generation**: Complete receipt and report PDF generation
- **Password Reset**: Email validation and secure reset process
- **Web Support**: Accessible via web browser with full functionality

#### 7. **User Experience** ✅
- **Modern UI**: Ghanaian-inspired color scheme
- **Intuitive Navigation**: Bottom tab navigation
- **Real-time Updates**: Pull-to-refresh functionality
- **Loading States**: Proper loading indicators
- **Offline Support**: Graceful error handling

## 🚀 **QUICK DEPLOYMENT**

### **Deploy to Render (Recommended)**

1. **Push to GitHub**:
   ```bash
   git add .
   git commit -m "Production ready for Render deployment"
   git push origin main
   ```

2. **Deploy on Render**:
   - Go to [render.com](https://render.com)
   - Create new Web Service
   - Connect your GitHub repository
   - Use build command: `cd server && npm install && npm run build`
   - Use start command: `cd server && npm start`
   - Add environment variables (see DEPLOYMENT.md)

3. **Update Client Configuration**:
   - Update `client/src/config/api.ts` with your Render URL
   - Rebuild client: `cd client && npm run build:web`

For detailed deployment instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md)

## Features

### Backend (Node.js/TypeScript)
- **Authentication & Authorization**: Secure JWT-based authentication with role-based access control
- **Inventory Management**: Complete inventory tracking with expiry date monitoring
- **Sales Management**: Sales tracking and transaction history
- **User Management**: Multi-user support with different roles (Admin, Pharmacist, Cashier)
- **Reports & Analytics**: Comprehensive reporting system with charts and analytics
- **Alerts System**: Automated alerts for low stock, expiring medications, and other critical events
- **Security**: Built-in security features including rate limiting, input validation, and data sanitization

### Frontend (React Native/TypeScript)
- **Modern Mobile UI**: React Native Paper based responsive design
- **Dashboard**: Real-time overview with key metrics and charts
- **Inventory Management**: Interactive mobile interface for inventory operations
- **Sales Interface**: User-friendly mobile sales processing interface
- **Reports Visualization**: Mobile-optimized charts and graphs for data analysis
- **Native Mobile Experience**: Works seamlessly on iOS and Android devices

## Technology Stack

### Backend
- **Runtime**: Node.js
- **Language**: TypeScript
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Security**: Helmet, CORS, Rate Limiting, Input Validation
- **Logging**: Winston
- **Email**: Nodemailer

### Frontend
- **Framework**: React Native 0.73.2 with TypeScript + Expo
- **UI Library**: React Native Paper
- **State Management**: React Context API
- **Navigation**: React Navigation
- **HTTP Client**: Axios
- **Charts**: React Native Chart Kit
- **Forms**: React Hook Form with Yup validation
- **Storage**: AsyncStorage for local data persistence
- **PDF Generation**: jsPDF + html2canvas (Web), expo-print (Mobile)
- **Web Support**: React Native Web + Expo Webpack Config

## Project Structure

```
jelpapharm-pharmacy-management-system/
├── server/                 # Backend application
│   ├── src/
│   │   ├── models/         # Database models
│   │   ├── routes/         # API routes
│   │   ├── middleware/     # Custom middleware
│   │   ├── utils/          # Utility functions
│   │   └── index.ts        # Server entry point
│   ├── package.json
│   └── tsconfig.json
├── client/                 # React Native mobile application
│   ├── src/
│   │   ├── screens/        # Screen components
│   │   ├── components/     # Reusable components
│   │   ├── contexts/       # React contexts
│   │   ├── config/         # Configuration files
│   │   ├── App.tsx         # Main app component
│   │   └── theme.ts        # Theme configuration
│   ├── package.json
│   ├── metro.config.js     # Metro bundler config
│   ├── babel.config.js     # Babel configuration
│   └── index.js            # React Native entry point
├── render.yaml             # Render deployment configuration
├── DEPLOYMENT.md           # Deployment guide
└── package.json            # Root package.json
```

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- MongoDB (local or cloud instance)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd jelpapharm-pharmacy-management-system
   ```

2. **Install dependencies**
   ```bash
   # Install all dependencies (root, server, and client)
   npm run install-all
   ```

3. **Environment Setup**
   ```bash
   # Copy environment example file
   cp server/env.example server/.env
   ```
   
   Edit `server/.env` with your configuration:
   ```env
   NODE_ENV=development
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/pharmacy-management
   JWT_SECRET=your-secret-key
   JWT_EXPIRE=30d
   ```

4. **Start the application**
   ```bash
   # Start the backend server
   npm run server
   ```

5. **Start Expo development**
   ```bash
   # Navigate to client directory
   cd client
   
   # Install dependencies (if not already done)
   npm install
   
   # Start Expo development server
   npm start
   
   # Run on Android
   npm run android
   
   # Run on iOS (macOS only)
   npm run ios
   
   # Run on Web
   npm run web
   ```

### Access the Application
- **Backend API**: http://localhost:5000
- **API Health Check**: http://localhost:5000/api/health
- **Mobile App**: Runs on iOS Simulator or Android Emulator
- **Web App**: http://localhost:19006 (accessible via browser)

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - User logout

### Inventory
- `GET /api/inventory` - Get all inventory items
- `POST /api/inventory` - Create new inventory item
- `GET /api/inventory/:id` - Get specific inventory item
- `PUT /api/inventory/:id` - Update inventory item
- `DELETE /api/inventory/:id` - Delete inventory item

### Sales
- `GET /api/sales` - Get all sales
- `POST /api/sales` - Create new sale
- `GET /api/sales/:id` - Get specific sale
- `PUT /api/sales/:id` - Update sale
- `DELETE /api/sales/:id` - Delete sale

### Reports
- `GET /api/reports/dashboard-stats` - Dashboard statistics
- `GET /api/reports/sales-chart` - Sales chart data
- `GET /api/reports/inventory-report` - Inventory report
- `GET /api/reports/sales-report` - Sales report

### Users
- `GET /api/users` - Get all users
- `POST /api/users` - Create new user
- `GET /api/users/:id` - Get specific user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Alerts
- `GET /api/alerts` - Get all alerts
- `POST /api/alerts` - Create new alert
- `PUT /api/alerts/:id` - Mark alert as read

## Development

### Available Scripts

**Root Level:**
- `npm run dev` - Start both server and client in development mode
- `npm run server` - Start server only
- `npm run client` - Start client only
- `npm run build` - Build client for production
- `npm run build:server` - Build server for production
- `npm run build:all` - Build both server and client
- `npm run install-all` - Install dependencies for all packages
- `npm run deploy:prepare` - Prepare for deployment (build + lint)

**Server:**
- `npm run dev` - Start server with nodemon
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Start production server
- `npm test` - Run tests

**Client (React Native + Expo):**
- `npm start` - Start Expo development server
- `npm run android` - Run on Android device/emulator
- `npm run ios` - Run on iOS device/simulator
- `npm run web` - Run on web browser
- `npm test` - Run tests
- `npm run lint` - Run ESLint
- `npm run build:web` - Build for web deployment
- `npm run build:android` - Build for Android deployment
- `npm run build:ios` - Build for iOS deployment

## Deployment

### Backend Deployment (Render)
1. Push code to GitHub
2. Create new Web Service on Render
3. Configure build command: `cd server && npm install && npm run build`
4. Configure start command: `cd server && npm start`
5. Add environment variables in Render dashboard
6. Deploy and get your production URL

### Mobile App Deployment
1. **Android**: Generate APK/AAB using `npm run build:android`
2. **iOS**: Archive and upload to App Store Connect using `npm run build:ios`
3. **Web**: Deploy to web hosting using `npm run build:web`
4. Configure environment variables for production API endpoints
5. Update API base URL in `src/config/api.ts` for production

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit your changes: `git commit -am 'Add feature'`
4. Push to the branch: `git push origin feature-name`
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions, please contact the development team or create an issue in the repository.

## Acknowledgments

- React Native Paper for the beautiful mobile component library
- Expo for the amazing cross-platform development framework
- MongoDB for the database solution
- Express.js for the robust backend framework
- React Native team for the amazing mobile framework
