import React, { useState } from 'react';
import { useAssetData } from '../hooks/useAssetData';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/useAuthStore';
import { Liability, LiabilityType } from '../types';
import { Plus, Pencil, Trash2, X, AlertCircle } from 'lucide-react';

const Liabilities = () => {
  const { liabilities, loading, refresh } = useAssetData();
  const { user } = useAuthStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLiability, setEditingLiability] = useState<Liability | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    type: 'credit_card' as LiabilityType,
    name: '',
    credit_limit: 0,
    used_amount: 0,
    available_amount: 0,
  });

  const BANKS = [
    '招商银行', '工商银行', '建设银行', '农业银行', '中国银行', 
    '交通银行', '中信银行', '浦发银行', '民生银行', '兴业银行', 
    '平安银行', '广发银行', '光大银行', '华夏银行', '邮储银行'
  ];

  const handleOpenModal = (liability?: Liability) => {
    setError(null);
    if (liability) {
      setEditingLiability(liability);
      setFormData({
        type: liability.type,
        name: liability.name,
        credit_limit: Number(liability.credit_limit),
        used_amount: Number(liability.used_amount),
        available_amount: Number(liability.available_amount),
      });
    } else {
      setEditingLiability(null);
      setFormData({
        type: 'credit_card',
        name: '',
        credit_limit: 0,
        used_amount: 0,
        available_amount: 0,
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setError(null);

    // Data Validation
    if (formData.available_amount > formData.credit_limit) {
      setError('可用额度不能超过授信额度');
      return;
    }

    // Duplicate Name Check
    const isDuplicateName = liabilities.some(
      (item) => item.name === formData.name && item.id !== editingLiability?.id
    );

    if (isDuplicateName) {
      setError('该负债名称已存在，请勿重复添加');
      return;
    }

    const used_amount = formData.credit_limit - formData.available_amount;

    try {
      if (editingLiability) {
        await supabase
          .from('liabilities')
          .update({
            ...formData,
            used_amount,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingLiability.id);
      } else {
        await supabase
          .from('liabilities')
          .insert([{ ...formData, used_amount, user_id: user.id }]);
      }
      setIsModalOpen(false);
      refresh();
    } catch (error: any) {
      setError(error.message || '保存失败');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('确定要删除这项负债吗？')) return;
    try {
      await supabase.from('liabilities').delete().eq('id', id);
      refresh();
    } catch (error) {
      console.error('Error deleting liability:', error);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: 'CNY',
    }).format(value);
  };

  const getTypeName = (type: LiabilityType) => {
    const names = {
      credit_card: '信用卡',
      huabei: '蚂蚁花呗',
      jd_baitiao: '京东白条',
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

  const totalCreditLimit = liabilities.reduce((sum, item) => sum + Number(item.credit_limit), 0);
  const totalUsedAmount = liabilities.reduce((sum, item) => sum + Number(item.used_amount), 0);
  const totalAvailableAmount = liabilities.reduce((sum, item) => sum + Number(item.available_amount), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">负债管理</h1>
          <div className="flex gap-4 mt-1 text-sm text-gray-500 items-center">
            <p>
              总授信：<span className="text-gray-900 font-bold text-lg">{formatCurrency(totalCreditLimit)}</span>
            </p>
            <span className="text-gray-300">|</span>
            <p>
              总欠款：<span className="text-red-600 font-bold text-lg">{formatCurrency(totalUsedAmount)}</span>
            </p>
            <span className="text-gray-300">|</span>
            <p>
              总可用：<span className="text-emerald-600 font-bold text-lg">{formatCurrency(totalAvailableAmount)}</span>
            </p>
          </div>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          新增负债
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">名称</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">类型</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600 text-right">授信额度</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600 text-right">已用额度</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600 text-right">可用额度</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600 text-center">使用率</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600 text-center">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {liabilities.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    暂无负债数据，点击右上角新增
                  </td>
                </tr>
              ) : (
                liabilities.map((item) => {
                  const usageRate = (Number(item.used_amount) / Number(item.credit_limit)) * 100;
                  return (
                    <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-gray-900">{item.name}</td>
                      <td className="px-6 py-4">
                        <span className="text-xs px-2 py-1 rounded-full bg-red-50 text-red-700 font-medium">
                          {getTypeName(item.type)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-mono">{formatCurrency(Number(item.credit_limit))}</td>
                      <td className="px-6 py-4 text-right font-mono text-red-600">{formatCurrency(Number(item.used_amount))}</td>
                      <td className="px-6 py-4 text-right font-mono text-emerald-600">{formatCurrency(Number(item.available_amount))}</td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col items-center gap-1">
                          <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div 
                              className={`h-full transition-all duration-500 ${usageRate > 80 ? 'bg-red-500' : usageRate > 50 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                              style={{ width: `${Math.min(usageRate, 100)}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-gray-400 font-medium">{usageRate.toFixed(1)}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleOpenModal(item)}
                            className="p-1 text-gray-400 hover:text-emerald-600 transition-colors"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-md overflow-hidden animate-in zoom-in duration-200">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-red-600 text-white">
              <h3 className="text-lg font-bold">{editingLiability ? '编辑负债' : '新增负债'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="hover:rotate-90 transition-transform">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="flex items-center gap-2 bg-red-50 text-red-600 p-3 rounded-lg text-sm">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">负债类型</label>
                <select
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-red-500 focus:border-red-500"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as LiabilityType })}
                >
                  <option value="credit_card">信用卡</option>
                  <option value="huabei">蚂蚁花呗</option>
                  <option value="jd_baitiao">京东白条</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">名称</label>
                {formData.type === 'credit_card' ? (
                  <div className="relative">
                    <input
                      type="text"
                      list="bank-list"
                      required
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-red-500 focus:border-red-500"
                      placeholder="请选择或输入银行名称"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                    <datalist id="bank-list">
                      {BANKS.map((bank) => (
                        <option key={bank} value={bank} />
                      ))}
                    </datalist>
                  </div>
                ) : (
                  <input
                    type="text"
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-red-500 focus:border-red-500"
                    placeholder="如：蚂蚁花呗、京东白条"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">授信额度 (¥)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-red-500 focus:border-red-500"
                    value={formData.credit_limit}
                    onChange={(e) => setFormData({ ...formData, credit_limit: parseFloat(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">可用额度 (¥)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-red-500 focus:border-red-500"
                    value={formData.available_amount}
                    onChange={(e) => setFormData({ ...formData, available_amount: parseFloat(e.target.value) })}
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
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium shadow-sm"
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

export default Liabilities;
