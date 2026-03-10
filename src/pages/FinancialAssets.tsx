import React, { useState } from 'react';
import { useAssetData } from '../hooks/useAssetData';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/useAuthStore';
import { FinancialAsset, FinancialAssetType } from '../types';
import { Plus, Pencil, Trash2, X } from 'lucide-react';

const FinancialAssets = () => {
  const { financialAssets, loading, refresh } = useAssetData();
  const { user } = useAuthStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<FinancialAsset | null>(null);
  const [formData, setFormData] = useState({
    type: 'stock' as FinancialAssetType,
    name: '',
    current_balance: 0,
    daily_profit_loss: 0,
    total_profit_loss: 0,
  });

  const handleOpenModal = (asset?: FinancialAsset) => {
    if (asset) {
      setEditingAsset(asset);
      setFormData({
        type: asset.type,
        name: asset.name,
        current_balance: Number(asset.current_balance),
        daily_profit_loss: Number(asset.daily_profit_loss),
        total_profit_loss: Number(asset.total_profit_loss),
      });
    } else {
      setEditingAsset(null);
      setFormData({
        type: 'stock',
        name: '',
        current_balance: 0,
        daily_profit_loss: 0,
        total_profit_loss: 0,
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      if (editingAsset) {
        await supabase
          .from('financial_assets')
          .update({
            ...formData,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingAsset.id);
      } else {
        await supabase
          .from('financial_assets')
          .insert([{ ...formData, user_id: user.id }]);
      }
      setIsModalOpen(false);
      refresh();
    } catch (error) {
      console.error('Error saving asset:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('确定要删除这项资产吗？')) return;
    try {
      await supabase.from('financial_assets').delete().eq('id', id);
      refresh();
    } catch (error) {
      console.error('Error deleting asset:', error);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: 'CNY',
    }).format(value);
  };

  const getTypeName = (type: FinancialAssetType) => {
    const names = {
      stock: '股票',
      fund: '基金',
      bank_card: '银行卡',
      wechat: '电子钱包',
    };
    return names[type];
  };

  const isInvestment = (type: FinancialAssetType) => {
    return type === 'stock' || type === 'fund';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  const totalBalance = financialAssets.reduce((sum, asset) => sum + Number(asset.current_balance), 0);
  const totalDailyProfit = financialAssets.reduce((sum, asset) => sum + Number(asset.daily_profit_loss), 0);
  const totalAccumulatedProfit = financialAssets.reduce((sum, asset) => sum + Number(asset.total_profit_loss), 0);

  return (
    <div className="space-y-6">
      {/* Header Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">金融资产管理</h1>
          <div className="flex flex-wrap gap-2 sm:gap-4 mt-2 text-sm text-gray-500 dark:text-gray-400 items-center">
            <p>
              总余额：<span className="text-emerald-600 dark:text-emerald-400 font-bold text-lg">{formatCurrency(totalBalance)}</span>
            </p>
            <span className="hidden sm:inline text-gray-300 dark:text-gray-600">|</span>
            <div className="w-full sm:w-auto flex gap-4 sm:gap-4">
              <p>
                当日盈亏：
                <span className={`font-bold text-lg ${totalDailyProfit >= 0 ? 'text-red-500 dark:text-red-400' : 'text-green-500 dark:text-green-400'}`}>
                  {totalDailyProfit > 0 ? '+' : ''}{formatCurrency(totalDailyProfit)}
                </span>
              </p>
              <span className="hidden sm:inline text-gray-300 dark:text-gray-600">|</span>
              <p>
                累计盈亏：
                <span className={`font-bold text-lg ${totalAccumulatedProfit >= 0 ? 'text-red-500 dark:text-red-400' : 'text-green-500 dark:text-green-400'}`}>
                  {totalAccumulatedProfit > 0 ? '+' : ''}{formatCurrency(totalAccumulatedProfit)}
                </span>
              </p>
            </div>
          </div>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          新增资产
        </button>
      </div>

      <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-xl shadow-xl border border-white/20 dark:border-gray-700/30 overflow-hidden">
        {/* Mobile View: Cards */}
        <div className="block sm:hidden divide-y divide-gray-200/50 dark:divide-gray-700/50">
          {financialAssets.length === 0 ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              暂无金融资产数据，点击上方新增
            </div>
          ) : (
            financialAssets.map((asset) => (
              <div key={asset.id} className="p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white">{asset.name}</h3>
                    <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-medium">
                      {getTypeName(asset.type)}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleOpenModal(asset)} className="p-1.5 text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(asset.id)} className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500 dark:text-gray-400 block text-xs">当前余额</span>
                    <span className="font-mono font-medium text-lg dark:text-gray-200">{formatCurrency(Number(asset.current_balance))}</span>
                  </div>
                  <div className="text-right">
                     {/* Empty for alignment if needed, or put daily profit here */}
                  </div>
                  
                  {isInvestment(asset.type) && (
                    <>
                      <div>
                        <span className="text-gray-500 dark:text-gray-400 block text-xs">当日盈亏</span>
                        <span className={`font-mono font-medium ${Number(asset.daily_profit_loss) >= 0 ? 'text-red-500 dark:text-red-400' : 'text-green-500 dark:text-green-400'}`}>
                          {Number(asset.daily_profit_loss) > 0 ? '+' : ''}{formatCurrency(Number(asset.daily_profit_loss))}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-gray-500 dark:text-gray-400 block text-xs">累计盈亏</span>
                        <span className={`font-mono font-medium ${Number(asset.total_profit_loss) >= 0 ? 'text-red-500 dark:text-red-400' : 'text-green-500 dark:text-green-400'}`}>
                          {Number(asset.total_profit_loss) > 0 ? '+' : ''}{formatCurrency(Number(asset.total_profit_loss))}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop View: Table */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 dark:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700/30">
                <th className="px-6 py-4 text-sm font-semibold text-gray-600 dark:text-gray-300">资产名称</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600 dark:text-gray-300">类型</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600 dark:text-gray-300 text-right">当前余额</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600 dark:text-gray-300 text-right">当日盈亏</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600 dark:text-gray-300 text-right">累计盈亏</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600 dark:text-gray-300 text-center">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-700/30">
              {financialAssets.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    暂无金融资产数据，点击右上角新增
                  </td>
                </tr>
              ) : (
                financialAssets.map((asset) => (
                  <tr key={asset.id} className="hover:bg-white/50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{asset.name}</td>
                    <td className="px-6 py-4">
                      <span className="text-xs px-2 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-medium">
                        {getTypeName(asset.type)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-mono dark:text-gray-200">{formatCurrency(Number(asset.current_balance))}</td>
                    <td className={`px-6 py-4 text-right font-mono ${Number(asset.daily_profit_loss) >= 0 ? 'text-red-500 dark:text-red-400' : 'text-green-500 dark:text-green-400'}`}>
                      {isInvestment(asset.type) ? (Number(asset.daily_profit_loss) > 0 ? '+' : '') + formatCurrency(Number(asset.daily_profit_loss)) : '-'}
                    </td>
                    <td className={`px-6 py-4 text-right font-mono ${Number(asset.total_profit_loss) >= 0 ? 'text-red-500 dark:text-red-400' : 'text-green-500 dark:text-green-400'}`}>
                      {isInvestment(asset.type) ? (Number(asset.total_profit_loss) > 0 ? '+' : '') + formatCurrency(Number(asset.total_profit_loss)) : '-'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleOpenModal(asset)}
                          className="p-1 text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(asset.id)}
                          className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-md overflow-hidden animate-in zoom-in duration-200 shadow-2xl border border-gray-100 dark:border-gray-700">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between bg-emerald-600 text-white">
              <h3 className="text-lg font-bold">{editingAsset ? '编辑资产' : '新增金融资产'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="hover:rotate-90 transition-transform">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">资产类型</label>
                <select
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as FinancialAssetType })}
                >
                  <option value="stock">股票账户</option>
                  <option value="fund">支付宝基金</option>
                  <option value="bank_card">银行卡</option>
                  <option value="wechat">微信/支付宝余额</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">资产名称</label>
                <input
                  type="text"
                  required
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                  placeholder="如：腾讯控股、易方达消费、招商银行卡"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">当前余额 (¥)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  value={formData.current_balance}
                  onChange={(e) => setFormData({ ...formData, current_balance: parseFloat(e.target.value) })}
                />
              </div>
              {isInvestment(formData.type) && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">当日盈亏 (¥)</label>
                    <input
                      type="number"
                      step="0.01"
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      value={formData.daily_profit_loss}
                      onChange={(e) => setFormData({ ...formData, daily_profit_loss: parseFloat(e.target.value) })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">累计盈亏 (¥)</label>
                    <input
                      type="number"
                      step="0.01"
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      value={formData.total_profit_loss}
                      onChange={(e) => setFormData({ ...formData, total_profit_loss: parseFloat(e.target.value) })}
                    />
                  </div>
                </div>
              )}
              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium shadow-sm"
                >
                  确认保存
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinancialAssets;
