import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { adminService } from '../services/adminService';
import { 
  Store, 
  Users, 
  DollarSign, 
  Calendar, 
  CreditCard, 
  Wallet,
  TrendingUp,
  ArrowLeft,
  CheckCircle,
  Clock,
  UserCheck,
  Settings
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';

export default function StoreDetail() {
  const { storeId } = useParams();
  const navigate = useNavigate();
  const [storeData, setStoreData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchStoreDetails();
  }, [storeId]);

  const fetchStoreDetails = async () => {
    setLoading(true);
    try {
      const response = await adminService.getStoreDetails(storeId);
      if (response.data.success) {
        setStoreData(response.data.data);
      }
    } catch (error) {
      console.error('Store details fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Yükleniyor...</div>;
  }

  if (!storeData) {
    return <div className="text-center py-12">İşletme bulunamadı</div>;
  }

  const { store, employees, stats, recentAppointments, recentPayments } = storeData;

  const tabs = [
    { id: 'overview', label: 'Genel Bakış' },
    { id: 'employees', label: 'Çalışanlar' },
    { id: 'appointments', label: 'Randevular' },
    { id: 'payments', label: 'Ödemeler' },
    { id: 'settings', label: 'Ayarlar' },
  ];

  const handleUpdateSettings = async (settings) => {
    try {
      const response = await adminService.updateStoreSettings(storeId, { installmentSettings: settings });
      if (response.data.success) {
        toast.success('Ayarlar güncellendi');
        fetchStoreDetails();
      }
    } catch (error) {
      console.error('Settings update error:', error);
      toast.error('Ayarlar güncellenemedi');
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/stores')}
          className="flex items-center text-gray-600 hover:text-gray-800 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Geri Dön
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">{store.storeName}</h1>
            <p className="text-gray-600 mt-1">{store.businessName}</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Toplam Kazanç</p>
              <p className="text-2xl font-bold text-emerald-600">
                {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(stats.totalEarnings || 0)}
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-emerald-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Cüzdan Bakiyesi</p>
              <p className="text-2xl font-bold text-primary-600">
                {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(stats.walletBalance || 0)}
              </p>
            </div>
            <Wallet className="w-8 h-8 text-primary-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Toplam Randevu</p>
              <p className="text-2xl font-bold text-gray-800">{stats.totalAppointments || 0}</p>
              <p className="text-xs text-gray-500 mt-1">
                {stats.completedAppointments || 0} tamamlandı, {stats.pendingAppointments || 0} bekliyor
              </p>
            </div>
            <Calendar className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Çalışanlar</p>
              <p className="text-2xl font-bold text-gray-800">{stats.totalEmployees || 0}</p>
              <p className="text-xs text-gray-500 mt-1">
                {stats.approvedEmployees || 0} onaylı
              </p>
            </div>
            <Users className="w-8 h-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="border-b">
          <nav className="flex -mb-px">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">İşletme Bilgileri</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">İşletme Adı</p>
                    <p className="font-medium">{store.storeName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Ticari Ünvan</p>
                    <p className="font-medium">{store.businessName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Sahibi</p>
                    <p className="font-medium">
                      {store.companyId?.firstName} {store.companyId?.lastName}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">E-posta</p>
                    <p className="font-medium">{store.companyId?.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Telefon</p>
                    <p className="font-medium">{store.companyId?.phoneNumber}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Adres</p>
                    <p className="font-medium">
                      {store.address?.city}, {store.address?.district}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4">Özet İstatistikler</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">Toplam Ödeme</p>
                    <p className="text-xl font-bold">{stats.totalPayments || 0}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">Toplam Çekim</p>
                    <p className="text-xl font-bold">
                      {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(stats.totalWithdrawals || 0)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Employees Tab */}
          {activeTab === 'employees' && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Çalışanlar ({employees?.length || 0})</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Çalışan</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Randevu</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kazanç</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Durum</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {employees?.map((employee) => (
                      <tr key={employee._id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="flex items-center">
                            <UserCheck className="w-5 h-5 text-primary-600 mr-3" />
                            <div>
                              <div className="text-sm font-medium">{employee.firstName} {employee.lastName}</div>
                              <div className="text-xs text-gray-500">{employee.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm">
                            <div className="font-medium">{employee.totalAppointments || 0} toplam</div>
                            <div className="text-xs text-gray-500">{employee.completedAppointments || 0} tamamlandı</div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm font-bold text-emerald-600">
                            {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(employee.totalEarnings || 0)}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {employee.isApproved ? (
                            <span className="flex items-center px-2 py-1 bg-green-100 text-green-800 rounded text-xs w-fit">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Onaylı
                            </span>
                          ) : (
                            <span className="flex items-center px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs w-fit">
                              <Clock className="w-3 h-3 mr-1" />
                              Bekliyor
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Appointments Tab */}
          {activeTab === 'appointments' && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Son Randevular</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tarih/Saat</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Müşteri</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Çalışan</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tutar</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Durum</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {recentAppointments?.map((apt) => (
                      <tr key={apt._id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="text-sm">
                            <div>{format(new Date(apt.appointmentDate), 'dd MMM yyyy')}</div>
                            <div className="text-gray-500">{apt.appointmentTime}</div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {apt.customerIds?.[0] ? (
                            <div className="text-sm">
                              <div className="font-medium">{apt.customerIds[0].firstName} {apt.customerIds[0].lastName}</div>
                              <div className="text-xs text-gray-500">{apt.customerIds[0].phoneNumber}</div>
                            </div>
                          ) : apt.userId ? (
                            <div className="text-sm">
                              <div className="font-medium">{apt.userId.firstName} {apt.userId.lastName}</div>
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {apt.employeeId ? (
                            <div className="text-sm">{apt.employeeId.firstName} {apt.employeeId.lastName}</div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm font-bold">
                            {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(apt.servicePrice || apt.totalPrice || 0)}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            apt.status === 'completed' ? 'bg-green-100 text-green-800' :
                            apt.status === 'approved' ? 'bg-blue-100 text-blue-800' :
                            apt.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {apt.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Payments Tab */}
          {activeTab === 'payments' && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Son Ödemeler</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tarih</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tutar</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tip</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Durum</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {recentPayments?.map((payment) => (
                      <tr key={payment._id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm">
                          {format(new Date(payment.createdAt), 'dd MMM yyyy HH:mm')}
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm font-bold">
                            {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: payment.currency || 'TRY' }).format(payment.price)}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {payment.appointmentId && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">Randevu</span>
                          )}
                          {payment.orderId && (
                            <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs">Sipariş</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className="flex items-center px-2 py-1 bg-green-100 text-green-800 rounded text-xs w-fit">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Başarılı
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="max-w-2xl">
              <h3 className="text-lg font-semibold mb-6">İşletme Ayarları</h3>
              
              <div className="bg-gray-50 rounded-lg p-6 space-y-6">
                <div>
                  <h4 className="font-medium text-gray-800 mb-4 flex items-center">
                    <CreditCard className="w-5 h-5 mr-2 text-primary-600" />
                    Taksit Ayarları
                  </h4>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-white rounded-lg border">
                      <div>
                        <p className="font-medium">Taksitli Ödeme</p>
                        <p className="text-sm text-gray-500">Müşterilerin taksitli ödeme yapabilmesini sağla</p>
                      </div>
                      <button
                        onClick={() => handleUpdateSettings({ enabled: !store.installmentSettings?.enabled })}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                          store.installmentSettings?.enabled ? 'bg-primary-600' : 'bg-gray-200'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            store.installmentSettings?.enabled ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>

                    {store.installmentSettings?.enabled && (
                      <div className="p-4 bg-white rounded-lg border">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Maksimum Taksit Sayısı
                        </label>
                        <select
                          value={store.installmentSettings?.maxInstallment || 12}
                          onChange={(e) => handleUpdateSettings({ maxInstallment: parseInt(e.target.value) })}
                          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                        >
                          <option value={1}>Taksit Yok (Peşin)</option>
                          <option value={2}>2 Taksit</option>
                          <option value={3}>3 Taksit</option>
                          <option value={6}>6 Taksit</option>
                          <option value={9}>9 Taksit</option>
                          <option value={12}>12 Taksit</option>
                        </select>
                        <p className="mt-2 text-xs text-gray-500">
                          iyzico üzerinden sunulacak maksimum taksit sayısını belirler.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

