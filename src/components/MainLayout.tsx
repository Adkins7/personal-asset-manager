import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Wallet, 
  CreditCard, 
  Package, 
  BarChart3, 
  LogOut,
  Menu,
  X,
  Shield,
  Sun,
  Moon
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useThemeStore } from '../store/useThemeStore';
import { clsx } from 'clsx';

const MainLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { signOut, user } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const navItems = [
    { name: '仪表盘', icon: LayoutDashboard, path: '/dashboard' },
    { name: '金融资产', icon: Wallet, path: '/assets/financial' },
    { name: '负债管理', icon: CreditCard, path: '/assets/liabilities' },
    { name: '其他资产', icon: Package, path: '/assets/other' },
    { name: '报表中心', icon: BarChart3, path: '/reports' },
    { name: '个人设置', icon: Shield, path: '/profile' },
  ];

  const currentTitle = navItems.find(item => item.path === location.pathname)?.name || '资产管家';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex transition-colors duration-200">
      {/* Background Gradients */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-400/20 dark:bg-emerald-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-400/20 dark:bg-blue-600/10 rounded-full blur-[120px]" />
      </div>

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={clsx(
        "fixed md:static inset-y-0 left-0 w-64 bg-emerald-900 dark:bg-gray-800 text-white transform transition-transform duration-200 ease-in-out z-30",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}>
        <div className="h-full flex flex-col">
          <div className="p-6 flex items-center space-x-3">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-xl">💰</div>
            <h1 className="text-xl font-bold tracking-tight">资产管家</h1>
          </div>

          <nav className="flex-1 px-4 py-6 space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setIsSidebarOpen(false)}
                className={({ isActive }) => clsx(
                  "flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors text-sm font-medium",
                  isActive ? "bg-emerald-800 text-white" : "text-emerald-100 hover:bg-emerald-800 hover:text-white"
                )}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.name}</span>
              </NavLink>
            ))}
          </nav>

          <div className="p-4 border-t border-emerald-800 dark:border-gray-700">
            <div className="px-4 py-3 text-sm text-emerald-100 dark:text-gray-300 flex items-center space-x-2 truncate">
              <div className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="truncate">{user?.email}</span>
            </div>
            <button
              onClick={handleSignOut}
              className="w-full flex items-center space-x-3 px-4 py-3 text-emerald-100 hover:bg-emerald-800 dark:text-gray-300 dark:hover:bg-gray-700 hover:text-white rounded-lg transition-colors text-sm font-medium"
            >
              <LogOut className="w-5 h-5" />
              <span>退出登录</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative z-10">
        {/* Header */}
        <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-b border-gray-200/50 dark:border-gray-700/50 h-16 flex items-center justify-between px-4 md:px-8 shrink-0 transition-colors duration-200 sticky top-0 z-20">
          <button 
            className="p-2 -ml-2 text-gray-500 dark:text-gray-400 md:hidden"
            onClick={() => setIsSidebarOpen(true)}
          >
            <Menu className="w-6 h-6" />
          </button>
          
          <div className="flex-1 flex justify-center md:justify-start">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white md:ml-4">{currentTitle}</h2>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={toggleTheme}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </button>
            {/* User Profile / Notifications */}
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-auto p-4 md:p-8">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
};

export default MainLayout;
