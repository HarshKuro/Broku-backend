import { Request, Response } from 'express';
import CashWallet, { ICashWallet } from '../models/CashWallet';
import mongoose from 'mongoose';

// Get or create cash wallet
export const getCashWallet = async (req: Request, res: Response): Promise<void> => {
  try {
    let wallet = await CashWallet.findOne();
    
    // If no wallet exists, create one
    if (!wallet) {
      wallet = new CashWallet({
        totalCash: 0,
        transactions: []
      });
      await wallet.save();
    }

    res.status(200).json({
      success: true,
      data: wallet
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Add cash to wallet (rolled up money)
export const addCashToWallet = async (req: Request, res: Response): Promise<void> => {
  try {
    const { amount, description } = req.body;

    if (!amount || amount <= 0) {
      res.status(400).json({
        success: false,
        message: 'Amount must be a positive number'
      });
      return;
    }

    let wallet = await CashWallet.findOne();
    
    // If no wallet exists, create one
    if (!wallet) {
      wallet = new CashWallet({
        totalCash: 0,
        transactions: []
      });
    }

    // Add cash using the model method
    await wallet.addCash(amount, description || 'Cash added to wallet');

    res.status(200).json({
      success: true,
      message: 'Cash added successfully',
      data: wallet
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Spend cash from wallet
export const spendCashFromWallet = async (req: Request, res: Response): Promise<void> => {
  try {
    const { amount, description, relatedExpenseId } = req.body;

    if (!amount || amount <= 0) {
      res.status(400).json({
        success: false,
        message: 'Amount must be a positive number'
      });
      return;
    }

    if (!description) {
      res.status(400).json({
        success: false,
        message: 'Description is required'
      });
      return;
    }

    const wallet = await CashWallet.findOne();
    
    if (!wallet) {
      res.status(404).json({
        success: false,
        message: 'Cash wallet not found'
      });
      return;
    }

    if (wallet.totalCash < amount) {
      res.status(400).json({
        success: false,
        message: 'Insufficient cash balance'
      });
      return;
    }

    // Spend cash using the model method
    await wallet.spendCash(amount, description, relatedExpenseId);

    res.status(200).json({
      success: true,
      message: 'Cash spent successfully',
      data: wallet
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Withdraw cash from wallet
export const withdrawCashFromWallet = async (req: Request, res: Response): Promise<void> => {
  try {
    const { amount, description } = req.body;

    if (!amount || amount <= 0) {
      res.status(400).json({
        success: false,
        message: 'Amount must be a positive number'
      });
      return;
    }

    const wallet = await CashWallet.findOne();
    
    if (!wallet) {
      res.status(404).json({
        success: false,
        message: 'Cash wallet not found'
      });
      return;
    }

    if (wallet.totalCash < amount) {
      res.status(400).json({
        success: false,
        message: 'Insufficient cash balance'
      });
      return;
    }

    // Withdraw cash using the model method
    await wallet.withdrawCash(amount, description || 'Cash withdrawn from wallet');

    res.status(200).json({
      success: true,
      message: 'Cash withdrawn successfully',
      data: wallet
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Get cash wallet transactions
export const getCashTransactions = async (req: Request, res: Response): Promise<void> => {
  try {
    const { limit = 50, offset = 0, type } = req.query;

    const wallet = await CashWallet.findOne();
    
    if (!wallet) {
      res.status(404).json({
        success: false,
        message: 'Cash wallet not found'
      });
      return;
    }

    let transactions = wallet.transactions;

    // Filter by type if specified
    if (type && ['add', 'spend', 'withdraw'].includes(type as string)) {
      transactions = transactions.filter(t => t.type === type);
    }

    // Sort by date (newest first)
    transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Apply pagination
    const startIndex = Number(offset);
    const endIndex = startIndex + Number(limit);
    const paginatedTransactions = transactions.slice(startIndex, endIndex);

    res.status(200).json({
      success: true,
      data: {
        transactions: paginatedTransactions,
        totalTransactions: transactions.length,
        currentBalance: wallet.totalCash,
        pagination: {
          limit: Number(limit),
          offset: Number(offset),
          total: transactions.length
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

// Update cash wallet balance (for corrections)
export const updateCashBalance = async (req: Request, res: Response): Promise<void> => {
  try {
    const { amount, reason } = req.body;

    if (typeof amount !== 'number') {
      res.status(400).json({
        success: false,
        message: 'Amount must be a number'
      });
      return;
    }

    if (amount < 0) {
      res.status(400).json({
        success: false,
        message: 'Total cash cannot be negative'
      });
      return;
    }

    let wallet = await CashWallet.findOne();
    
    if (!wallet) {
      wallet = new CashWallet({
        totalCash: 0,
        transactions: []
      });
    }

    const previousBalance = wallet.totalCash;
    const difference = amount - previousBalance;

    if (difference !== 0) {
      // Add a correction transaction
      wallet.transactions.push({
        type: difference > 0 ? 'add' : 'withdraw',
        amount: Math.abs(difference),
        description: reason || `Balance correction: ${difference > 0 ? 'added' : 'removed'} ${Math.abs(difference)}`,
        date: new Date()
      });
    }

    wallet.totalCash = amount;
    await wallet.save();

    res.status(200).json({
      success: true,
      message: 'Cash balance updated successfully',
      data: {
        wallet,
        previousBalance,
        newBalance: amount,
        difference
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

// Delete cash transaction
export const deleteCashTransaction = async (req: Request, res: Response): Promise<void> => {
  try {
    const { transactionId } = req.params;

    if (!transactionId) {
      res.status(400).json({
        success: false,
        message: 'Transaction ID is required'
      });
      return;
    }

    const wallet = await CashWallet.findOne();
    
    if (!wallet) {
      res.status(404).json({
        success: false,
        message: 'Cash wallet not found'
      });
      return;
    }

    // Find the transaction
    const transactionIndex = wallet.transactions.findIndex(
      t => t._id?.toString() === transactionId
    );

    if (transactionIndex === -1) {
      res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
      return;
    }

    const transaction = wallet.transactions[transactionIndex];
    
    // Reverse the transaction effect on total cash
    switch (transaction.type) {
      case 'add':
        wallet.totalCash -= transaction.amount;
        break;
      case 'spend':
      case 'withdraw':
        wallet.totalCash += transaction.amount;
        break;
    }

    // Remove the transaction
    wallet.transactions.splice(transactionIndex, 1);
    
    // Ensure totalCash doesn't go negative
    if (wallet.totalCash < 0) {
      wallet.totalCash = 0;
    }

    await wallet.save();

    res.status(200).json({
      success: true,
      message: 'Transaction deleted successfully',
      data: {
        wallet,
        deletedTransaction: transaction
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
