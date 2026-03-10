import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { FinancialAsset, Liability, OtherAsset } from '../types';
import { useAuthStore } from '../store/useAuthStore';

export const useAssetData = () => {
  const [financialAssets, setFinancialAssets] = useState<FinancialAsset[]>([]);
  const [liabilities, setLiabilities] = useState<Liability[]>([]);
  const [otherAssets, setOtherAssets] = useState<OtherAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    
    try {
      const [financialRes, liabilitiesRes, otherRes] = await Promise.all([
        supabase.from('financial_assets').select('*').eq('user_id', user.id),
        supabase.from('liabilities').select('*').eq('user_id', user.id),
        supabase.from('other_assets').select('*').eq('user_id', user.id),
      ]);

      if (financialRes.data) setFinancialAssets(financialRes.data);
      if (liabilitiesRes.data) setLiabilities(liabilitiesRes.data);
      if (otherRes.data) setOtherAssets(otherRes.data);
    } catch (error) {
      console.error('Error fetching asset data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const totals = {
    financial: financialAssets.reduce((sum, item) => sum + Number(item.current_balance), 0),
    liabilities: liabilities.reduce((sum, item) => sum + Number(item.used_amount), 0),
    other: otherAssets.reduce((sum, item) => sum + Number(item.value), 0),
    dailyProfit: financialAssets.reduce((sum, item) => sum + Number(item.daily_profit_loss), 0),
  };

  const totalAssets = totals.financial + totals.other;
  const netAssets = totalAssets - totals.liabilities;
  const debtRatio = totalAssets > 0 ? (totals.liabilities / totalAssets) * 100 : 0;

  return {
    financialAssets,
    liabilities,
    otherAssets,
    totals,
    totalAssets,
    netAssets,
    debtRatio,
    loading,
    refresh: fetchData
  };
};
