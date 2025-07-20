import { Request, Response } from 'express';
import pdf from 'pdf-parse';
import fs from 'fs';
import Expense from '../models/Expense';
import CashWallet from '../models/CashWallet';

export interface TransactionData {
  date: Date;
  amount: number;
  description: string;
  type: 'income' | 'expense';
  category?: string;
}

// Parse bank statement PDF and extract transactions
export const importPdfTransactions = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('Import PDF request received');
    console.log('Request file:', req.file);
    console.log('Request body:', req.body);
    
    if (!req.file) {
      console.log('No file found in request');
      res.status(400).json({
        success: false,
        message: 'No PDF file uploaded'
      });
      return;
    }

    console.log('Processing file:', {
      filename: req.file.filename,
      path: req.file.path,
      size: req.file.size,
      mimetype: req.file.mimetype
    });

    const dataBuffer = fs.readFileSync(req.file.path);
    const data = await pdf(dataBuffer);
    
    // Parse the PDF text to extract transactions
    const transactions = parseTransactionData(data.text);
    
    // Clean up uploaded file
    fs.unlinkSync(req.file.path);

    if (transactions.length === 0) {
      res.status(400).json({
        success: false,
        message: 'No transactions found in the PDF. Please ensure it\'s a valid bank statement.'
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: `Found ${transactions.length} transactions`,
      data: transactions
    });

  } catch (error) {
    console.error('Error in importPdfTransactions:', error);
    
    // Clean up file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({
      success: false,
      message: 'Error processing PDF file',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Save parsed transactions to database
export const saveImportedTransactions = async (req: Request, res: Response): Promise<void> => {
  try {
    const { transactions } = req.body;

    if (!transactions || !Array.isArray(transactions)) {
      res.status(400).json({
        success: false,
        message: 'Invalid transactions data'
      });
      return;
    }

    const savedTransactions = [];
    const errors = [];

    for (const transaction of transactions) {
      try {
        // Validate transaction data
        if (!transaction.date || !transaction.amount || !transaction.type) {
          errors.push(`Invalid transaction data: ${JSON.stringify(transaction)}`);
          continue;
        }

        // Create expense record
        const expense = new Expense({
          category: transaction.category || (transaction.type === 'income' ? 'Salary' : 'Other'),
          amount: Math.abs(transaction.amount),
          date: new Date(transaction.date),
          note: transaction.description || 'Imported from PDF',
          type: transaction.type,
          paymentMethod: 'digital'
        });

        const savedExpense = await expense.save();
        savedTransactions.push(savedExpense);

        // Update cash wallet if it's cash transaction
        if (transaction.type === 'income') {
          await updateCashWallet(Math.abs(transaction.amount), 'add');
        } else {
          await updateCashWallet(Math.abs(transaction.amount), 'subtract');
        }

      } catch (error) {
        errors.push(`Error saving transaction: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    res.status(200).json({
      success: true,
      message: `Successfully imported ${savedTransactions.length} transactions`,
      data: {
        saved: savedTransactions.length,
        errors: errors.length,
        errorDetails: errors
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error saving transactions',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Helper function to parse transaction data from PDF text
function parseTransactionData(text: string): TransactionData[] {
  const transactions: TransactionData[] = [];
  const lines = text.split('\n');
  
  // Common patterns for different bank statement formats
  const patterns = [
    // Pattern 1: DD/MM/YYYY Description Amount CR/DR
    /(\d{1,2}\/\d{1,2}\/\d{4})\s+(.+?)\s+([\d,]+\.?\d*)\s*(CR|DR|CREDIT|DEBIT)?/gi,
    // Pattern 2: YYYY-MM-DD Description Amount +/-
    /(\d{4}-\d{1,2}-\d{1,2})\s+(.+?)\s+([+-]?[\d,]+\.?\d*)/gi,
    // Pattern 3: DD-MM-YYYY Description Amount 
    /(\d{1,2}-\d{1,2}-\d{4})\s+(.+?)\s+([\d,]+\.?\d*)\s*(CR|DR)?/gi
  ];

  for (const line of lines) {
    for (const pattern of patterns) {
      pattern.lastIndex = 0; // Reset regex
      const matches = pattern.exec(line);
      
      if (matches) {
        try {
          const dateStr = matches[1];
          const description = matches[2].trim();
          const amountStr = matches[3].replace(/,/g, '');
          const indicator = matches[4];
          
          // Parse date
          let date: Date;
          if (dateStr.includes('/')) {
            const [day, month, year] = dateStr.split('/');
            date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
          } else if (dateStr.includes('-')) {
            if (dateStr.length === 10 && dateStr.indexOf('-') === 4) {
              // YYYY-MM-DD format
              date = new Date(dateStr);
            } else {
              // DD-MM-YYYY format
              const [day, month, year] = dateStr.split('-');
              date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
            }
          } else {
            continue;
          }

          // Parse amount
          let amount = parseFloat(amountStr);
          if (isNaN(amount) || amount === 0) continue;

          // Determine transaction type
          let type: 'income' | 'expense' = 'expense';
          
          if (indicator) {
            type = (indicator.toUpperCase().includes('CR') || indicator.toUpperCase().includes('CREDIT')) ? 'income' : 'expense';
          } else if (amountStr.startsWith('+')) {
            type = 'income';
          } else if (amountStr.startsWith('-')) {
            type = 'expense';
            amount = Math.abs(amount);
          } else {
            // Default logic: larger amounts might be income
            type = amount > 1000 ? 'income' : 'expense';
          }

          // Categorize based on description
          const category = categorizeTransaction(description, type);

          transactions.push({
            date,
            amount,
            description,
            type,
            category
          });
          
        } catch (error) {
          console.error('Error parsing line:', line, error);
        }
      }
    }
  }

  return transactions;
}

// Helper function to categorize transactions based on description
function categorizeTransaction(description: string, type: 'income' | 'expense'): string {
  const desc = description.toLowerCase();
  
  if (type === 'income') {
    if (desc.includes('salary') || desc.includes('sal') || desc.includes('wages')) return 'Salary';
    if (desc.includes('interest') || desc.includes('dividend')) return 'Investment';
    if (desc.includes('refund') || desc.includes('return')) return 'Refund';
    return 'Other Income';
  } else {
    if (desc.includes('food') || desc.includes('restaurant') || desc.includes('cafe') || desc.includes('swiggy') || desc.includes('zomato')) return 'Food';
    if (desc.includes('fuel') || desc.includes('petrol') || desc.includes('gas') || desc.includes('transport') || desc.includes('uber') || desc.includes('ola')) return 'Transportation';
    if (desc.includes('grocery') || desc.includes('supermarket') || desc.includes('mart')) return 'Groceries';
    if (desc.includes('shopping') || desc.includes('amazon') || desc.includes('flipkart')) return 'Shopping';
    if (desc.includes('medical') || desc.includes('hospital') || desc.includes('pharmacy')) return 'Healthcare';
    if (desc.includes('electricity') || desc.includes('water') || desc.includes('gas') || desc.includes('internet') || desc.includes('mobile')) return 'Utilities';
    if (desc.includes('movie') || desc.includes('entertainment') || desc.includes('netflix') || desc.includes('spotify')) return 'Entertainment';
    return 'Other';
  }
}

// Helper function to update cash wallet
async function updateCashWallet(amount: number, operation: 'add' | 'subtract'): Promise<void> {
  try {
    let wallet = await CashWallet.findOne();
    
    if (!wallet) {
      wallet = new CashWallet({
        totalCash: operation === 'add' ? amount : 0,
        transactions: []
      });
    } else {
      if (operation === 'add') {
        wallet.totalCash += amount;
      } else {
        wallet.totalCash = Math.max(0, wallet.totalCash - amount);
      }
    }
    
    await wallet.save();
  } catch (error) {
    console.error('Error updating cash wallet:', error);
  }
}
