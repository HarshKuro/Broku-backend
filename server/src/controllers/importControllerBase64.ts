import { Request, Response } from 'express';
import pdf from 'pdf-parse';
import fs from 'fs';
import path from 'path';
import Expense from '../models/Expense';
import CashWallet from '../models/CashWallet';

// Local type for parsed transactions
interface ParsedTransactionData {
  date: Date;
  amount: number;
  description: string;
  type: 'income' | 'expense';
  category?: string;
}

export interface TransactionData {
  date: Date;
  amount: number;
  description: string;
  type: 'income' | 'expense';
  category?: string;
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

// Function to parse transaction data from PDF text
function parseTransactionData(text: string): ParsedTransactionData[] {
  const transactions: ParsedTransactionData[] = [];
  const lines = text.split('\n');
  const patterns = [
    /^([A-Za-z]{3} \d{1,2}, \d{4}) (\d{1,2}:\d{2} (?:am|pm))\s+(.+?)\s+(DEBIT|CREDIT)\s+₹([\d,]+\.?\d*)$/i,
    /(\d{1,2}\/\d{1,2}\/\d{4})\s+(.+?)\s+([\d,]+\.?\d*)\s*(CR|DR|CREDIT|DEBIT)?\s*$/gi,
    /(\d{1,2}-\d{1,2}-\d{4})\s+(.+?)\s+([\d,]+\.?\d*)\s*(CR|DR|CREDIT|DEBIT)?\s*$/gi,
    /(\d{4}-\d{1,2}-\d{1,2})\s+(.+?)\s+([+-]?[\d,]+\.?\d*)\s*$/gi,
    /(\d{1,2}\/\d{1,2}\/\d{4})\s+(\d{1,2}:\d{2}:\d{2})\s+(.+?)\s+(₹\s*[\d,]+\.?\d*)\s*(Sent|Received|Paid|Added)?\s*$/gi,
    /(\d{1,2}[\/-]\d{1,2}[\/-]\d{4})\s+(.+?)\s*₹\s*([\d,]+\.?\d*)\s*(CR|DR|CREDIT|DEBIT|Sent|Received)?\s*$/gi,
    /(\d{1,2}[\/-]\d{1,2}[\/-]\d{4})\s+(.+?)\s+([\d,]+\.?\d*)\s*$/gi,
    /(\d{1,2}[\/-]\d{1,2}[\/-]\d{4})\s+(.+?)\s+([\d,]+\.?\d*)\s+[A-Z0-9]{10,}\s*$/gi
  ];
  
  console.log('Processing', lines.length, 'lines for transaction extraction');
  console.log('First 20 lines for debugging:', lines.slice(0, 20));
  
  let i = 0;
  while (i < lines.length) {
    const dateLine = lines[i].trim();
    console.log(`Processing line ${i}: "${dateLine}"`);
    
    // Enhanced PhonePe format detection - look for table-style layout
    // Pattern: Date | Transaction Details | Type | Amount
    // Also handle: DEBIT₹30Paid to JOGI SUPER STORE format
    const tableRowMatch = /^([A-Za-z]{3} \d{1,2}, \d{4})\s+(.+?)\s+(DEBIT|CREDIT)\s+₹([\d,]+\.?\d*)$/i.exec(dateLine);
    const phonepeRowMatch = /^(DEBIT|CREDIT)₹([\d,]+\.?\d*)(.+)$/i.exec(dateLine);
    
    if (tableRowMatch) {
      console.log('Found table row match:', tableRowMatch);
      const dateStr = tableRowMatch[1];
      const description = tableRowMatch[2].trim();
      const indicator = tableRowMatch[3];
      const amountStr = tableRowMatch[4].replace(/,/g, '');
      
      const date = new Date(dateStr);
      let type: 'income' | 'expense' = indicator === 'CREDIT' ? 'income' : 'expense';
      let amount = parseFloat(amountStr);
      
      if (!isNaN(amount) && amount > 0) {
        const category = categorizeTransaction(description, type);
        transactions.push({ date, amount, description, type, category });
        console.log('Successfully parsed table row transaction:', { 
          date: date.toISOString(), 
          amount, 
          description, 
          type, 
          category 
        });
      }
      i++;
      continue;
    }
    
    // Handle standalone PhonePe transaction lines (when we have date context from previous lines)
    if (phonepeRowMatch && i > 0) {
      console.log('Found PhonePe row match:', phonepeRowMatch);
      const indicator = phonepeRowMatch[1];
      const amountStr = phonepeRowMatch[2].replace(/,/g, '');
      const description = phonepeRowMatch[3].trim();
      
      // Look back for the most recent date
      let recentDate = null;
      for (let k = i - 1; k >= Math.max(0, i - 10); k--) {
        const prevLine = lines[k].trim();
        const prevDateMatch = /^([A-Za-z]{3} \d{1,2}, \d{4})$/.exec(prevLine);
        if (prevDateMatch) {
          recentDate = new Date(prevDateMatch[1]);
          break;
        }
      }
      
      if (recentDate) {
        let type: 'income' | 'expense' = indicator === 'CREDIT' ? 'income' : 'expense';
        let amount = parseFloat(amountStr);
        
        if (!isNaN(amount) && amount > 0) {
          const category = categorizeTransaction(description, type);
          transactions.push({ date: recentDate, amount, description, type, category });
          console.log('Successfully parsed standalone PhonePe transaction:', { 
            date: recentDate.toISOString(), 
            amount, 
            description, 
            type, 
            category 
          });
        }
      }
      i++;
      continue;
    }
    
    // Match date line: e.g. Jul 20, 2025
    const dateMatch = /^([A-Za-z]{3} \d{1,2}, \d{4})$/.exec(dateLine);
    
    if (dateMatch && i + 1 < lines.length) {
      console.log('Found date match:', dateMatch[1]);
      
      // Look ahead for transaction details and amount in the next few lines
      let foundTransaction = false;
      
      // Check next line for time - handle both "08:05 pm" and "0805 pm" formats
      const nextLine = lines[i + 1].trim();
      const timeMatch = /^([0-9]{1,2}:?[0-9]{2} ?(?:am|pm))$/i.exec(nextLine);
      
      if (timeMatch && i + 2 < lines.length) {
        console.log('Found time match:', timeMatch[1]);
        
        // Look for transaction details and amount in subsequent lines
        for (let j = i + 2; j < Math.min(i + 8, lines.length); j++) {
          const checkLine = lines[j].trim();
          console.log(`Checking line ${j}: "${checkLine}"`);
          
          // Enhanced pattern to match PhonePe format: DEBIT₹30Paid to JOGI SUPER STORE
          const transactionMatch = /^(DEBIT|CREDIT)₹([\d,]+\.?\d*)(.+)$/i.exec(checkLine);
          
          if (transactionMatch) {
            console.log('Found PhonePe transaction match:', transactionMatch);
            const indicator = transactionMatch[1];
            const amountStr = transactionMatch[2].replace(/,/g, '');
            const description = transactionMatch[3].trim();
            
            const dateStr = dateMatch[1];
            const timeStr = timeMatch[1];
            // Normalize time format - add colon if missing
            const normalizedTime = timeStr.includes(':') ? timeStr : timeStr.replace(/(\d{2})(\d{2})/, '$1:$2');
            const fullDateStr = `${dateStr} ${normalizedTime}`;
            const date = new Date(fullDateStr);
            let type: 'income' | 'expense' = indicator === 'CREDIT' ? 'income' : 'expense';
            let amount = parseFloat(amountStr);
            
            if (!isNaN(amount) && amount > 0) {
              const category = categorizeTransaction(description, type);
              transactions.push({ date, amount, description, type, category });
              console.log('Successfully parsed PhonePe multiline transaction:', { 
                date: date.toISOString(), 
                amount, 
                description, 
                type, 
                category 
              });
              foundTransaction = true;
              i = j + 1;
              break;
            }
          }
          
          // Also try the original pattern for backwards compatibility
          const legacyTransactionMatch = /^(.+?)\s+(DEBIT|CREDIT)\s+₹([\d,]+\.?\d*)$/i.exec(checkLine);
          
          if (legacyTransactionMatch) {
            console.log('Found legacy transaction match:', legacyTransactionMatch);
            const description = legacyTransactionMatch[1].trim();
            const indicator = legacyTransactionMatch[2];
            const amountStr = legacyTransactionMatch[3].replace(/,/g, '');
            
            const dateStr = dateMatch[1];
            const timeStr = timeMatch[1];
            const normalizedTime = timeStr.includes(':') ? timeStr : timeStr.replace(/(\d{2})(\d{2})/, '$1:$2');
            const fullDateStr = `${dateStr} ${normalizedTime}`;
            const date = new Date(fullDateStr);
            let type: 'income' | 'expense' = indicator === 'CREDIT' ? 'income' : 'expense';
            let amount = parseFloat(amountStr);
            
            if (!isNaN(amount) && amount > 0) {
              const category = categorizeTransaction(description, type);
              transactions.push({ date, amount, description, type, category });
              console.log('Successfully parsed legacy multiline transaction:', { 
                date: date.toISOString(), 
                amount, 
                description, 
                type, 
                category 
              });
              foundTransaction = true;
              i = j + 1;
              break;
            }
          }
          
          // Alternative: look for separate type and amount lines
          if (checkLine.match(/^(DEBIT|CREDIT)$/i) && j + 1 < lines.length) {
            const amountLine = lines[j + 1].trim();
            const amountMatch = /^₹([\d,]+\.?\d*)$/.exec(amountLine);
            
            if (amountMatch) {
              console.log('Found separate type and amount:', checkLine, amountMatch[1]);
              
              // Look backwards for description
              let description = 'Unknown Transaction';
              for (let k = i + 2; k < j; k++) {
                const descLine = lines[k].trim();
                if (descLine && !descLine.match(/^(Transaction ID|UTR No\.|Paid by)/i)) {
                  description = descLine;
                  break;
                }
              }
              
              const indicator = checkLine;
              const amountStr = amountMatch[1].replace(/,/g, '');
              
              const dateStr = dateMatch[1];
              const timeStr = timeMatch[1];
              const fullDateStr = `${dateStr} ${timeStr}`;
              const date = new Date(fullDateStr);
              let type: 'income' | 'expense' = indicator === 'CREDIT' ? 'income' : 'expense';
              let amount = parseFloat(amountStr);
              
              if (!isNaN(amount) && amount > 0) {
                const category = categorizeTransaction(description, type);
                transactions.push({ date, amount, description, type, category });
                console.log('Successfully parsed separate lines transaction:', { 
                  date: date.toISOString(), 
                  amount, 
                  description, 
                  type, 
                  category 
                });
                foundTransaction = true;
                i = j + 2;
                break;
              }
            }
          }
        }
      }
      
      if (!foundTransaction) {
        i++;
      }
      continue;
    }
    
    // Process single-line patterns
    const line = lines[i].trim();
    if (!line || line.length < 10) { 
      i++; 
      continue; 
    }
    
    for (let patternIndex = 0; patternIndex < patterns.length; patternIndex++) {
      const pattern = patterns[patternIndex];
      pattern.lastIndex = 0;
      const matches = pattern.exec(line);
      
      if (matches) {
        try {
          let date: Date;
          let description = '';
          let amountStr = '';
          let indicator = '';
          
          if (patternIndex === 0) {
            // Already handled above in multiline processing
            break;
          } else {
            const dateStr = matches[1];
            description = matches[2] || matches[3];
            
            if (patternIndex === 4) {
              amountStr = matches[4].replace(/₹\s*/, '').replace(/,/g, '');
              indicator = matches[5] || '';
              if (matches[2]) {
                description = `${description} (${matches[2]})`;
              }
            } else {
              amountStr = matches[3].replace(/₹\s*/, '').replace(/,/g, '');
              indicator = matches[4] || '';
            }
            
            description = description.trim();
            
            // Parse date
            if (dateStr.includes('/')) {
              const [day, month, year] = dateStr.split('/');
              date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
            } else if (dateStr.includes('-')) {
              if (dateStr.length === 10 && dateStr.indexOf('-') === 4) {
                date = new Date(dateStr);
              } else {
                const [day, month, year] = dateStr.split('-');
                date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
              }
            } else {
              i++;
              continue;
            }
            
            let amount = parseFloat(amountStr);
            if (isNaN(amount) || amount === 0) { 
              i++; 
              continue; 
            }
            
            // Determine transaction type
            let type: 'income' | 'expense' = 'expense';
            if (indicator) {
              const indUpper = indicator.toUpperCase();
              if (indUpper.includes('CR') || indUpper.includes('CREDIT') || 
                  indUpper.includes('RECEIVED') || indUpper.includes('ADDED')) {
                type = 'income';
              } else {
                type = 'expense';
              }
            } else if (amountStr.startsWith('+')) {
              type = 'income';
            } else if (amountStr.startsWith('-')) {
              type = 'expense';
              amount = Math.abs(amount);
            } else {
              const descLower = description.toLowerCase();
              if (descLower.includes('salary') || descLower.includes('credit') || 
                  descLower.includes('refund') || descLower.includes('cashback') ||
                  descLower.includes('interest') || amount > 5000) {
                type = 'income';
              } else {
                type = 'expense';
              }
            }
            
            const category = categorizeTransaction(description, type);
            transactions.push({ date, amount, description, type, category });
            break;
          }
        } catch (error) {
          console.error('Error parsing line:', line, error);
        }
      }
    }
    i++;
  }
  
  console.log('Total transactions found:', transactions.length);
  return transactions;
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

// Alternative import method using base64 encoded PDF data
export const importPdfBase64 = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('Import PDF base64 request received');
    const { pdfData, fileName } = req.body;
    
    if (!pdfData) {
      res.status(400).json({
        success: false,
        message: 'No PDF data provided'
      });
      return;
    }

    // Decode base64 PDF data
    const buffer = Buffer.from(pdfData, 'base64');
    const data = await pdf(buffer);
    
    // Parse the PDF text to extract transactions
    const transactions = parseTransactionData(data.text);

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
    console.error('Error in importPdfBase64:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing PDF file',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Parse bank statement PDF and extract transactions (original multer version)
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