-- Migration: Add withdrawal tables
-- Created: 2025-01-28

-- Withdrawal requests table
CREATE TABLE IF NOT EXISTS withdrawal_requests (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL(15, 2) NOT NULL CHECK (amount > 0),
    withdrawal_method VARCHAR(20) NOT NULL CHECK (withdrawal_method IN ('bank_transfer', 'crypto', 'paypal')),
    
    -- Bank transfer details
    bank_account_number VARCHAR(50),
    bank_routing_number VARCHAR(20),
    bank_account_holder_name VARCHAR(100),
    bank_name VARCHAR(100),
    
    -- Crypto details
    crypto_wallet_address VARCHAR(200),
    crypto_network VARCHAR(20) CHECK (crypto_network IN ('bitcoin', 'ethereum', 'tron')),
    
    -- PayPal details
    paypal_email VARCHAR(100),
    
    -- Request details
    notes TEXT,
    status VARCHAR(30) NOT NULL DEFAULT 'pending_tax_payment' 
        CHECK (status IN ('pending_tax_payment', 'tax_paid', 'processing', 'completed', 'rejected')),
    
    -- Tax information
    tax_fee DECIMAL(15, 2) NOT NULL,
    tax_paid BOOLEAN DEFAULT FALSE,
    tax_payment_proof TEXT, -- URL or reference to tax payment proof
    
    -- Admin fields
    admin_notes TEXT,
    processed_by INTEGER REFERENCES users(id),
    processed_at TIMESTAMP,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Withdrawal status history table for audit trail
CREATE TABLE IF NOT EXISTS withdrawal_status_history (
    id SERIAL PRIMARY KEY,
    withdrawal_request_id INTEGER NOT NULL REFERENCES withdrawal_requests(id) ON DELETE CASCADE,
    previous_status VARCHAR(30),
    new_status VARCHAR(30) NOT NULL,
    changed_by INTEGER REFERENCES users(id),
    change_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tax payments table to track tax fee payments
CREATE TABLE IF NOT EXISTS tax_payments (
    id SERIAL PRIMARY KEY,
    withdrawal_request_id INTEGER NOT NULL REFERENCES withdrawal_requests(id) ON DELETE CASCADE,
    amount DECIMAL(15, 2) NOT NULL,
    payment_method VARCHAR(50),
    payment_reference VARCHAR(100),
    payment_proof_url TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected')),
    verified_by INTEGER REFERENCES users(id),
    verified_at TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_user_id ON withdrawal_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_status ON withdrawal_requests(status);
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_created_at ON withdrawal_requests(created_at);
CREATE INDEX IF NOT EXISTS idx_withdrawal_status_history_request_id ON withdrawal_status_history(withdrawal_request_id);
CREATE INDEX IF NOT EXISTS idx_tax_payments_request_id ON tax_payments(withdrawal_request_id);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_withdrawal_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_withdrawal_requests_updated_at
    BEFORE UPDATE ON withdrawal_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_withdrawal_requests_updated_at();

-- Trigger to log status changes
CREATE OR REPLACE FUNCTION log_withdrawal_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO withdrawal_status_history (
            withdrawal_request_id,
            previous_status,
            new_status,
            changed_by
        ) VALUES (
            NEW.id,
            OLD.status,
            NEW.status,
            NEW.processed_by
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER log_withdrawal_status_change
    AFTER UPDATE ON withdrawal_requests
    FOR EACH ROW
    EXECUTE FUNCTION log_withdrawal_status_change();

-- Sample data for testing (optional)
-- INSERT INTO withdrawal_requests (
--     user_id, amount, withdrawal_method, 
--     bank_account_number, bank_routing_number, bank_account_holder_name, bank_name,
--     tax_fee, status
-- ) VALUES (
--     1, 5000.00, 'bank_transfer',
--     '1234567890', '123456789', 'John Doe', 'Bank of America',
--     600.00, 'pending_tax_payment'
-- );

COMMENT ON TABLE withdrawal_requests IS 'Stores user withdrawal requests with all payment method details';
COMMENT ON TABLE withdrawal_status_history IS 'Audit trail for withdrawal status changes';
COMMENT ON TABLE tax_payments IS 'Tracks tax fee payments for withdrawal requests';
COMMENT ON COLUMN withdrawal_requests.tax_fee IS '6% tax fee calculated from total account balance';
COMMENT ON COLUMN withdrawal_requests.status IS 'Current status of the withdrawal request';
COMMENT ON COLUMN tax_payments.payment_proof_url IS 'URL to uploaded payment proof document';