'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, 
  Download, 
  CheckCircle, 
  XCircle, 
  Clock, 
  User,
  Calendar,
  Eye,
  MessageSquare
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Card, { CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

interface KycDocument {
  id: number;
  user_id: number;
  user_name: string;
  user_email: string;
  document_type: 'passport' | 'drivers_license' | 'national_id' | 'utility_bill';
  document_url: string;
  status: 'pending' | 'approved' | 'rejected' | 'under_review';
  submitted_at: string;
  reviewed_at?: string;
  reviewer_id?: number;
  reviewer_name?: string;
  comments?: string;
}

interface KycVerificationPanelProps {
  documents: KycDocument[];
  onVerifyDocument: (documentId: number, status: 'approved' | 'rejected', comments: string) => Promise<void>;
}

export const KycVerificationPanel: React.FC<KycVerificationPanelProps> = ({
  documents,
  onVerifyDocument
}) => {
  const [selectedDocument, setSelectedDocument] = useState<KycDocument | null>(null);
  const [reviewStatus, setReviewStatus] = useState<'approved' | 'rejected' | null>(null);
  const [comments, setComments] = useState('');
  const [loading, setLoading] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'text-green-400 bg-green-400/10 border-green-400/20';
      case 'rejected':
        return 'text-red-400 bg-red-400/10 border-red-400/20';
      case 'pending':
        return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
      default:
        return 'text-gray-400 bg-gray-400/10 border-gray-400/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-4 h-4" />;
      case 'rejected':
        return <XCircle className="w-4 h-4" />;
      case 'pending':
        return <Clock className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getDocumentTypeLabel = (type: string) => {
    switch (type) {
      case 'passport':
        return 'Passport';
      case 'drivers_license':
        return "Driver's License";
      case 'national_id':
        return 'National ID';
      case 'utility_bill':
        return 'Utility Bill';
      default:
        return 'Document';
    }
  };

  const handleReview = (document: KycDocument) => {
    setSelectedDocument(document);
    setReviewStatus(null);
    setComments('');
  };

  const submitReview = async () => {
    if (!selectedDocument || !reviewStatus) return;

    setLoading(true);
    try {
      await onVerifyDocument(selectedDocument.id, reviewStatus, comments);
      setSelectedDocument(null);
      setReviewStatus(null);
      setComments('');
    } catch (error) {
      console.error('Review submission failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const pendingDocuments = documents.filter(doc => doc.status === 'pending');
  const reviewedDocuments = documents.filter(doc => doc.status !== 'pending');

  return (
    <div className="space-y-6">
      {/* Pending Reviews */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-yellow-400" />
            <span>Pending KYC Reviews ({pendingDocuments.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pendingDocuments.length === 0 ? (
            <p className="text-gray-400 text-center py-8">No pending KYC documents to review</p>
          ) : (
            <div className="space-y-4">
              {pendingDocuments.map((document) => (
                <motion.div
                  key={document.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center justify-between p-4 bg-slate-800/30 rounded-lg border border-slate-700"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center border border-blue-500/20">
                      <FileText className="w-6 h-6 text-blue-400" />
                    </div>
                    
                    <div>
                      <h4 className="text-white font-semibold">{document.user_name}</h4>
                      <p className="text-gray-400 text-sm">{document.user_email}</p>
                      <div className="flex items-center space-x-3 mt-1">
                        <span className="text-blue-400 text-sm">{getDocumentTypeLabel(document.document_type)}</span>
                        <span className="text-gray-500 text-xs">
                          Submitted {new Date(document.submitted_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(document.status)}`}>
                      {getStatusIcon(document.status)}
                      <span className="capitalize">{document.status}</span>
                    </span>

                    <Button
                      size="sm"
                      onClick={() => handleReview(document)}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Review
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Reviews */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Reviews</CardTitle>
        </CardHeader>
        <CardContent>
          {reviewedDocuments.length === 0 ? (
            <p className="text-gray-400 text-center py-8">No reviewed documents</p>
          ) : (
            <div className="space-y-4">
              {reviewedDocuments.slice(0, 10).map((document) => (
                <div
                  key={document.id}
                  className="flex items-center justify-between p-4 bg-slate-800/30 rounded-lg border border-slate-700"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-gray-500/10 rounded-lg flex items-center justify-center border border-gray-500/20">
                      <FileText className="w-5 h-5 text-gray-400" />
                    </div>
                    
                    <div>
                      <h4 className="text-white font-medium">{document.user_name}</h4>
                      <p className="text-gray-400 text-sm">{getDocumentTypeLabel(document.document_type)}</p>
                      {document.reviewed_at && (
                        <p className="text-gray-500 text-xs">
                          Reviewed {new Date(document.reviewed_at).toLocaleDateString()}
                          {document.reviewer_name && ` by ${document.reviewer_name}`}
                        </p>
                      )}
                    </div>
                  </div>

                  <span className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(document.status)}`}>
                    {getStatusIcon(document.status)}
                    <span className="capitalize">{document.status}</span>
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Review Modal */}
      <Modal
        isOpen={!!selectedDocument}
        onClose={() => setSelectedDocument(null)}
        title="Review KYC Document"
      >
        {selectedDocument && (
          <div className="space-y-6">
            {/* User Info */}
            <div className="bg-slate-800 rounded-lg p-4">
              <div className="flex items-center space-x-3 mb-3">
                <User className="w-5 h-5 text-blue-400" />
                <h4 className="text-white font-semibold">User Information</h4>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-400 text-sm">Name</p>
                  <p className="text-white">{selectedDocument.user_name}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Email</p>
                  <p className="text-white">{selectedDocument.user_email}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Document Type</p>
                  <p className="text-white">{getDocumentTypeLabel(selectedDocument.document_type)}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Submitted</p>
                  <p className="text-white">{new Date(selectedDocument.submitted_at).toLocaleString()}</p>
                </div>
              </div>
            </div>

            {/* Document Preview */}
            <div className="bg-slate-800 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-white font-semibold">Document</h4>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => window.open(selectedDocument.document_url, '_blank')}
                >
                  <Download className="w-4 h-4 mr-1" />
                  Download
                </Button>
              </div>
              <div className="bg-slate-900 rounded-lg p-4 text-center">
                <FileText className="w-16 h-16 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-400">Click download to view document</p>
              </div>
            </div>

            {/* Review Actions */}
            <div className="space-y-4">
              <div>
                <label className="text-white font-medium mb-3 block">Review Decision</label>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setReviewStatus('approved')}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-colors ${
                      reviewStatus === 'approved'
                        ? 'bg-green-600 border-green-500 text-white'
                        : 'bg-slate-800 border-slate-600 text-gray-300 hover:border-green-500'
                    }`}
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Approve</span>
                  </button>
                  <button
                    onClick={() => setReviewStatus('rejected')}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-colors ${
                      reviewStatus === 'rejected'
                        ? 'bg-red-600 border-red-500 text-white'
                        : 'bg-slate-800 border-slate-600 text-gray-300 hover:border-red-500'
                    }`}
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Reject</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="text-white font-medium mb-3 block">Comments (Optional)</label>
                <textarea
                  placeholder="Add comments about your review decision..."
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 resize-none"
                  rows={3}
                />
              </div>
            </div>

            {/* Submit Review */}
            <div className="flex space-x-3">
              <Button
                variant="secondary"
                onClick={() => setSelectedDocument(null)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={submitReview}
                disabled={!reviewStatus}
                loading={loading}
                className="flex-1"
              >
                Submit Review
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default KycVerificationPanel;