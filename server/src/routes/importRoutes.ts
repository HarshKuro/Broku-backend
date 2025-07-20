import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { importPdfTransactions, saveImportedTransactions } from '../controllers/importController';
import { importPdfBase64 } from '../controllers/importControllerBase64';

const router = express.Router();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    console.log('File upload attempt:', { 
      fieldname: file.fieldname, 
      originalname: file.originalname, 
      mimetype: file.mimetype 
    });
    
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      console.error('Invalid file type:', file.mimetype);
      cb(new Error('Only PDF files are allowed'));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Add error handling middleware
const handleMulterError = (err: any, req: any, res: any, next: any) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 10MB.'
      });
    }
    return res.status(400).json({
      success: false,
      message: `Upload error: ${err.message}`
    });
  }
  
  if (err) {
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }
  
  next();
};

// @route   POST /api/import/pdf
// @desc    Upload and parse PDF bank statement
// @access  Public
router.post('/pdf', upload.single('pdfFile'), handleMulterError, importPdfTransactions);

// @route   POST /api/import/test
// @desc    Test endpoint to check file upload without processing
// @access  Public
router.post('/test', (req, res) => {
  console.log('Test endpoint hit');
  console.log('Request headers:', req.headers);
  console.log('Request body keys:', Object.keys(req.body));
  console.log('Request files:', req.files);
  console.log('Request file:', req.file);
  
  res.json({
    success: true,
    message: 'Test endpoint reached',
    headers: req.headers,
    bodyKeys: Object.keys(req.body),
    hasFiles: !!req.files,
    hasFile: !!req.file
  });
});

// @route   POST /api/import/pdf-base64
// @desc    Upload and parse PDF bank statement using base64 encoding
// @access  Public
router.post('/pdf-base64', importPdfBase64);

// @route   POST /api/import/save-transactions
// @desc    Save parsed transactions to database
// @access  Public
router.post('/save-transactions', saveImportedTransactions);

export default router;
