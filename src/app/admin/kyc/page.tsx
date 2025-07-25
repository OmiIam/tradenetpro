'use client';

import React, { useEffect, useState } from 'react';
import { Search, CheckCircle, XCircle, Eye } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import { AdminProvider, useAdmin, AdminKycDocument } from '@/contexts/AdminContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { MobileInput, MobileSelect, MobileTextarea } from '@/components/ui/MobileForm';
import MobileTable from '@/components/ui/MobileTable';
import { Modal } from '@/components/ui/Modal';
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
      render: (_, doc: AdminKycDocument) => (
        <div>
          <p className="font-semibold capitalize">{doc.document_type.replace('_', ' ')}</p>
          <p className="text-sm text-gray-400">User: {doc.user_id}</p>
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
          'bg-gray-900/20 text-gray-400'
        }`}>
          {status}
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
            loading={state.loading.kyc}
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
              <div>
                <h4 className="font-semibold text-white">Document Details</h4>
                <div className="mt-2 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Type:</span>
                    <span className="text-white capitalize">{reviewingDoc.document_type.replace('_', ' ')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">User ID:</span>
                    <span className="text-white">{reviewingDoc.user_id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Status:</span>
                    <span className="text-white capitalize">{reviewingDoc.status}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Submitted:</span>
                    <span className="text-white">{new Date(reviewingDoc.submitted_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-800 rounded-lg p-4">
                <Button variant="outline" className="w-full flex items-center space-x-2">
                  <Eye className="w-4 h-4" />
                  <span>View Document</span>
                </Button>
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

      <ConfirmationModal />
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