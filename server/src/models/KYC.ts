import Database from 'better-sqlite3';

export interface KYCDocument {
  id: number;
  user_id: number;
  document_type: 'id' | 'passport' | 'drivers_license' | 'utility_bill' | 'bank_statement';
  file_path: string;
  file_name: string;
  file_size: number;
  verification_status: 'pending' | 'approved' | 'rejected' | 'under_review';
  rejection_reason?: string;
  uploaded_at: string;
  verified_at?: string;
  verified_by?: number;
  // Extended fields for admin view
  user_email?: string;
  user_first_name?: string;
  user_last_name?: string;
  verified_by_name?: string;
}

export interface CreateKYCDocumentData {
  user_id: number;
  document_type: 'id' | 'passport' | 'drivers_license' | 'utility_bill' | 'bank_statement';
  file_path: string;
  file_name: string;
  file_size: number;
}

export interface KYCStatus {
  user_id: number;
  kyc_status: 'pending' | 'under_review' | 'approved' | 'rejected';
  documents: KYCDocument[];
  required_documents: string[];
  missing_documents: string[];
  approved_documents: string[];
  rejected_documents: string[];
}

export interface KYCStats {
  total_documents: number;
  pending: number;
  approved: number;
  rejected: number;
  under_review: number;
  users_by_status: {
    pending: number;
    under_review: number;
    approved: number;
    rejected: number;
  };
  recent_submissions: number; // last 24 hours
  processing_time_avg: number; // average days
}

export class KYCModel {
  private db: Database.Database;
  private requiredDocuments = ['passport', 'utility_bill']; // Default required documents

  constructor(database: Database.Database) {
    this.db = database;
  }

  // Get all KYC documents with optional filtering
  getAllDocuments(
    limit: number = 50,
    offset: number = 0,
    filters: {
      status?: string;
      document_type?: string;
      user_id?: number;
    } = {}
  ): KYCDocument[] {
    let query = `
      SELECT 
        ud.*,
        u.email as user_email,
        u.first_name as user_first_name,
        u.last_name as user_last_name,
        admin.first_name as verified_by_first_name,
        admin.last_name as verified_by_last_name
      FROM user_documents ud
      JOIN users u ON ud.user_id = u.id
      LEFT JOIN users admin ON ud.verified_by = admin.id
      WHERE 1=1
    `;

    const params: any[] = [];

    if (filters.status && ['pending', 'approved', 'rejected', 'under_review'].includes(filters.status)) {
      query += ' AND ud.verification_status = ?';
      params.push(filters.status);
    }

    if (filters.document_type) {
      query += ' AND ud.document_type = ?';
      params.push(filters.document_type);
    }

    if (filters.user_id) {
      query += ' AND ud.user_id = ?';
      params.push(filters.user_id);
    }

    query += ' ORDER BY ud.uploaded_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const stmt = this.db.prepare(query);
    const results = stmt.all(...params) as any[];

    return results.map(row => ({
      ...row,
      verified_by_name: row.verified_by_first_name && row.verified_by_last_name 
        ? `${row.verified_by_first_name} ${row.verified_by_last_name}` 
        : null
    }));
  }

  // Get document by ID
  getDocumentById(id: number): KYCDocument | null {
    const stmt = this.db.prepare(`
      SELECT 
        ud.*,
        u.email as user_email,
        u.first_name as user_first_name,
        u.last_name as user_last_name,
        admin.first_name as verified_by_first_name,
        admin.last_name as verified_by_last_name
      FROM user_documents ud
      JOIN users u ON ud.user_id = u.id
      LEFT JOIN users admin ON ud.verified_by = admin.id
      WHERE ud.id = ?
    `);

    const result = stmt.get(id) as any;
    if (!result) return null;

    return {
      ...result,
      verified_by_name: result.verified_by_first_name && result.verified_by_last_name 
        ? `${result.verified_by_first_name} ${result.verified_by_last_name}` 
        : null
    };
  }

  // Get user's KYC status and documents
  getUserKYCStatus(userId: number): KYCStatus {
    // Get user's current KYC status
    const userResult = this.db.prepare('SELECT kyc_status FROM users WHERE id = ?').get(userId) as { kyc_status: string } | undefined;
    const kycStatus = userResult?.kyc_status || 'pending';

    // Get user's documents
    const documents = this.db.prepare(`
      SELECT 
        id, document_type, file_name, file_size, verification_status, 
        rejection_reason, uploaded_at, verified_at
      FROM user_documents 
      WHERE user_id = ?
      ORDER BY uploaded_at DESC
    `).all(userId) as KYCDocument[];

    // Analyze document status
    const submittedTypes = documents.map(doc => doc.document_type);
    const approvedDocuments = documents.filter(doc => doc.verification_status === 'approved').map(doc => doc.document_type);
    const rejectedDocuments = documents.filter(doc => doc.verification_status === 'rejected').map(doc => doc.document_type);
    const missingDocuments = this.requiredDocuments.filter(type => !submittedTypes.includes(type as any));

    return {
      user_id: userId,
      kyc_status: kycStatus as any,
      documents,
      required_documents: this.requiredDocuments,
      missing_documents: missingDocuments,
      approved_documents: approvedDocuments,
      rejected_documents: rejectedDocuments
    };
  }

  // Create new KYC document
  createDocument(data: CreateKYCDocumentData): KYCDocument {
    const stmt = this.db.prepare(`
      INSERT INTO user_documents (
        user_id, document_type, file_path, file_name, file_size, verification_status
      ) VALUES (?, ?, ?, ?, ?, 'pending')
    `);

    const result = stmt.run(
      data.user_id,
      data.document_type,
      data.file_path,
      data.file_name,
      data.file_size
    );

    // Update user KYC status to under_review if this is their first document
    const userDocs = this.db.prepare(`
      SELECT COUNT(*) as count FROM user_documents 
      WHERE user_id = ? AND verification_status != 'rejected'
    `).get(data.user_id) as { count: number };

    if (userDocs.count === 1) {
      this.db.prepare('UPDATE users SET kyc_status = ? WHERE id = ?').run('under_review', data.user_id);
    }

    return this.getDocumentById(result.lastInsertRowid as number)!;
  }

  // Verify or reject a document
  verifyDocument(documentId: number, status: 'approved' | 'rejected', adminId: number, comments?: string): boolean {
    // Update document status
    const updateDoc = this.db.prepare(`
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
      return false;
    }

    // Get document info to update user KYC status
    const document = this.db.prepare('SELECT user_id FROM user_documents WHERE id = ?').get(documentId) as { user_id: number } | undefined;
    
    if (document) {
      this.updateUserKYCStatus(document.user_id);
    }

    return true;
  }

  // Update user's overall KYC status based on document statuses
  private updateUserKYCStatus(userId: number): void {
    const approvedDocs = this.db.prepare(`
      SELECT document_type FROM user_documents 
      WHERE user_id = ? AND verification_status = 'approved'
    `).all(userId) as { document_type: string }[];

    const rejectedDocs = this.db.prepare(`
      SELECT document_type FROM user_documents 
      WHERE user_id = ? AND verification_status = 'rejected' AND document_type IN (${this.requiredDocuments.map(() => '?').join(',')})
    `).all(userId, ...this.requiredDocuments) as { document_type: string }[];

    const approvedTypes = approvedDocs.map(doc => doc.document_type);
    const hasAllRequired = this.requiredDocuments.every(type => approvedTypes.includes(type));

    let newKycStatus = 'under_review';
    if (hasAllRequired) {
      newKycStatus = 'approved';
    } else if (rejectedDocs.length > 0) {
      newKycStatus = 'rejected';
    }

    this.db.prepare('UPDATE users SET kyc_status = ? WHERE id = ?').run(newKycStatus, userId);
  }

  // Check if user has existing document of type
  hasDocumentType(userId: number, documentType: string): boolean {
    const result = this.db.prepare(`
      SELECT id FROM user_documents 
      WHERE user_id = ? AND document_type = ? AND verification_status != 'rejected'
    `).get(userId, documentType);

    return !!result;
  }

  // Get KYC statistics
  getKYCStats(): KYCStats {
    // Document statistics
    const totalDocs = this.db.prepare('SELECT COUNT(*) as count FROM user_documents').get() as { count: number };
    const pendingDocs = this.db.prepare('SELECT COUNT(*) as count FROM user_documents WHERE verification_status = ?').get('pending') as { count: number };
    const approvedDocs = this.db.prepare('SELECT COUNT(*) as count FROM user_documents WHERE verification_status = ?').get('approved') as { count: number };
    const rejectedDocs = this.db.prepare('SELECT COUNT(*) as count FROM user_documents WHERE verification_status = ?').get('rejected') as { count: number };
    const underReviewDocs = this.db.prepare('SELECT COUNT(*) as count FROM user_documents WHERE verification_status = ?').get('under_review') as { count: number };

    // User KYC status statistics
    const userStats = this.db.prepare(`
      SELECT 
        kyc_status,
        COUNT(*) as count
      FROM users
      GROUP BY kyc_status
    `).all() as { kyc_status: string; count: number }[];

    const usersByStatus = userStats.reduce((acc, stat) => {
      acc[stat.kyc_status] = stat.count;
      return acc;
    }, {} as Record<string, number>);

    // Recent submissions (last 24 hours)
    const recentSubmissions = this.db.prepare(`
      SELECT COUNT(*) as count 
      FROM user_documents 
      WHERE uploaded_at >= datetime('now', '-1 day')
    `).get() as { count: number };

    // Average processing time (simplified - days between upload and verification)
    const avgProcessingTime = this.db.prepare(`
      SELECT AVG(julianday(verified_at) - julianday(uploaded_at)) as avg_days
      FROM user_documents 
      WHERE verified_at IS NOT NULL
    `).get() as { avg_days: number | null };

    return {
      total_documents: totalDocs.count,
      pending: pendingDocs.count,
      approved: approvedDocs.count,
      rejected: rejectedDocs.count,
      under_review: underReviewDocs.count,
      users_by_status: {
        pending: usersByStatus.pending || 0,
        under_review: usersByStatus.under_review || 0,
        approved: usersByStatus.approved || 0,
        rejected: usersByStatus.rejected || 0
      },
      recent_submissions: recentSubmissions.count,
      processing_time_avg: Math.round(avgProcessingTime.avg_days || 0)
    };
  }

  // Get document count with filters
  getDocumentCount(filters: {
    status?: string;
    document_type?: string;
    user_id?: number;
  } = {}): number {
    let query = 'SELECT COUNT(*) as count FROM user_documents WHERE 1=1';
    const params: any[] = [];

    if (filters.status && ['pending', 'approved', 'rejected', 'under_review'].includes(filters.status)) {
      query += ' AND verification_status = ?';
      params.push(filters.status);
    }

    if (filters.document_type) {
      query += ' AND document_type = ?';
      params.push(filters.document_type);
    }

    if (filters.user_id) {
      query += ' AND user_id = ?';
      params.push(filters.user_id);
    }

    const stmt = this.db.prepare(query);
    const result = stmt.get(...params) as { count: number };
    return result.count;
  }

  // Delete document (cleanup)
  deleteDocument(documentId: number): boolean {
    const stmt = this.db.prepare('DELETE FROM user_documents WHERE id = ?');
    const result = stmt.run(documentId);
    return result.changes > 0;
  }

  // Get documents pending review (for admin dashboard)
  getPendingDocuments(limit: number = 10): KYCDocument[] {
    return this.getAllDocuments(limit, 0, { status: 'pending' });
  }

  // Validate document type
  isValidDocumentType(type: string): type is 'id' | 'passport' | 'drivers_license' | 'utility_bill' | 'bank_statement' {
    const validTypes: Array<'id' | 'passport' | 'drivers_license' | 'utility_bill' | 'bank_statement'> = ['id', 'passport', 'drivers_license', 'utility_bill', 'bank_statement'];
    return validTypes.includes(type as any);
  }

  // Set required documents (configurable)
  setRequiredDocuments(documents: string[]): void {
    this.requiredDocuments = documents.filter(doc => this.isValidDocumentType(doc));
  }

  // Get required documents
  getRequiredDocuments(): string[] {
    return [...this.requiredDocuments];
  }
}

export default KYCModel;