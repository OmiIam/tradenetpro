'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  DollarSign, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  ArrowDownLeft,
  Info,
  CreditCard,
  Clock,
  Shield
} from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { MobileInput, MobileTextarea } from '@/components/ui/MobileForm';
import toast from 'react-hot-toast';

interface WithdrawalModalProps {
  isOpen: boolean;
  onClose: () => void;
  accountBalance: number;
  onWithdrawalRequest: (data: WithdrawalRequestData) => Promise<void>;
}

export interface WithdrawalRequestData {
  amount: number;
  withdrawalMethod: 'bank_transfer' | 'crypto' | 'paypal';
  bankDetails?: {
    accountNumber: string;
    routingNumber: string;
    accountHolderName: string;
    bankName: string;
  };
  cryptoDetails?: {
    walletAddress: string;
    network: 'bitcoin' | 'ethereum' | 'tron';
  };
  paypalDetails?: {
    email: string;
  };
  notes?: string;
}

const WithdrawalModal: React.FC<WithdrawalModalProps> = ({ 
  isOpen, 
  onClose, 
  accountBalance,
  onWithdrawalRequest 
}) => {
  const [step, setStep] = useState<'amount' | 'method' | 'details' | 'confirm' | 'processing' | 'success'>('amount');
  const [withdrawalAmount, setWithdrawalAmount] = useState('');
  const [withdrawalMethod, setWithdrawalMethod] = useState<'bank_transfer' | 'crypto' | 'paypal'>('bank_transfer');
  const [bankDetails, setBankDetails] = useState({
    accountNumber: '',
    routingNumber: '',
    accountHolderName: '',
    bankName: ''
  });
  const [cryptoDetails, setCryptoDetails] = useState({
    walletAddress: '',
    network: 'bitcoin' as 'bitcoin' | 'ethereum' | 'tron'
  });
  const [paypalDetails, setPaypalDetails] = useState({
    email: ''
  });
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  // Calculate 6% tax fee
  const taxFee = accountBalance * 0.06;
  const availableForWithdrawal = accountBalance - taxFee;
  const requestedAmount = parseFloat(withdrawalAmount) || 0;

  useEffect(() => {
    if (!isOpen) {
      // Reset form when modal closes
      setStep('amount');
      setWithdrawalAmount('');
      setErrors({});
      setBankDetails({
        accountNumber: '',
        routingNumber: '',
        accountHolderName: '',
        bankName: ''
      });
      setCryptoDetails({
        walletAddress: '',
        network: 'bitcoin'
      });
      setPaypalDetails({
        email: ''
      });
      setNotes('');
    }
  }, [isOpen]);

  const validateAmount = () => {
    const newErrors: Record<string, string> = {};
    
    if (!withdrawalAmount) {
      newErrors.amount = 'Please enter a withdrawal amount';
    } else if (requestedAmount <= 0) {
      newErrors.amount = 'Amount must be greater than $0';
    } else if (requestedAmount > availableForWithdrawal) {
      newErrors.amount = `Amount exceeds available balance after tax fee (${formatCurrency(availableForWithdrawal)})`;
    } else if (requestedAmount < 10) {
      newErrors.amount = 'Minimum withdrawal amount is $10';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateDetails = () => {
    const newErrors: Record<string, string> = {};

    if (withdrawalMethod === 'bank_transfer') {
      if (!bankDetails.accountNumber) newErrors.accountNumber = 'Account number is required';
      if (!bankDetails.routingNumber) newErrors.routingNumber = 'Routing number is required';
      if (!bankDetails.accountHolderName) newErrors.accountHolderName = 'Account holder name is required';
      if (!bankDetails.bankName) newErrors.bankName = 'Bank name is required';
    } else if (withdrawalMethod === 'crypto') {
      if (!cryptoDetails.walletAddress) newErrors.walletAddress = 'Wallet address is required';
      if (cryptoDetails.walletAddress && cryptoDetails.walletAddress.length < 26) {
        newErrors.walletAddress = 'Please enter a valid wallet address';
      }
    } else if (withdrawalMethod === 'paypal') {
      if (!paypalDetails.email) newErrors.email = 'PayPal email is required';
      if (paypalDetails.email && !/\S+@\S+\.\S+/.test(paypalDetails.email)) {
        newErrors.email = 'Please enter a valid email address';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (step === 'amount' && validateAmount()) {
      setStep('method');
    } else if (step === 'method') {
      setStep('details');
    } else if (step === 'details' && validateDetails()) {
      setStep('confirm');
    }
  };

  const handleConfirmWithdrawal = async () => {
    setStep('processing');
    setLoading(true);

    try {
      const withdrawalData: WithdrawalRequestData = {
        amount: requestedAmount,
        withdrawalMethod,
        notes
      };

      if (withdrawalMethod === 'bank_transfer') {
        withdrawalData.bankDetails = bankDetails;
      } else if (withdrawalMethod === 'crypto') {
        withdrawalData.cryptoDetails = cryptoDetails;
      } else if (withdrawalMethod === 'paypal') {
        withdrawalData.paypalDetails = paypalDetails;
      }

      await onWithdrawalRequest(withdrawalData);
      setStep('success');
      toast.success('Withdrawal request submitted successfully!');
    } catch (error) {
      console.error('Withdrawal request failed:', error);
      toast.error('Failed to submit withdrawal request. Please try again.');
      setStep('confirm');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const renderStepContent = () => {
    switch (step) {
      case 'amount':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-500/30">
                <ArrowDownLeft className="w-8 h-8 text-blue-400" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Withdraw Funds</h3>
              <p className="text-slate-400">Enter the amount you'd like to withdraw</p>
            </div>

            {/* Account Balance Info */}
            <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/40">
              <div className="flex items-center justify-between mb-3">
                <span className="text-slate-400 text-sm">Available Balance</span>
                <span className="text-white font-bold">{formatCurrency(accountBalance)}</span>
              </div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <Info className="w-4 h-4 text-amber-400" />
                  <span className="text-slate-400 text-sm">Tax Fee (6%)</span>
                </div>
                <span className="text-amber-400 font-semibold">-{formatCurrency(taxFee)}</span>
              </div>
              <div className="border-t border-slate-700/50 pt-3">
                <div className="flex items-center justify-between">
                  <span className="text-green-400 font-medium">Available for Withdrawal</span>
                  <span className="text-green-400 font-bold text-lg">{formatCurrency(availableForWithdrawal)}</span>
                </div>
              </div>
            </div>

            {/* Tax Fee Warning */}
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="text-amber-400 font-semibold mb-1">Important Tax Information</p>
                  <p className="text-amber-200/90">
                    A 6% tax fee ({formatCurrency(taxFee)}) is required on your total account balance. 
                    You must pay this fee before your withdrawal can be processed.
                  </p>
                </div>
              </div>
            </div>

            {/* Amount Input */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Withdrawal Amount
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <DollarSign className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="number"
                  value={withdrawalAmount}
                  onChange={(e) => {
                    setWithdrawalAmount(e.target.value);
                    if (errors.amount) {
                      setErrors(prev => ({ ...prev, amount: '' }));
                    }
                  }}
                  className={`block w-full pl-10 pr-3 py-3 border rounded-lg bg-slate-800 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                    errors.amount ? 'border-red-500' : 'border-slate-700'
                  }`}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
              </div>
              {errors.amount && (
                <p className="mt-2 text-sm text-red-400">{errors.amount}</p>
              )}
              
              {/* Quick Amount Buttons */}
              <div className="grid grid-cols-3 gap-2 mt-3">
                {[0.25, 0.5, 1.0].map((percentage) => {
                  const amount = availableForWithdrawal * percentage;
                  return (
                    <button
                      key={percentage}
                      type="button"
                      onClick={() => setWithdrawalAmount(amount.toFixed(2))}
                      className="px-3 py-2 bg-slate-700/50 hover:bg-slate-700 text-slate-300 hover:text-white text-sm rounded-lg transition-colors border border-slate-600/50 hover:border-slate-600"
                    >
                      {percentage === 1 ? 'Max' : `${percentage * 100}%`}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        );

      case 'method':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-white mb-2">Withdrawal Method</h3>
              <p className="text-slate-400">Choose how you'd like to receive your funds</p>
            </div>

            <div className="space-y-3">
              {[
                {
                  id: 'bank_transfer' as const,
                  name: 'Bank Transfer',
                  description: 'Direct transfer to your bank account',
                  icon: <CreditCard className="w-6 h-6" />,
                  processingTime: '3-5 business days'
                },
                {
                  id: 'crypto' as const,
                  name: 'Cryptocurrency',
                  description: 'Withdraw to your crypto wallet',
                  icon: <DollarSign className="w-6 h-6" />,
                  processingTime: '1-2 hours'
                },
                {
                  id: 'paypal' as const,
                  name: 'PayPal',
                  description: 'Transfer to your PayPal account',
                  icon: <Shield className="w-6 h-6" />,
                  processingTime: '1-2 business days'
                }
              ].map((method) => (
                <button
                  key={method.id}
                  onClick={() => setWithdrawalMethod(method.id)}
                  className={`w-full p-4 rounded-xl border text-left transition-all duration-200 ${
                    withdrawalMethod === method.id
                      ? 'border-blue-500/50 bg-blue-500/10'
                      : 'border-slate-700/40 bg-slate-800/40 hover:border-slate-600/50'
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    <div className={`p-2 rounded-lg ${
                      withdrawalMethod === method.id ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-700/50 text-slate-400'
                    }`}>
                      {method.icon}
                    </div>
                    <div className="flex-1">
                      <h4 className="text-white font-semibold">{method.name}</h4>
                      <p className="text-slate-400 text-sm">{method.description}</p>
                      <div className="flex items-center space-x-1 mt-1">
                        <Clock className="w-3 h-3 text-slate-500" />
                        <span className="text-slate-500 text-xs">{method.processingTime}</span>
                      </div>
                    </div>
                    <div className={`w-4 h-4 rounded-full border-2 ${
                      withdrawalMethod === method.id
                        ? 'border-blue-500 bg-blue-500'
                        : 'border-slate-600'
                    }`}>
                      {withdrawalMethod === method.id && (
                        <div className="w-full h-full bg-white rounded-full scale-50" />
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        );

      case 'details':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-white mb-2">Withdrawal Details</h3>
              <p className="text-slate-400">
                {withdrawalMethod === 'bank_transfer' && 'Enter your bank account information'}
                {withdrawalMethod === 'crypto' && 'Enter your wallet details'}
                {withdrawalMethod === 'paypal' && 'Enter your PayPal information'}
              </p>
            </div>

            {withdrawalMethod === 'bank_transfer' && (
              <div className="space-y-4">
                <MobileInput
                  label="Account Holder Name"
                  value={bankDetails.accountHolderName}
                  onChange={(e) => setBankDetails(prev => ({ ...prev, accountHolderName: e.target.value }))}
                  error={errors.accountHolderName}
                  placeholder="Full name as it appears on account"
                />
                <MobileInput
                  label="Bank Name"
                  value={bankDetails.bankName}
                  onChange={(e) => setBankDetails(prev => ({ ...prev, bankName: e.target.value }))}
                  error={errors.bankName}
                  placeholder="Your bank's name"
                />
                <MobileInput
                  label="Account Number"
                  value={bankDetails.accountNumber}
                  onChange={(e) => setBankDetails(prev => ({ ...prev, accountNumber: e.target.value }))}
                  error={errors.accountNumber}
                  placeholder="Your account number"
                />
                <MobileInput
                  label="Routing Number"
                  value={bankDetails.routingNumber}
                  onChange={(e) => setBankDetails(prev => ({ ...prev, routingNumber: e.target.value }))}
                  error={errors.routingNumber}
                  placeholder="9-digit routing number"
                />
              </div>
            )}

            {withdrawalMethod === 'crypto' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Network
                  </label>
                  <select
                    value={cryptoDetails.network}
                    onChange={(e) => setCryptoDetails(prev => ({ ...prev, network: e.target.value as any }))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="bitcoin">Bitcoin (BTC)</option>
                    <option value="ethereum">Ethereum (ETH)</option>
                    <option value="tron">Tron (TRX)</option>
                  </select>
                </div>
                <MobileInput
                  label="Wallet Address"
                  value={cryptoDetails.walletAddress}
                  onChange={(e) => setCryptoDetails(prev => ({ ...prev, walletAddress: e.target.value }))}
                  error={errors.walletAddress}
                  placeholder="Your wallet address"
                />
              </div>
            )}

            {withdrawalMethod === 'paypal' && (
              <MobileInput
                label="PayPal Email"
                type="email"
                value={paypalDetails.email}
                onChange={(e) => setPaypalDetails(prev => ({ ...prev, email: e.target.value }))}
                error={errors.email}
                placeholder="your.email@example.com"
              />
            )}

            <MobileTextarea
              label="Notes (Optional)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional instructions or notes..."
              rows={3}
            />
          </div>
        );

      case 'confirm':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-amber-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-amber-500/30">
                <AlertTriangle className="w-8 h-8 text-amber-400" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Confirm Withdrawal</h3>
              <p className="text-slate-400">Please review your withdrawal details</p>
            </div>

            {/* Withdrawal Summary */}
            <div className="bg-slate-800/40 rounded-xl p-6 border border-slate-700/40 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Withdrawal Amount</span>
                <span className="text-white font-bold text-lg">{formatCurrency(requestedAmount)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Method</span>
                <span className="text-white capitalize">
                  {withdrawalMethod === 'bank_transfer' ? 'Bank Transfer' : 
                   withdrawalMethod === 'crypto' ? 'Cryptocurrency' : 'PayPal'}
                </span>
              </div>
              {withdrawalMethod === 'bank_transfer' && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Bank Account</span>
                  <span className="text-white">****{bankDetails.accountNumber.slice(-4)}</span>
                </div>
              )}
            </div>

            {/* Tax Fee Warning */}
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="text-red-400 font-semibold mb-2">Tax Payment Required</p>
                  <p className="text-red-200/90 mb-3">
                    Before processing your withdrawal, you must pay the required tax fee of{' '}
                    <span className="font-bold">{formatCurrency(taxFee)}</span> (6% of your total balance).
                  </p>
                  <p className="text-red-200/90">
                    Your withdrawal will be staged until the tax payment is confirmed by our admin team.
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      case 'processing':
        return (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-blue-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-500/30">
              <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Processing Request</h3>
            <p className="text-slate-400">Please wait while we process your withdrawal request...</p>
          </div>
        );

      case 'success':
        return (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-green-500/30">
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Request Submitted</h3>
            <p className="text-slate-400 mb-6">
              Your withdrawal request has been submitted successfully. You will receive further instructions
              about the tax payment process via email.
            </p>
            
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 text-left">
              <p className="text-blue-400 font-semibold mb-2">Next Steps:</p>
              <ol className="text-blue-200/90 text-sm space-y-1 list-decimal list-inside">
                <li>You'll receive an email with tax payment instructions</li>
                <li>Pay the required tax fee of {formatCurrency(taxFee)}</li>
                <li>Admin will verify your payment</li>
                <li>Your withdrawal will be processed once verified</li>
              </ol>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const renderFooter = () => {
    if (step === 'processing' || step === 'success') {
      return (
        <div className="flex justify-center">
          <Button onClick={onClose} variant="primary">
            {step === 'success' ? 'Close' : 'Cancel'}
          </Button>
        </div>
      );
    }

    return (
      <div className="flex items-center justify-between space-x-3">
        <Button
          onClick={step === 'amount' ? onClose : () => setStep(
            step === 'method' ? 'amount' : 
            step === 'details' ? 'method' : 
            step === 'confirm' ? 'details' : 'amount'
          )}
          variant="secondary"
        >
          {step === 'amount' ? 'Cancel' : 'Back'}
        </Button>
        
        <Button
          onClick={step === 'confirm' ? handleConfirmWithdrawal : handleNext}
          variant="primary"
          disabled={loading}
          className="flex-1"
        >
          {step === 'confirm' ? 'Submit Request' : 'Continue'}
        </Button>
      </div>
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="">
      <div className="space-y-6">
        {renderStepContent()}
        {renderFooter()}
      </div>
    </Modal>
  );
};

export default WithdrawalModal;