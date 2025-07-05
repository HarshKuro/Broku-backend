# Expense Tracker App Configuration

## Quick Start Commands

### Backend Development
```bash
cd server
npm install
npm run build
npm run dev
```

### Frontend Development  
```bash
cd client
npm install
npm start
```

### Database Setup
```bash
cd server
npm run seed  # Seeds default categories
```

## Important Configuration

### Backend API URL Configuration

⚠️ **IMPORTANT**: Before running the mobile app, you need to update the API URL:

1. Find your local IP address:
   - Windows: `ipconfig` (look for IPv4 Address)
   - Mac/Linux: `ifconfig` (look for inet address)

2. Update `client/api/expenseApi.ts`:
   ```typescript
   const BASE_URL = 'http://YOUR_LOCAL_IP:5000/api';
   ```
   
   Example: `const BASE_URL = 'http://192.168.1.100:5000/api';`

### MongoDB Configuration

Update `server/.env` with your MongoDB Atlas connection string:
```
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/expense-tracker?retryWrites=true&w=majority
```

## Default Categories

The app comes with these pre-configured categories:
- Food, Transportation, Entertainment
- Shopping, Bills, Healthcare
- Education, Travel, Groceries
- Gym, Music, Dinner, Coffee
- Gas, Rent, Other

Run `npm run seed` to add them to your database.

## Development Tips

1. **Start backend first** - The mobile app needs the API server running
2. **Check network connectivity** - Ensure your phone and computer are on the same WiFi
3. **Use Expo Go app** - Install on your phone to test the mobile app
4. **Monitor server logs** - Backend logs show API requests and errors

## Troubleshooting

- **Cannot connect to server**: Check IP address in API configuration
- **Metro bundler issues**: Run `expo start -c` to clear cache  
- **Database connection fails**: Verify MongoDB URI and network access
- **Expo app won't load**: Ensure phone and computer are on same network
