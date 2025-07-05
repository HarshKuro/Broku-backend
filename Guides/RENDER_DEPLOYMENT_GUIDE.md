# 🚀 Render Backend Deployment Guide - Expense Tracker

## Step 1: Prepare Your Repository

Make sure your backend code is pushed to GitHub:

```bash
cd "c:\Users\Harsh Jain\Videos\Personal Projects\expense-tracker-app"
git add .
git commit -m "Prepare for Render deployment"
git push origin main
```

## Step 2: Create Render Account & Deploy

### 2.1 Sign Up for Render
1. Go to [render.com](https://render.com)
2. Sign up with your GitHub account
3. Connect your GitHub repository

### 2.2 Create Web Service
1. Click **"New +"** → **"Web Service"**
2. Connect your GitHub repository: `expense-tracker-app`
3. Configure the service:

**Basic Settings:**
- **Name**: `expense-tracker-backend`
- **Region**: `Oregon (US West)` or closest to you
- **Branch**: `main`
- **Root Directory**: `server` ⚠️ IMPORTANT!
- **Runtime**: `Node`

**Build & Deploy Settings:**
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`

### 2.3 Environment Variables
In Render dashboard, add these environment variables:

```
NODE_ENV=production
PORT=10000
JWT_SECRET=your-super-secret-jwt-key-2024-expensetracker
MONGODB_URI=<your-mongodb-atlas-uri>
FRONTEND_URL=*
```

## Step 3: Set Up MongoDB Atlas (Database)

### 3.1 Create MongoDB Atlas Account
1. Go to [mongodb.com/atlas](https://mongodb.com/atlas)
2. Sign up for free account
3. Create a new cluster (free tier is fine)

### 3.2 Configure Database Access
1. **Database Access** → **Add New Database User**
   - Username: `expense-tracker-user`
   - Password: Generate secure password
   - Built-in Role: `Read and write to any database`

2. **Network Access** → **Add IP Address**
   - Click **"Allow Access from Anywhere"** (`0.0.0.0/0`)
   - Or add Render's IP ranges

### 3.3 Get Connection String
1. Click **"Connect"** on your cluster
2. Choose **"Connect your application"**
3. Copy the connection string:
   ```
   mongodb+srv://expense-tracker-user:<password>@cluster0.xxxxx.mongodb.net/expense-tracker?retryWrites=true&w=majority
   ```
4. Replace `<password>` with your actual password

## Step 4: Update Environment Variables in Render

Go back to your Render service and update:

```
NODE_ENV=production
PORT=10000
JWT_SECRET=your-super-secret-jwt-key-2024-expensetracker
MONGODB_URI=mongodb+srv://expense-tracker-user:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/expense-tracker?retryWrites=true&w=majority
FRONTEND_URL=*
```

## Step 5: Deploy & Get Your Backend URL

1. Click **"Deploy Latest Commit"** in Render
2. Wait for deployment to complete (~5-10 minutes)
3. Your backend will be available at:
   ```
   https://expense-tracker-backend.onrender.com
   ```

## Step 6: Update Frontend Configuration

Update your client configuration with the new backend URL:

```typescript
// client/config/env.ts
const productionConfig: AppConfig = {
  API_BASE_URL: 'https://expense-tracker-backend.onrender.com/api',
  ENVIRONMENT: 'production',
};
```

## Step 7: Test Your Backend

Test your deployed backend:

```bash
# Test health endpoint
curl https://expense-tracker-backend.onrender.com/api/health

# Test categories endpoint
curl https://expense-tracker-backend.onrender.com/api/categories
```

## 🎯 Important Notes for Render

### Free Tier Limitations:
- ⚠️ **Service spins down after 15 minutes of inactivity**
- ⚠️ **First request after spin-down takes 30-60 seconds**
- ✅ **750 hours/month free** (sufficient for testing)

### For Production Use:
- Upgrade to **Paid Plan** ($7/month) for always-on service
- No spin-down delays
- Better performance

## 🔧 Troubleshooting

### Common Issues:

1. **Build Fails - "Root Directory"**
   - Ensure Root Directory is set to `server`
   - Build command should be in server folder context

2. **Database Connection Fails**
   - Check MongoDB Atlas IP whitelist
   - Verify connection string format
   - Ensure database user has correct permissions

3. **Environment Variables**
   - Double-check all variables are set
   - No quotes around values in Render UI
   - JWT_SECRET should be long and secure

4. **CORS Errors**
   - Ensure FRONTEND_URL is set to `*` for testing
   - Or set specific domain for production

## ✅ Success Checklist

- [ ] Backend deployed to Render
- [ ] MongoDB Atlas configured
- [ ] Environment variables set
- [ ] API endpoints responding
- [ ] Frontend config updated
- [ ] Ready to build APK

## 🚀 Next Steps

Once your backend is deployed:

1. **Update client/config/env.ts** with your Render URL
2. **Build APK**: `eas build --platform android --profile apk`
3. **Test APK** with real backend integration

Your backend URL will be:
```
https://expense-tracker-backend.onrender.com
```
