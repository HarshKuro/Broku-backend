# 🔥 AWS Deployment Guide - Broku Backend

## 🎯 AWS Deployment Options (Recommended)

### Option 1: AWS App Runner (Easiest)
**Perfect for your Node.js backend - no server management needed!**

#### Step 1: Prepare Your Code
```bash
# Ensure your server code is in GitHub
cd server/
git add .
git commit -m "Prepare for AWS deployment"
git push origin main
```

#### Step 2: Deploy to AWS App Runner
1. **Go to AWS Console** → Search "App Runner"
2. **Create service** → "Source code repository"
3. **Connect to GitHub** → Select your repository
4. **Configure**:
   - **Repository**: `expense-tracker-app`
   - **Source directory**: `server`
   - **Runtime**: `Node.js 18`
   - **Build command**: `npm install && npm run build`
   - **Start command**: `npm start`

#### Step 3: Environment Variables
```
NODE_ENV=production
PORT=8080
JWT_SECRET=your-super-secret-jwt-key-2024
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/expense-tracker
FRONTEND_URL=*
```

#### Step 4: Get Your URL
- AWS will provide: `https://your-app.region.awsapprunner.com`
- **Always-on service** (no hibernation!)
- **Auto-scaling** and **SSL included**

---

### Option 2: AWS EC2 + Docker (More Control)

#### Step 1: Create EC2 Instance
```bash
# Launch Ubuntu 22.04 LTS instance
# t3.micro (free tier eligible)
# Configure security group: Allow HTTP (80), HTTPS (443), SSH (22)
```

#### Step 2: Install Dependencies
```bash
# SSH into your EC2 instance
sudo apt update
sudo apt install -y docker.io docker-compose nginx
sudo systemctl start docker
sudo usermod -aG docker $USER
```

#### Step 3: Create Dockerfile
```dockerfile
# In your server folder
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

#### Step 4: Deploy with Docker
```bash
# On EC2
git clone https://github.com/yourusername/expense-tracker-app.git
cd expense-tracker-app/server
docker build -t broku-backend .
docker run -d -p 3000:3000 --env-file .env broku-backend
```

#### Step 5: Configure Nginx (SSL + Domain)
```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

### Option 3: AWS Elastic Beanstalk (Auto-Scaling)

#### Step 1: Install EB CLI
```bash
pip install awsebcli
eb init
```

#### Step 2: Configure Application
```bash
cd server/
eb init broku-backend --platform node.js --region us-east-1
eb create production
```

#### Step 3: Environment Variables
```bash
eb setenv NODE_ENV=production JWT_SECRET=your-secret MONGODB_URI=your-mongodb-uri
```

#### Step 4: Deploy
```bash
eb deploy
```

---

## 🔧 Quick AWS App Runner Setup (Recommended)

### Why App Runner?
- ✅ **Zero server management**
- ✅ **Auto-scaling**
- ✅ **Built-in load balancing**
- ✅ **SSL certificates**
- ✅ **GitHub integration**
- ✅ **Always-on** (no hibernation)

### Step-by-Step:
1. **AWS Console** → "App Runner"
2. **Create service** → "Source code repository"
3. **Connect GitHub** → Select your repo
4. **Source settings**:
   - Repository: `expense-tracker-app`
   - Source directory: `server`
   - Automatic deployments: ✅
5. **Build settings**:
   - Runtime: `Node.js 18`
   - Build commands: `npm install && npm run build`
   - Start command: `npm start`
6. **Service settings**:
   - Service name: `broku-backend`
   - Port: `3000`
   - Environment variables: (add your vars)
7. **Deploy** → Get your URL!

---

## 💰 Cost Comparison

| Service | Free Tier | Monthly Cost | Always-On |
|---------|-----------|--------------|-----------|
| **App Runner** | First service free | ~$5-10 | ✅ |
| **EC2 t3.micro** | 750 hours free | ~$8-12 | ✅ |
| **Elastic Beanstalk** | Free (pay for EC2) | ~$10-15 | ✅ |
| **Render** | 750 hours | $7 | ❌ (hibernates) |

---

## 🚀 Next Steps

1. **Choose deployment method** (App Runner recommended)
2. **Deploy backend to AWS**
3. **Update frontend config** with AWS URL
4. **Push instant update** to your APK
5. **Test with always-on backend!**

Your backend URL will be something like:
```
https://broku-backend.us-east-1.awsapprunner.com
```
