import express from 'express';
import {
  getCategories,
  createCategory,
  deleteCategory
} from '../controllers/categoryController';

const router = express.Router();

// @route   GET /api/categories
// @desc    Get all categories
// @access  Public
router.get('/', getCategories);

// @route   POST /api/categories
// @desc    Create new category
// @access  Public
router.post('/', createCategory);

// @route   DELETE /api/categories/:id
// @desc    Delete category
// @access  Public
router.delete('/:id', deleteCategory);

export default router;
