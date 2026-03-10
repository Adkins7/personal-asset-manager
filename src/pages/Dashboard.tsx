import React from 'react';
import { useAssetData } from '../hooks/useAssetData';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  CreditCard, 
  PieChart as PieChartIcon,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { 
  Chart as ChartJS, 
  ArcElement, 
  Tooltip, 
  Legend, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  Title 
} from 'chart.js';
import { Pie, Line } from 'react-chartjs-2';

ChartJS.register(
  ArcElement, 
  Tooltip, 
  Legend, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  Title
);

const Dashboard = () => {
  const { totals, totalAssets, netAssets, debtRatio, loading } = useAssetData();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: 'CNY',
      minimumFractionDigits: 2,
    }).format(value);
  };

  const pieData = {
    labels: ['金融资产', '其他资产', '负债'],
    datasets: [
      {
        data: [totals.financial, totals.other, totals.liabilities],
        backgroundColor: [
          'rgba(16, 185, 129, 0.8)', // Emerald 500
          'rgba(59, 130, 246, 0.8)', // Blue 500
          'rgba(239, 68, 68, 0.8)',   // Red 500
        ],
        borderColor: [
          'rgba(16, 185, 129, 1)',
          'rgba(59, 130, 246, 1)',
          'rgba(239, 68, 68, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const lineData = {
    labels: ['7日前', '6日前', '5日前', '4日前', '3日前', '2日前', '今日'],
    datasets: [
      {
        label: '净资产趋势',
        data: [0, 0, 0, 0, 0, 0, netAssets], // Mock data for now
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.5)',
        tension: 0.3,
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
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
              <Wallet className="w-6 h-6" />
            </div>
            <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">总资产</span>
          </div>
          <h3 className="text-gray-500 text-sm font-medium">总资产价值</h3>
          <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(totalAssets)}</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-red-50 rounded-lg text-red-600">
              <CreditCard className="w-6 h-6" />
            </div>
            <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-1 rounded-full">总负债</span>
          </div>
          <h3 className="text-gray-500 text-sm font-medium">当前总欠款</h3>
          <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(totals.liabilities)}</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
              <TrendingUp className="w-6 h-6" />
            </div>
            <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full">净资产</span>
          </div>
          <h3 className="text-gray-500 text-sm font-medium">个人净资产</h3>
          <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(netAssets)}</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-amber-50 rounded-lg text-amber-600">
              <PieChartIcon className="w-6 h-6" />
            </div>
            <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded-full">负债率</span>
          </div>
          <h3 className="text-gray-500 text-sm font-medium">总负债占比</h3>
          <p className="text-2xl font-bold text-gray-900 mt-1">{debtRatio.toFixed(2)}%</p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-600" />
            净资产趋势 (7日)
          </h3>
          <div className="h-64">
            <Line 
              data={lineData} 
              options={{ 
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: { y: { beginAtZero: false } }
              }} 
            />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
            <PieChartIcon className="w-5 h-5 text-emerald-600" />
            资产配置比例
          </h3>
          <div className="h-64 flex items-center justify-center">
            <Pie data={pieData} options={{ maintainAspectRatio: false }} />
          </div>
        </div>
      </div>

      {/* Recent Activity / Daily Earnings */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900">当日收益概览</h3>
          <div className={`flex items-center gap-1 text-sm font-medium ${totals.dailyProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            {totals.dailyProfit >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
            {formatCurrency(Math.abs(totals.dailyProfit))}
          </div>
        </div>
        <div className="p-6">
          <p className="text-sm text-gray-500">今日整体收益主要来自金融资产波动。</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
