import { Request, Response } from 'express';
import Expense, { IExpense } from '../models/Expense';
import CashWallet from '../models/CashWallet';
import mongoose from 'mongoose';

// Get all expenses with optional filtering
export const getExpenses = async (req: Request, res: Response): Promise<void> => {
  try {
    const { month, year, category, type } = req.query;
    
    // Build filter object
    const filter: any = {};
    
    if (month && year) {
      const startDate = new Date(Number(year), Number(month) - 1, 1);
      const endDate = new Date(Number(year), Number(month), 0, 23, 59, 59, 999);
      filter.date = { $gte: startDate, $lte: endDate };
    }
    
    if (category) {
      filter.category = category;
    }

    if (type) {
      filter.type = type;
    }

    const expenses = await Expense.find(filter).sort({ date: -1 });
    
    res.status(200).json({
      success: true,
      count: expenses.length,
      data: expenses
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Get expense by ID
export const getExpenseById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: 'Invalid expense ID'
      });
      return;
    }

    const expense = await Expense.findById(id);

    if (!expense) {
      res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: expense
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Create new expense
export const createExpense = async (req: Request, res: Response): Promise<void> => {
  try {
    const { category, amount, date, note, type, paymentMethod } = req.body;

    // Validation
    if (!category || !amount) {
      res.status(400).json({
        success: false,
        message: 'Category and amount are required'
      });
      return;
    }

    if (amount <= 0) {
      res.status(400).json({
        success: false,
        message: 'Amount must be greater than 0'
      });
      return;
    }

    // If payment method is cash and type is expense, check cash wallet balance
    if (paymentMethod === 'cash' && (type === 'expense' || !type)) {
      const wallet = await CashWallet.findOne();
      if (!wallet || wallet.totalCash < amount) {
        res.status(400).json({
          success: false,
          message: 'Insufficient cash balance in wallet'
        });
        return;
      }
    }

    const expense = await Expense.create({
      category: category.trim(),
      amount: Number(amount),
      date: date ? new Date(date) : new Date(),
      note: note ? note.trim() : '',
      type: type || 'expense',
      paymentMethod: paymentMethod || 'other'
    });

    // If payment method is cash and type is expense, deduct from cash wallet
    if (paymentMethod === 'cash' && (type === 'expense' || !type)) {
      const wallet = await CashWallet.findOne();
      if (wallet) {
        await wallet.spendCash(
          Number(amount),
          `${category}: ${note || 'Expense'}`,
          (expense as any)._id.toString()
        );
      }
    }

    res.status(201).json({
      success: true,
      data: expense
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Update expense
export const updateExpense = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { category, amount, date, note, type } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: 'Invalid expense ID'
      });
      return;
    }

    // Validation
    if (amount && amount <= 0) {
      res.status(400).json({
        success: false,
        message: 'Amount must be greater than 0'
      });
      return;
    }

    const updateData: any = {};
    if (category) updateData.category = category.trim();
    if (amount) updateData.amount = Number(amount);
    if (date) updateData.date = new Date(date);
    if (note !== undefined) updateData.note = note.trim();
    if (type) updateData.type = type;

    const expense = await Expense.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!expense) {
      res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: expense
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Delete expense
export const deleteExpense = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: 'Invalid expense ID'
      });
      return;
    }

    const expense = await Expense.findByIdAndDelete(id);

    if (!expense) {
      res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Expense deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Get monthly summary
export const getMonthlySummary = async (req: Request, res: Response): Promise<void> => {
  try {
    const { month, year } = req.query;
    
    if (!month || !year) {
      res.status(400).json({
        success: false,
        message: 'Month and year are required'
      });
      return;
    }

    const startDate = new Date(Number(year), Number(month) - 1, 1);
    const endDate = new Date(Number(year), Number(month), 0, 23, 59, 59, 999);

    const summary = await Expense.aggregate([
      {
        $match: {
          date: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: '$category',
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { totalAmount: -1 }
      }
    ]);

    const totalExpenses = await Expense.aggregate([
      {
        $match: {
          date: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        categoryWise: summary,
        total: totalExpenses[0] || { total: 0, count: 0 },
        period: {
          month: Number(month),
          year: Number(year),
          startDate,
          endDate
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Get analytics data with income/expense separation
export const getAnalytics = async (req: Request, res: Response): Promise<void> => {
  try {
    const { period } = req.query; // 'week', 'month', 'lastMonth'
    
    const now = new Date();
    let startDate = new Date();
    let endDate = new Date();
    
    // Set date ranges based on period
    if (period === 'week') {
      const dayOfWeek = now.getDay();
      startDate = new Date(now.getTime() - dayOfWeek * 24 * 60 * 60 * 1000);
      endDate = now;
    } else if (period === 'month') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = now;
    } else { // lastMonth
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      endDate = new Date(now.getFullYear(), now.getMonth(), 0);
    }

    // Get income and expense totals
    const totals = await Expense.aggregate([
      {
        $match: {
          date: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: '$type',
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    // Get category-wise breakdown for expenses
    const expensesByCategory = await Expense.aggregate([
      {
        $match: {
          date: { $gte: startDate, $lte: endDate },
          type: 'expense'
        }
      },
      {
        $group: {
          _id: '$category',
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { totalAmount: -1 }
      }
    ]);

    // Get daily/period breakdown
    const timeBreakdown = await Expense.aggregate([
      {
        $match: {
          date: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
            type: '$type'
          },
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.date': 1 }
      }
    ]);

    // Format response
    const income = totals.find(t => t._id === 'income')?.totalAmount || 0;
    const expense = totals.find(t => t._id === 'expense')?.totalAmount || 0;

    res.status(200).json({
      success: true,
      data: {
        summary: {
          income,
          expense,
          balance: income - expense,
          period: period || 'month'
        },
        expensesByCategory,
        timeBreakdown,
        period: {
          startDate,
          endDate,
          type: period || 'month'
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Get insights based on spending patterns
export const getInsights = async (req: Request, res: Response): Promise<void> => {
  try {
    const now = new Date();
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    // Current month data
    const currentMonthData = await Expense.aggregate([
      {
        $match: {
          date: { $gte: currentMonth }
        }
      },
      {
        $group: {
          _id: '$type',
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    // Last month data for comparison
    const lastMonthData = await Expense.aggregate([
      {
        $match: {
          date: { $gte: lastMonth, $lte: lastMonthEnd }
        }
      },
      {
        $group: {
          _id: '$type',
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    // Top spending category this month
    const topCategory = await Expense.aggregate([
      {
        $match: {
          date: { $gte: currentMonth },
          type: 'expense'
        }
      },
      {
        $group: {
          _id: '$category',
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { totalAmount: -1 }
      },
      { $limit: 1 }
    ]);

    // Recent high expense
    const recentHighExpense = await Expense.findOne({
      type: 'expense',
      date: { $gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) }
    }).sort({ amount: -1 });

    res.status(200).json({
      success: true,
      data: {
        currentMonth: currentMonthData,
        lastMonth: lastMonthData,
        topCategory: topCategory[0] || null,
        recentHighExpense
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
