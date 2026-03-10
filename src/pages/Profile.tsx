import React, { useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { supabase } from '../lib/supabase';
import { Download, Upload, Shield, LogOut, User as UserIcon } from 'lucide-react';

const Profile = () => {
  const { user, signOut } = useAuthStore();
  const [loading, setLoading] = useState(false);

  const handleBackup = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [financial, liabilities, other] = await Promise.all([
        supabase.from('financial_assets').select('*').eq('user_id', user.id),
        supabase.from('liabilities').select('*').eq('user_id', user.id),
        supabase.from('other_assets').select('*').eq('user_id', user.id),
      ]);

      const backupData = {
        version: '1.0',
        timestamp: new Date().toISOString(),
        data: {
          financial_assets: financial.data,
          liabilities: liabilities.data,
          other_assets: other.data,
        }
      };

      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `assets_backup_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Backup failed:', error);
      alert('备份失败');
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!window.confirm('恢复备份将覆盖现有数据，确定继续吗？')) return;

    setLoading(true);
    try {
      const text = await file.text();
      const backup = JSON.parse(text);

      if (!backup.data) throw new Error('无效的备份文件');

      // Simple restore: delete all and insert
      await Promise.all([
        supabase.from('financial_assets').delete().eq('user_id', user.id),
        supabase.from('liabilities').delete().eq('user_id', user.id),
        supabase.from('other_assets').delete().eq('user_id', user.id),
      ]);

      const { financial_assets, liabilities, other_assets } = backup.data;

      const prepare = (list: any[]) => list.map(({ id, created_at, updated_at, ...rest }) => ({ ...rest, user_id: user.id }));

      if (financial_assets?.length) await supabase.from('financial_assets').insert(prepare(financial_assets));
      if (liabilities?.length) await supabase.from('liabilities').insert(prepare(liabilities));
      if (other_assets?.length) await supabase.from('other_assets').insert(prepare(other_assets));

      alert('数据恢复成功！');
      window.location.reload();
    } catch (error) {
      console.error('Restore failed:', error);
      alert('恢复失败: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">个人设置</h1>

      {/* Profile Card */}
      <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl p-8 rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/30 flex items-center gap-6">
        <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center text-emerald-600 dark:text-emerald-400">
          <UserIcon className="w-10 h-10" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">{user?.email}</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm">已通过邮箱验证</p>
          <div className="mt-2 flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 font-medium bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded-full w-fit">
            <Shield className="w-3 h-3" />
            数据已加密存储
          </div>
        </div>
      </div>

      {/* Backup & Recovery Section */}
      <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/30 overflow-hidden">
        <div className="p-6 border-b border-gray-100 dark:border-gray-700/30 bg-gray-50/50 dark:bg-gray-700/50">
          <h3 className="font-bold text-gray-900 dark:text-white">数据备份与恢复</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">导出您的所有数据以供备份，或从备份文件中恢复。</p>
        </div>
        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <button
            onClick={handleBackup}
            disabled={loading}
            className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl hover:border-emerald-500 dark:hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all group"
          >
            <Download className="w-8 h-8 text-gray-400 dark:text-gray-500 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 mb-2" />
            <span className="font-medium text-gray-700 dark:text-gray-300 group-hover:text-emerald-700 dark:group-hover:text-emerald-300">立即备份</span>
            <span className="text-xs text-gray-400 dark:text-gray-500 mt-1">下载 JSON 格式数据</span>
          </button>

          <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all group cursor-pointer">
            <input type="file" accept=".json" className="hidden" onChange={handleRestore} disabled={loading} />
            <Upload className="w-8 h-8 text-gray-400 dark:text-gray-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 mb-2" />
            <span className="font-medium text-gray-700 dark:text-gray-300 group-hover:text-blue-700 dark:group-hover:text-blue-300">恢复数据</span>
            <span className="text-xs text-gray-400 dark:text-gray-500 mt-1">上传备份的 JSON 文件</span>
          </label>
        </div>
      </div>

      {/* Security Info */}
      <div className="bg-amber-50 dark:bg-amber-900/20 p-6 rounded-xl border border-amber-100 dark:border-amber-900/30 flex gap-4">
        <Shield className="w-6 h-6 text-amber-600 dark:text-amber-400 shrink-0" />
        <div>
          <h4 className="font-bold text-amber-900 dark:text-amber-100 text-sm">安全提示</h4>
          <p className="text-xs text-amber-800 dark:text-amber-200 mt-1 leading-relaxed">
            您的敏感金融数据在传输过程中经过 SSL 加密。建议定期执行数据备份，并妥善保管您的登录凭据。
          </p>
        </div>
      </div>

      <button
        onClick={signOut}
        className="w-full flex items-center justify-center gap-2 py-3 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 rounded-xl font-medium hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
      >
        <LogOut className="w-5 h-5" />
        退出登录
      </button>
    </div>
  );
};

export default Profile;
