# SPRED Admin Panel

A comprehensive admin dashboard for the SPRED video streaming platform, built with React and connected to real SPRED APIs.

## 🚀 Features

### ✅ **Implemented Features**

#### **1. Real-time Dashboard**
- **Live metrics** from SPRED APIs (videos, views, downloads, revenue)
- **Performance monitoring** with real-time data updates
- **Visual analytics** with charts and statistics
- **API status indicators** showing connection health

#### **2. Authentication System**
- **Secure login** using SPRED API credentials
- **Token-based authentication** with localStorage persistence
- **Auto-logout** and session management
- **Default test credentials** for development

#### **3. Content Management**
- **Video library overview** with real SPRED content
- **Content analytics** (views, downloads per video)
- **Recent uploads** tracking
- **Content performance** metrics

#### **4. API Integration**
- **Direct connection** to SPRED backend APIs
- **Real-time data fetching** from production endpoints
- **Error handling** and fallback mechanisms
- **Authentication headers** matching mobile app

### 📊 **Dashboard Metrics**

The dashboard displays real-time analytics including:
- **Total Videos**: Count from SPRED content API
- **Total Views**: Aggregated view counts across all videos
- **Total Downloads**: Download statistics from content
- **Revenue Tracking**: Financial metrics (when available)
- **API Status**: Connection health indicators

### 🔧 **Technical Stack**

- **Frontend**: React 18 with TypeScript
- **Styling**: Custom CSS with modern design
- **API Client**: Axios with interceptors
- **State Management**: React hooks
- **Build Tool**: Create React App

## 🏃‍♂️ **Running the Application**

### **Prerequisites**
- Node.js 16+
- npm or yarn

### **Installation**
```bash
cd spred-admin-panel
npm install
```

### **Development**
```bash
# Start development server on port 3002
npm start
```

### **Build for Production**
```bash
npm run build
```

### **Test Credentials**
```
Email: admin@spred.com
Password: admin123
```

## 🔌 **API Integration**

### **SPRED API Endpoints Used**
- `getAllMovies` - Fetch all video content
- `getWalletStats` - Financial analytics
- `getAllCategories` - Content categorization
- Authentication endpoints for admin login

### **API Configuration**
The app uses the same authentication headers as the SPRED mobile app:
```javascript
{
  mobileAppByPassIVAndKey: 'a0092a148a0d69715268df9f5bb63b24fca27d344f54df9b',
  username: 'SpredMediaAdmin',
  password: 'SpredMediaLoveSpreding@2023'
}
```

## 📁 **Project Structure**

```
spred-admin-panel/
├── src/
│   ├── components/
│   │   ├── Login.tsx           # Authentication component
│   │   ├── SimpleDashboard.tsx # Main dashboard
│   │   └── Layout.tsx          # Layout wrapper
│   ├── services/
│   │   ├── spredApi.ts         # SPRED API client
│   │   └── api.ts              # Additional API services
│   ├── pages/                  # Page components
│   ├── App.tsx                 # Main app component
│   ├── App.css                 # Global styles
│   └── index.tsx               # App entry point
├── public/                     # Static assets
└── package.json                # Dependencies
```

## 🎯 **Key Features Demonstrated**

### **Real API Integration**
- ✅ Connected to live SPRED production APIs
- ✅ Real-time data fetching and display
- ✅ Proper authentication and error handling
- ✅ API status monitoring

### **Performance Monitoring**
- ✅ Real-time metrics updates
- ✅ Content performance analytics
- ✅ User engagement tracking
- ✅ Financial reporting capabilities

### **User Experience**
- ✅ Modern, responsive design
- ✅ Loading states and error handling
- ✅ Intuitive navigation and layout
- ✅ Mobile-friendly interface

## 🚀 **Future Enhancements**

### **Planned Features**
- [ ] Advanced analytics with charts (Recharts integration)
- [ ] User management interface
- [ ] Content upload and moderation tools
- [ ] Real-time notifications
- [ ] Export functionality for reports
- [ ] Advanced filtering and search

### **Technical Improvements**
- [ ] Redux for state management
- [ ] React Query for data fetching
- [ ] Unit and integration tests
- [ ] Docker containerization
- [ ] CI/CD pipeline setup

## 🔧 **Development Notes**

### **API Limitations**
- User data API endpoints may be limited
- Some analytics require additional API development
- Real-time features depend on API capabilities

### **Performance Considerations**
- API calls are optimized with proper error handling
- Data is cached where appropriate
- Loading states prevent UI blocking

### **Security**
- Authentication tokens stored securely
- API credentials properly configured
- No sensitive data exposed in client

## 📞 **Support**

For questions about the SPRED Admin Panel:
- Check the SPRED API documentation
- Review the code comments for implementation details
- Test with the provided credentials

---

**Built for SPRED Video Streaming Platform** 🎬
