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
  Settings,
  Edit,
  Save,
  X,
  Image as ImageIcon,
  MapPin,
  Building,
  FileText,
  Tag,
  Link as LinkIcon,
  Plus,
  Trash2
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import { getSectorByKey, getBusinessFieldOptions } from '../constants/sectors';

/** Aynı isimdeki hizmetlerden sadece ilkini bırakır (isim boş olanlar elenir) */
function deduplicateServicesByName(services) {
  const seen = new Set();
  return (services || []).filter((s) => {
    const n = (s.name || '').trim();
    if (!n) return false;
    if (seen.has(n)) return false;
    seen.add(n);
    return true;
  });
}

export default function StoreDetail() {
  const { storeId } = useParams();
  const navigate = useNavigate();
  const [storeData, setStoreData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('info');
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});

  useEffect(() => {
    fetchStoreDetails();
  }, [storeId]);

  const fetchStoreDetails = async () => {
    setLoading(true);
    try {
      const response = await adminService.getStoreDetails(storeId);
      if (response.data.success) {
        setStoreData(response.data.data);
        setEditData(response.data.data.store || {});
      }
    } catch (error) {
      console.error('Store details fetch error:', error);
      toast.error('İşletme bilgileri yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const payload = {
        ...editData,
        services: deduplicateServicesByName(editData.services || []),
      };
      const response = await adminService.updateStore(storeId, payload);
      if (response.data.success) {
        toast.success('İşletme bilgileri güncellendi');
        setIsEditing(false);
        fetchStoreDetails();
      } else {
        toast.error(response.data.message || 'Güncelleme başarısız');
      }
    } catch (error) {
      console.error('Update error:', error);
      toast.error(error.response?.data?.message || 'Güncelleme başarısız');
    }
  };

  const handleCancel = () => {
    setEditData(storeData?.store || {});
    setIsEditing(false);
  };

  const handleFieldChange = (field, value) => {
    setEditData(prev => {
      if (field.includes('.')) {
        const [parent, child] = field.split('.');
        return {
          ...prev,
          [parent]: {
            ...prev[parent],
            [child]: value
          }
        };
      }
      return { ...prev, [field]: value };
    });
  };

  const handleArrayFieldChange = (field, index, subField, value) => {
    setEditData(prev => {
      const array = [...(prev[field] || [])];
      array[index] = { ...array[index], [subField]: value };
      return { ...prev, [field]: array };
    });
  };

  const handleAddArrayItem = (field, defaultItem) => {
    setEditData(prev => ({
      ...prev,
      [field]: [...(prev[field] || []), defaultItem]
    }));
  };

  const handleRemoveArrayItem = (field, index) => {
    setEditData(prev => ({
      ...prev,
      [field]: (prev[field] || []).filter((_, i) => i !== index)
    }));
  };

  const handleAddServiceImage = () => {
    setEditData(prev => ({
      ...prev,
      serviceImages: [...(prev.serviceImages || []), '']
    }));
  };

  const handleRemoveServiceImage = (index) => {
    setEditData(prev => ({
      ...prev,
      serviceImages: (prev.serviceImages || []).filter((_, i) => i !== index)
    }));
  };

  const handleServiceImageChange = (index, value) => {
    setEditData(prev => {
      const images = [...(prev.serviceImages || [])];
      images[index] = value;
      return { ...prev, serviceImages: images };
    });
  };

  if (loading) {
    return <div className="text-center py-12">Yükleniyor...</div>;
  }

  if (!storeData) {
    return <div className="text-center py-12">İşletme bulunamadı</div>;
  }

  const { store, employees, stats, recentAppointments, recentPayments } = storeData;
  const displayData = isEditing ? editData : store;

  const tabs = [
    { id: 'info', label: 'Bilgiler' },
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

  const daysOfWeek = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];
  const dayMap = {
    monday: 'Pazartesi',
    tuesday: 'Salı',
    wednesday: 'Çarşamba',
    thursday: 'Perşembe',
    friday: 'Cuma',
    saturday: 'Cumartesi',
    sunday: 'Pazar'
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
          {activeTab === 'info' && (
            <div className="flex gap-2">
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Düzenle
                </button>
              ) : (
                <>
                  <button
                    onClick={handleSave}
                    className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Kaydet
                  </button>
                  <button
                    onClick={handleCancel}
                    className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    <X className="w-4 h-4 mr-2" />
                    İptal
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Toplam Kazanç</p>
              <p className="text-2xl font-bold text-emerald-600">
                {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(stats?.totalEarnings || 0)}
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
                {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(stats?.walletBalance || 0)}
              </p>
            </div>
            <Wallet className="w-8 h-8 text-primary-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Toplam Randevu</p>
              <p className="text-2xl font-bold text-gray-800">{stats?.totalAppointments || 0}</p>
              <p className="text-xs text-gray-500 mt-1">
                {stats?.completedAppointments || 0} tamamlandı, {stats?.pendingAppointments || 0} bekliyor
              </p>
            </div>
            <Calendar className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Çalışanlar</p>
              <p className="text-2xl font-bold text-gray-800">{stats?.totalEmployees || 0}</p>
              <p className="text-xs text-gray-500 mt-1">
                {stats?.approvedEmployees || 0} onaylı
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
                onClick={() => {
                  setActiveTab(tab.id);
                  setIsEditing(false);
                }}
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
          {/* Info Tab - Tüm Bilgiler */}
          {activeTab === 'info' && (
            <div className="space-y-8">
              {/* Temel Bilgiler */}
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <Store className="w-5 h-5 mr-2 text-primary-600" />
                  Temel Bilgiler
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">İşletme Adı</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={displayData.storeName || ''}
                        onChange={(e) => handleFieldChange('storeName', e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                      />
                    ) : (
                      <p className="font-medium">{displayData.storeName || '-'}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Ticari Ünvan</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={displayData.businessName || ''}
                        onChange={(e) => handleFieldChange('businessName', e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                      />
                    ) : (
                      <p className="font-medium">{displayData.businessName || '-'}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">İş Alanı</label>
                    {isEditing ? (
                      <select
                        value={displayData.businessField || ''}
                        onChange={(e) => handleFieldChange('businessField', e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                      >
                        <option value="">— Seçin —</option>
                        {getBusinessFieldOptions().map((o) => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                    ) : (
                      <p className="font-medium">
                        {getBusinessFieldOptions().find((o) => o.value === displayData.businessField)?.label || displayData.businessField || '-'}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">İşletme Açıklaması</label>
                    {isEditing ? (
                      <textarea
                        value={displayData.businessDescription || ''}
                        onChange={(e) => handleFieldChange('businessDescription', e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                      />
                    ) : (
                      <p className="font-medium">{displayData.businessDescription || '-'}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Store Code</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={displayData.storeCode || ''}
                        onChange={(e) => handleFieldChange('storeCode', e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                        placeholder="6 haneli kod"
                      />
                    ) : (
                      <p className="font-medium">{displayData.storeCode || '-'}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Store Link</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={displayData.storeLink || ''}
                        onChange={(e) => handleFieldChange('storeLink', e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                        placeholder="https://bakimla.com/..."
                      />
                    ) : displayData.storeLink ? (
                      <a href={displayData.storeLink} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline flex items-center">
                        <LinkIcon className="w-4 h-4 mr-1" />
                        {displayData.storeLink}
                      </a>
                    ) : (
                      <p className="text-gray-400">-</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Yetkili Kişi Bilgileri */}
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <UserCheck className="w-5 h-5 mr-2 text-primary-600" />
                  Yetkili Kişi Bilgileri
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Yetkili Kişi Adı</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={displayData.authorizedPersonName || ''}
                        onChange={(e) => handleFieldChange('authorizedPersonName', e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                      />
                    ) : (
                      <p className="font-medium">{displayData.authorizedPersonName || '-'}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">TCKN</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={displayData.authorizedPersonTCKN || ''}
                        onChange={(e) => handleFieldChange('authorizedPersonTCKN', e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                      />
                    ) : (
                      <p className="font-medium">{displayData.authorizedPersonTCKN || '-'}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Vergi Bilgileri */}
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <FileText className="w-5 h-5 mr-2 text-primary-600" />
                  Vergi Bilgileri
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Vergi Dairesi</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={displayData.taxOffice || ''}
                        onChange={(e) => handleFieldChange('taxOffice', e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                      />
                    ) : (
                      <p className="font-medium">{displayData.taxOffice || '-'}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Vergi Numarası</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={displayData.taxNumber || ''}
                        onChange={(e) => handleFieldChange('taxNumber', e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                      />
                    ) : (
                      <p className="font-medium">{displayData.taxNumber || '-'}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">IBAN</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={displayData.iban || ''}
                        onChange={(e) => handleFieldChange('iban', e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                      />
                    ) : (
                      <p className="font-medium">{displayData.iban || '-'}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">İşletme Şifresi</label>
                    <p className="font-medium">{displayData.businessPassword ? '••••••' : 'Yok'}</p>
                  </div>
                </div>
              </div>

              {/* Adres Bilgileri */}
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <MapPin className="w-5 h-5 mr-2 text-primary-600" />
                  Adres Bilgileri
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Adres Adı</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={displayData.address?.addressName || ''}
                        onChange={(e) => handleFieldChange('address.addressName', e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                      />
                    ) : (
                      <p className="font-medium">{displayData.address?.addressName || '-'}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Tam Adres</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={displayData.address?.fullAddress || ''}
                        onChange={(e) => handleFieldChange('address.fullAddress', e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                      />
                    ) : (
                      <p className="font-medium">{displayData.address?.fullAddress || '-'}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Şehir</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={displayData.address?.city || ''}
                        onChange={(e) => handleFieldChange('address.city', e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                      />
                    ) : (
                      <p className="font-medium">{displayData.address?.city || '-'}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">İlçe</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={displayData.address?.district || ''}
                        onChange={(e) => handleFieldChange('address.district', e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                      />
                    ) : (
                      <p className="font-medium">{displayData.address?.district || '-'}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Bina</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={displayData.address?.building || ''}
                        onChange={(e) => handleFieldChange('address.building', e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                      />
                    ) : (
                      <p className="font-medium">{displayData.address?.building || '-'}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Kat</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={displayData.address?.floor || ''}
                        onChange={(e) => handleFieldChange('address.floor', e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                      />
                    ) : (
                      <p className="font-medium">{displayData.address?.floor || '-'}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Daire</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={displayData.address?.apartment || ''}
                        onChange={(e) => handleFieldChange('address.apartment', e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                      />
                    ) : (
                      <p className="font-medium">{displayData.address?.apartment || '-'}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">No</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={displayData.address?.no || ''}
                        onChange={(e) => handleFieldChange('address.no', e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                      />
                    ) : (
                      <p className="font-medium">{displayData.address?.no || '-'}</p>
                    )}
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm text-gray-600 mb-1">Adres Detayı</label>
                    {isEditing ? (
                      <textarea
                        value={displayData.address?.addressDetail || ''}
                        onChange={(e) => handleFieldChange('address.addressDetail', e.target.value)}
                        rows={2}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                      />
                    ) : (
                      <p className="font-medium">{displayData.address?.addressDetail || '-'}</p>
                    )}
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Enlem (Latitude)</label>
                    {isEditing ? (
                      <input
                        type="number"
                        step="any"
                        value={displayData.location?.latitude || ''}
                        onChange={(e) => handleFieldChange('location.latitude', parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                        placeholder="0.0"
                      />
                    ) : (
                      <p className="font-medium">{displayData.location?.latitude || '-'}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Boylam (Longitude)</label>
                    {isEditing ? (
                      <input
                        type="number"
                        step="any"
                        value={displayData.location?.longitude || ''}
                        onChange={(e) => handleFieldChange('location.longitude', parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                        placeholder="0.0"
                      />
                    ) : (
                      <p className="font-medium">{displayData.location?.longitude || '-'}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Konum Adresi</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={displayData.location?.address || ''}
                        onChange={(e) => handleFieldChange('location.address', e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                        placeholder="Konum adresi"
                      />
                    ) : (
                      <p className="font-medium">{displayData.location?.address || '-'}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Resimler */}
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center justify-between">
                  <span className="flex items-center">
                    <ImageIcon className="w-5 h-5 mr-2 text-primary-600" />
                    Resimler
                  </span>
                  {isEditing && (
                    <button
                      onClick={() => {
                        if (!displayData.interiorImage) handleFieldChange('interiorImage', '');
                        if (!displayData.exteriorImage) handleFieldChange('exteriorImage', '');
                        if (!displayData.appIcon) handleFieldChange('appIcon', '');
                      }}
                      className="text-sm text-primary-600 hover:text-primary-700"
                    >
                      Tümünü Göster
                    </button>
                  )}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-2">İç Görsel</label>
                    {(displayData.interiorImage || isEditing) && (
                      <>
                        {displayData.interiorImage && (
                          <img
                            src={displayData.interiorImage}
                            alt="İç Görsel"
                            className="w-full h-48 object-cover rounded-lg border mb-2"
                            onError={(e) => { e.target.src = 'https://via.placeholder.com/400x300?text=Resim+Yok'; }}
                          />
                        )}
                        {isEditing && (
                          <input
                            type="text"
                            value={displayData.interiorImage || ''}
                            onChange={(e) => handleFieldChange('interiorImage', e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                            placeholder="Resim URL"
                          />
                        )}
                      </>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-2">Dış Görsel</label>
                    {(displayData.exteriorImage || isEditing) && (
                      <>
                        {displayData.exteriorImage && (
                          <img
                            src={displayData.exteriorImage}
                            alt="Dış Görsel"
                            className="w-full h-48 object-cover rounded-lg border mb-2"
                            onError={(e) => { e.target.src = 'https://via.placeholder.com/400x300?text=Resim+Yok'; }}
                          />
                        )}
                        {isEditing && (
                          <input
                            type="text"
                            value={displayData.exteriorImage || ''}
                            onChange={(e) => handleFieldChange('exteriorImage', e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                            placeholder="Resim URL"
                          />
                        )}
                      </>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-2">App İkonu</label>
                    {(displayData.appIcon || isEditing) && (
                      <>
                        {displayData.appIcon && (
                          <img
                            src={displayData.appIcon}
                            alt="App İkonu"
                            className="w-full h-48 object-cover rounded-lg border mb-2"
                            onError={(e) => { e.target.src = 'https://via.placeholder.com/400x300?text=Resim+Yok'; }}
                          />
                        )}
                        {isEditing && (
                          <input
                            type="text"
                            value={displayData.appIcon || ''}
                            onChange={(e) => handleFieldChange('appIcon', e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                            placeholder="Resim URL"
                          />
                        )}
                      </>
                    )}
                  </div>
                  <div className="md:col-span-2 lg:col-span-3">
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm text-gray-600">Hizmet Görselleri ({displayData.serviceImages?.length || 0})</label>
                      {isEditing && (
                        <button
                          onClick={handleAddServiceImage}
                          className="flex items-center px-3 py-1 bg-primary-600 text-white rounded text-sm hover:bg-primary-700"
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Ekle
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {displayData.serviceImages?.map((img, idx) => (
                        <div key={idx} className="relative">
                          {img && (
                            <img
                              src={img}
                              alt={`Hizmet ${idx + 1}`}
                              className="w-full h-32 object-cover rounded-lg border mb-2"
                              onError={(e) => { e.target.src = 'https://via.placeholder.com/200x150?text=Resim+Yok'; }}
                            />
                          )}
                          {isEditing && (
                            <>
                              <input
                                type="text"
                                value={img || ''}
                                onChange={(e) => handleServiceImageChange(idx, e.target.value)}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 text-sm"
                                placeholder="Resim URL"
                              />
                              <button
                                onClick={() => handleRemoveServiceImage(idx)}
                                className="mt-1 text-red-600 hover:text-red-800 text-sm flex items-center"
                              >
                                <Trash2 className="w-4 h-4 mr-1" />
                                Sil
                              </button>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Sektörler */}
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center justify-between">
                  <span className="flex items-center">
                    <Tag className="w-5 h-5 mr-2 text-primary-600" />
                    Sektörler
                  </span>
                  {isEditing && (
                    <button
                      onClick={() => handleAddArrayItem('sectors', { id: 0, name: '', key: '' })}
                      className="flex items-center px-3 py-1 bg-primary-600 text-white rounded text-sm hover:bg-primary-700"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Sektör Ekle
                    </button>
                  )}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {displayData.sectors?.map((sector, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      {isEditing ? (
                        <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg border">
                          <input
                            type="text"
                            value={typeof sector === 'object' ? (sector.name || '') : String(sector || '')}
                            onChange={(e) => {
                              const newSectors = [...(displayData.sectors || [])];
                              if (typeof sector === 'object') {
                                newSectors[idx] = { ...sector, name: e.target.value, key: e.target.value.toLowerCase().replace(/\s+/g, '_') };
                              } else {
                                newSectors[idx] = { id: idx, name: e.target.value, key: e.target.value.toLowerCase().replace(/\s+/g, '_') };
                              }
                              handleFieldChange('sectors', newSectors);
                            }}
                            className="px-2 py-1 border rounded text-sm w-32"
                            placeholder="Sektör adı"
                          />
                          <button
                            onClick={() => handleRemoveArrayItem('sectors', idx)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <span className="px-3 py-1 bg-primary-100 text-primary-800 rounded-lg text-sm">
                          {typeof sector === 'object' && sector !== null
                            ? (sector.name || sector.key || '-')
                            : String(sector ?? '')}
                        </span>
                      )}
                    </div>
                  ))}
                  {(!displayData.sectors || displayData.sectors.length === 0) && !isEditing && (
                    <span className="text-gray-400">Sektör bulunamadı</span>
                  )}
                </div>
              </div>

              {/* Çalışma Günleri */}
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center justify-between">
                  <span className="flex items-center">
                    <Clock className="w-5 h-5 mr-2 text-primary-600" />
                    Çalışma Günleri
                  </span>
                  {isEditing && (
                    <button
                      onClick={() => {
                        const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
                        const existingDays = (displayData.workingDays || []).map(d => d.day);
                        const newDay = days.find(d => !existingDays.includes(d));
                        if (newDay) {
                          handleAddArrayItem('workingDays', {
                            day: newDay,
                            startTime: '09:00',
                            endTime: '18:00',
                            isOpen: true
                          });
                        }
                      }}
                      className="flex items-center px-3 py-1 bg-primary-600 text-white rounded text-sm hover:bg-primary-700"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Gün Ekle
                    </button>
                  )}
                </h3>
                <div className="space-y-2">
                  {displayData.workingDays?.map((day, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      {isEditing ? (
                        <div className="flex items-center gap-4 w-full">
                          <select
                            value={day.day}
                            onChange={(e) => handleArrayFieldChange('workingDays', idx, 'day', e.target.value)}
                            className="px-3 py-2 border rounded-lg text-sm w-32"
                          >
                            {Object.entries(dayMap).map(([key, label]) => (
                              <option key={key} value={key}>{label}</option>
                            ))}
                          </select>
                          <input
                            type="time"
                            value={day.startTime}
                            onChange={(e) => handleArrayFieldChange('workingDays', idx, 'startTime', e.target.value)}
                            className="px-3 py-2 border rounded-lg text-sm"
                          />
                          <span className="text-gray-600">-</span>
                          <input
                            type="time"
                            value={day.endTime}
                            onChange={(e) => handleArrayFieldChange('workingDays', idx, 'endTime', e.target.value)}
                            className="px-3 py-2 border rounded-lg text-sm"
                          />
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={day.isOpen}
                              onChange={(e) => handleArrayFieldChange('workingDays', idx, 'isOpen', e.target.checked)}
                              className="w-4 h-4"
                            />
                            <span className="text-sm">Açık</span>
                          </label>
                          <button
                            onClick={() => handleRemoveArrayItem('workingDays', idx)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-4">
                          <span className="font-medium w-24">{dayMap[day.day] || day.day}</span>
                          <span className="text-sm text-gray-600">
                            {day.startTime} - {day.endTime}
                          </span>
                          <span className={`px-2 py-1 rounded text-xs ${day.isOpen ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {day.isOpen ? 'Açık' : 'Kapalı'}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                  {(!displayData.workingDays || displayData.workingDays.length === 0) && !isEditing && (
                    <p className="text-gray-400">Çalışma günü bilgisi yok</p>
                  )}
                </div>
              </div>

              {/* Hizmetler: İş alanına (businessField) göre seçilebilir; aynı isim tek görünür */}
              {(() => {
                const sector = getSectorByKey(displayData.businessField);
                const baseServices = sector?.services || [];
                const existingNames = (displayData.services || []).map((s) => s.name).filter(Boolean);
                const serviceNameOptions = [...new Set([...baseServices, ...existingNames])].sort();
                const listToShow = isEditing
                  ? (editData.services || [])
                  : deduplicateServicesByName(store?.services || []);
                return (
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center justify-between">
                  <span className="flex items-center">
                    <Settings className="w-5 h-5 mr-2 text-primary-600" />
                    Hizmetler ({listToShow.length})
                  </span>
                  {isEditing && (
                    <button
                      onClick={() => handleAddArrayItem('services', {
                        name: '',
                        category: '',
                        duration: 30,
                        price: 0,
                        cancelDuration: 0,
                        description: '',
                        isActive: true
                      })}
                      className="flex items-center px-3 py-1 bg-primary-600 text-white rounded text-sm hover:bg-primary-700"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Hizmet Ekle
                    </button>
                  )}
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hizmet Adı</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kategori</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Süre (dk)</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fiyat</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Durum</th>
                        {isEditing && <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">İşlem</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {listToShow.map((service, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            {isEditing ? (
                              <select
                                value={service.name || ''}
                                onChange={(e) => handleArrayFieldChange('services', idx, 'name', e.target.value)}
                                className="w-full px-2 py-1 border rounded text-sm min-w-[140px]"
                              >
                                <option value="">— Seçin —</option>
                                {serviceNameOptions.map((opt) => (
                                  <option key={opt} value={opt}>{opt}</option>
                                ))}
                              </select>
                            ) : (
                              <span className="text-sm font-medium">{service.name}</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {isEditing ? (
                              <input
                                type="text"
                                value={service.category || ''}
                                onChange={(e) => handleArrayFieldChange('services', idx, 'category', e.target.value)}
                                className="w-full px-2 py-1 border rounded text-sm"
                                placeholder="Kategori"
                              />
                            ) : (
                              <span className="text-sm text-gray-600">{service.category}</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {isEditing ? (
                              <input
                                type="number"
                                value={service.duration || 0}
                                onChange={(e) => handleArrayFieldChange('services', idx, 'duration', parseInt(e.target.value) || 0)}
                                className="w-full px-2 py-1 border rounded text-sm"
                                placeholder="Süre"
                              />
                            ) : (
                              <span className="text-sm">{service.duration}</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {isEditing ? (
                              <input
                                type="number"
                                step="0.01"
                                value={service.price || 0}
                                onChange={(e) => handleArrayFieldChange('services', idx, 'price', parseFloat(e.target.value) || 0)}
                                className="w-full px-2 py-1 border rounded text-sm"
                                placeholder="Fiyat"
                              />
                            ) : (
                              <span className="text-sm font-bold">
                                {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(service.price || 0)}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {isEditing ? (
                              <label className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={service.isActive ?? true}
                                  onChange={(e) => handleArrayFieldChange('services', idx, 'isActive', e.target.checked)}
                                  className="w-4 h-4"
                                />
                                <span className="text-xs">Aktif</span>
                              </label>
                            ) : (
                              <span className={`px-2 py-1 rounded text-xs ${service.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                {service.isActive ? 'Aktif' : 'Pasif'}
                              </span>
                            )}
                          </td>
                          {isEditing && (
                            <td className="px-4 py-3">
                              <button
                                onClick={() => handleRemoveArrayItem('services', idx)}
                                className="text-red-600 hover:text-red-800"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {(!listToShow || listToShow.length === 0) && !isEditing && (
                    <p className="text-center py-4 text-gray-400">Hizmet bulunamadı</p>
                  )}
                </div>
              </div>
                );
              })()}

              {/* Durum Bilgileri */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Durum Bilgileri</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium">Açık/Kapalı</span>
                    {isEditing ? (
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={displayData.isOpen ?? true}
                          onChange={(e) => handleFieldChange('isOpen', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                      </label>
                    ) : (
                      <span className={`px-3 py-1 rounded text-sm ${displayData.isOpen ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {displayData.isOpen ? 'Açık' : 'Kapalı'}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium">Randevu Taleplerini Otomatik Kabul Et</span>
                    {isEditing ? (
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={displayData.alwaysAcceptAppointmentRequests ?? false}
                          onChange={(e) => handleFieldChange('alwaysAcceptAppointmentRequests', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                      </label>
                    ) : (
                      <span className={`px-3 py-1 rounded text-sm ${displayData.alwaysAcceptAppointmentRequests ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {displayData.alwaysAcceptAppointmentRequests ? 'Evet' : 'Hayır'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

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
                    <p className="text-xl font-bold">{stats?.totalPayments || 0}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">Toplam Çekim</p>
                    <p className="text-xl font-bold">
                      {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(stats?.totalWithdrawals || 0)}
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
