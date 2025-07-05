import express from 'express';
import {
  getExpenses,
  getExpenseById,
  createExpense,
  updateExpense,
  deleteExpense,
  getMonthlySummary
} from '../controllers/expenseController';

const router = express.Router();

// @route   GET /api/expenses
// @desc    Get all expenses (with optional filtering)
// @access  Public
router.get('/', getExpenses);

// @route   GET /api/expenses/summary
// @desc    Get monthly summary
// @access  Public
router.get('/summary', getMonthlySummary);

// @route   GET /api/expenses/:id
// @desc    Get expense by ID
// @access  Public
router.get('/:id', getExpenseById);

// @route   POST /api/expenses
// @desc    Create new expense
// @access  Public
router.post('/', createExpense);

// @route   PUT /api/expenses/:id
// @desc    Update expense
// @access  Public
router.put('/:id', updateExpense);

// @route   DELETE /api/expenses/:id
// @desc    Delete expense
// @access  Public
router.delete('/:id', deleteExpense);

export default router;
