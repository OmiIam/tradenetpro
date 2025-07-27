import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import Database from 'better-sqlite3';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = './uploads/kyc';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = crypto.randomBytes(16).toString('hex');
    const extension = path.extname(file.originalname);
    cb(null, `kyc_${Date.now()}_${uniqueSuffix}${extension}`);
  }
});

const fileFilter = (req: any, file: any, cb: any) => {
  // Check file type
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, and PDF files are allowed.'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: fileFilter
});

// Initialize database connection
let db: Database.Database;

export default function createKYCRoutes(database: Database.Database) {
  db = database;

  // GET /api/kyc/test - Test endpoint for mobile debugging
  router.get('/test', authenticateToken, (req, res) => {
    res.json({
      success: true,
      message: 'KYC endpoint is accessible',
      user: req.user,
      timestamp: new Date().toISOString()
    });
  });

  // POST /api/kyc/upload - Upload KYC document
  router.post('/upload', authenticateToken, upload.single('document'), async (req, res) => {
    try {
      const userId = (req as any).user.userId;
      const { document_type } = req.body;
      const file = req.file;

      if (!file) {
        return res.status(400).json({
          success: false,
          error: 'No file uploaded'
        });
      }

      if (!document_type) {
        // Clean up uploaded file
        fs.unlinkSync(file.path);
        return res.status(400).json({
          success: false,
          error: 'Document type is required'
        });
      }

      // Validate document type
      const validTypes = ['id', 'passport', 'drivers_license', 'utility_bill', 'bank_statement'];
      if (!validTypes.includes(document_type)) {
        fs.unlinkSync(file.path);
        return res.status(400).json({
          success: false,
          error: 'Invalid document type'
        });
      }

      // Check if user already has this document type
      const existingDoc = db.prepare(`
        SELECT id FROM user_documents 
        WHERE user_id = ? AND document_type = ? AND verification_status != 'rejected'
      `).get(userId, document_type);

      if (existingDoc) {
        fs.unlinkSync(file.path);
        return res.status(400).json({
          success: false,
          error: 'Document type already uploaded. Please wait for verification or contact support.'
        });
      }

      // Insert document record
      const insertDoc = db.prepare(`
        INSERT INTO user_documents (
          user_id, document_type, file_path, file_name, file_size, verification_status
        ) VALUES (?, ?, ?, ?, ?, ?)
      `);

      const result = insertDoc.run(
        userId,
        document_type,
        file.path,
        file.originalname,
        file.size,
        'pending'
      );

      // Update user KYC status to under_review if this is their first document
      const userDocs = db.prepare(`
        SELECT COUNT(*) as count FROM user_documents 
        WHERE user_id = ? AND verification_status != 'rejected'
      `).get(userId) as { count: number };

      if (userDocs.count === 1) {
        db.prepare(`
          UPDATE users SET kyc_status = 'under_review' WHERE id = ?
        `).run(userId);
      }

      // Get the created document
      const document = db.prepare(`
        SELECT * FROM user_documents WHERE id = ?
      `).get(result.lastInsertRowid) as any;

      console.log(`KYC document uploaded: User ${userId}, Type: ${document_type}, File: ${file.originalname}`);

      res.json({
        success: true,
        message: 'Document uploaded successfully',
        document: {
          id: document.id,
          document_type: document.document_type,
          file_name: document.file_name,
          file_size: document.file_size,
          verification_status: document.verification_status,
          uploaded_at: document.uploaded_at
        }
      });

    } catch (error) {
      console.error('KYC upload error:', error);
      
      // Clean up file if there was an error
      if (req.file) {
        try {
          fs.unlinkSync(req.file.path);
        } catch (unlinkError) {
          console.error('Error cleaning up file:', unlinkError);
        }
      }

      res.status(500).json({
        success: false,
        error: 'Internal server error during file upload'
      });
    }
  });

  // GET /api/kyc/status - Get user's KYC status and documents
  router.get('/status', authenticateToken, (req, res) => {
    try {
      const userId = (req as any).user.userId;

      // Get user's KYC status
      const user = db.prepare(`
        SELECT kyc_status FROM users WHERE id = ?
      `).get(userId) as { kyc_status: string };

      // Get user's documents
      const documents = db.prepare(`
        SELECT 
          id, document_type, file_name, file_size, verification_status, 
          rejection_reason, uploaded_at, verified_at
        FROM user_documents 
        WHERE user_id = ?
        ORDER BY uploaded_at DESC
      `).all(userId);

      res.json({
        success: true,
        status: user?.kyc_status || 'pending',
        documents: documents || []
      });

    } catch (error) {
      console.error('Error fetching KYC status:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch KYC status'
      });
    }
  });

  // GET /api/kyc/documents - Get all user documents (for admin)
  router.get('/documents', authenticateToken, (req, res) => {
    try {
      const userId = (req as any).user.userId;
      const userRole = (req as any).user.role;

      if (userRole !== 'admin') {
        return res.status(403).json({
          success: false,
          error: 'Access denied'
        });
      }

      const documents = db.prepare(`
        SELECT 
          ud.*,
          u.email as user_email,
          u.first_name,
          u.last_name
        FROM user_documents ud
        JOIN users u ON ud.user_id = u.id
        ORDER BY ud.uploaded_at DESC
      `).all();

      res.json({
        success: true,
        documents
      });

    } catch (error) {
      console.error('Error fetching all documents:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch documents'
      });
    }
  });

  // POST /api/kyc/verify/:documentId - Verify or reject a document (admin only)
  router.post('/verify/:documentId', authenticateToken, (req, res) => {
    try {
      const adminId = (req as any).user.id;
      const adminRole = (req as any).user.role;
      const documentId = parseInt(req.params.documentId);
      const { status, comments } = req.body;

      if (adminRole !== 'admin') {
        return res.status(403).json({
          success: false,
          error: 'Access denied'
        });
      }

      if (!['approved', 'rejected'].includes(status)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid status. Must be "approved" or "rejected"'
        });
      }

      // Update document status
      const updateDoc = db.prepare(`
        UPDATE user_documents 
        SET verification_status = ?, rejection_reason = ?, verified_at = CURRENT_TIMESTAMP, verified_by = ?
        WHERE id = ?
      `);

      const result = updateDoc.run(
        status,
        status === 'rejected' ? comments : null,
        adminId,
        documentId
      );

      if (result.changes === 0) {
        return res.status(404).json({
          success: false,
          error: 'Document not found'
        });
      }

      // Get document info to update user KYC status
      const document = db.prepare(`
        SELECT user_id, document_type FROM user_documents WHERE id = ?
      `).get(documentId) as { user_id: number; document_type: string };

      if (document) {
        // Check if user has all required documents approved
        const requiredDocs = ['passport', 'utility_bill'];
        const approvedDocs = db.prepare(`
          SELECT document_type FROM user_documents 
          WHERE user_id = ? AND verification_status = 'approved'
        `).all(document.user_id) as { document_type: string }[];

        const approvedTypes = approvedDocs.map(doc => doc.document_type);
        const hasAllRequired = requiredDocs.every(type => approvedTypes.includes(type));

        // Update user KYC status
        let newKycStatus = 'under_review';
        if (hasAllRequired) {
          newKycStatus = 'approved';
        } else {
          // Check if any required documents are rejected
          const rejectedDocs = db.prepare(`
            SELECT document_type FROM user_documents 
            WHERE user_id = ? AND verification_status = 'rejected' AND document_type IN (${requiredDocs.map(() => '?').join(',')})
          `).all(document.user_id, ...requiredDocs) as { document_type: string }[];

          if (rejectedDocs.length > 0) {
            newKycStatus = 'rejected';
          }
        }

        db.prepare(`
          UPDATE users SET kyc_status = ? WHERE id = ?
        `).run(newKycStatus, document.user_id);
      }

      console.log(`Document ${documentId} ${status} by admin ${adminId}`);

      res.json({
        success: true,
        message: `Document ${status} successfully`
      });

    } catch (error) {
      console.error('Error verifying document:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to verify document'
      });
    }
  });

  // GET /api/kyc/download/:documentId - Download document file (admin only)
  router.get('/download/:documentId', authenticateToken, (req, res) => {
    try {
      const userRole = (req as any).user.role;
      const documentId = parseInt(req.params.documentId);

      if (userRole !== 'admin') {
        return res.status(403).json({
          success: false,
          error: 'Access denied'
        });
      }

      const document = db.prepare(`
        SELECT file_path, file_name FROM user_documents WHERE id = ?
      `).get(documentId) as { file_path: string; file_name: string };

      if (!document) {
        return res.status(404).json({
          success: false,
          error: 'Document not found'
        });
      }

      if (!fs.existsSync(document.file_path)) {
        return res.status(404).json({
          success: false,
          error: 'File not found on server'
        });
      }

      res.download(document.file_path, document.file_name);

    } catch (error) {
      console.error('Error downloading document:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to download document'
      });
    }
  });

  return router;
}