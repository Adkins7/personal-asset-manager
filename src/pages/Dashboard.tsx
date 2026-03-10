import React from 'react';
import { useAssetData } from '../hooks/useAssetData';
import { 
  TrendingUp, 
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
      {/* Summary Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl p-6 rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/30 transition-all duration-200 hover:shadow-2xl hover:scale-[1.02]">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-emerald-100/50 dark:bg-emerald-900/30 rounded-xl text-emerald-600 dark:text-emerald-400">
              <Wallet className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100/50 dark:bg-emerald-900/30 px-2.5 py-1 rounded-full">总资产</span>
          </div>
          <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">总资产价值</h3>
          <p className="text-3xl font-black text-gray-900 dark:text-white mt-2 tracking-tight">{formatCurrency(totalAssets)}</p>
        </div>

        <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl p-6 rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/30 transition-all duration-200 hover:shadow-2xl hover:scale-[1.02]">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-red-100/50 dark:bg-red-900/30 rounded-xl text-red-600 dark:text-red-400">
              <CreditCard className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-red-600 dark:text-red-400 bg-red-100/50 dark:bg-red-900/30 px-2.5 py-1 rounded-full">总负债</span>
          </div>
          <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">当前总欠款</h3>
          <p className="text-3xl font-black text-gray-900 dark:text-white mt-2 tracking-tight">{formatCurrency(totals.liabilities)}</p>
        </div>

        <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl p-6 rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/30 transition-all duration-200 hover:shadow-2xl hover:scale-[1.02]">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-100/50 dark:bg-blue-900/30 rounded-xl text-blue-600 dark:text-blue-400">
              <TrendingUp className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-100/50 dark:bg-blue-900/30 px-2.5 py-1 rounded-full">净资产</span>
          </div>
          <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">个人净资产</h3>
          <p className="text-3xl font-black text-gray-900 dark:text-white mt-2 tracking-tight">{formatCurrency(netAssets)}</p>
        </div>

        <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl p-6 rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/30 transition-all duration-200 hover:shadow-2xl hover:scale-[1.02]">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-amber-100/50 dark:bg-amber-900/30 rounded-xl text-amber-600 dark:text-amber-400">
              <PieChartIcon className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-100/50 dark:bg-amber-900/30 px-2.5 py-1 rounded-full">负债率</span>
          </div>
          <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">总负债占比</h3>
          <p className="text-3xl font-black text-gray-900 dark:text-white mt-2 tracking-tight">{debtRatio.toFixed(2)}%</p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl p-6 rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/30 transition-colors duration-200">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            净资产趋势 (7日)
          </h3>
          <div className="h-64">
            <Line 
              data={lineData} 
              options={{ 
                maintainAspectRatio: false,
                plugins: { 
                  legend: { display: false },
                  tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                  }
                },
                scales: { 
                  y: { 
                    beginAtZero: false,
                    grid: { color: 'rgba(200, 200, 200, 0.1)' },
                    ticks: { color: '#9ca3af' }
                  },
                  x: {
                    grid: { color: 'rgba(200, 200, 200, 0.1)' },
                    ticks: { color: '#9ca3af' }
                  }
                }
              }} 
            />
          </div>
        </div>

        <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl p-6 rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/30 transition-colors duration-200">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <PieChartIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            资产配置比例
          </h3>
          <div className="h-64 flex items-center justify-center">
            <Pie data={pieData} options={{ maintainAspectRatio: false }} />
          </div>
        </div>
      </div>

      {/* Recent Activity / Daily Earnings */}
      <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/30 overflow-hidden transition-colors duration-200">
        <div className="p-6 border-b border-gray-100 dark:border-gray-700/30 flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">当日收益概览</h3>
          <div className={`flex items-center gap-1 text-sm font-medium ${totals.dailyProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
            {totals.dailyProfit >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
            {formatCurrency(Math.abs(totals.dailyProfit))}
          </div>
        </div>
        <div className="p-6">
          <p className="text-sm text-gray-500 dark:text-gray-400">今日整体收益主要来自金融资产波动。</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
