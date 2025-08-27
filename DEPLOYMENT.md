# 🚀 **DEPLOYMENT GUIDE - JELPAPHARM Pharmacy Management System**

## **Render Deployment Instructions**

This guide will help you deploy the JELPAPHARM Pharmacy Management System to Render.

---

## **📋 PREREQUISITES**

1. **GitHub Account**: Your code should be pushed to GitHub
2. **Render Account**: Sign up at [render.com](https://render.com)
3. **MongoDB Atlas**: Database should be set up and accessible

---

## **🔧 STEP 1: PREPARE YOUR REPOSITORY**

### **1.1 Update .gitignore**
Ensure your `.gitignore` file excludes sensitive files:
```bash
# Check that .env files are ignored
cat .gitignore | grep -E "\.env"
```

### **1.2 Commit and Push to GitHub**
```bash
git add .
git commit -m "Production ready for Render deployment"
git push origin main
```

---

## **🚀 STEP 2: DEPLOY ON RENDER**

### **2.1 Create New Web Service**

1. **Login to Render**: Go to [dashboard.render.com](https://dashboard.render.com)
2. **New Web Service**: Click "New +" → "Web Service"
3. **Connect Repository**: Connect your GitHub repository
4. **Configure Service**:
   - **Name**: `jelpapharm-pharmacy-api`
   - **Environment**: `Node`
   - **Region**: Choose closest to your users
   - **Branch**: `main`
   - **Build Command**: `cd server && npm install && npm run build`
   - **Start Command**: `cd server && npm start`

### **2.2 Environment Variables**

Add these environment variables in Render dashboard:

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `PORT` | `5000` |
| `MONGODB_URI` | `mongodb+srv://elormjoseph610:e8g23EBrrzJCWreD@jelpa.2mfaztn.mongodb.net/pharmacy_management?retryWrites=true&w=majority` |
| `JWT_SECRET` | `your-super-secret-jwt-key-here-make-it-long-and-complex` |
| `JWT_EXPIRE` | `7d` |
| `JWT_COOKIE_EXPIRE` | `7` |
| `BCRYPT_ROUNDS` | `12` |
| `RATE_LIMIT_WINDOW_MS` | `900000` |
| `RATE_LIMIT_MAX_REQUESTS` | `100` |
| `MAX_FILE_SIZE` | `5242880` |
| `UPLOAD_PATH` | `./uploads` |
| `APP_NAME` | `JELPAPHARM Pharmacy Management System` |
| `APP_URL` | `https://your-render-url.onrender.com` |

### **2.3 Advanced Settings**

- **Auto-Deploy**: Enable for automatic deployments
- **Health Check Path**: `/api/health`
- **Plan**: Start with Free plan, upgrade as needed

---

## **🔗 STEP 3: UPDATE CLIENT CONFIGURATION**

### **3.1 Update API Base URL**

After deployment, update the client configuration:

```typescript
// client/src/config/api.ts
export const API_BASE_URL = __DEV__ 
  ? 'http://localhost:5000' 
  : 'https://your-render-url.onrender.com';
```

### **3.2 Rebuild Client**

```bash
cd client
npm run build:web
```

---

## **✅ STEP 4: VERIFY DEPLOYMENT**

### **4.1 Health Check**
Visit: `https://your-render-url.onrender.com/api/health`

Expected response:
```json
{
  "status": "success",
  "message": "JELPAPHARM Pharmacy Management System is running",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "environment": "production"
}
```

### **4.2 API Endpoints Test**
Test key endpoints:
- `GET /api/auth/register` - User registration
- `GET /api/inventory` - Inventory list (requires auth)
- `GET /api/reports/dashboard-stats` - Dashboard stats (requires auth)

---

## **🔐 STEP 5: SECURITY CONSIDERATIONS**

### **5.1 Environment Variables**
- ✅ Never commit `.env` files to Git
- ✅ Use Render's environment variable system
- ✅ Rotate JWT secrets regularly
- ✅ Use strong passwords for database

### **5.2 Database Security**
- ✅ MongoDB Atlas network access configured
- ✅ Database user has minimal required permissions
- ✅ Regular database backups enabled

### **5.3 API Security**
- ✅ CORS properly configured
- ✅ Rate limiting enabled
- ✅ Input validation active
- ✅ JWT authentication working

---

## **📱 STEP 6: CLIENT DEPLOYMENT**

### **6.1 Web Client**
The React Native web build can be deployed to:
- **Vercel**: For web-only deployment
- **Netlify**: Alternative web hosting
- **GitHub Pages**: Free static hosting

### **6.2 Mobile Apps**
- **Expo EAS Build**: For iOS/Android builds
- **App Store/Play Store**: For distribution

---

## **🔧 STEP 7: MONITORING & MAINTENANCE**

### **7.1 Render Dashboard**
- Monitor service health
- Check logs for errors
- Monitor resource usage

### **7.2 Application Monitoring**
- Set up error tracking (Sentry)
- Monitor API response times
- Track user activity

### **7.3 Database Monitoring**
- Monitor MongoDB Atlas metrics
- Set up alerts for high usage
- Regular backup verification

---

## **🚨 TROUBLESHOOTING**

### **Common Issues**

#### **Build Failures**
```bash
# Check build logs in Render dashboard
# Ensure all dependencies are in package.json
# Verify TypeScript compilation
```

#### **Database Connection Issues**
```bash
# Verify MongoDB URI is correct
# Check network access in MongoDB Atlas
# Ensure database user has proper permissions
```

#### **Environment Variable Issues**
```bash
# Verify all required env vars are set
# Check for typos in variable names
# Ensure values are properly formatted
```

#### **CORS Issues**
```bash
# Update CORS configuration in server
# Add your domain to allowed origins
# Check client API base URL
```

---

## **📞 SUPPORT**

### **Render Support**
- [Render Documentation](https://render.com/docs)
- [Render Community](https://community.render.com)

### **Application Support**
- Check application logs in Render dashboard
- Monitor MongoDB Atlas for database issues
- Review error tracking if configured

---

## **🎉 DEPLOYMENT COMPLETE**

Once deployed, your JELPAPHARM Pharmacy Management System will be available at:
- **API**: `https://your-render-url.onrender.com`
- **Health Check**: `https://your-render-url.onrender.com/api/health`
- **Documentation**: `https://your-render-url.onrender.com/`

The system is now production-ready and accessible worldwide! 🌍
