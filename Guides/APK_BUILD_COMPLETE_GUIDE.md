# 📱 Complete APK Build Guide - Expense Tracker

## 🎯 Overview
This guide will help you create a production-ready APK that works on all Android devices.

## 📋 Prerequisites
✅ EAS CLI installed (`npm install -g eas-cli`)
✅ Expo CLI installed (`npm install -g @expo/cli`)
✅ EAS account logged in (`eas login`)

## 🚀 Step-by-Step Process

### Step 1: Deploy Backend (CRITICAL)

**Option A: Railway (Recommended - Free & Easy)**
1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub
3. Create new project → Deploy from GitHub repo
4. Add PostgreSQL database from Railway dashboard
5. Set environment variables:
   ```
   NODE_ENV=production
   JWT_SECRET=your-super-secret-key-here
   FRONTEND_URL=*
   ```
6. Get your backend URL: `https://your-app-name.up.railway.app`

**Option B: Heroku**
```bash
cd server
heroku create your-expense-tracker-api
heroku addons:create heroku-postgresql:mini
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=your-secret-key
git push heroku main
```

**Option C: Render**
1. Sign up at render.com
2. Create Web Service from GitHub
3. Add PostgreSQL database
4. Configure environment variables

### Step 2: Update Frontend Configuration

After deploying backend, update your API URL:

```typescript
// client/config/env.ts
const productionConfig: AppConfig = {
  API_BASE_URL: 'https://YOUR-DEPLOYED-BACKEND-URL.railway.app/api',
  ENVIRONMENT: 'production',
};
```

### Step 3: Build APK

```bash
cd client
eas build --platform android --profile apk
```

This will:
- Upload your code to EAS servers
- Build the APK in the cloud
- Provide download link when complete (~10-15 minutes)

### Step 4: Alternative Local Build (if needed)

```bash
# Install dependencies
eas build:configure

# Local build (requires Android SDK)
eas build --platform android --profile apk --local
```

## 🔧 Configuration Files

### app.json
```json
{
  "expo": {
    "name": "Expense Tracker",
    "slug": "expense-tracker",
    "version": "1.0.0",
    "platforms": ["ios", "android"],
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#FFFFFF"
      },
      "package": "com.yourname.expensetracker",
      "permissions": [
        "android.permission.INTERNET",
        "android.permission.ACCESS_NETWORK_STATE"
      ]
    }
  }
}
```

### eas.json
```json
{
  "build": {
    "apk": {
      "android": {
        "buildType": "apk",
        "gradleCommand": ":app:assembleRelease"
      },
      "distribution": "internal"
    }
  }
}
```

## 🐛 Troubleshooting

### Common Issues:

1. **Build fails with "API_BASE_URL not found"**
   - Ensure `client/config/env.ts` exists
   - Check API URL is correct in production config

2. **Network errors in APK**
   - Verify backend is deployed and accessible
   - Check CORS configuration on backend
   - Ensure API URL uses HTTPS (not HTTP)

3. **App crashes on device**
   - Check logs: `eas build:list` → View logs
   - Verify all dependencies are compatible
   - Test on development build first

4. **Categories/Expenses not loading**
   - Backend not deployed properly
   - Database connection issues
   - CORS blocking requests

## 📱 Testing Your APK

1. **Download APK**: From EAS build completion email
2. **Install on device**: Enable "Unknown sources" in Android settings
3. **Test features**:
   - ✅ Add/Edit/Delete expenses
   - ✅ Categories management
   - ✅ Charts and analytics
   - ✅ Network connectivity
   - ✅ Data persistence

## 🔄 Build Profiles Explained

- **development**: Development client with debugging
- **preview**: Internal testing build
- **production**: Play Store ready build
- **apk**: Direct APK download (recommended for testing)

## 🎯 Production Checklist

Before building production APK:

- [ ] Backend deployed to production server
- [ ] Environment variables configured
- [ ] API URLs updated in client
- [ ] App tested on development
- [ ] Icons and splash screens added
- [ ] App permissions configured
- [ ] Package name set correctly

## 🚀 Next Steps After APK

1. **Test on multiple devices**
2. **Collect user feedback**
3. **Submit to Google Play Store** (optional)
4. **Set up crash reporting** (Sentry, Bugsnag)
5. **Add analytics** (Firebase, Amplitude)

## 🔗 Useful Commands

```bash
# Check build status
eas build:list

# View build logs
eas build:view [BUILD_ID]

# Cancel build
eas build:cancel [BUILD_ID]

# Update EAS CLI
npm install -g eas-cli@latest
```

---

## 🎉 Success Metrics

Your APK is ready when:
- ✅ Downloads and installs successfully
- ✅ All features work offline/online
- ✅ Data syncs with backend
- ✅ UI responds properly on different screen sizes
- ✅ No crashes during normal usage
