'use client';

import React, { useEffect, useState } from 'react';
import { Search, CheckCircle, XCircle, Eye, Download, User, Clock } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import { AdminProvider, useAdmin, AdminKycDocument } from '@/contexts/AdminContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import Card, { CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { MobileInput, MobileSelect, MobileTextarea } from '@/components/ui/MobileForm';
import MobileTable from '@/components/ui/MobileTable';
import Modal from '@/components/ui/Modal';
import { ResponsiveGrid } from '@/components/layout/ResponsiveContainer';
import { useConfirmation, confirmationActions } from '@/components/ui/ConfirmationModal';

function KycPageContent() {
  const { 
    state, 
    fetchKycDocuments, 
    approveKyc,
    rejectKyc,
    hasPermission
  } = useAdmin();
  
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    type: ''
  });
  
  const [reviewingDoc, setReviewingDoc] = useState<AdminKycDocument | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const { confirm, ConfirmationModal } = useConfirmation();
  const canApprove = hasPermission('kyc:approve');
  const canReject = hasPermission('kyc:reject');

  useEffect(() => {
    fetchKycDocuments(1, filters);
  }, [fetchKycDocuments, filters]);

  const handleApprove = (document: AdminKycDocument) => {
    confirm(confirmationActions.approveKyc(
      {
        id: document.id,
        type: document.document_type,
        user: document.user_id
      },
      () => approveKyc(document.id)
    ));
  };

  const handleReject = (document: AdminKycDocument) => {
    if (!rejectionReason.trim()) {
      alert('Please provide a rejection reason');
      return;
    }
    
    confirm(confirmationActions.rejectKyc(
      {
        id: document.id,
        type: document.document_type,
        user: document.user_id
      },
      rejectionReason,
      () => rejectKyc(document.id, rejectionReason)
    ));
  };

  const kycColumns = [
    {
      key: 'details',
      label: 'Document',
      primary: true,
      render: (_: any, doc: AdminKycDocument) => (
        <div>
          <p className="font-semibold capitalize">{doc.document_type.replace('_', ' ')}</p>
          <p className="text-sm text-gray-400">
            {doc.user_first_name && doc.user_last_name 
              ? `${doc.user_first_name} ${doc.user_last_name}` 
              : `User: ${doc.user_id}`}
          </p>
          {doc.user_email && (
            <p className="text-xs text-gray-500">{doc.user_email}</p>
          )}
        </div>
      )
    },
    {
      key: 'status',
      label: 'Status',
      primary: true,
      render: (status: string) => (
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
          status === 'approved' ? 'bg-green-900/20 text-green-400' :
          status === 'pending' ? 'bg-yellow-900/20 text-yellow-400' :
          status === 'rejected' ? 'bg-red-900/20 text-red-400' :
          status === 'under_review' ? 'bg-blue-900/20 text-blue-400' :
          'bg-gray-900/20 text-gray-400'
        }`}>
          {status === 'under_review' ? 'Under Review' : status}
        </span>
      )
    },
    {
      key: 'submitted_at',
      label: 'Submitted',
      secondary: true,
      render: (date: string) => new Date(date).toLocaleDateString()
    },
    {
      key: 'reviewed_at',
      label: 'Reviewed',
      secondary: true,
      render: (date?: string) => date ? new Date(date).toLocaleDateString() : 'Not reviewed'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <ResponsiveGrid cols={{ base: 1, sm: 3 }} gap="md">
            <MobileInput
              label="Search"
              placeholder="Search documents..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              leftIcon={<Search className="w-4 h-4" />}
            />
            
            <MobileSelect
              label="Status"
              options={[
                { value: '', label: 'All Statuses' },
                { value: 'pending', label: 'Pending' },
                { value: 'under_review', label: 'Under Review' },
                { value: 'approved', label: 'Approved' },
                { value: 'rejected', label: 'Rejected' }
              ]}
              value={filters.status}
              onChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
            />
            
            <MobileSelect
              label="Document Type"
              options={[
                { value: '', label: 'All Types' },
                { value: 'passport', label: 'Passport' },
                { value: 'driver_license', label: 'Driver License' },
                { value: 'national_id', label: 'National ID' },
                { value: 'utility_bill', label: 'Utility Bill' }
              ]}
              value={filters.type}
              onChange={(value) => setFilters(prev => ({ ...prev, type: value }))}
            />
          </ResponsiveGrid>
        </CardContent>
      </Card>

      {/* KYC Documents Table */}
      <Card>
        <CardHeader>
          <CardTitle>KYC Documents ({state.pagination.kyc.total})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <MobileTable
            data={state.kycDocuments}
            columns={kycColumns}
            emptyMessage="No KYC documents found"
            onRowClick={(doc) => setReviewingDoc(doc)}
          />
        </CardContent>
      </Card>

      {/* Review Modal */}
      <Modal
        isOpen={!!reviewingDoc}
        onClose={() => {
          setReviewingDoc(null);
          setRejectionReason('');
        }}
        title="Review KYC Document"
      >
        {reviewingDoc && (
          <div className="space-y-6">
            <div className="space-y-4">
              {/* User Information */}
              <div className="bg-slate-800 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <User className="w-5 h-5 text-blue-400" />
                  <h4 className="font-semibold text-white">User Information</h4>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-400">Name:</span>
                    <p className="text-white">
                      {reviewingDoc.user_first_name && reviewingDoc.user_last_name 
                        ? `${reviewingDoc.user_first_name} ${reviewingDoc.user_last_name}` 
                        : 'Not provided'}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-400">Email:</span>
                    <p className="text-white">{reviewingDoc.user_email || 'Not provided'}</p>
                  </div>
                  <div>
                    <span className="text-gray-400">User ID:</span>
                    <p className="text-white">{reviewingDoc.user_id}</p>
                  </div>
                </div>
              </div>

              {/* Document Details */}
              <div>
                <h4 className="font-semibold text-white mb-3">Document Details</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Type:</span>
                    <span className="text-white capitalize">{reviewingDoc.document_type.replace('_', ' ')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Status:</span>
                    <span className={`capitalize ${
                      reviewingDoc.status === 'approved' ? 'text-green-400' :
                      reviewingDoc.status === 'pending' ? 'text-yellow-400' :
                      reviewingDoc.status === 'rejected' ? 'text-red-400' :
                      reviewingDoc.status === 'under_review' ? 'text-blue-400' :
                      'text-gray-400'
                    }`}>
                      {reviewingDoc.status === 'under_review' ? 'Under Review' : reviewingDoc.status}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Submitted:</span>
                    <span className="text-white flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>{new Date(reviewingDoc.submitted_at).toLocaleDateString()}</span>
                    </span>
                  </div>
                  {reviewingDoc.reviewed_at && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Reviewed:</span>
                      <span className="text-white">{new Date(reviewingDoc.reviewed_at).toLocaleDateString()}</span>
                    </div>
                  )}
                  {reviewingDoc.reviewed_by && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Reviewed by:</span>
                      <span className="text-white">{reviewingDoc.reviewed_by}</span>
                    </div>
                  )}
                  {reviewingDoc.rejection_reason && (
                    <div className="mt-3">
                      <span className="text-gray-400">Rejection Reason:</span>
                      <p className="text-red-400 mt-1 p-2 bg-red-900/20 rounded">{reviewingDoc.rejection_reason}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Document Actions */}
              <div className="bg-slate-800 rounded-lg p-4">
                <div className="flex space-x-3">
                  <Button 
                    variant="outline" 
                    className="flex-1 flex items-center justify-center space-x-2"
                    onClick={() => window.open(reviewingDoc.document_url, '_blank')}
                  >
                    <Eye className="w-4 h-4" />
                    <span>View Document</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex-1 flex items-center justify-center space-x-2"
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = reviewingDoc.document_url;
                      link.download = `${reviewingDoc.document_type}_${reviewingDoc.user_id}.pdf`;
                      link.click();
                    }}
                  >
                    <Download className="w-4 h-4" />
                    <span>Download</span>
                  </Button>
                </div>
              </div>

              {reviewingDoc.status === 'pending' && (
                <div className="space-y-4">
                  <MobileTextarea
                    label="Rejection Reason (optional)"
                    placeholder="Provide a reason if rejecting..."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    rows={3}
                  />
                  
                  <div className="flex space-x-3">
                    {canApprove && (
                      <Button
                        variant="primary"
                        onClick={() => handleApprove(reviewingDoc)}
                        className="flex-1 flex items-center justify-center space-x-2"
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>Approve</span>
                      </Button>
                    )}
                    
                    {canReject && (
                      <Button
                        variant="danger"
                        onClick={() => handleReject(reviewingDoc)}
                        className="flex-1 flex items-center justify-center space-x-2"
                        disabled={!rejectionReason.trim()}
                      >
                        <XCircle className="w-4 h-4" />
                        <span>Reject</span>
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {ConfirmationModal}
    </div>
  );
}

export default function KycPage() {
  return (
    <ProtectedRoute requireAdmin={true}>
      <AdminProvider>
        <AdminLayout title="KYC Verification" subtitle="Review and manage user identity verification documents">
          <KycPageContent />
        </AdminLayout>
      </AdminProvider>
    </ProtectedRoute>
  );
}