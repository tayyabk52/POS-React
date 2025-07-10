import React, { useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  ShoppingCart, 
  Package, 
  Receipt, 
  Tag, 
  Users,
  UserCheck,
  Building,
  Monitor,
  Percent,
  Settings
} from 'lucide-react';
import { SettingsModalContext } from '../context/SettingsModalContext';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { openHandler } = useContext(SettingsModalContext);
  const location = useLocation();

  const navigation = [
    { name: 'Dashboard', href: '/', icon: Home },
    { name: 'POS', href: '/pos', icon: ShoppingCart },
    { name: 'Products', href: '/products', icon: Package },
    { name: 'Sales', href: '/sales', icon: Receipt },
    { name: 'Categories', href: '/categories', icon: Tag },
    { name: 'Customers', href: '/customers', icon: UserCheck },
    { name: 'Branches', href: '/branches', icon: Building },
    { name: 'Devices', href: '/devices', icon: Monitor },
    { name: 'Tax Rates', href: '/tax-rates', icon: Percent },
    { name: 'Users', href: '/users', icon: Users },
  ];

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 via-white to-gray-200 font-sans">
      {/* Sidebar */}
      <div className="w-64 bg-white/70 backdrop-blur-lg shadow-xl border-r border-gray-200 rounded-r-3xl m-2 flex flex-col">
        <div className="flex items-center justify-center h-16 bg-primary-600 text-white rounded-t-3xl shadow-md">
          <h1 className="text-2xl font-bold tracking-tight">POS System</h1>
        </div>
        <nav className="mt-8 flex-1">
          <div className="px-4 space-y-2">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center gap-3 px-4 py-2 text-base font-medium rounded-lg transition-all duration-200 group border-l-4 ${
                    isActive
                      ? 'bg-primary-100/80 text-primary-700 border-primary-600 shadow-sm'
                      : 'text-gray-700 border-transparent hover:bg-gray-100/80 hover:text-primary-700 hover:border-primary-200'
                  }`}
                >
                  <item.icon className={`h-5 w-5 transition-colors duration-200 ${isActive ? 'text-primary-600' : 'text-gray-400 group-hover:text-primary-500'}`} />
                  {item.name}
                </Link>
              );
            })}
            <Link
              to="/settings"
              className={`flex items-center gap-3 px-4 py-2 text-base font-medium rounded-lg transition-all duration-200 group border-l-4 mt-6 ${
                location.pathname === '/settings'
                  ? 'bg-primary-100/80 text-primary-700 border-primary-600 shadow-sm'
                  : 'text-gray-700 border-transparent hover:bg-gray-100/80 hover:text-primary-700 hover:border-primary-200'
              }`}
            >
              <Settings className={`h-5 w-5 transition-colors duration-200 ${location.pathname === '/settings' ? 'text-primary-600' : 'text-gray-400 group-hover:text-primary-500'}`} />
              Settings
            </Link>
          </div>
        </nav>
      </div>
      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden rounded-l-3xl m-2 bg-white/80 shadow-xl">
        {/* Header */}
        <header className="bg-white/80 shadow-md rounded-tl-3xl border-b border-gray-100 px-8 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900 tracking-tight">
            {navigation.find(item => item.href === location.pathname)?.name || 'Dashboard'}
          </h2>
          <div className="flex items-center space-x-4">
            <button className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-400 hover:text-primary-600 transition-colors shadow-sm">
              <Settings className="h-5 w-5" />
            </button>
          </div>
        </header>
        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-8 bg-gradient-to-br from-white/80 to-gray-50">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout; 