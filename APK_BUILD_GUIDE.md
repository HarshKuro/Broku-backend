# 📱 Expense Tracker APK Build Guide

## 🚀 Complete Step-by-Step APK Generation Process

### **Phase 1: Backend Deployment (Required First)**

#### Option A: Deploy to Heroku (Free Tier)
```bash
# 1. Install Heroku CLI
# Download from: https://devcenter.heroku.com/articles/heroku-cli

# 2. Navigate to server directory
cd server

# 3. Login to Heroku
heroku login

# 4. Create new app
heroku create expense-tracker-backend-yourname

# 5. Add MongoDB addon
heroku addons:create mongolab:sandbox

# 6. Set environment variables
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=your-super-secret-jwt-key-here
heroku config:set MONGODB_URI=your-mongodb-connection-string

# 7. Initialize git and deploy
git init
git add .
git commit -m "Deploy backend"
heroku git:remote -a expense-tracker-backend-yourname
git push heroku main

# 8. Your backend URL will be:
# https://expense-tracker-backend-yourname.herokuapp.com
```

#### Option B: Deploy to Railway (Recommended - Easier)
```bash
# 1. Go to https://railway.app/
# 2. Sign up with GitHub
# 3. Click "Deploy from GitHub repo"
# 4. Select your repository and server folder
# 5. Add environment variables in Railway dashboard:
#    - NODE_ENV=production
#    - JWT_SECRET=your-secret-key
#    - MONGODB_URI=your-mongodb-connection
# 6. Railway will give you a URL like: https://your-app.railway.app
```

### **Phase 2: Update Frontend Configuration**

After deploying backend, update the production URL:

1. **Edit `client/config/env.ts`:**
```typescript
const productionConfig: AppConfig = {
  API_BASE_URL: 'https://your-actual-deployed-backend.herokuapp.com/api', // Replace with your URL
  ENVIRONMENT: 'production',
};
```

### **Phase 3: APK Build Process**

#### Prerequisites
```bash
# Install required tools globally
npm install -g @expo/cli eas-cli
```

#### Build Commands
```bash
# 1. Navigate to client directory
cd client

# 2. Login to EAS
eas login

# 3. Build APK (Development - for testing)
eas build --platform android --profile development

# 4. Build APK (Production - for release)
eas build --platform android --profile production

# 5. Build APK (Preview - recommended for sharing)
eas build --platform android --profile preview
```

### **Phase 4: Build Profiles Explained**

#### Development Build
- ✅ Includes development tools
- ✅ Hot reload support
- ✅ Debugging enabled
- ❌ Larger file size
- **Use for:** Testing during development

#### Preview Build
- ✅ Production-like build
- ✅ Smaller file size
- ✅ Good for sharing/testing
- ❌ No development tools
- **Use for:** Beta testing, sharing with others

#### Production Build
- ✅ Fully optimized
- ✅ Smallest file size
- ✅ Ready for Google Play Store
- ❌ No debugging tools
- **Use for:** Final release, app store submission

### **Phase 5: After Build Completion**

1. **Download APK:**
   - EAS will provide a download link
   - You can also check builds at: https://expo.dev/

2. **Install APK:**
   - Enable "Unknown Sources" on Android device
   - Transfer APK file to device
   - Install by tapping the APK file

3. **Test Functionality:**
   - Verify backend connection
   - Test all features
   - Check data persistence

### **Phase 6: Making APK Work on All Devices**

#### Compatibility Settings (Already configured in app.json):
```json
{
  "android": {
    "permissions": ["INTERNET", "ACCESS_NETWORK_STATE"],
    "versionCode": 1,
    "adaptiveIcon": {
      "foregroundImage": "./assets/adaptive-icon.png",
      "backgroundColor": "#ffffff"
    }
  }
}
```

#### Network Security (For Android 9+):
Create `android/app/src/main/res/xml/network_security_config.xml`:
```xml
<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <domain-config cleartextTrafficPermitted="true">
        <domain includeSubdomains="true">your-backend-domain.com</domain>
    </domain-config>
</network-security-config>
```

### **Phase 7: Troubleshooting Common Issues**

#### Build Failures:
```bash
# Clear cache and rebuild
npx expo install --fix
eas build --platform android --profile preview --clear-cache
```

#### Network Issues in APK:
- Ensure backend is deployed and accessible
- Check CORS configuration in backend
- Verify API endpoints are working

#### App Crashes:
- Check logs: `eas build:list`
- Use development build for debugging
- Check for missing permissions

### **Commands Summary:**

```bash
# Quick APK build (recommended)
cd client
eas login
eas build --platform android --profile preview

# Check build status
eas build:list

# Download builds
eas build:view [BUILD_ID]
```

### **Final APK Features:**
✅ Works offline (cached data)
✅ Real-time backend sync when online
✅ Modern UI with smooth animations
✅ Category management
✅ Expense tracking
✅ Analytics and insights
✅ Compatible with Android 7.0+
✅ Dark/Light theme support

### **Next Steps After APK:**
1. Test thoroughly on different devices
2. Gather user feedback
3. Submit to Google Play Store (optional)
4. Plan future updates and features

---

**Note:** The APK build process typically takes 10-20 minutes. You'll receive an email when it's complete, and you can download the APK from the provided link.
