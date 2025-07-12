import express from 'express';
import {
  getCashWallet,
  addCashToWallet,
  spendCashFromWallet,
  withdrawCashFromWallet,
  getCashTransactions,
  updateCashBalance,
  deleteCashTransaction
} from '../controllers/cashWalletController';

const router = express.Router();

// GET /api/cash-wallet - Get or create cash wallet
router.get('/', getCashWallet);

// POST /api/cash-wallet/add - Add cash to wallet (rolled up money)
router.post('/add', addCashToWallet);

// POST /api/cash-wallet/spend - Spend cash from wallet
router.post('/spend', spendCashFromWallet);

// POST /api/cash-wallet/withdraw - Withdraw cash from wallet
router.post('/withdraw', withdrawCashFromWallet);

// GET /api/cash-wallet/transactions - Get cash transactions
router.get('/transactions', getCashTransactions);

// PUT /api/cash-wallet/balance - Update cash balance (for corrections)
router.put('/balance', updateCashBalance);

// DELETE /api/cash-wallet/transactions/:transactionId - Delete a transaction
router.delete('/transactions/:transactionId', deleteCashTransaction);

export default router;
