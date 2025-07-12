import { GoogleGenerativeAI } from '@google/generative-ai';
import { IExpense } from '../models/Expense';
import Category, { ICategory } from '../models/Category';

interface FinancialInsight {
  type: 'warning' | 'success' | 'info' | 'tip';
  title: string;
  message: string;
  priority: number;
  actionable?: boolean;
  action?: string;
}

interface SpendingPattern {
  category: string;
  trend: 'increasing' | 'decreasing' | 'stable';
  percentage: number;
  amount: number;
  recommendation?: string;
}

interface BudgetRecommendation {
  category: string;
  currentSpending: number;
  recommendedBudget: number;
  reason: string;
  savingsPotential: number;
}

interface CategorySuggestion {
  category: string;
  confidence: number;
  reason: string;
}

export class AIService {
  private static genAI: GoogleGenerativeAI;
  private static model: any;

  static initialize() {
    // Initialize Gemini AI
    if (process.env.GEMINI_API_KEY) {
      console.log('✅ Initializing Gemini AI with API key');
      this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      this.model = this.genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    } else {
      console.warn('⚠️  GEMINI_API_KEY not found in environment variables');
    }
  }

  /**
   * Smart expense categorization using Gemini AI
   */
  static async categorizeExpense(description: string, amount: number): Promise<CategorySuggestion[]> {
    try {
      // Get available categories from database
      const categories = await Category.find();
      const categoryNames = categories.map(cat => cat.name).join(', ');

      if (!this.model) {
        // Fallback to keyword-based categorization if Gemini is not available
        return this.fallbackCategorization(description, amount, categories);
      }

      const prompt = `
        You are a financial AI assistant helping categorize expenses. 
        
        Expense Description: "${description}"
        Amount: $${amount}
        
        Available Categories: ${categoryNames}
        
        Please suggest the top 3 most appropriate categories for this expense with confidence scores (0-100).
        Consider the description keywords, amount, and typical spending patterns.
        
        Respond ONLY with a JSON array in this exact format:
        [
          {
            "category": "category_name",
            "confidence": 95,
            "reason": "Brief explanation why this category fits"
          }
        ]
        
        Important: 
        - Use only categories from the available list
        - Confidence should reflect how certain you are (0-100)
        - Provide exactly 3 suggestions
        - Keep reasons brief (under 50 characters)
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      let text = response.text();
      
      // Clean up the response by removing markdown code blocks
      text = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
      
      try {
        const suggestions = JSON.parse(text);
        
        // Validate the response format
        if (Array.isArray(suggestions) && suggestions.length > 0) {
          return suggestions.slice(0, 3).map((suggestion: any) => ({
            category: suggestion.category || 'Other',
            confidence: Math.min(Math.max(suggestion.confidence || 50, 0), 100),
            reason: suggestion.reason || 'AI categorization'
          }));
        }
      } catch (parseError) {
        console.warn('Failed to parse Gemini response, using fallback:', parseError);
        console.log('Raw Gemini response:', text);
      }
      
      // Fallback if parsing fails
      return this.fallbackCategorization(description, amount, categories);
      
    } catch (error) {
      console.error('Gemini categorization error:', error);
      // Fallback to keyword-based categorization
      const categories = await Category.find();
      return this.fallbackCategorization(description, amount, categories);
    }
  }

  /**
   * Fallback categorization method using keyword matching
   */
  private static fallbackCategorization(description: string, amount: number, availableCategories: ICategory[]): CategorySuggestion[] {
    const categoryMap: { [key: string]: string[] } = {
      food: ['restaurant', 'food', 'eat', 'lunch', 'dinner', 'breakfast', 'cafe', 'pizza', 'burger', 'coffee', 'tea', 'snack', 'grocery', 'market'],
      transport: ['uber', 'taxi', 'bus', 'metro', 'fuel', 'petrol', 'gas', 'parking', 'toll', 'auto', 'ola', 'rapido'],
      entertainment: ['movie', 'cinema', 'netflix', 'spotify', 'game', 'concert', 'party', 'club', 'bar', 'theatre'],
      shopping: ['amazon', 'flipkart', 'shop', 'store', 'mall', 'clothes', 'dress', 'shirt', 'shoes', 'electronics'],
      bills: ['electricity', 'water', 'gas', 'internet', 'mobile', 'phone', 'bill', 'recharge', 'wifi'],
      health: ['doctor', 'hospital', 'medicine', 'pharmacy', 'medical', 'clinic', 'checkup', 'dentist'],
      education: ['book', 'course', 'class', 'school', 'college', 'university', 'tuition', 'training'],
      travel: ['flight', 'hotel', 'booking', 'trip', 'vacation', 'airbnb', 'travel'],
      other: []
    };

    const lowerDesc = description.toLowerCase();
    const suggestions: CategorySuggestion[] = [];
    
    // Find matching categories based on keywords
    for (const [categoryType, keywords] of Object.entries(categoryMap)) {
      const matchingKeywords = keywords.filter(keyword => lowerDesc.includes(keyword));
      if (matchingKeywords.length > 0) {
        // Find matching category in database
        const existingCategory = availableCategories.find((cat: ICategory) => 
          cat.name.toLowerCase().includes(categoryType) || 
          cat.name.toLowerCase() === categoryType
        );
        
        if (existingCategory) {
          const confidence = Math.min(90, 60 + (matchingKeywords.length * 10));
          suggestions.push({
            category: existingCategory.name,
            confidence,
            reason: `Matched keywords: ${matchingKeywords.slice(0, 2).join(', ')}`
          });
        }
      }
    }

    // Amount-based suggestions for ambiguous cases
    if (suggestions.length === 0) {
      if (amount > 5000) {
        const travelCategory = availableCategories.find((cat: ICategory) => 
          cat.name.toLowerCase().includes('travel') || cat.name.toLowerCase().includes('trip')
        );
        if (travelCategory) {
          suggestions.push({
            category: travelCategory.name,
            confidence: 70,
            reason: 'High amount suggests travel/major expense'
          });
        }
      }

      if (amount < 100) {
        const foodCategory = availableCategories.find((cat: ICategory) => 
          cat.name.toLowerCase().includes('food') || cat.name.toLowerCase().includes('meal')
        );
        if (foodCategory) {
          suggestions.push({
            category: foodCategory.name,
            confidence: 60,
            reason: 'Small amount suggests daily expense'
          });
        }
      }
    }

    // Add "Other" category as fallback
    const otherCategory = availableCategories.find((cat: ICategory) => 
      cat.name.toLowerCase().includes('other') || cat.name.toLowerCase().includes('miscellaneous')
    );
    if (otherCategory && suggestions.length < 3) {
      suggestions.push({
        category: otherCategory.name,
        confidence: 30,
        reason: 'Default fallback category'
      });
    }

    // Ensure we have at least one suggestion
    if (suggestions.length === 0 && availableCategories.length > 0) {
      suggestions.push({
        category: availableCategories[0].name,
        confidence: 25,
        reason: 'No specific match found'
      });
    }

    return suggestions.slice(0, 3);
  }

  /**
   * Generate AI-powered financial insights using Gemini
   */
  static async generateFinancialInsights(expenses: IExpense[], timeframe: 'week' | 'month' = 'month'): Promise<FinancialInsight[]> {
    if (expenses.length === 0) {
      return [{
        type: 'info',
        title: 'Start Your Financial Journey',
        message: 'Add some expenses to get personalized AI insights and recommendations.',
        priority: 1
      }];
    }

    try {
      if (!this.model) {
        return this.generateFallbackInsights(expenses, timeframe);
      }

      // Prepare expense data for analysis
      const totalExpenses = expenses.filter(e => e.type === 'expense').reduce((sum, e) => sum + e.amount, 0);
      const totalIncome = expenses.filter(e => e.type === 'income').reduce((sum, e) => sum + e.amount, 0);
      const savings = totalIncome - totalExpenses;
      const savingsRate = totalIncome > 0 ? (savings / totalIncome) * 100 : 0;

      // Group expenses by category
      const categorySpending = this.analyzeCategorySpending(expenses);
      const categoryData = categorySpending.slice(0, 5).map(cat => 
        `${cat.category}: $${cat.amount.toFixed(2)} (${cat.percentage.toFixed(1)}%)`
      ).join(', ');

      const prompt = `
        You are a professional financial advisor AI. Analyze this user's financial data and provide 3-5 actionable insights.

        Financial Summary:
        - Total Income: $${totalIncome.toFixed(2)}
        - Total Expenses: $${totalExpenses.toFixed(2)}
        - Net Savings: $${savings.toFixed(2)}
        - Savings Rate: ${savingsRate.toFixed(1)}%
        - Top Spending Categories: ${categoryData}
        - Time Period: ${timeframe}
        - Number of Transactions: ${expenses.length}

        Provide insights as a JSON array with this exact format:
        [
          {
            "type": "warning|success|info|tip",
            "title": "Brief title (max 40 chars)",
            "message": "Actionable insight (max 120 chars)",
            "priority": 1-3,
            "actionable": true/false,
            "action": "Specific action step (max 80 chars, only if actionable)"
          }
        ]

        Focus on:
        1. Savings rate optimization
        2. Spending pattern observations
        3. Budget recommendations
        4. Financial health alerts
        5. Actionable improvement tips

        Make insights specific, actionable, and encouraging.
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      let text = response.text();

      // Clean up the response by removing markdown code blocks
      text = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();

      try {
        const insights = JSON.parse(text);
        
        if (Array.isArray(insights) && insights.length > 0) {
          return insights.map((insight: any) => ({
            type: insight.type || 'info',
            title: insight.title || 'Financial Insight',
            message: insight.message || 'Review your financial habits',
            priority: Math.min(Math.max(insight.priority || 2, 1), 3),
            actionable: insight.actionable || false,
            action: insight.action || undefined
          }));
        }
      } catch (parseError) {
        console.warn('Failed to parse Gemini insights response:', parseError);
        console.log('Raw Gemini insights response:', text);
      }

      // Fallback if parsing fails
      return this.generateFallbackInsights(expenses, timeframe);

    } catch (error) {
      console.error('Gemini insights generation error:', error);
      return this.generateFallbackInsights(expenses, timeframe);
    }
  }

  /**
   * Fallback insights generation
   */
  private static generateFallbackInsights(expenses: IExpense[], timeframe: string): FinancialInsight[] {
    const insights: FinancialInsight[] = [];
    
    if (expenses.length === 0) {
      return [{
        type: 'info',
        title: 'Start Your Financial Journey',
        message: 'Add some expenses to get personalized AI insights and recommendations.',
        priority: 1
      }];
    }

    const totalExpenses = expenses.filter(e => e.type === 'expense').reduce((sum, e) => sum + e.amount, 0);
    const totalIncome = expenses.filter(e => e.type === 'income').reduce((sum, e) => sum + e.amount, 0);
    const savings = totalIncome - totalExpenses;
    const savingsRate = totalIncome > 0 ? (savings / totalIncome) * 100 : 0;

    // Savings Rate Analysis
    if (savingsRate >= 20) {
      insights.push({
        type: 'success',
        title: 'Excellent Saving Habits! 🎉',
        message: `You're saving ${savingsRate.toFixed(1)}% of your income. You're on track for financial independence!`,
        priority: 1
      });
    } else if (savingsRate >= 10) {
      insights.push({
        type: 'info',
        title: 'Good Progress on Savings',
        message: `You're saving ${savingsRate.toFixed(1)}% of income. Try to reach 20% for optimal financial health.`,
        priority: 2,
        actionable: true,
        action: 'Review your largest expense categories for optimization opportunities.'
      });
    } else if (savingsRate > 0) {
      insights.push({
        type: 'warning',
        title: 'Low Savings Rate Alert',
        message: `You're only saving ${savingsRate.toFixed(1)}% of income. Aim for at least 10-20%.`,
        priority: 1,
        actionable: true,
        action: 'Consider reducing discretionary spending or finding additional income sources.'
      });
    } else {
      insights.push({
        type: 'warning',
        title: 'Overspending Detected',
        message: 'You\'re spending more than you earn. Immediate action needed to avoid debt.',
        priority: 1,
        actionable: true,
        action: 'Review all expenses and eliminate non-essential spending immediately.'
      });
    }

    // Category-wise spending analysis
    const categorySpending = this.analyzeCategorySpending(expenses);
    const topCategory = categorySpending[0];
    
    if (topCategory && topCategory.amount > totalExpenses * 0.4) {
      insights.push({
        type: 'warning',
        title: 'High Category Concentration',
        message: `${topCategory.category} accounts for ${((topCategory.amount / totalExpenses) * 100).toFixed(1)}% of your spending.`,
        priority: 2,
        actionable: true,
        action: 'Consider diversifying your spending or optimizing this category.'
      });
    }

    // Frequency-based insights
    const dailyAverage = totalExpenses / 30;
    if (dailyAverage > 1000) {
      insights.push({
        type: 'tip',
        title: 'Daily Spending Awareness',
        message: `You spend an average of ₹${dailyAverage.toFixed(0)} per day. Small daily savings can add up significantly.`,
        priority: 3,
        actionable: true,
        action: 'Try to reduce daily expenses by ₹100-200 for substantial monthly savings.'
      });
    }

    // AI-generated smart tips
    const smartTips = this.generateSmartTips(expenses, totalIncome, totalExpenses);
    insights.push(...smartTips);

    return insights.sort((a, b) => a.priority - b.priority).slice(0, 5);
  }

  /**
   * Analyze spending patterns and trends
   */
  static analyzeSpendingPatterns(expenses: IExpense[]): SpendingPattern[] {
    const categoryGroups = this.groupExpensesByCategory(expenses);
    const patterns: SpendingPattern[] = [];

    for (const [category, categoryExpenses] of Object.entries(categoryGroups)) {
      const amounts = (categoryExpenses as IExpense[]).map((e: IExpense) => e.amount);
      const totalAmount = amounts.reduce((sum: number, amount: number) => sum + amount, 0);
      
      // Simple trend analysis (last 3 vs first 3 transactions)
      const recentAvg = amounts.slice(-3).reduce((sum: number, amount: number) => sum + amount, 0) / Math.min(3, amounts.length);
      const oldAvg = amounts.slice(0, 3).reduce((sum: number, amount: number) => sum + amount, 0) / Math.min(3, amounts.length);
      
      let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
      let percentage = 0;
      
      if (amounts.length >= 6) {
        percentage = ((recentAvg - oldAvg) / oldAvg) * 100;
        if (percentage > 20) trend = 'increasing';
        else if (percentage < -20) trend = 'decreasing';
      }

      patterns.push({
        category,
        trend,
        percentage: Math.abs(percentage),
        amount: totalAmount,
        recommendation: this.getPatternRecommendation(trend, percentage, category)
      });
    }

    return patterns.sort((a, b) => b.amount - a.amount);
  }

  /**
   * Generate budget recommendations using AI analysis
   */
  static generateBudgetRecommendations(expenses: IExpense[], income: number): BudgetRecommendation[] {
    const categorySpending = this.analyzeCategorySpending(expenses);
    const recommendations: BudgetRecommendation[] = [];

    // Standard budget allocation percentages (50/30/20 rule adapted)
    const budgetRules: { [key: string]: number } = {
      food: 0.15,        // 15% for food
      transport: 0.10,   // 10% for transport
      bills: 0.20,       // 20% for bills/utilities
      entertainment: 0.05, // 5% for entertainment
      shopping: 0.10,    // 10% for shopping
      health: 0.05,      // 5% for health
      other: 0.15        // 15% for others
    };

    for (const spending of categorySpending) {
      const recommendedPercentage = budgetRules[spending.category.toLowerCase()] || 0.10;
      const recommendedBudget = income * recommendedPercentage;
      const difference = spending.amount - recommendedBudget;

      if (Math.abs(difference) > recommendedBudget * 0.1) { // 10% threshold
        recommendations.push({
          category: spending.category,
          currentSpending: spending.amount,
          recommendedBudget,
          reason: difference > 0 
            ? `You're overspending by ₹${difference.toFixed(0)}. Consider reducing expenses in this category.`
            : `You have ₹${Math.abs(difference).toFixed(0)} room for additional spending or savings in this category.`,
          savingsPotential: Math.max(0, difference)
        });
      }
    }

    return recommendations.sort((a, b) => b.savingsPotential - a.savingsPotential);
  }

  /**
   * AI Chat Assistant - Process user queries
   */
  static async processChatQuery(query: string, expenses: IExpense[]): Promise<string> {
    const lowerQuery = query.toLowerCase();
    
    // Spending queries
    if (lowerQuery.includes('spend') || lowerQuery.includes('expense')) {
      const totalExpenses = expenses.filter(e => e.type === 'expense').reduce((sum, e) => sum + e.amount, 0);
      return `You've spent ₹${totalExpenses.toLocaleString()} this month across ${expenses.filter(e => e.type === 'expense').length} transactions. Your top spending category is ${this.getTopCategory(expenses)}.`;
    }

    // Savings queries
    if (lowerQuery.includes('save') || lowerQuery.includes('saving')) {
      const totalIncome = expenses.filter(e => e.type === 'income').reduce((sum, e) => sum + e.amount, 0);
      const totalExpenses = expenses.filter(e => e.type === 'expense').reduce((sum, e) => sum + e.amount, 0);
      const savings = totalIncome - totalExpenses;
      const savingsRate = totalIncome > 0 ? (savings / totalIncome) * 100 : 0;
      
      return `You've saved ₹${savings.toLocaleString()} this month (${savingsRate.toFixed(1)}% of income). ${savings > 0 ? 'Great job!' : 'Consider reducing expenses to improve your savings.'} Financial experts recommend saving 20% of income.`;
    }

    // Budget queries
    if (lowerQuery.includes('budget') || lowerQuery.includes('recommendation')) {
      const recommendations = this.generateBudgetRecommendations(expenses, 50000); // Assume average income
      const topRec = recommendations[0];
      if (topRec) {
        return `Budget insight: Your ${topRec.category} spending is ₹${topRec.currentSpending.toFixed(0)}, but I recommend ₹${topRec.recommendedBudget.toFixed(0)}. ${topRec.reason}`;
      }
      return "Your spending seems balanced! Continue monitoring your expenses for optimal financial health.";
    }

    // Category queries
    if (lowerQuery.includes('category') || lowerQuery.includes('what did i spend on')) {
      const categorySpending = this.analyzeCategorySpending(expenses);
      const topCategories = categorySpending.slice(0, 3);
      return `Your top spending categories are: ${topCategories.map(c => `${c.category} (₹${c.amount.toFixed(0)})`).join(', ')}.`;
    }

    // Default response with insights
    const insights = await this.generateFinancialInsights(expenses);
    const topInsight = insights[0];
    return topInsight ? `${topInsight.title}: ${topInsight.message}` : "I'm here to help with your financial questions! Ask me about your spending, savings, or budget recommendations.";
  }

  // Helper methods
  private static analyzeCategorySpending(expenses: IExpense[]) {
    const expenseOnly = expenses.filter(e => e.type === 'expense');
    const totalAmount = expenseOnly.reduce((sum, e) => sum + e.amount, 0);
    const categoryMap = this.groupExpensesByCategory(expenseOnly);
    
    return Object.entries(categoryMap)
      .map(([category, exps]) => {
        const amount = (exps as IExpense[]).reduce((sum: number, e: IExpense) => sum + e.amount, 0);
        return {
          category,
          amount,
          count: (exps as IExpense[]).length,
          percentage: totalAmount > 0 ? (amount / totalAmount) * 100 : 0
        };
      })
      .sort((a, b) => b.amount - a.amount);
  }

  private static groupExpensesByCategory(expenses: IExpense[]) {
    return expenses.reduce((groups, expense) => {
      const category = expense.category || 'Other';
      if (!groups[category]) groups[category] = [];
      groups[category].push(expense);
      return groups;
    }, {} as { [key: string]: IExpense[] });
  }

  private static generateSmartTips(expenses: IExpense[], income: number, totalExpenses: number): FinancialInsight[] {
    const tips: FinancialInsight[] = [];
    
    // Weekend spending analysis
    const weekendExpenses = expenses.filter(e => {
      const day = new Date(e.date).getDay();
      return day === 0 || day === 6; // Sunday or Saturday
    });
    
    if (weekendExpenses.length > 0) {
      const weekendTotal = weekendExpenses.reduce((sum, e) => sum + e.amount, 0);
      const weekendAverage = weekendTotal / weekendExpenses.length;
      
      if (weekendAverage > totalExpenses / expenses.length * 1.5) {
        tips.push({
          type: 'tip',
          title: 'Weekend Spending Pattern',
          message: 'You tend to spend more on weekends. Consider planning budget-friendly weekend activities.',
          priority: 4,
          actionable: true,
          action: 'Set a weekend spending limit or explore free activities.'
        });
      }
    }

    return tips;
  }

  private static getPatternRecommendation(trend: string, percentage: number, category: string): string {
    if (trend === 'increasing' && percentage > 30) {
      return `Your ${category} spending is increasing rapidly. Consider reviewing this category for optimization.`;
    }
    if (trend === 'decreasing' && percentage > 20) {
      return `Great job reducing ${category} expenses! You're saving ${percentage.toFixed(1)}% compared to before.`;
    }
    return `Your ${category} spending is ${trend === 'stable' ? 'consistent' : trend}.`;
  }

  private static getTopCategory(expenses: IExpense[]): string {
    const categorySpending = this.analyzeCategorySpending(expenses);
    return categorySpending.length > 0 ? categorySpending[0].category : 'Unknown';
  }

  /**
   * Chat with AI financial advisor using Gemini
   */
  static async chatWithAI(query: string, expenses: IExpense[] = []): Promise<string> {
    try {
      if (!this.model) {
        return "I'm currently offline, but here's a general tip: Track your expenses regularly and categorize them to better understand your spending patterns.";
      }

      // Prepare context from user's financial data
      const totalExpenses = expenses.filter(e => e.type === 'expense').reduce((sum, e) => sum + e.amount, 0);
      const totalIncome = expenses.filter(e => e.type === 'income').reduce((sum, e) => sum + e.amount, 0);
      const categorySpending = this.analyzeCategorySpending(expenses);
      const topCategories = categorySpending.slice(0, 3).map(cat => 
        `${cat.category}: $${cat.amount.toFixed(2)}`
      ).join(', ');

      const contextInfo = expenses.length > 0 ? `
        User's Financial Context:
        - Total Income: $${totalIncome.toFixed(2)}
        - Total Expenses: $${totalExpenses.toFixed(2)}
        - Top Spending: ${topCategories || 'No data'}
        - Transaction Count: ${expenses.length}
      ` : '';

      const prompt = `
        You are a helpful, knowledgeable financial advisor AI assistant. Answer the user's question about personal finance, budgeting, or money management.

        ${contextInfo}

        User Question: "${query}"

        Guidelines:
        - Be helpful, practical, and encouraging
        - Keep responses concise (under 200 words)
        - Use the user's financial context when relevant
        - Provide actionable advice when possible
        - Be supportive and non-judgmental
        - If asked about specific financial products, give general education rather than recommendations

        Response:
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      return text.trim() || "I'm here to help with your financial questions! Could you please rephrase your question?";

    } catch (error) {
      console.error('Gemini chat error:', error);
      return "I'm having trouble processing your question right now. Please try asking something about budgeting, saving, or expense management.";
    }
  }
}
