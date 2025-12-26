import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Store, 
  Calendar, 
  CreditCard, 
  ShoppingBag,
  Wallet,
  TrendingUp,
  Package,
  Star,
  UserCheck,
  LogOut
} from 'lucide-react';
import { authService } from '../services/authService';

const menuItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/users', label: 'Kullanıcılar', icon: Users },
  { path: '/stores', label: 'İşletmeler', icon: Store },
  { path: '/appointments', label: 'Randevular', icon: Calendar },
  { path: '/payments', label: 'Ödemeler', icon: CreditCard },
  { path: '/orders', label: 'Siparişler', icon: ShoppingBag },
  { path: '/wallets', label: 'Cüzdanlar', icon: Wallet },
  { path: '/withdrawal-requests', label: 'Para Çekme Talepleri', icon: TrendingUp },
  { path: '/products', label: 'Ürünler', icon: Package },
  { path: '/reviews', label: 'Yorumlar', icon: Star },
  { path: '/employees', label: 'Çalışanlar', icon: UserCheck },
];

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const user = authService.getCurrentUser();

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-lg">
        <div className="p-6 border-b">
          <h1 className="text-2xl font-bold text-primary-600">Bakimla Admin</h1>
        </div>
        <nav className="mt-6">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center px-6 py-3 text-gray-700 hover:bg-primary-50 hover:text-primary-600 transition-colors ${
                  isActive ? 'bg-primary-50 text-primary-600 border-r-4 border-primary-600' : ''
                }`}
              >
                <Icon className="w-5 h-5 mr-3" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="absolute bottom-0 w-64 p-6 border-t">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-gray-700">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-gray-500">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Çıkış Yap
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

