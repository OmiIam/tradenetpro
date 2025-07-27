'use client';

import React, { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import KYCUpload, { KYCDocument } from '@/components/KYCUpload';
import { Shield, CheckCircle, AlertCircle, Clock, FileText, Users, Award } from 'lucide-react';
import api from '@/lib/api';

export default function KYCPage() {
  const [documents, setDocuments] = useState<KYCDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [kycStatus, setKycStatus] = useState<'pending' | 'approved' | 'rejected' | 'under_review'>('pending');

  useEffect(() => {
    const fetchKYCData = async () => {
      try {
        const response = await api.get('/api/user/kyc/status');
        const responseData = response.data || response;
        
        setDocuments((responseData as any)?.documents || []);
        setKycStatus((responseData as any)?.status || 'pending');
      } catch (error) {
        console.error('Error fetching KYC data:', error);
        // Use fallback data
        setDocuments([]);
        setKycStatus('pending');
      } finally {
        setLoading(false);
      }
    };

    fetchKYCData();
  }, []);

  const handleUploadComplete = (newDocument: KYCDocument) => {
    setDocuments(prev => [...prev, newDocument]);
    // If this was the first document, update status to under_review
    if (documents.length === 0) {
      setKycStatus('under_review');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'text-green-400 bg-green-500/10 border-green-500/20';
      case 'rejected':
        return 'text-red-400 bg-red-500/10 border-red-500/20';
      case 'under_review':
        return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
      default:
        return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-6 h-6" />;
      case 'rejected':
        return <AlertCircle className="w-6 h-6" />;
      case 'under_review':
        return <Clock className="w-6 h-6" />;
      default:
        return <FileText className="w-6 h-6" />;
    }
  };

  const getStatusMessage = (status: string) => {
    switch (status) {
      case 'approved':
        return 'Your KYC verification is complete! You now have full access to all trading features.';
      case 'rejected':
        return 'Your KYC application was rejected. Please review the feedback and resubmit corrected documents.';
      case 'under_review':
        return 'Your documents are being reviewed by our verification team. This typically takes 24-48 hours.';
      default:
        return 'Complete your KYC verification to unlock full trading capabilities and higher limits.';
    }
  };

  const getCompletionPercentage = () => {
    const requiredDocs = ['passport', 'utility_bill']; // Required document types
    const uploadedRequired = documents.filter(doc => 
      requiredDocs.includes(doc.document_type) && doc.verification_status !== 'rejected'
    );
    return Math.round((uploadedRequired.length / requiredDocs.length) * 100);
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="max-w-4xl mx-auto py-12 px-4">
          <div className="text-center">
            <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-slate-400">Loading KYC status...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="max-w-6xl mx-auto py-12 px-4">
        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-500/20 rounded-2xl border border-blue-500/30 mb-6">
            <Shield className="w-8 h-8 text-blue-400" />
          </div>
          <h1 className="text-4xl font-black text-white mb-4 tracking-tight">
            KYC Verification
          </h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            Verify your identity to unlock full trading capabilities and ensure platform security
          </p>
        </div>

        {/* Status Overview */}
        <div className="mb-12">
          <div className={`rounded-2xl border p-8 ${getStatusColor(kycStatus)}`}>
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                {getStatusIcon(kycStatus)}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-white">
                    Verification Status: {kycStatus.charAt(0).toUpperCase() + kycStatus.slice(1).replace('_', ' ')}
                  </h2>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-white mb-1">
                      {getCompletionPercentage()}%
                    </div>
                    <div className="text-sm opacity-75">Complete</div>
                  </div>
                </div>
                <p className="text-lg mb-6 opacity-90">
                  {getStatusMessage(kycStatus)}
                </p>
                
                {/* Progress Bar */}
                <div className="w-full bg-slate-800/50 rounded-full h-3">
                  <div
                    className="bg-current h-3 rounded-full transition-all duration-500"
                    style={{ width: `${getCompletionPercentage()}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Benefits Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/80 rounded-2xl p-6 border border-slate-700/40">
            <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center mb-4 border border-green-500/30">
              <Users className="w-6 h-6 text-green-400" />
            </div>
            <h3 className="text-white font-bold text-lg mb-2">Enhanced Security</h3>
            <p className="text-slate-400 text-sm">
              Protect your account and comply with regulatory requirements for secure trading.
            </p>
          </div>
          
          <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/80 rounded-2xl p-6 border border-slate-700/40">
            <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center mb-4 border border-blue-500/30">
              <Award className="w-6 h-6 text-blue-400" />
            </div>
            <h3 className="text-white font-bold text-lg mb-2">Higher Limits</h3>
            <p className="text-slate-400 text-sm">
              Unlock increased trading limits and access to premium features and instruments.
            </p>
          </div>
          
          <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/80 rounded-2xl p-6 border border-slate-700/40">
            <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center mb-4 border border-purple-500/30">
              <Shield className="w-6 h-6 text-purple-400" />
            </div>
            <h3 className="text-white font-bold text-lg mb-2">Faster Withdrawals</h3>
            <p className="text-slate-400 text-sm">
              Enjoy faster withdrawal processing times and access to all payment methods.
            </p>
          </div>
        </div>

        {/* KYC Upload Component */}
        <div className="bg-gradient-to-br from-slate-800/40 to-slate-900/60 rounded-2xl p-8 border border-slate-700/40 backdrop-blur-sm">
          <KYCUpload
            onUploadComplete={handleUploadComplete}
            existingDocuments={documents}
          />
        </div>

        {/* Requirements Section */}
        <div className="mt-12 bg-slate-800/40 rounded-2xl p-8 border border-slate-700/40">
          <h3 className="text-2xl font-bold text-white mb-6">Verification Requirements</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-lg font-semibold text-white mb-4">Required Documents</h4>
              <ul className="space-y-3">
                <li className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                  <span className="text-slate-300">Government-issued photo ID (Passport, Driver's License, or National ID)</span>
                </li>
                <li className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                  <span className="text-slate-300">Proof of address (Utility bill or Bank statement - last 3 months)</span>
                </li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold text-white mb-4">Document Guidelines</h4>
              <ul className="space-y-3">
                <li className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-blue-400 rounded-full flex-shrink-0"></div>
                  <span className="text-slate-300">Clear, high-resolution images or PDFs</span>
                </li>
                <li className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-blue-400 rounded-full flex-shrink-0"></div>
                  <span className="text-slate-300">All four corners visible and text readable</span>
                </li>
                <li className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-blue-400 rounded-full flex-shrink-0"></div>
                  <span className="text-slate-300">No edited, expired, or photocopied documents</span>
                </li>
                <li className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-blue-400 rounded-full flex-shrink-0"></div>
                  <span className="text-slate-300">Maximum file size: 10MB per document</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Support Section */}
        <div className="mt-8 text-center">
          <p className="text-slate-400 mb-4">
            Having trouble with verification? Our support team is here to help.
          </p>
          <button className="inline-flex items-center px-6 py-3 bg-slate-700/50 hover:bg-slate-700 text-white font-semibold rounded-xl transition-colors border border-slate-600/50 hover:border-slate-600">
            <FileText className="w-5 h-5 mr-2" />
            Contact Support
          </button>
        </div>
      </div>
    </ProtectedRoute>
  );
}