export type FinancialAssetType = 'stock' | 'fund' | 'bank_card' | 'wechat';
export type LiabilityType = 'credit_card' | 'huabei' | 'jd_baitiao';
export type OtherAssetType = 'daily_earnings' | 'physical_assets' | 'virtual_assets';

export interface FinancialAsset {
  id: string;
  user_id: string;
  type: FinancialAssetType;
  name: string;
  current_balance: number;
  daily_profit_loss: number;
  total_profit_loss: number;
  created_at: string;
  updated_at: string;
}

export interface Liability {
  id: string;
  user_id: string;
  type: LiabilityType;
  name: string;
  credit_limit: number;
  used_amount: number;
  available_amount: number;
  created_at: string;
  updated_at: string;
}

export interface OtherAsset {
  id: string;
  user_id: string;
  type: OtherAssetType;
  name: string;
  value: number;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface DailyReport {
  id: string;
  user_id: string;
  report_date: string;
  total_assets: number;
  total_liabilities: number;
  net_assets: number;
  debt_ratio: number;
  asset_breakdown: {
    financial: number;
    liabilities: number;
    other: number;
  };
  created_at: string;
}
