-- CraftlyCV Supabase Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username VARCHAR(20) UNIQUE,
  scans INTEGER DEFAULT 10,
  plan VARCHAR(20) DEFAULT 'free',
  referral_code VARCHAR(10) UNIQUE,
  referred_by UUID REFERENCES profiles(id),
  resume_updated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Resumes table
CREATE TABLE IF NOT EXISTS resumes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT,
  ats_score INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payment transactions table
CREATE TABLE IF NOT EXISTS payment_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  payment_id VARCHAR(100) UNIQUE NOT NULL,
  order_id VARCHAR(100),
  plan_id VARCHAR(20),
  scans_added INTEGER,
  amount INTEGER,
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Referrals table
CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referrer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  referred_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  credits_awarded INTEGER DEFAULT 5,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Scan logs table
CREATE TABLE IF NOT EXISTS scan_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  action_type VARCHAR(50) NOT NULL,
  scans_used INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Atomic RPC function to add scans (prevents race conditions)
CREATE OR REPLACE FUNCTION add_scans(p_user_id UUID, p_amount INTEGER)
RETURNS void AS $$
BEGIN
  UPDATE profiles 
  SET scans = scans + p_amount,
      updated_at = NOW()
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Atomic RPC function to deduct scans (fails if insufficient balance)
CREATE OR REPLACE FUNCTION deduct_scan(p_user_id UUID, p_amount INTEGER)
RETURNS void AS $$
DECLARE
  current_scans INTEGER;
BEGIN
  -- Get current scans with row lock
  SELECT scans INTO current_scans 
  FROM profiles 
  WHERE id = p_user_id 
  FOR UPDATE;
  
  -- Check if enough scans
  IF current_scans < p_amount THEN
    RAISE EXCEPTION 'Insufficient scans';
  END IF;
  
  -- Deduct scans (never go negative)
  UPDATE profiles 
  SET scans = GREATEST(0, scans - p_amount),
      updated_at = NOW()
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE scan_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for resumes
CREATE POLICY "Users can view own resumes" ON resumes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own resumes" ON resumes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own resumes" ON resumes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own resumes" ON resumes FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for payment_transactions
CREATE POLICY "Users can view own transactions" ON payment_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service can insert transactions" ON payment_transactions FOR INSERT WITH CHECK (true);

-- RLS Policies for scan_logs
CREATE POLICY "Users can view own scan logs" ON scan_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service can insert scan logs" ON scan_logs FOR INSERT WITH CHECK (true);

-- RLS Policies for referrals
CREATE POLICY "Users can view referrals" ON referrals FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_referral_code ON profiles(referral_code);
CREATE INDEX IF NOT EXISTS idx_resumes_user_id ON resumes(user_id);
CREATE INDEX IF NOT EXISTS idx_scan_logs_user_id ON scan_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_user_id ON payment_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_payment_id ON payment_transactions(payment_id);
