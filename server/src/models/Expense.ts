import mongoose, { Document, Schema } from 'mongoose';

export interface IExpense extends Document {
  category: string;
  amount: number;
  date: Date;
  note: string;
  createdAt: Date;
  updatedAt: Date;
}

const ExpenseSchema: Schema = new Schema({
  category: {
    type: String,
    required: [true, 'Category is required'],
    trim: true
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0.01, 'Amount must be greater than 0']
  },
  date: {
    type: Date,
    required: [true, 'Date is required'],
    default: Date.now
  },
  note: {
    type: String,
    trim: true,
    maxlength: [200, 'Note cannot exceed 200 characters'],
    default: ''
  }
}, {
  timestamps: true
});

// Index for efficient querying by date
ExpenseSchema.index({ date: -1 });
ExpenseSchema.index({ category: 1, date: -1 });

export default mongoose.model<IExpense>('Expense', ExpenseSchema);
