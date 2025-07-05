# Personal Expense Tracker

A full-stack personal expense tracking application built with React Native (Expo + TypeScript) frontend and Node.js + Express + MongoDB backend.

## Features

✅ **Core Features:**
- Add expenses with category, amount, date, and notes
- View expense history with search and filtering
- Monthly expense summary with charts
- Add and manage custom categories
- Category-wise spending breakdown

✅ **Technical Features:**
- RESTful API backend
- TypeScript throughout
- React Navigation for mobile navigation
- React Native Paper for UI components
- MongoDB with Mongoose ODM
- Responsive charts with react-native-chart-kit
- Form validation and error handling

## Tech Stack

### Frontend (Mobile App)
- **React Native** with Expo SDK
- **TypeScript** for type safety
- **React Navigation** for navigation
- **React Native Paper** for UI components
- **Axios** for API calls
- **React Native Chart Kit** for data visualization

### Backend (API Server)
- **Node.js** with Express.js
- **TypeScript** for type safety
- **MongoDB Atlas** with Mongoose ODM
- **CORS** enabled for cross-origin requests
- **Environment-based configuration**

## Setup Instructions

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- MongoDB Atlas account (or local MongoDB)
- Expo CLI: `npm install -g @expo/cli`

### Backend Setup

1. **Navigate to server directory:**
   ```bash
   cd server
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   - Copy `.env` file and update with your MongoDB connection string:
   ```bash
   PORT=5000
   MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/expense-tracker?retryWrites=true&w=majority
   NODE_ENV=development
   ```

4. **Build the TypeScript code:**
   ```bash
   npm run build
   ```

5. **Seed default categories (optional):**
   ```bash
   npm run seed
   ```

6. **Start the development server:**
   ```bash
   npm run dev
   ```

The backend will be running on `http://localhost:5000`

### Frontend Setup

1. **Navigate to client directory:**
   ```bash
   cd client
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Update API URL:**
   - Open `client/api/expenseApi.ts`
   - Update `BASE_URL` with your backend URL:
   ```typescript
   const BASE_URL = 'http://YOUR_LOCAL_IP:5000/api'; // Replace with your IP
   ```

4. **Start the Expo development server:**
   ```bash
   npm start
   ```

5. **Run on device/simulator:**
   - Install Expo Go app on your mobile device
   - Scan the QR code shown in terminal
   - Or press `a` for Android emulator, `i` for iOS simulator

## API Endpoints

### Expenses
- `GET /api/expenses` - Get all expenses (with optional filtering)
- `GET /api/expenses/:id` - Get expense by ID
- `POST /api/expenses` - Create new expense
- `PUT /api/expenses/:id` - Update expense
- `DELETE /api/expenses/:id` - Delete expense
- `GET /api/expenses/summary` - Get monthly summary

### Categories
- `GET /api/categories` - Get all categories
- `POST /api/categories` - Create new category
- `DELETE /api/categories/:id` - Delete category

### Health Check
- `GET /api/health` - API health status

## Project Structure

### Backend (`/server`)
```
server/
├── src/
│   ├── config/
│   │   └── db.ts                 # Database connection
│   ├── controllers/
│   │   ├── expenseController.ts  # Expense business logic
│   │   └── categoryController.ts # Category business logic
│   ├── models/
│   │   ├── Expense.ts           # Expense data model
│   │   └── Category.ts          # Category data model
│   ├── routes/
│   │   ├── expenseRoutes.ts     # Expense API routes
│   │   └── categoryRoutes.ts    # Category API routes
│   ├── scripts/
│   │   └── seedCategories.ts    # Database seeding
│   └── server.ts                # Main server file
├── dist/                        # Compiled JavaScript
├── package.json
├── tsconfig.json
└── .env
```

### Frontend (`/client`)
```
client/
├── screens/
│   ├── HomeScreen.tsx           # Dashboard with overview
│   ├── AddExpenseScreen.tsx     # Add new expense form
│   ├── HistoryScreen.tsx        # Expense history with filters
│   ├── AddCategoryScreen.tsx    # Manage categories
│   └── SummaryScreen.tsx        # Monthly charts & analytics
├── components/
│   ├── ExpenseCard.tsx          # Individual expense display
│   └── CategorySelector.tsx     # Category selection component
├── types/
│   └── types.ts                 # TypeScript type definitions
├── api/
│   └── expenseApi.ts           # API service layer
├── navigation.tsx               # React Navigation setup
├── App.tsx                     # Main app component
└── package.json
```

## Usage

1. **Start by adding categories** - Go to "Add Category" to create expense categories
2. **Add your first expense** - Tap the + button to add an expense
3. **View your spending** - Check the "History" tab to see all expenses
4. **Analyze your data** - Use "Summary" to view charts and spending patterns

## Development Notes

### Network Configuration
- Make sure your mobile device and development machine are on the same network
- Update the `BASE_URL` in `client/api/expenseApi.ts` with your machine's IP address
- Backend runs on port 5000 by default

### Database Models
- **Expense**: category, amount, date, note, timestamps
- **Category**: name, timestamps
- Both models include automatic validation and indexing

### Error Handling
- Frontend includes comprehensive error handling and user feedback
- Backend provides detailed error responses with appropriate HTTP status codes
- Network connectivity checking in the mobile app

## Future Enhancements

- [ ] User authentication and multi-user support
- [ ] Budget targets and alerts
- [ ] Export data to CSV/PDF
- [ ] Dark mode theme
- [ ] Recurring expense tracking
- [ ] Photo attachments for receipts
- [ ] Advanced filtering and search
- [ ] Push notifications for budget limits

## Troubleshooting

### Common Issues

1. **Metro bundler cache issues**: Run `expo start -c` to clear cache
2. **Network connectivity**: Ensure device and computer are on same WiFi
3. **MongoDB connection**: Verify connection string and network access
4. **Port conflicts**: Change PORT in `.env` if 5000 is already in use

### Development Tips

- Use `npm run dev` for backend with auto-reload
- Check backend logs for API request debugging
- Use React Native Debugger for frontend debugging
- Monitor network tab in browser for API call inspection

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is open source and available under the MIT License.
