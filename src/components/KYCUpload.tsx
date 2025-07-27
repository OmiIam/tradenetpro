'use client';

import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, 
  FileText, 
  Image as ImageIcon, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Camera,
  X,
  Plus,
  Eye,
  Trash2,
  Download
} from 'lucide-react';
import api from '@/lib/api';

export interface KYCDocument {
  id?: number;
  document_type: 'passport' | 'drivers_license' | 'national_id' | 'utility_bill' | 'bank_statement';
  file_name: string;
  file_size: number;
  verification_status: 'pending' | 'approved' | 'rejected';
  uploaded_at: string;
  rejection_reason?: string;
}

interface KYCUploadProps {
  onUploadComplete?: (document: KYCDocument) => void;
  existingDocuments?: KYCDocument[];
}

const documentTypes = [
  {
    id: 'passport',
    name: 'Passport',
    description: 'Government-issued passport with photo',
    icon: '📔',
    required: true
  },
  {
    id: 'drivers_license',
    name: "Driver's License",
    description: 'Valid driver\'s license with photo',
    icon: '🪪',
    required: false
  },
  {
    id: 'national_id',
    name: 'National ID',
    description: 'Government-issued national ID card',
    icon: '🆔',
    required: false
  },
  {
    id: 'utility_bill',
    name: 'Utility Bill',
    description: 'Recent utility bill (last 3 months)',
    icon: '📄',
    required: true
  },
  {
    id: 'bank_statement',
    name: 'Bank Statement',
    description: 'Bank statement (last 3 months)',
    icon: '🏦',
    required: false
  }
];

export const KYCUpload: React.FC<KYCUploadProps> = ({ 
  onUploadComplete, 
  existingDocuments = [] 
}) => {
  const [selectedType, setSelectedType] = useState<string>('');
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const maxFileSize = 10 * 1024 * 1024; // 10MB
  const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const validateFile = (file: File): string | null => {
    if (!allowedTypes.includes(file.type)) {
      return 'Only JPEG, PNG, and PDF files are allowed';
    }
    if (file.size > maxFileSize) {
      return 'File size must be less than 10MB';
    }
    return null;
  };

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return;
    if (!selectedType) {
      setError('Please select a document type first');
      return;
    }

    const file = files[0];
    const validationError = validateFile(file);
    
    if (validationError) {
      setError(validationError);
      return;
    }

    setPreviewFile(file);
    setError(null);

    // Create preview URL for images
    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }
  }, [selectedType]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
  }, [handleFiles]);

  const uploadDocument = async () => {
    if (!previewFile || !selectedType) {
      setError('Please select a document type and file');
      return;
    }

    try {
      setUploading(true);
      setUploadProgress(0);
      setError(null);

      // Create FormData for file upload
      const formData = new FormData();
      formData.append('document', previewFile);
      formData.append('document_type', selectedType);

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const response = await api.post('/api/user/kyc/upload', formData);

      clearInterval(progressInterval);
      setUploadProgress(100);

      const responseData = response.data || response;
      
      if ((responseData as any).success) {
        setSuccess('Document uploaded successfully! It will be reviewed within 24-48 hours.');
        setPreviewFile(null);
        setPreviewUrl(null);
        setSelectedType('');
        
        if (onUploadComplete && (responseData as any).document) {
          onUploadComplete((responseData as any).document);
        }
        
        // Reset form after 3 seconds
        setTimeout(() => {
          setSuccess(null);
          setUploadProgress(0);
        }, 3000);
      } else {
        throw new Error((responseData as any).error || 'Upload failed');
      }
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.response?.data?.error || err.message || 'Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  const clearPreview = () => {
    setPreviewFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getDocumentStatus = (type: string) => {
    const existingDoc = existingDocuments.find(doc => doc.document_type === type);
    return existingDoc?.verification_status || null;
  };

  const getStatusIcon = (status: string | null) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-400" />;
      case 'pending':
        return <AlertCircle className="w-5 h-5 text-yellow-400" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'approved':
        return 'border-green-500/30 bg-green-500/5';
      case 'rejected':
        return 'border-red-500/30 bg-red-500/5';
      case 'pending':
        return 'border-yellow-500/30 bg-yellow-500/5';
      default:
        return 'border-slate-700/40 bg-slate-800/40';
    }
  };

  return (
    <div className="space-y-8">
      {/* Document Type Selection */}
      <div>
        <h3 className="text-xl font-bold text-white mb-4">Select Document Type</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {documentTypes.map((type) => {
            const status = getDocumentStatus(type.id);
            const isSelected = selectedType === type.id;
            
            return (
              <motion.button
                key={type.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => !status && setSelectedType(type.id)}
                disabled={!!status}
                className={`relative p-4 rounded-xl border text-left transition-all duration-200 ${
                  status 
                    ? getStatusColor(status)
                    : isSelected
                    ? 'border-blue-500/50 bg-blue-500/10'
                    : 'border-slate-700/40 bg-slate-800/40 hover:border-slate-600/50'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{type.icon}</span>
                    <div>
                      <h4 className="font-semibold text-white">{type.name}</h4>
                      {type.required && (
                        <span className="text-xs text-red-400 font-medium">Required</span>
                      )}
                    </div>
                  </div>
                  {getStatusIcon(status)}
                </div>
                <p className="text-sm text-slate-400">{type.description}</p>
                
                {status && (
                  <div className="absolute inset-0 bg-slate-900/20 rounded-xl flex items-center justify-center">
                    <span className={`text-sm font-medium ${
                      status === 'approved' ? 'text-green-400' : 
                      status === 'rejected' ? 'text-red-400' : 'text-yellow-400'
                    }`}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </span>
                  </div>
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* File Upload Area */}
      <AnimatePresence>
        {selectedType && !getDocumentStatus(selectedType) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-6"
          >
            <div>
              <h3 className="text-xl font-bold text-white mb-4">
                Upload {documentTypes.find(t => t.id === selectedType)?.name}
              </h3>
              
              {!previewFile ? (
                <div
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-200 ${
                    dragActive
                      ? 'border-blue-500 bg-blue-500/5'
                      : 'border-slate-600 bg-slate-800/20 hover:border-slate-500'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".jpg,.jpeg,.png,.pdf"
                    onChange={handleFileSelect}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  
                  <div className="space-y-4">
                    <div className="mx-auto w-16 h-16 bg-slate-700/50 rounded-2xl flex items-center justify-center">
                      <Upload className="w-8 h-8 text-slate-400" />
                    </div>
                    
                    <div>
                      <h4 className="text-white font-semibold mb-2">
                        Drop your file here or click to browse
                      </h4>
                      <p className="text-slate-400 text-sm">
                        Supports JPEG, PNG, PDF • Max size 10MB
                      </p>
                    </div>
                    
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors"
                    >
                      <Plus className="w-5 h-5 mr-2" />
                      Choose File
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-800/40 rounded-2xl p-6 border border-slate-700/40">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      {previewUrl ? (
                        <img
                          src={previewUrl}
                          alt="Preview"
                          className="w-20 h-20 object-cover rounded-xl border border-slate-600"
                        />
                      ) : (
                        <div className="w-20 h-20 bg-slate-700/50 rounded-xl flex items-center justify-center border border-slate-600">
                          <FileText className="w-8 h-8 text-slate-400" />
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h4 className="text-white font-semibold truncate">{previewFile.name}</h4>
                      <p className="text-slate-400 text-sm">
                        {(previewFile.size / 1024 / 1024).toFixed(2)} MB • {previewFile.type}
                      </p>
                      
                      {uploading && (
                        <div className="mt-3">
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span className="text-slate-400">Uploading...</span>
                            <span className="text-white">{uploadProgress}%</span>
                          </div>
                          <div className="w-full bg-slate-700 rounded-full h-2">
                            <div
                              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${uploadProgress}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <button
                      onClick={clearPreview}
                      disabled={uploading}
                      className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors disabled:opacity-50"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-end space-x-3 mt-4 pt-4 border-t border-slate-700/50">
                    <button
                      onClick={clearPreview}
                      disabled={uploading}
                      className="px-4 py-2 text-slate-400 hover:text-white font-medium transition-colors disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={uploadDocument}
                      disabled={uploading}
                      className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white font-semibold rounded-lg transition-colors"
                    >
                      {uploading ? 'Uploading...' : 'Upload Document'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Status Messages */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-red-500/10 border border-red-500/20 rounded-xl p-4"
          >
            <div className="flex items-center text-red-400">
              <XCircle className="w-5 h-5 mr-3 flex-shrink-0" />
              <span>{error}</span>
            </div>
          </motion.div>
        )}
        
        {success && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-green-500/10 border border-green-500/20 rounded-xl p-4"
          >
            <div className="flex items-center text-green-400">
              <CheckCircle className="w-5 h-5 mr-3 flex-shrink-0" />
              <span>{success}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Existing Documents */}
      {existingDocuments.length > 0 && (
        <div>
          <h3 className="text-xl font-bold text-white mb-4">Uploaded Documents</h3>
          <div className="space-y-3">
            {existingDocuments.map((doc) => {
              const docType = documentTypes.find(t => t.id === doc.document_type);
              return (
                <div
                  key={doc.id}
                  className={`p-4 rounded-xl border ${getStatusColor(doc.verification_status)}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-xl">{docType?.icon || '📄'}</span>
                      <div>
                        <h4 className="text-white font-semibold">{docType?.name || doc.document_type}</h4>
                        <p className="text-slate-400 text-sm">
                          Uploaded {new Date(doc.uploaded_at).toLocaleDateString()}
                        </p>
                        {doc.rejection_reason && (
                          <p className="text-red-400 text-sm mt-1">{doc.rejection_reason}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(doc.verification_status)}
                      <span className={`text-sm font-medium ${
                        doc.verification_status === 'approved' ? 'text-green-400' :
                        doc.verification_status === 'rejected' ? 'text-red-400' : 'text-yellow-400'
                      }`}>
                        {doc.verification_status.charAt(0).toUpperCase() + doc.verification_status.slice(1)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default KYCUpload;