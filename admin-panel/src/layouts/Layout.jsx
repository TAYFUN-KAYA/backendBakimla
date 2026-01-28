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
  LogOut,
  Gift,
  MapPin,
  Bell,
  Settings,
  FileText,
  Award,
  Receipt,
  Heart,
  ShoppingCart,
  Tag,
  Megaphone,
  Clock,
  Database,
  History,
  Key
} from 'lucide-react';
import { authService } from '../services/authService';

const menuItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/users', label: 'Kullanıcılar', icon: Users },
  { path: '/stores', label: 'İşletmeler', icon: Store },
  { path: '/appointments', label: 'Randevular', icon: Calendar },
  { path: '/quick-appointments', label: 'Hızlı Randevular', icon: Clock },
  { path: '/payments', label: 'Ödemeler', icon: CreditCard },
  { path: '/payment-methods', label: 'Ödeme Yöntemleri', icon: CreditCard },
  { path: '/orders', label: 'Siparişler', icon: ShoppingBag },
  { path: '/wallets', label: 'Cüzdanlar', icon: Wallet },
  { path: '/islet-kazan', label: 'İşlet Kazan', icon: Gift },
  { path: '/withdrawal-requests', label: 'Para Çekme Talepleri', icon: TrendingUp },
  { path: '/products', label: 'Ürünler', icon: Package },
  { path: '/baskets', label: 'Sepetler', icon: ShoppingCart },
  { path: '/favorites', label: 'Favoriler', icon: Heart },
  { path: '/reviews', label: 'Yorumlar', icon: Star },
  { path: '/employees', label: 'Çalışanlar', icon: UserCheck },
  { path: '/customers', label: 'Müşteriler', icon: Users },
  { path: '/campaigns', label: 'Kampanyalar', icon: Gift },
  { path: '/coupons', label: 'Kuponlar', icon: Tag },
  { path: '/bakimla-store-coupons', label: 'Bakimla Store Kuponları', icon: Tag },
  { path: '/user-campaigns', label: 'Kullanıcı Kampanyaları', icon: Gift },
  { path: '/user-coupons', label: 'Kullanıcı Kuponları', icon: Tag },
  { path: '/user-favorite-stores', label: 'Kullanıcı Favori İşletmeleri', icon: Heart },
  { path: '/addresses', label: 'Adresler', icon: MapPin },
  { path: '/notifications', label: 'Bildirimler', icon: Bell },
  { path: '/services', label: 'Hizmetler', icon: Settings },
  { path: '/invoices', label: 'Faturalar', icon: Receipt },
  { path: '/points', label: 'Puanlar', icon: Award },
  { path: '/rewards', label: 'Ödüller', icon: Award },
  { path: '/accounting', label: 'Muhasebe', icon: FileText },
  { path: '/forms', label: 'Formlar', icon: FileText },
  { path: '/business-home-ads', label: 'İşletme Ana Sayfa Reklamları', icon: Megaphone },
  { path: '/client-home-ads', label: 'Müşteri Ana Sayfa Reklamları', icon: Megaphone },
  { path: '/client-center-ads', label: 'Müşteri Merkez Reklamları', icon: Megaphone },
  { path: '/wallet-transactions', label: 'Cüzdan İşlemleri', icon: History },
  { path: '/otps', label: 'OTP Kodları', icon: Key },
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
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Sidebar */}
      <aside className="flex flex-col w-64 flex-shrink-0 bg-white shadow-lg overflow-hidden">
        <div className="flex-shrink-0 p-6 border-b">
          <h1 className="text-2xl font-bold text-primary-600">Bakimla Admin</h1>
        </div>
        <nav className="flex-1 min-h-0 overflow-y-auto mt-6">
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
        <div className="flex-shrink-0 p-6 border-t">
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
      <main className="flex-1 min-h-0 overflow-auto">
        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

