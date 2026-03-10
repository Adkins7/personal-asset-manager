-- Initial schema migration for Personal Asset Management System

-- Financial Assets Table
CREATE TABLE financial_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL CHECK (type IN ('stock', 'fund', 'bank_card', 'wechat')),
  name VARCHAR(100) NOT NULL,
  current_balance DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  daily_profit_loss DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  total_profit_loss DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for financial_assets
CREATE INDEX idx_financial_assets_user_id ON financial_assets(user_id);
CREATE INDEX idx_financial_assets_type ON financial_assets(type);

-- Enable RLS for financial_assets
ALTER TABLE financial_assets ENABLE ROW LEVEL SECURITY;

-- Create policies for financial_assets
CREATE POLICY "Users can view own financial assets" ON financial_assets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own financial assets" ON financial_assets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own financial assets" ON financial_assets FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own financial assets" ON financial_assets FOR DELETE USING (auth.uid() = user_id);

-- Liabilities Table
CREATE TABLE liabilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL CHECK (type IN ('credit_card', 'huabei', 'jd_baitiao')),
  name VARCHAR(100) NOT NULL,
  credit_limit DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  used_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  available_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT check_credit_limit CHECK (used_amount <= credit_limit)
);

-- Create indexes for liabilities
CREATE INDEX idx_liabilities_user_id ON liabilities(user_id);
CREATE INDEX idx_liabilities_type ON liabilities(type);

-- Enable RLS for liabilities
ALTER TABLE liabilities ENABLE ROW LEVEL SECURITY;

-- Create policies for liabilities
CREATE POLICY "Users can view own liabilities" ON liabilities FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own liabilities" ON liabilities FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own liabilities" ON liabilities FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own liabilities" ON liabilities FOR DELETE USING (auth.uid() = user_id);

-- Other Assets Table
CREATE TABLE other_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type VARCHAR(30) NOT NULL CHECK (type IN ('daily_earnings', 'physical_assets', 'virtual_assets')),
  name VARCHAR(100) NOT NULL,
  value DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for other_assets
CREATE INDEX idx_other_assets_user_id ON other_assets(user_id);
CREATE INDEX idx_other_assets_type ON other_assets(type);

-- Enable RLS for other_assets
ALTER TABLE other_assets ENABLE ROW LEVEL SECURITY;

-- Create policies for other_assets
CREATE POLICY "Users can view own other assets" ON other_assets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own other assets" ON other_assets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own other assets" ON other_assets FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own other assets" ON other_assets FOR DELETE USING (auth.uid() = user_id);

-- Daily Reports Table
CREATE TABLE daily_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  report_date DATE NOT NULL,
  total_assets DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  total_liabilities DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  net_assets DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  debt_ratio DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  asset_breakdown JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, report_date)
);

-- Create indexes for daily_reports
CREATE INDEX idx_daily_reports_user_id ON daily_reports(user_id);
CREATE INDEX idx_daily_reports_date ON daily_reports(report_date);

-- Enable RLS for daily_reports
ALTER TABLE daily_reports ENABLE ROW LEVEL SECURITY;

-- Create policies for daily_reports
CREATE POLICY "Users can view own daily reports" ON daily_reports FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own daily reports" ON daily_reports FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Grant permissions to authenticated users
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO authenticated;
