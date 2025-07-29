import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import Database from 'better-sqlite3';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { KYCModel, CreateKYCDocumentData } from '../models/KYC';
import { AdminNotificationsModel } from '../models/AdminNotifications';

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
let kycModel: KYCModel;
let adminNotificationsModel: AdminNotificationsModel;

export default function createKYCRoutes(database: Database.Database) {
  db = database;
  kycModel = new KYCModel(database);
  adminNotificationsModel = new AdminNotificationsModel(database);

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

      console.log(`[KYC UPLOAD] User ${userId} uploading ${document_type}, file:`, file?.originalname);

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

      // Validate document type using model
      if (!kycModel.isValidDocumentType(document_type)) {
        fs.unlinkSync(file.path);
        return res.status(400).json({
          success: false,
          error: 'Invalid document type'
        });
      }

      // Check if user already has this document type
      if (kycModel.hasDocumentType(userId, document_type)) {
        fs.unlinkSync(file.path);
        return res.status(400).json({
          success: false,
          error: 'Document type already uploaded. Please wait for verification or contact support.'
        });
      }

      // Create document using model
      const documentData: CreateKYCDocumentData = {
        user_id: userId,
        document_type: document_type as any,
        file_path: file.path,
        file_name: file.originalname,
        file_size: file.size
      };

      const document = kycModel.createDocument(documentData);

      // Get user info for notification
      const user = db.prepare('SELECT first_name, last_name, email FROM users WHERE id = ?').get(userId) as any;
      
      // Create admin notification
      if (user) {
        adminNotificationsModel.createKycSubmissionNotification(
          userId, 
          document_type
        );
      }

      console.log(`[KYC UPLOAD SUCCESS] User ${userId}, Document ID: ${document.id}, Type: ${document_type}`);

      res.json({
        success: true,
        message: 'Document uploaded successfully and is now pending review',
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
      console.error('[KYC UPLOAD ERROR]:', error);
      
      // Clean up file if there was an error
      if (req.file) {
        try {
          fs.unlinkSync(req.file.path);
        } catch (unlinkError) {
          console.error('[KYC CLEANUP ERROR]:', unlinkError);
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
      
      console.log(`[KYC STATUS] Getting status for user ${userId}`);

      const kycStatus = kycModel.getUserKYCStatus(userId);

      res.json({
        success: true,
        status: kycStatus.kyc_status,
        documents: kycStatus.documents,
        required_documents: kycStatus.required_documents,
        missing_documents: kycStatus.missing_documents,
        approved_documents: kycStatus.approved_documents,
        rejected_documents: kycStatus.rejected_documents
      });

    } catch (error) {
      console.error('[KYC STATUS ERROR]:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch KYC status'
      });
    }
  });

  // GET /api/kyc/documents - Get all user documents (for admin)
  router.get('/documents', authenticateToken, requireAdmin, (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      const status = req.query.status as string;
      const document_type = req.query.document_type as string;

      console.log(`[KYC ADMIN] Getting documents with filters: status=${status}, type=${document_type}`);

      const documents = kycModel.getAllDocuments(limit, offset, {
        status,
        document_type
      });

      const total = kycModel.getDocumentCount({
        status,
        document_type
      });

      res.json({
        success: true,
        documents,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total
        }
      });

    } catch (error) {
      console.error('[KYC ADMIN DOCUMENTS ERROR]:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch documents'
      });
    }
  });

  // POST /api/kyc/verify/:documentId - Verify or reject a document (admin only)
  router.post('/verify/:documentId', authenticateToken, requireAdmin, (req, res) => {
    try {
      const adminId = (req as any).user.userId;
      const documentId = parseInt(req.params.documentId);
      const { status, comments } = req.body;

      console.log(`[KYC VERIFY] Admin ${adminId} ${status} document ${documentId}`);

      if (!['approved', 'rejected'].includes(status)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid status. Must be "approved" or "rejected"'
        });
      }

      // Get document info before verification
      const document = kycModel.getDocumentById(documentId);
      if (!document) {
        return res.status(404).json({
          success: false,
          error: 'Document not found'
        });
      }

      // Verify document using model
      const success = kycModel.verifyDocument(documentId, status as any, adminId, comments);

      if (!success) {
        return res.status(500).json({
          success: false,
          error: 'Failed to verify document'
        });
      }

      // Create user notification about KYC status change
      const updatedUserStatus = kycModel.getUserKYCStatus(document.user_id);
      
      // Get admin info for notification
      const admin = db.prepare('SELECT first_name, last_name FROM users WHERE id = ?').get(adminId) as any;
      const adminName = admin ? `${admin.first_name} ${admin.last_name}` : 'Admin';

      // Create admin notification for successful verification
      adminNotificationsModel.createNotification({
        title: `KYC Document ${status}`,
        message: `${document.document_type} document ${status} for ${document.user_first_name} ${document.user_last_name}`,
        type: status === 'approved' ? 'success' : 'info',
        category: 'kyc_submission',
        target_user_id: document.user_id,
        metadata: {
          document_id: documentId,
          document_type: document.document_type,
          admin_id: adminId,
          admin_name: adminName,
          new_kyc_status: updatedUserStatus.kyc_status
        }
      });

      console.log(`[KYC VERIFY SUCCESS] Document ${documentId} ${status}, User KYC status: ${updatedUserStatus.kyc_status}`);

      res.json({
        success: true,
        message: `Document ${status} successfully`,
        document: {
          id: documentId,
          status: status,
          user_kyc_status: updatedUserStatus.kyc_status
        }
      });

    } catch (error) {
      console.error('[KYC VERIFY ERROR]:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to verify document'
      });
    }
  });

  // GET /api/kyc/download/:documentId - Download document file (admin only)
  router.get('/download/:documentId', authenticateToken, requireAdmin, (req, res) => {
    try {
      const documentId = parseInt(req.params.documentId);
      
      console.log(`[KYC DOWNLOAD] Admin downloading document ${documentId}`);

      const document = kycModel.getDocumentById(documentId);

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
      console.error('[KYC DOWNLOAD ERROR]:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to download document'
      });
    }
  });

  // GET /api/kyc/stats - Get KYC statistics (admin only)
  router.get('/stats', authenticateToken, requireAdmin, (req, res) => {
    try {
      console.log('[KYC STATS] Getting KYC statistics');

      const stats = kycModel.getKYCStats();

      res.json({
        success: true,
        stats
      });

    } catch (error) {
      console.error('[KYC STATS ERROR]:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch KYC statistics'
      });
    }
  });

  // GET /api/kyc/pending - Get pending documents for admin dashboard (admin only)
  router.get('/pending', authenticateToken, requireAdmin, (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      
      console.log(`[KYC PENDING] Getting ${limit} pending documents`);

      const pendingDocuments = kycModel.getPendingDocuments(limit);

      res.json({
        success: true,
        documents: pendingDocuments,
        count: pendingDocuments.length
      });

    } catch (error) {
      console.error('[KYC PENDING ERROR]:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch pending documents'
      });
    }
  });

  return router;
}