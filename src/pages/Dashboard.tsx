import React, { useState, useEffect } from 'react';
import { DollarSign, ShoppingCart, Package, TrendingUp } from 'lucide-react';

interface DashboardStats {
  totalSales: number;
  totalRevenue: number;
  totalProducts: number;
  totalCategories: number;
}

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalSales: 0,
    totalRevenue: 0,
    totalProducts: 0,
    totalCategories: 0,
  });

  useEffect(() => {
    // TODO: Fetch dashboard stats from API
    setStats({
      totalSales: 150,
      totalRevenue: 12500.50,
      totalProducts: 45,
      totalCategories: 8,
    });
  }, []);

  const statCards = [
    {
      name: 'Total Sales',
      value: stats.totalSales,
      icon: ShoppingCart,
      color: 'bg-blue-500',
    },
    {
      name: 'Total Revenue',
      value: `$${stats.totalRevenue.toFixed(2)}`,
      icon: DollarSign,
      color: 'bg-green-500',
    },
    {
      name: 'Total Products',
      value: stats.totalProducts,
      icon: Package,
      color: 'bg-purple-500',
    },
    {
      name: 'Categories',
      value: stats.totalCategories,
      icon: TrendingUp,
      color: 'bg-orange-500',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Overview of your POS system</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => (
          <div
            key={stat.name}
            className="bg-white rounded-lg shadow p-6 border border-gray-200"
          >
            <div className="flex items-center">
              <div className={`p-3 rounded-full ${stat.color}`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stat.value}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  New sale completed - $125.50
                </p>
                <p className="text-xs text-gray-500">2 minutes ago</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  Product "Coffee Beans" stock updated
                </p>
                <p className="text-xs text-gray-500">15 minutes ago</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  New category "Beverages" added
                </p>
                <p className="text-xs text-gray-500">1 hour ago</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Quick Actions</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <ShoppingCart className="h-8 w-8 text-primary-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-900">New Sale</p>
            </button>
            <button className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <Package className="h-8 w-8 text-primary-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-900">Add Product</p>
            </button>
            <button className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <TrendingUp className="h-8 w-8 text-primary-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-900">View Reports</p>
            </button>
            <button className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <DollarSign className="h-8 w-8 text-primary-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-900">Daily Summary</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 