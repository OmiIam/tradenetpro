'use client';

import { Toaster } from 'react-hot-toast';

export default function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        // Default toast options
        duration: 4000,
        style: {
          background: 'rgba(30, 41, 59, 0.95)', // slate-800 with transparency
          color: '#f8fafc', // slate-50
          border: '1px solid rgba(59, 130, 246, 0.3)', // blue-500 with transparency
          borderRadius: '12px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2)',
          backdropFilter: 'blur(10px)',
          fontSize: '14px',
          fontWeight: '500',
          maxWidth: '400px',
        },
        // Success toast styling
        success: {
          iconTheme: {
            primary: '#10b981', // emerald-500
            secondary: '#f8fafc', // slate-50
          },
          style: {
            border: '1px solid rgba(16, 185, 129, 0.3)', // emerald-500 with transparency
          },
        },
        // Error toast styling
        error: {
          iconTheme: {
            primary: '#ef4444', // red-500
            secondary: '#f8fafc', // slate-50
          },
          style: {
            border: '1px solid rgba(239, 68, 68, 0.3)', // red-500 with transparency
          },
        },
        // Loading toast styling
        loading: {
          iconTheme: {
            primary: '#3b82f6', // blue-500
            secondary: '#f8fafc', // slate-50
          },
          style: {
            border: '1px solid rgba(59, 130, 246, 0.3)', // blue-500 with transparency
          },
        },
      }}
      containerStyle={{
        top: 20,
        right: 20,
      }}
    />
  );
}