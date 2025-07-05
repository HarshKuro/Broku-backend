import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Category from '../models/Category';
import connectDB from '../config/db';

// Load environment variables
dotenv.config();

const defaultCategories = [
  'Food',
  'Transportation',
  'Entertainment',
  'Shopping',
  'Bills',
  'Healthcare',
  'Education',
  'Travel',
  'Groceries',
  'Gym',
  'Music',
  'Dinner',
  'Coffee',
  'Gas',
  'Rent',
  'Other'
];

const seedCategories = async () => {
  try {
    await connectDB();
    
    console.log('Seeding categories...');
    
    // Clear existing categories (optional)
    // await Category.deleteMany({});
    
    // Insert default categories if they don't exist
    for (const categoryName of defaultCategories) {
      const existingCategory = await Category.findOne({ 
        name: new RegExp(`^${categoryName}$`, 'i') 
      });
      
      if (!existingCategory) {
        await Category.create({ name: categoryName });
        console.log(`✅ Created category: ${categoryName}`);
      } else {
        console.log(`⏭️  Category already exists: ${categoryName}`);
      }
    }
    
    console.log('✅ Categories seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding categories:', error);
    process.exit(1);
  }
};

seedCategories();
