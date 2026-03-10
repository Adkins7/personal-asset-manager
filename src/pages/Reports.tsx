import React, { useState } from 'react';
import { useAssetData } from '../hooks/useAssetData';
import { useAuthStore } from '../store/useAuthStore';
import { supabase } from '../lib/supabase';
import { numberToChineseCapital } from '../utils/currency';
import { 
  FileSpreadsheet, 
  Download, 
  PieChart as PieChartIcon, 
  Activity,
  Calendar,
  ChevronRight,
  History
} from 'lucide-react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';
import * as XLSX from 'xlsx';

ChartJS.register(ArcElement, Tooltip, Legend);

const Reports = () => {
  const { user } = useAuthStore();
  const [archiving, setArchiving] = useState(false);
  const { 
    financialAssets, 
    liabilities, 
    otherAssets, 
    totals, 
    totalAssets, 
    netAssets, 
    debtRatio, 
    loading 
  } = useAssetData();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: 'CNY',
    }).format(value);
  };

  const handleExportExcel = () => {
    const wb = XLSX.utils.book_new();

    const dateStr = new Date().toLocaleString();

    // Helper to format currency for Excel strings
    const excelFormat = (num: number) => {
      return new Intl.NumberFormat('zh-CN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(num);
    };

    // 1. Financial Assets Sheet
    const financialRows = financialAssets.map(item => ({
      '资产名称': item.name,
      '当前余额 (¥)': item.current_balance,
      '当日盈亏 (¥)': item.daily_profit_loss,
      '累计盈亏 (¥)': item.total_profit_loss,
      '更新时间': new Date(item.updated_at).toLocaleString(),
    }));
    
    // Add a total row
    financialRows.push({
      '资产名称': '合计',
      '当前余额 (¥)': financialAssets.reduce((sum, a) => sum + Number(a.current_balance), 0),
      '当日盈亏 (¥)': financialAssets.reduce((sum, a) => sum + Number(a.daily_profit_loss), 0),
      '累计盈亏 (¥)': financialAssets.reduce((sum, a) => sum + Number(a.total_profit_loss), 0),
      '更新时间': '-'
    });

    const wsFinancial = XLSX.utils.json_to_sheet(financialRows);
    wsFinancial['!cols'] = [{ wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(wb, wsFinancial, "1.金融资产明细");

    // 2. Liabilities Sheet
    const liabilitiesRows = liabilities.map(item => ({
      '名称': item.name,
      '授信额度 (¥)': item.credit_limit,
      '已用额度 (¥)': item.used_amount,
      '可用额度 (¥)': item.available_amount,
      '更新时间': new Date(item.updated_at).toLocaleString(),
    }));

    liabilitiesRows.push({
      '名称': '合计',
      '授信额度 (¥)': liabilities.reduce((sum, a) => sum + Number(a.credit_limit), 0),
      '已用额度 (¥)': liabilities.reduce((sum, a) => sum + Number(a.used_amount), 0),
      '可用额度 (¥)': liabilities.reduce((sum, a) => sum + Number(a.available_amount), 0),
      '更新时间': '-'
    });

    const wsLiabilities = XLSX.utils.json_to_sheet(liabilitiesRows);
    wsLiabilities['!cols'] = [{ wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(wb, wsLiabilities, "2.负债管理明细");

    // 3. Other Assets Sheet
    const otherRows = otherAssets.map(item => ({
      '名称': item.name,
      '估值 (¥)': item.value,
      '备注/描述': item.description || '',
      '更新时间': new Date(item.updated_at).toLocaleString(),
    }));

    otherRows.push({
      '名称': '合计',
      '估值 (¥)': otherAssets.reduce((sum, a) => sum + Number(a.value), 0),
      '备注/描述': '-',
      '更新时间': '-'
    });

    const wsOther = XLSX.utils.json_to_sheet(otherRows);
    wsOther['!cols'] = [{ wch: 20 }, { wch: 15 }, { wch: 30 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(wb, wsOther, "3.其他资产明细");

    // 4. Summary Sheet
    const summaryRows = [
      { '资产分类统计': '--- 全局概览 ---', '数值': '' },
      { '资产分类统计': '总资产 (A+B)', '数值': excelFormat(totalAssets) },
      { '资产分类统计': '总负债 (C)', '数值': excelFormat(totals.liabilities) },
      { '资产分类统计': '个人净资产 (A+B-C)', '数值': excelFormat(netAssets) },
      { '资产分类统计': '当前负债率', '数值': `${debtRatio.toFixed(2)}%` },
      { '资产分类统计': '', '数值': '' },
      { '资产分类统计': '--- 模块明细汇总 ---', '数值': '' },
      { '资产分类统计': 'A. 金融资产总额', '数值': excelFormat(totals.financial) },
      { '资产分类统计': 'B. 其他资产总额', '数值': excelFormat(totals.other) },
      { '资产分类统计': 'C. 负债欠款总额', '数值': excelFormat(totals.liabilities) },
      { '资产分类统计': '', '数值': '' },
      { '资产分类统计': '报告生成时间', '数值': dateStr },
      { '资产分类统计': '报告持有人', '数值': user?.email || '未认证用户' }
    ];

    const wsSummary = XLSX.utils.json_to_sheet(summaryRows);
    wsSummary['!cols'] = [{ wch: 25 }, { wch: 25 }];
    XLSX.utils.book_append_sheet(wb, wsSummary, "资产汇总报告");

    XLSX.writeFile(wb, `个人资产深度报告_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleArchiveSnapshot = async () => {
    if (!user) return;
    if (!window.confirm('确定要归档今日资产快照吗？这将保存您今天的总资产记录。')) return;
    
    setArchiving(true);
    try {
      // 1. Check if snapshot already exists for today
      const today = new Date().toISOString().split('T')[0];
      const { data: existing } = await supabase
        .from('daily_snapshots')
        .select('id')
        .eq('user_id', user.id)
        .eq('snapshot_date', today)
        .single();

      const snapshotData = {
        user_id: user.id,
        snapshot_date: today,
        total_assets: totalAssets,
        total_liabilities: totals.liabilities,
        net_assets: netAssets,
        asset_breakdown: {
          financial: totals.financial,
          other: totals.other,
          liabilities: totals.liabilities
        }
      };

      if (existing) {
        // Update existing snapshot
        const { error } = await supabase
          .from('daily_snapshots')
          .update(snapshotData)
          .eq('id', existing.id);
        if (error) throw error;
        alert('今日快照已更新！');
      } else {
        // Create new snapshot
        const { error } = await supabase
          .from('daily_snapshots')
          .insert([snapshotData]);
        if (error) throw error;
        alert('今日资产已成功归档！');
      }
    } catch (error: any) {
      console.error('Error archiving snapshot:', error);
      alert('归档失败：' + error.message);
    } finally {
      setArchiving(false);
    }
  };

  const pieData = {
    labels: ['金融资产', '其他资产', '负债'],
    datasets: [
      {
        data: [totals.financial, totals.other, totals.liabilities],
        backgroundColor: [
          'rgba(16, 185, 129, 0.8)',
          'rgba(59, 130, 246, 0.8)',
          'rgba(239, 68, 68, 0.8)',
        ],
        borderWidth: 0,
      },
    ],
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">报表中心</h1>
        <div className="flex gap-3">
          <button
            onClick={handleArchiveSnapshot}
            disabled={archiving}
            className="flex items-center gap-2 bg-white text-emerald-600 border border-emerald-600 px-4 py-2 rounded-lg hover:bg-emerald-50 transition-all shadow-sm active:scale-95 disabled:opacity-50"
          >
            <History className="w-4 h-4" />
            {archiving ? '归档中...' : '归档今日快照'}
          </button>
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-all shadow-sm active:scale-95"
          >
            <Download className="w-4 h-4" />
            导出 Excel 报告
          </button>
        </div>
      </div>

      {/* Daily Summary Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-emerald-600 p-8 text-white">
          <div className="flex items-center gap-2 text-emerald-100 mb-4">
            <Calendar className="w-4 h-4" />
            <span className="text-sm font-medium">{new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </div>
          <h2 className="text-sm font-medium text-emerald-100 uppercase tracking-wider mb-1">当前个人净资产</h2>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold">{formatCurrency(netAssets)}</span>
            <span className="text-emerald-100 text-sm opacity-80">RMB</span>
          </div>
          <div className="mt-6 p-4 bg-white/10 rounded-xl backdrop-blur-sm border border-white/10">
            <p className="text-xs text-emerald-100 mb-1 opacity-80">大写金额</p>
            <p className="text-lg font-medium">{numberToChineseCapital(netAssets)}</p>
          </div>
        </div>

        <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-1">
            <p className="text-gray-500 text-sm font-medium">总资产价值</p>
            <p className="text-xl font-bold text-gray-900">{formatCurrency(totalAssets)}</p>
          </div>
          <div className="space-y-1">
            <p className="text-gray-500 text-sm font-medium">总负债额度</p>
            <p className="text-xl font-bold text-red-600">{formatCurrency(totals.liabilities)}</p>
          </div>
          <div className="space-y-1">
            <p className="text-gray-500 text-sm font-medium">当前负债率</p>
            <p className={`text-xl font-bold ${debtRatio > 50 ? 'text-red-600' : 'text-emerald-600'}`}>
              {debtRatio.toFixed(2)}%
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Asset Breakdown */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
            <PieChartIcon className="w-5 h-5 text-emerald-600" />
            资产分布占比
          </h3>
          <div className="h-64 flex items-center justify-center">
            <Pie data={pieData} options={{ maintainAspectRatio: false }} />
          </div>
        </div>

        {/* Breakdown List */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-600" />
            各模块资产明细
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-default">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-sm font-medium text-gray-700">金融资产</span>
              </div>
              <span className="text-sm font-bold text-gray-900">{formatCurrency(totals.financial)}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-default">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                <span className="text-sm font-medium text-gray-700">其他资产</span>
              </div>
              <span className="text-sm font-bold text-gray-900">{formatCurrency(totals.other)}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-default">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-red-500" />
                <span className="text-sm font-medium text-gray-700">总负债</span>
              </div>
              <span className="text-sm font-bold text-gray-900">{formatCurrency(totals.liabilities)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
