import React, { useState } from 'react';
import { useAssetData } from '../hooks/useAssetData';
import { useAuthStore } from '../store/useAuthStore';
import { supabase } from '../lib/supabase';
import { OtherAsset, OtherAssetType } from '../types';
import { Plus, Pencil, Trash2, X, Package } from 'lucide-react';

const OtherAssets = () => {
  const { otherAssets, loading, refresh } = useAssetData();
  const { user } = useAuthStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<OtherAsset | null>(null);
  const [formData, setFormData] = useState({
    type: 'physical_assets' as OtherAssetType,
    name: '',
    value: 0,
    quantity: 1, // Add quantity field
    description: '',
  });

  const handleOpenModal = (asset?: OtherAsset) => {
    if (asset) {
      setEditingAsset(asset);
      setFormData({
        type: asset.type,
        name: asset.name,
        value: Number(asset.value),
        quantity: 1, // Default to 1 for existing assets (since we didn't track it before)
        description: asset.description || '',
      });
    } else {
      setEditingAsset(null);
      setFormData({
        type: 'physical_assets',
        name: '',
        value: 0,
        quantity: 1,
        description: '',
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Calculate total value based on unit price * quantity
    // Note: The 'value' field in database stores the TOTAL value
    // So we treat the input 'value' as UNIT PRICE here, and multiply by quantity before saving
    // BUT wait, to avoid confusion, let's clarify the UI:
    // User inputs: Unit Price & Quantity
    // We display: Total = Unit Price * Quantity
    // We save: Total Value (as 'value' column)

    const totalValue = formData.value * formData.quantity;

    try {
      if (editingAsset) {
        await supabase
          .from('other_assets')
          .update({
            type: formData.type,
            name: formData.name,
            value: totalValue, // Save total value
            description: formData.description + ` (单价: ¥${formData.value}, 数量: ${formData.quantity})`, // Hack: store details in description for now
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingAsset.id);
      } else {
        await supabase
          .from('other_assets')
          .insert([{ 
            type: formData.type,
            name: formData.name,
            value: totalValue,
            description: formData.description + ` (单价: ¥${formData.value}, 数量: ${formData.quantity})`,
            user_id: user.id 
          }]);
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
      await supabase.from('other_assets').delete().eq('id', id);
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

  const getTypeName = (type: OtherAssetType) => {
    const names = {
      daily_earnings: '当日收益/红包',
      physical_assets: '实物资产',
      virtual_assets: '虚拟资产',
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

  const totalOtherAssets = otherAssets.reduce((sum, asset) => sum + Number(asset.value), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">其他资产管理</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            总价值：<span className="text-blue-600 dark:text-blue-400 font-bold text-lg">{formatCurrency(totalOtherAssets)}</span>
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          新增资产
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {otherAssets.length === 0 ? (
          <div className="col-span-full bg-white/50 dark:bg-gray-800/50 p-12 rounded-xl border border-dashed border-gray-300 dark:border-gray-600 flex flex-col items-center justify-center text-gray-500 dark:text-gray-400 backdrop-blur-sm">
            <Package className="w-12 h-12 mb-4 opacity-20" />
            <p>暂无其他资产数据，点击上方按钮新增</p>
          </div>
        ) : (
          otherAssets.map((asset) => (
            <div key={asset.id} className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl p-5 rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/30 hover:shadow-2xl hover:scale-[1.02] transition-all relative group duration-300">
              <div className="flex items-start justify-between mb-3">
                <span className={`text-[10px] px-2.5 py-1 rounded-lg font-bold uppercase tracking-wider ${
                  asset.type === 'daily_earnings' ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' : 
                  asset.type === 'physical_assets' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' : 'bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400'
                }`}>
                  {getTypeName(asset.type)}
                </span>
                <div className="flex gap-2 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleOpenModal(asset)} className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(asset.id)} className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <h3 className="text-base font-bold text-gray-800 dark:text-white mb-1">{asset.name}</h3>
              <p className="text-2xl font-black text-blue-600 dark:text-blue-400 mb-3">{formatCurrency(Number(asset.value))}</p>
              {asset.description && (
                <div className="text-xs text-gray-400 dark:text-gray-500 border-t border-gray-100 dark:border-gray-700 pt-3 leading-relaxed">
                  {asset.description}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-md overflow-hidden animate-in zoom-in duration-200 shadow-2xl border border-gray-100 dark:border-gray-700">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between bg-blue-600 text-white">
              <h3 className="text-lg font-bold">{editingAsset ? '编辑资产' : '新增其他资产'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="hover:rotate-90 transition-transform">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">资产类型</label>
                <select
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as OtherAssetType })}
                >
                  <option value="daily_earnings">当日收益 (返利/红包/薅羊毛)</option>
                  <option value="physical_assets">实物资产 (数码/奢侈品/保值物)</option>
                  <option value="virtual_assets">虚拟资产 (游戏账号/装备/皮肤)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">名称</label>
                <input
                  type="text"
                  required
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                  placeholder="如：今日外卖红包、iPhone 15 Pro、Steam账号"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">单价/估值 (¥)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: parseFloat(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">数量</label>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    required
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) })}
                  />
                </div>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg flex justify-between items-center text-blue-800 dark:text-blue-300 font-medium">
                <span>总价值：</span>
                <span className="text-lg">
                  {new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY' }).format(formData.value * formData.quantity)}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">备注说明</label>
                <textarea
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                  rows={3}
                  placeholder="添加更多细节描述..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
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
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm"
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

export default OtherAssets;
