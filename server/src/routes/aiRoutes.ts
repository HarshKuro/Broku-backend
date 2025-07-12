import express, { Request, Response } from 'express';
import { AIController } from '../controllers/aiController';

const router = express.Router();

// Smart expense categorization
router.post('/categorize', async (req: Request, res: Response) => {
  await AIController.categorizeExpense(req, res);
});

// Financial insights (mock user for testing)
router.get('/insights', async (req: Request, res: Response) => {
  // Add mock user for testing
  (req as any).user = { id: 'test-user-id' };
  await AIController.getFinancialInsights(req as any, res);
});

// Spending patterns analysis
router.get('/patterns', async (req: Request, res: Response) => {
  (req as any).user = { id: 'test-user-id' };
  await AIController.getSpendingPatterns(req as any, res);
});

// Budget recommendations
router.get('/budget-recommendations', async (req: Request, res: Response) => {
  (req as any).user = { id: 'test-user-id' };
  await AIController.getBudgetRecommendations(req as any, res);
});

// AI Chat Assistant
router.post('/chat', async (req: Request, res: Response) => {
  (req as any).user = { id: 'test-user-id' };
  await AIController.chatQuery(req as any, res);
});

// AI Overview Dashboard
router.get('/overview', async (req: Request, res: Response) => {
  (req as any).user = { id: 'test-user-id' };
  await AIController.getAIOverview(req as any, res);
});

export default router;
