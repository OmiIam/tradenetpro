import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

interface WithdrawalRequest {
  id: number;
  user_id: number;
  amount: number;
  withdrawal_method: 'bank_transfer' | 'crypto' | 'paypal';
  bank_details?: {
    account_number: string;
    routing_number: string;
    account_holder_name: string;
    bank_name: string;
  };
  crypto_details?: {
    wallet_address: string;
    network: 'bitcoin' | 'ethereum' | 'tron';
  };
  paypal_details?: {
    email: string;
  };
  notes?: string;
  status: 'pending_tax_payment' | 'tax_paid' | 'processing' | 'completed' | 'rejected';
  tax_fee: number;
  tax_paid: boolean;
  created_at: string;
  updated_at: string;
  admin_notes?: string;
}

// In-memory storage for demo purposes
// In production, this would be stored in your database
let withdrawalRequests: WithdrawalRequest[] = [];
let requestIdCounter = 1;

function getUserFromToken(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;
    return decoded;
  } catch (error) {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = getUserFromToken(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      amount,
      withdrawalMethod,
      bankDetails,
      cryptoDetails,
      paypalDetails,
      notes
    } = body;

    // Validation
    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Valid withdrawal amount is required' },
        { status: 400 }
      );
    }

    if (amount < 10) {
      return NextResponse.json(
        { error: 'Minimum withdrawal amount is $10' },
        { status: 400 }
      );
    }

    if (!withdrawalMethod || !['bank_transfer', 'crypto', 'paypal'].includes(withdrawalMethod)) {
      return NextResponse.json(
        { error: 'Valid withdrawal method is required' },
        { status: 400 }
      );
    }

    // Get user's current balance (in production, fetch from database)
    // For demo purposes, we'll use a mock balance
    const userBalance = 10000; // This would come from your user balance table
    const taxFee = userBalance * 0.06;
    const availableForWithdrawal = userBalance - taxFee;

    if (amount > availableForWithdrawal) {
      return NextResponse.json(
        { 
          error: 'Insufficient funds',
          details: {
            requested: amount,
            available: availableForWithdrawal,
            taxFee: taxFee
          }
        },
        { status: 400 }
      );
    }

    // Create withdrawal request
    const withdrawalRequest: WithdrawalRequest = {
      id: requestIdCounter++,
      user_id: user.id,
      amount,
      withdrawal_method: withdrawalMethod,
      bank_details: withdrawalMethod === 'bank_transfer' ? {
        account_number: bankDetails?.accountNumber,
        routing_number: bankDetails?.routingNumber,
        account_holder_name: bankDetails?.accountHolderName,
        bank_name: bankDetails?.bankName
      } : undefined,
      crypto_details: withdrawalMethod === 'crypto' ? {
        wallet_address: cryptoDetails?.walletAddress,
        network: cryptoDetails?.network
      } : undefined,
      paypal_details: withdrawalMethod === 'paypal' ? {
        email: paypalDetails?.email
      } : undefined,
      notes,
      status: 'pending_tax_payment',
      tax_fee: taxFee,
      tax_paid: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Store the request (in production, save to database)
    withdrawalRequests.push(withdrawalRequest);

    // In production, you would also:
    // 1. Send an email to the user with tax payment instructions
    // 2. Create an audit log entry
    // 3. Notify admin dashboard of the new withdrawal request

    console.log('New withdrawal request created:', {
      id: withdrawalRequest.id,
      user_id: user.id,
      amount,
      method: withdrawalMethod,
      tax_fee: taxFee
    });

    return NextResponse.json({
      success: true,
      message: 'Withdrawal request submitted successfully',
      data: {
        requestId: withdrawalRequest.id,
        amount: withdrawalRequest.amount,
        taxFee: withdrawalRequest.tax_fee,
        status: withdrawalRequest.status
      }
    });

  } catch (error) {
    console.error('Withdrawal request error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = getUserFromToken(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get user's withdrawal requests
    const userWithdrawals = withdrawalRequests.filter(req => req.user_id === user.id);

    return NextResponse.json({
      success: true,
      data: userWithdrawals.map(req => ({
        id: req.id,
        amount: req.amount,
        withdrawal_method: req.withdrawal_method,
        status: req.status,
        tax_fee: req.tax_fee,
        tax_paid: req.tax_paid,
        created_at: req.created_at,
        updated_at: req.updated_at,
        admin_notes: req.admin_notes
      }))
    });

  } catch (error) {
    console.error('Get withdrawals error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Admin endpoint to update withdrawal status
export async function PATCH(request: NextRequest) {
  try {
    const user = getUserFromToken(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { requestId, status, adminNotes, taxPaid } = body;

    const requestIndex = withdrawalRequests.findIndex(req => req.id === requestId);
    if (requestIndex === -1) {
      return NextResponse.json(
        { error: 'Withdrawal request not found' },
        { status: 404 }
      );
    }

    // Update the withdrawal request
    withdrawalRequests[requestIndex] = {
      ...withdrawalRequests[requestIndex],
      status,
      admin_notes: adminNotes,
      tax_paid: taxPaid ?? withdrawalRequests[requestIndex].tax_paid,
      updated_at: new Date().toISOString()
    };

    console.log('Withdrawal request updated by admin:', {
      requestId,
      status,
      adminId: user.id,
      taxPaid
    });

    return NextResponse.json({
      success: true,
      message: 'Withdrawal request updated successfully'
    });

  } catch (error) {
    console.error('Update withdrawal error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}