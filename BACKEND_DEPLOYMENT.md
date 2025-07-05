# Expense Tracker Backend - Production Deployment

## Deploy to Heroku (Free option)

### Prerequisites
1. Install Heroku CLI: https://devcenter.heroku.com/articles/heroku-cli
2. Create a free Heroku account: https://signup.heroku.com/

### Steps to Deploy:

1. **Login to Heroku**
   ```bash
   heroku login
   ```

2. **Create a new Heroku app**
   ```bash
   cd server
   heroku create expense-tracker-backend-[your-name]
   ```

3. **Add MongoDB Atlas (Free Database)**
   ```bash
   heroku addons:create mongolab:sandbox
   ```

4. **Set Environment Variables**
   ```bash
   heroku config:set NODE_ENV=production
   heroku config:set JWT_SECRET=your-super-secret-jwt-key
   heroku config:set GOOGLE_AI_API_KEY=your-google-ai-key
   ```

5. **Deploy the app**
   ```bash
   git init
   git add .
   git commit -m "Initial backend deployment"
   heroku git:remote -a expense-tracker-backend-[your-name]
   git push heroku main
   ```

6. **Your backend will be available at:**
   ```
   https://expense-tracker-backend-[your-name].herokuapp.com
   ```

## Alternative: Deploy to Railway (Recommended)

1. Go to https://railway.app/
2. Sign up with GitHub
3. Connect your repository
4. Railway will auto-deploy your backend
5. Add environment variables in Railway dashboard

## Alternative: Deploy to Render (Free)

1. Go to https://render.com/
2. Connect your GitHub repository
3. Choose "Web Service"
4. Set build command: `npm install && npm run build`
5. Set start command: `npm start`
6. Add environment variables

## Update Frontend Configuration

After deploying, update the production URL in:
`client/config/env.ts`

Replace `https://your-deployed-backend.herokuapp.com/api` with your actual deployed URL.
