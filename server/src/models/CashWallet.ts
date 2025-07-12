import mongoose, { Document, Schema } from 'mongoose';

export interface ICashWallet extends Document {
  totalCash: number;
  transactions: ICashTransaction[];
  createdAt: Date;
  updatedAt: Date;
  addCash(amount: number, description?: string): Promise<ICashWallet>;
  spendCash(amount: number, description: string, relatedExpenseId?: string): Promise<ICashWallet>;
  withdrawCash(amount: number, description?: string): Promise<ICashWallet>;
}

export interface ICashTransaction {
  _id?: mongoose.Types.ObjectId;
  type: 'add' | 'spend' | 'withdraw';
  amount: number;
  description: string;
  date: Date;
  relatedExpenseId?: string; // Link to expense if cash was used for an expense
}

const CashTransactionSchema = new Schema({
  type: {
    type: String,
    enum: ['add', 'spend', 'withdraw'],
    required: [true, 'Transaction type is required']
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0.01, 'Amount must be greater than 0']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    maxlength: [200, 'Description cannot exceed 200 characters']
  },
  date: {
    type: Date,
    required: [true, 'Date is required'],
    default: Date.now
  },
  relatedExpenseId: {
    type: Schema.Types.ObjectId,
    ref: 'Expense',
    required: false
  }
}, {
  _id: true
});

const CashWalletSchema: Schema = new Schema({
  totalCash: {
    type: Number,
    required: [true, 'Total cash amount is required'],
    min: [0, 'Total cash cannot be negative'],
    default: 0
  },
  transactions: [CashTransactionSchema]
}, {
  timestamps: true
});

// Virtual to calculate current balance from transactions
CashWalletSchema.virtual('currentBalance').get(function(this: ICashWallet) {
  return this.transactions.reduce((balance: number, transaction: ICashTransaction) => {
    switch (transaction.type) {
      case 'add':
        return balance + transaction.amount;
      case 'spend':
      case 'withdraw':
        return balance - transaction.amount;
      default:
        return balance;
    }
  }, 0);
});

// Method to add cash
CashWalletSchema.methods.addCash = function(amount: number, description: string = 'Cash added to wallet') {
  this.transactions.push({
    type: 'add',
    amount,
    description,
    date: new Date()
  });
  this.totalCash += amount;
  return this.save();
};

// Method to spend cash
CashWalletSchema.methods.spendCash = function(amount: number, description: string, relatedExpenseId?: string) {
  if (this.totalCash < amount) {
    throw new Error('Insufficient cash balance');
  }
  
  this.transactions.push({
    type: 'spend',
    amount,
    description,
    date: new Date(),
    relatedExpenseId
  });
  this.totalCash -= amount;
  return this.save();
};

// Method to withdraw cash
CashWalletSchema.methods.withdrawCash = function(amount: number, description: string = 'Cash withdrawn from wallet') {
  if (this.totalCash < amount) {
    throw new Error('Insufficient cash balance');
  }
  
  this.transactions.push({
    type: 'withdraw',
    amount,
    description,
    date: new Date()
  });
  this.totalCash -= amount;
  return this.save();
};

export default mongoose.model<ICashWallet>('CashWallet', CashWalletSchema);
