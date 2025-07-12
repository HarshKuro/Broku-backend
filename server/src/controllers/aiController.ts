import { Request, Response } from 'express';
import { AIService } from '../services/aiService';
import Expense from '../models/Expense';

// Extend Request interface to include user
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    [key: string]: any;
  };
}

export class AIController {
  /**
   * Smart expense categorization endpoint using Gemini AI
   */
  static async categorizeExpense(req: Request, res: Response) {
    try {
      const { description, amount } = req.body;

      if (!description || !amount) {
        return res.status(400).json({
          success: false,
          message: 'Description and amount are required'
        });
      }

      const suggestions = await AIService.categorizeExpense(description, amount);
      
      // Get categories for additional context
      const Category = require('../models/Category').default;
      const categories = await Category.find();
      
      // Map suggestions to include category IDs
      const enrichedSuggestions = suggestions.map(suggestion => {
        const matchingCategory = categories.find((cat: any) => 
          cat.name.toLowerCase() === suggestion.category.toLowerCase()
        );
        
        return {
          id: matchingCategory ? matchingCategory._id.toString() : null,
          name: suggestion.category,
          confidence: suggestion.confidence / 100, // Convert to 0-1 scale
          reason: suggestion.reason
        };
      });

      res.json({
        success: true,
        data: {
          suggestions: enrichedSuggestions,
          primarySuggestion: enrichedSuggestions[0]?.id || null,
          description,
          amount
        }
      });
    } catch (error) {
      console.error('AI categorization error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to categorize expense',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Generate financial insights endpoint
   */
  static async getFinancialInsights(req: AuthenticatedRequest, res: Response) {
    try {
      const { timeframe = 'month' } = req.query;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User authentication required'
        });
      }

      // Get user's expenses for the timeframe
      const startDate = new Date();
      if (timeframe === 'week') {
        startDate.setDate(startDate.getDate() - 7);
      } else {
        startDate.setMonth(startDate.getMonth() - 1);
      }

      const expenses = await Expense.find({
        userId,
        date: { $gte: startDate }
      }).sort({ date: -1 });

      const insights = await AIService.generateFinancialInsights(expenses, timeframe as 'week' | 'month');

      res.json({
        success: true,
        data: {
          insights,
          timeframe,
          totalExpenses: expenses.filter(e => e.type === 'expense').length,
          totalIncome: expenses.filter(e => e.type === 'income').length,
          period: {
            start: startDate.toISOString(),
            end: new Date().toISOString()
          }
        }
      });
    } catch (error) {
      console.error('AI insights error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate financial insights',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Analyze spending patterns endpoint
   */
  static async getSpendingPatterns(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User authentication required'
        });
      }

      // Get user's expenses from last 3 months for pattern analysis
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

      const expenses = await Expense.find({
        userId,
        date: { $gte: threeMonthsAgo },
        type: 'expense'
      }).sort({ date: -1 });

      const patterns = AIService.analyzeSpendingPatterns(expenses);

      res.json({
        success: true,
        data: {
          patterns,
          analysisperiod: '3 months',
          totalTransactions: expenses.length,
          totalAmount: expenses.reduce((sum, e) => sum + e.amount, 0)
        }
      });
    } catch (error) {
      console.error('AI patterns error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to analyze spending patterns',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get budget recommendations endpoint
   */
  static async getBudgetRecommendations(req: AuthenticatedRequest, res: Response) {
    try {
      const { income } = req.query;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User authentication required'
        });
      }

      // Get user's expenses from last month
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);

      const expenses = await Expense.find({
        userId,
        date: { $gte: lastMonth }
      }).sort({ date: -1 });

      // Use provided income or calculate from income transactions
      let userIncome = income ? parseFloat(income as string) : 0;
      if (!userIncome) {
        userIncome = expenses
          .filter(e => e.type === 'income')
          .reduce((sum, e) => sum + e.amount, 0);
      }

      if (userIncome === 0) {
        return res.status(400).json({
          success: false,
          message: 'Income information required for budget recommendations'
        });
      }

      const recommendations = AIService.generateBudgetRecommendations(expenses, userIncome);

      res.json({
        success: true,
        data: {
          recommendations,
          income: userIncome,
          currentSpending: expenses.filter(e => e.type === 'expense').reduce((sum, e) => sum + e.amount, 0),
          potentialSavings: recommendations.reduce((sum, r) => sum + r.savingsPotential, 0)
        }
      });
    } catch (error) {
      console.error('AI budget recommendations error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate budget recommendations',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * AI Chat Assistant endpoint
   */
  static async chatQuery(req: AuthenticatedRequest, res: Response) {
    try {
      const { query } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User authentication required'
        });
      }

      if (!query || typeof query !== 'string') {
        return res.status(400).json({
          success: false,
          message: 'Query is required'
        });
      }

      // Get user's recent expenses for context
      const recentExpenses = await Expense.find({
        userId
      }).sort({ date: -1 }).limit(100);

      const response = await AIService.chatWithAI(query, recentExpenses);

      res.json({
        success: true,
        data: {
          query,
          response,
          timestamp: new Date().toISOString(),
          contextExpenses: recentExpenses.length
        }
      });
    } catch (error) {
      console.error('AI chat error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to process chat query',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get AI overview with all insights
   */
  static async getAIOverview(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User authentication required'
        });
      }

      // Get user's data
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);

      const expenses = await Expense.find({
        userId,
        date: { $gte: lastMonth }
      }).sort({ date: -1 });

      const income = expenses.filter(e => e.type === 'income').reduce((sum, e) => sum + e.amount, 0);
      
      // Generate all AI insights
      const [insights, patterns, budgetRecommendations] = await Promise.all([
        AIService.generateFinancialInsights(expenses),
        AIService.analyzeSpendingPatterns(expenses),
        income > 0 ? AIService.generateBudgetRecommendations(expenses, income) : []
      ]);

      const totalExpenses = expenses.filter(e => e.type === 'expense').reduce((sum, e) => sum + e.amount, 0);
      const savings = income - totalExpenses;
      const savingsRate = income > 0 ? (savings / income) * 100 : 0;

      res.json({
        success: true,
        data: {
          overview: {
            income,
            expenses: totalExpenses,
            savings,
            savingsRate: parseFloat(savingsRate.toFixed(1)),
            transactionCount: expenses.length
          },
          insights,
          patterns: patterns.slice(0, 5), // Top 5 patterns
          budgetRecommendations: budgetRecommendations.slice(0, 3), // Top 3 recommendations
          aiScore: this.calculateAIFinancialScore(savingsRate, insights.length, patterns.length),
          lastUpdated: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('AI overview error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate AI overview',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  private static calculateAIFinancialScore(savingsRate: number, insightsCount: number, patternsCount: number): number {
    let score = 50; // Base score

    // Savings rate contribution (0-40 points)
    if (savingsRate >= 20) score += 40;
    else if (savingsRate >= 10) score += 20;
    else if (savingsRate > 0) score += 10;

    // Activity bonus (0-20 points)
    score += Math.min(20, (insightsCount + patternsCount) * 2);

    // Financial health indicators
    if (savingsRate > 0) score += 10; // Positive savings
    if (patternsCount > 3) score += 10; // Good transaction diversity

    return Math.min(100, Math.max(0, score));
  }
}
