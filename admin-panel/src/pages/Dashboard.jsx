import { useState, useEffect } from 'react';
import { adminService } from '../services/adminService';
import { 
  Users, 
  Store, 
  Calendar, 
  CreditCard, 
  ShoppingBag,
  Wallet,
  TrendingUp,
  DollarSign
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await adminService.getDashboardStats();
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error('Dashboard stats error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Yükleniyor...</div>;
  }

  if (!stats) {
    return <div className="text-center py-12">Veri yüklenemedi</div>;
  }

  const statCards = [
    {
      title: 'Toplam Kullanıcı',
      value: stats.users?.total || 0,
      icon: Users,
      color: 'bg-blue-500',
      subValue: `${stats.users?.companies || 0} İşletme`,
    },
    {
      title: 'İşletmeler',
      value: stats.stores || 0,
      icon: Store,
      color: 'bg-green-500',
    },
    {
      title: 'Randevular',
      value: stats.appointments || 0,
      icon: Calendar,
      color: 'bg-purple-500',
    },
    {
      title: 'Toplam Ödeme',
      value: stats.payments?.total || 0,
      icon: CreditCard,
      color: 'bg-yellow-500',
    },
    {
      title: 'Toplam Gelir',
      value: new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(stats.payments?.revenue || 0),
      icon: DollarSign,
      color: 'bg-emerald-500',
    },
    {
      title: 'Siparişler',
      value: stats.orders || 0,
      icon: ShoppingBag,
      color: 'bg-pink-500',
    },
    {
      title: 'Onay Bekleyen Çalışan',
      value: stats.users?.pendingEmployees || 0,
      icon: Users,
      color: 'bg-orange-500',
    },
    {
      title: 'Bekleyen Para Çekme',
      value: stats.withdrawals?.pending || 0,
      icon: TrendingUp,
      color: 'bg-red-500',
    },
  ];

  const userTypeData = [
    { name: 'Müşteriler', value: stats.users?.total || 0 },
    { name: 'İşletmeler', value: stats.users?.companies || 0 },
    { name: 'Çalışanlar', value: stats.users?.employees || 0 },
  ];

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
                  {stat.subValue && (
                    <p className="text-xs text-gray-500 mt-1">{stat.subValue}</p>
                  )}
                </div>
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Kullanıcı Dağılımı</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={userTypeData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {userTypeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Özet Bilgiler</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Toplam İşletme</span>
              <span className="font-bold text-gray-800">{stats.stores || 0}</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Toplam Randevu</span>
              <span className="font-bold text-gray-800">{stats.appointments || 0}</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Toplam Sipariş</span>
              <span className="font-bold text-gray-800">{stats.orders || 0}</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Toplam Gelir</span>
              <span className="font-bold text-emerald-600">
                {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(stats.payments?.revenue || 0)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

