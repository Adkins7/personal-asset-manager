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
      wechat: '微信/支付宝',
    };
    return names[type];
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">金融资产管理</h1>
          <div className="flex gap-4 mt-1 text-sm text-gray-500 items-center">
            <p>
              总余额：<span className="text-emerald-600 font-bold text-lg">{formatCurrency(totalBalance)}</span>
            </p>
            <span className="text-gray-300">|</span>
            <p>
              当日盈亏：
              <span className={`font-bold text-lg ${totalDailyProfit >= 0 ? 'text-red-500' : 'text-green-500'}`}>
                {totalDailyProfit > 0 ? '+' : ''}{formatCurrency(totalDailyProfit)}
              </span>
            </p>
            <span className="text-gray-300">|</span>
            <p>
              累计盈亏：
              <span className={`font-bold text-lg ${totalAccumulatedProfit >= 0 ? 'text-red-500' : 'text-green-500'}`}>
                {totalAccumulatedProfit > 0 ? '+' : ''}{formatCurrency(totalAccumulatedProfit)}
              </span>
            </p>
          </div>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          新增资产
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">资产名称</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">类型</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600 text-right">当前余额</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600 text-right">当日盈亏</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600 text-right">累计盈亏</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600 text-center">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {financialAssets.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    暂无金融资产数据，点击右上角新增
                  </td>
                </tr>
              ) : (
                financialAssets.map((asset) => (
                  <tr key={asset.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">{asset.name}</td>
                    <td className="px-6 py-4">
                      <span className="text-xs px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 font-medium">
                        {getTypeName(asset.type)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-mono">{formatCurrency(Number(asset.current_balance))}</td>
                    <td className={`px-6 py-4 text-right font-mono ${Number(asset.daily_profit_loss) >= 0 ? 'text-red-500' : 'text-green-500'}`}>
                      {Number(asset.daily_profit_loss) > 0 ? '+' : ''}{formatCurrency(Number(asset.daily_profit_loss))}
                    </td>
                    <td className={`px-6 py-4 text-right font-mono ${Number(asset.total_profit_loss) >= 0 ? 'text-red-500' : 'text-green-500'}`}>
                      {Number(asset.total_profit_loss) > 0 ? '+' : ''}{formatCurrency(Number(asset.total_profit_loss))}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleOpenModal(asset)}
                          className="p-1 text-gray-400 hover:text-emerald-600 transition-colors"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(asset.id)}
                          className="p-1 text-gray-400 hover:text-red-600 transition-colors"
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
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-md overflow-hidden animate-in zoom-in duration-200">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-emerald-600 text-white">
              <h3 className="text-lg font-bold">{editingAsset ? '编辑资产' : '新增金融资产'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="hover:rotate-90 transition-transform">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">资产类型</label>
                <select
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-emerald-500 focus:border-emerald-500"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as FinancialAssetType })}
                >
                  <option value="stock">股票账户</option>
                  <option value="fund">支付宝基金</option>
                  <option value="bank_card">银行卡</option>
                  <option value="wechat">微信钱包/零钱</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">资产名称</label>
                <input
                  type="text"
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="如：腾讯控股、易方达消费、招商银行卡"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">当前余额 (¥)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-emerald-500 focus:border-emerald-500"
                  value={formData.current_balance}
                  onChange={(e) => setFormData({ ...formData, current_balance: parseFloat(e.target.value) })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">当日盈亏 (¥)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-emerald-500 focus:border-emerald-500"
                    value={formData.daily_profit_loss}
                    onChange={(e) => setFormData({ ...formData, daily_profit_loss: parseFloat(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">累计盈亏 (¥)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-emerald-500 focus:border-emerald-500"
                    value={formData.total_profit_loss}
                    onChange={(e) => setFormData({ ...formData, total_profit_loss: parseFloat(e.target.value) })}
                  />
                </div>
              </div>
              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
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
