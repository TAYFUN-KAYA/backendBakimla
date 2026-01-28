import { useState, useEffect, useMemo } from 'react';
import { adminService } from '../services/adminService';
import { X, Save, Briefcase, Plus, Search, Eye, Edit, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

// Sektörler ve hizmetler
const SECTORS = {
  erkek_kuafor: {
    id: 1,
    name: "Erkek Kuaförü",
    key: "erkek_kuafor",
    services: [
      "Saç Kesimi", "Sakal Tıraşı", "Saç + Sakal", "Çocuk Saç Kesimi", "Saç Yıkama",
      "Saç Şekillendirme", "Fön", "Keratin Bakımı", "Saç Boyama", "Saç Ağartma",
      "Perma", "Cilt Bakımı", "Kaş Alma", "Kulak Burun Kılı Temizleme", "Maske Bakımı",
    ],
  },
  kadin_kuafor: {
    id: 2,
    name: "Kadın Kuaförü",
    key: "kadin_kuafor",
    services: [
      "Saç Kesimi", "Fön", "Maşa", "Saç Boyama", "Dip Boya", "Ombre", "Sombre",
      "Balayage", "Saç Açma", "Keratin Bakımı", "Brezilya Fönü", "Perma", "Topuz",
      "Gelin Saçı", "Nişan Saçı", "Kaş Alma", "Saç Bakımı", "Saç Yıkama",
    ],
  },
  unisex_kuafor: {
    id: 3,
    name: "Unisex Kuaför Salonu",
    key: "unisex_kuafor",
    services: [
      "Saç Kesimi", "Saç Yıkama", "Saç Şekillendirme", "Fön", "Keratin Bakımı", "Perma",
      "Saç Boyama", "Kaş Alma", "Cilt Bakımı", "Sakal Tıraşı", "Saç + Sakal",
      "Çocuk Saç Kesimi", "Saç Ağartma", "Kulak Burun Kılı Temizleme", "Maske Bakımı",
      "Maşa", "Dip Boya", "Ombre", "Sombre", "Balayage", "Saç Açma", "Brezilya Fönü",
      "Topuz", "Gelin Saçı", "Nişan Saçı", "Saç Bakımı",
    ],
  },
  guzellik_merkezi: {
    id: 4,
    name: "Güzellik Merkezi",
    key: "guzellik_merkezi",
    services: [
      "Cilt Bakımı", "Derin Cilt Temizliği", "Hydrafacial", "Lazer Epilasyon",
      "İğneli Epilasyon", "Bölgesel İncelme", "Selülit Tedavisi", "Kirpik Lifting",
      "Kirpik Perması", "Kaş Laminasyonu", "Kaş Tasarımı", "Kalıcı Makyaj",
      "Microblading", "BB Glow", "G5 Masajı",
    ],
  },
  tirnak_salonu: {
    id: 5,
    name: "Tırnak Salonu",
    key: "tirnak_salonu",
    services: [
      "Manikür", "Pedikür", "Klasik Manikür", "Klasik Pedikür", "Jel Tırnak",
      "Akrilik Tırnak", "Protez Tırnak", "Kalıcı Oje", "Nail Art", "Tırnak Bakımı",
      "Tırnak Güçlendirme", "Tırnak Onarımı",
    ],
  },
  masaj_salonu: {
    id: 6,
    name: "Masaj Salonu",
    key: "masaj_salonu",
    services: [
      "Klasik Masaj", "Aromaterapi Masajı", "Spor Masajı", "Derin Doku Masajı",
      "Thai Masajı", "Refleksoloji", "Medikal Masaj", "Relax Masaj",
      "Sıcak Taş Masajı", "Lenf Drenaj Masajı", "Bölgesel Masaj",
    ],
  },
  makyaj_uzmani: {
    id: 7,
    name: "Makyaj Uzmanı",
    key: "makyaj_uzmani",
    services: [
      "Günlük Makyaj", "Gece Makyajı", "Profesyonel Makyaj", "Gelin Makyajı",
      "Nişan Makyajı", "Kına Makyajı", "Fotoğraf Çekimi Makyajı", "Podyum Makyajı",
      "Özel Gün Makyajı",
    ],
  },
};

// Tüm benzersiz hizmetleri al
const getAllServices = () => {
  const allServices = new Set();
  Object.values(SECTORS).forEach(sector => {
    sector.services.forEach(service => allServices.add(service));
  });
  return Array.from(allServices).sort();
};

// Sektöre göre hizmetleri al
const getServicesByBusinessField = (businessField) => {
  if (!businessField) return getAllServices();
  const sector = SECTORS[businessField];
  return sector ? sector.services : getAllServices();
};

export default function Services() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [activeFilter, setActiveFilter] = useState('');
  const [businessFieldFilter, setBusinessFieldFilter] = useState('');

  const [editModal, setEditModal] = useState({ open: false, service: null });
  const [viewModal, setViewModal] = useState({ open: false, service: null });
  const [createModal, setCreateModal] = useState({ open: false });

  // İşletme arama için
  const [storeSearch, setStoreSearch] = useState('');
  const [stores, setStores] = useState([]);
  const [loadingStores, setLoadingStores] = useState(false);
  const [selectedStore, setSelectedStore] = useState(null);

  // Yeni hizmet formu
  const [newService, setNewService] = useState({
    storeId: '',
    name: '',
    description: '',
    price: '',
    duration: '',
    category: '',
    cancelDuration: '',
    isActive: true,
  });

  // Seçili işletmenin sektörüne göre hizmet seçenekleri
  const availableServicesForNewService = useMemo(() => {
    if (selectedStore?.businessField) {
      return getServicesByBusinessField(selectedStore.businessField);
    }
    return getAllServices();
  }, [selectedStore]);

  // Düzenleme modalı için hizmet seçenekleri
  const availableServicesForEdit = useMemo(() => {
    if (editModal.service?.businessField) {
      return getServicesByBusinessField(editModal.service.businessField);
    }
    return getAllServices();
  }, [editModal.service]);

  // Filtreleme için tüm hizmetler
  const allCategoryOptions = useMemo(() => getAllServices(), []);

  // Hizmetleri getir
  const fetchServices = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (search) params.search = search;
      if (categoryFilter) params.category = categoryFilter;
      if (activeFilter) params.isActive = activeFilter;
      if (businessFieldFilter) params.businessField = businessFieldFilter;

      const response = await adminService.storeServices.getAll(params);
      if (response.data.success) {
        setServices(response.data.data);
        setTotalPages(response.data.totalPages || 1);
      }
    } catch (error) {
      console.error('Fetch error:', error);
      toast.error('Hizmetler yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, [page, search, categoryFilter, activeFilter, businessFieldFilter]);

  useEffect(() => {
    setPage(1);
  }, [search, categoryFilter, activeFilter, businessFieldFilter]);

  // İşletme arama
  useEffect(() => {
    const searchStores = async () => {
      if (storeSearch.length < 2) {
        setStores([]);
        return;
      }
      setLoadingStores(true);
      try {
        const response = await adminService.getAllStores({ search: storeSearch, limit: 10 });
        if (response.data.success) {
          setStores(response.data.data);
        }
      } catch (error) {
        console.error('Store search error:', error);
      } finally {
        setLoadingStores(false);
      }
    };

    const debounce = setTimeout(searchStores, 300);
    return () => clearTimeout(debounce);
  }, [storeSearch]);

  const handleEdit = (service) => {
    setEditModal({ open: true, service: { ...service } });
  };

  const handleView = (service) => {
    setViewModal({ open: true, service });
  };

  const handleCreate = () => {
    setNewService({
      storeId: '',
      name: '',
      description: '',
      price: '',
      duration: '',
      category: '',
      cancelDuration: '',
      isActive: true,
    });
    setSelectedStore(null);
    setStoreSearch('');
    setStores([]);
    setCreateModal({ open: true });
  };

  const handleSave = async () => {
    try {
      const { storeId, serviceIndex, ...data } = editModal.service;
      const updateData = {
        name: data.name,
        description: data.description,
        price: parseFloat(data.price) || 0,
        duration: parseInt(data.duration) || 0,
        category: data.category,
        cancelDuration: parseInt(data.cancelDuration) || 0,
        isActive: data.isActive,
      };
      await adminService.storeServices.update(storeId, serviceIndex, updateData);
      toast.success('Hizmet başarıyla güncellendi');
      setEditModal({ open: false, service: null });
      fetchServices();
    } catch (error) {
      console.error('Update error:', error);
      toast.error('Güncelleme başarısız: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleCreateService = async () => {
    if (!newService.storeId) {
      toast.error('Lütfen bir işletme seçin');
      return;
    }
    if (!newService.name || !newService.price || !newService.duration || !newService.category) {
      toast.error('Hizmet adı, fiyat, süre ve kategori zorunludur');
      return;
    }

    try {
      const serviceData = {
        name: newService.name,
        description: newService.description,
        price: parseFloat(newService.price) || 0,
        duration: parseInt(newService.duration) || 0,
        category: newService.category,
        cancelDuration: parseInt(newService.cancelDuration) || 0,
        isActive: newService.isActive,
      };
      await adminService.storeServices.create(newService.storeId, serviceData);
      toast.success('Hizmet başarıyla oluşturuldu');
      setCreateModal({ open: false });
      fetchServices();
    } catch (error) {
      console.error('Create error:', error);
      toast.error('Hizmet oluşturulamadı: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleDelete = async (service) => {
    if (!window.confirm('Bu hizmeti silmek istediğinize emin misiniz?')) {
      return;
    }
    try {
      await adminService.storeServices.delete(service.storeId, service.serviceIndex);
      toast.success('Hizmet başarıyla silindi');
      fetchServices();
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Silme başarısız: ' + (error.response?.data?.message || error.message));
    }
  };

  const updateField = (field, value) => {
    setEditModal((prev) => ({
      ...prev,
      service: { ...prev.service, [field]: value },
    }));
  };

  const selectStore = (store) => {
    setSelectedStore(store);
    setNewService((prev) => ({ ...prev, storeId: store._id }));
    setStoreSearch('');
    setStores([]);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">İşletme Hizmetleri</h1>
        <button
          onClick={handleCreate}
          className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Plus className="w-5 h-5 mr-2" />
          Yeni Hizmet
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Hizmet adı, işletme ara..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <select
            value={businessFieldFilter}
            onChange={(e) => {
              const newBusinessField = e.target.value;
              setBusinessFieldFilter(newBusinessField);
              // Sektör değişince, seçili hizmet yeni sektörde yoksa sıfırla
              if (categoryFilter && newBusinessField) {
                const availableServices = getServicesByBusinessField(newBusinessField);
                if (!availableServices.includes(categoryFilter)) {
                  setCategoryFilter('');
                }
              }
            }}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Tüm Sektörler</option>
            {Object.entries(SECTORS).map(([key, sector]) => (
              <option key={key} value={key}>
                {sector.name}
              </option>
            ))}
          </select>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Tüm Hizmet Türleri</option>
            {(businessFieldFilter ? getServicesByBusinessField(businessFieldFilter) : allCategoryOptions).map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
          <select
            value={activeFilter}
            onChange={(e) => setActiveFilter(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Tüm Durumlar</option>
            <option value="true">Aktif</option>
            <option value="false">Pasif</option>
          </select>
          <div className="text-sm text-gray-500 flex items-center">
            Toplam: {services.length} hizmet
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="text-center py-12">Yükleniyor...</div>
        ) : services.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Briefcase className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>Henüz hizmet bulunamadı</p>
            <p className="text-sm mt-2">İşletmelere hizmet eklemek için "Yeni Hizmet" butonunu kullanın</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">İşletme</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sektör</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hizmet Adı</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hizmet Türü</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Süre</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fiyat</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Durum</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">İşlemler</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {services.map((service) => (
                    <tr key={service._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{service.storeName}</p>
                          {service.companyId && (
                            <p className="text-xs text-gray-500">
                              {`${service.companyId.firstName || ''} ${service.companyId.lastName || ''}`.trim()}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs">
                          {SECTORS[service.businessField]?.name || service.businessField || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{service.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                          {service.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{service.duration} dk</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {service.price?.toLocaleString('tr-TR')} ₺
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 rounded text-xs ${
                            service.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {service.isActive ? 'Aktif' : 'Pasif'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleView(service)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Görüntüle"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleEdit(service)}
                            className="text-green-600 hover:text-green-900"
                            title="Düzenle"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(service)}
                            className="text-red-600 hover:text-red-900"
                            title="Sil"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Sayfa {page} / {totalPages}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Önceki
                  </button>
                  <button
                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                    disabled={page === totalPages}
                    className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Sonraki
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Görüntüleme Modal */}
      {viewModal.open && viewModal.service && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-primary-600" />
                Hizmet Detayı
              </h2>
              <button
                onClick={() => setViewModal({ open: false, service: null })}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-500">İşletme</label>
                <p className="mt-1 text-gray-900 font-medium">{viewModal.service.storeName}</p>
                {viewModal.service.companyId && (
                  <p className="text-sm text-gray-500">
                    {`${viewModal.service.companyId.firstName || ''} ${viewModal.service.companyId.lastName || ''}`.trim()}
                    {viewModal.service.companyId.email && ` • ${viewModal.service.companyId.email}`}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Hizmet Adı</label>
                <p className="mt-1 text-gray-900 font-medium text-lg">{viewModal.service.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Açıklama</label>
                <p className="mt-1 text-gray-900 whitespace-pre-wrap">{viewModal.service.description || '-'}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500">Kategori</label>
                  <p className="mt-1">
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                      {viewModal.service.category}
                    </span>
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Durum</label>
                  <p className="mt-1">
                    <span
                      className={`px-2 py-1 rounded text-sm ${
                        viewModal.service.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {viewModal.service.isActive ? 'Aktif' : 'Pasif'}
                    </span>
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <label className="block text-sm font-medium text-gray-500">Süre</label>
                  <p className="mt-1 text-xl font-bold text-gray-900">
                    {viewModal.service.duration} <span className="text-sm font-normal">dk</span>
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Fiyat</label>
                  <p className="mt-1 text-xl font-bold text-primary-600">
                    {viewModal.service.price?.toLocaleString('tr-TR')} ₺
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">İptal Süresi</label>
                  <p className="mt-1 text-xl font-bold text-gray-900">
                    {viewModal.service.cancelDuration || 0} <span className="text-sm font-normal">dk</span>
                  </p>
                </div>
              </div>
            </div>
            <div className="flex justify-end p-4 border-t">
              <button
                onClick={() => setViewModal({ open: false, service: null })}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Düzenleme Modal */}
      {editModal.open && editModal.service && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-xl font-semibold">Hizmet Düzenle</h2>
              <button
                onClick={() => setEditModal({ open: false, service: null })}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="p-3 bg-gray-50 rounded-lg">
                <label className="block text-sm font-medium text-gray-500">İşletme</label>
                <p className="mt-1 text-gray-900 font-medium">{editModal.service.storeName}</p>
                <p className="text-xs text-gray-400 mt-1">İşletme değiştirilemez</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hizmet Adı *</label>
                <input
                  type="text"
                  value={editModal.service.name || ''}
                  onChange={(e) => updateField('name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Açıklama</label>
                <textarea
                  value={editModal.service.description || ''}
                  onChange={(e) => updateField('description', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Hizmet açıklaması (opsiyonel)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hizmet Türü *</label>
                <select
                  value={editModal.service.category || ''}
                  onChange={(e) => updateField('category', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">Hizmet türü seçin</option>
                  {availableServicesForEdit.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
                {editModal.service.businessField && SECTORS[editModal.service.businessField] && (
                  <p className="text-xs text-gray-500 mt-1">
                    Sektör: {SECTORS[editModal.service.businessField].name}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Süre (dk) *</label>
                  <input
                    type="number"
                    value={editModal.service.duration || ''}
                    onChange={(e) => updateField('duration', e.target.value)}
                    min="1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fiyat (₺) *</label>
                  <input
                    type="number"
                    value={editModal.service.price || ''}
                    onChange={(e) => updateField('price', e.target.value)}
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">İptal Süresi</label>
                  <input
                    type="number"
                    value={editModal.service.cancelDuration || ''}
                    onChange={(e) => updateField('cancelDuration', e.target.value)}
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={editModal.service.isActive ?? true}
                  onChange={(e) => updateField('isActive', e.target.checked)}
                  className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <label htmlFor="isActive" className="text-sm text-gray-700 cursor-pointer">
                  Hizmet aktif
                </label>
              </div>
            </div>
            <div className="flex justify-end gap-3 p-4 border-t">
              <button
                onClick={() => setEditModal({ open: false, service: null })}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                İptal
              </button>
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                <Save className="w-4 h-4" />
                Kaydet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Yeni Hizmet Ekleme Modal */}
      {createModal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Plus className="w-5 h-5 text-primary-600" />
                Yeni Hizmet Ekle
              </h2>
              <button
                onClick={() => setCreateModal({ open: false })}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {/* İşletme Seçimi */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">İşletme *</label>
                {selectedStore ? (
                  <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">
                        {selectedStore.storeName || selectedStore.businessName}
                      </p>
                      {selectedStore.companyId && (
                        <p className="text-sm text-gray-500">
                          {`${selectedStore.companyId.firstName || ''} ${selectedStore.companyId.lastName || ''}`.trim()}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => {
                        setSelectedStore(null);
                        setNewService((prev) => ({ ...prev, storeId: '' }));
                      }}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="text"
                        value={storeSearch}
                        onChange={(e) => setStoreSearch(e.target.value)}
                        placeholder="İşletme ara (isim)..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>
                    {loadingStores && (
                      <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg mt-1 p-3 text-center text-gray-500 shadow-lg z-10">
                        Aranıyor...
                      </div>
                    )}
                    {!loadingStores && stores.length > 0 && (
                      <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg mt-1 max-h-48 overflow-y-auto shadow-lg z-10">
                        {stores.map((store) => (
                          <button
                            key={store._id}
                            onClick={() => selectStore(store)}
                            className="w-full text-left px-4 py-2 hover:bg-gray-50 border-b last:border-b-0"
                          >
                            <p className="font-medium text-gray-900">
                              {store.storeName || store.businessName}
                            </p>
                            {store.companyId && (
                              <p className="text-sm text-gray-500">
                                {`${store.companyId.firstName || ''} ${store.companyId.lastName || ''}`.trim()}
                              </p>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                    {!loadingStores && storeSearch.length >= 2 && stores.length === 0 && (
                      <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg mt-1 p-3 text-center text-gray-500 shadow-lg z-10">
                        İşletme bulunamadı
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hizmet Adı *</label>
                <input
                  type="text"
                  value={newService.name}
                  onChange={(e) => setNewService((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Örn: Saç Kesimi"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Açıklama</label>
                <textarea
                  value={newService.description}
                  onChange={(e) => setNewService((prev) => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  placeholder="Hizmet açıklaması (opsiyonel)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hizmet Türü *</label>
                <select
                  value={newService.category}
                  onChange={(e) => setNewService((prev) => ({ ...prev, category: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  disabled={!selectedStore}
                >
                  <option value="">Hizmet türü seçin</option>
                  {availableServicesForNewService.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
                {selectedStore?.businessField && SECTORS[selectedStore.businessField] && (
                  <p className="text-xs text-gray-500 mt-1">
                    Sektör: {SECTORS[selectedStore.businessField].name}
                  </p>
                )}
                {!selectedStore && (
                  <p className="text-xs text-yellow-600 mt-1">
                    Önce işletme seçin
                  </p>
                )}
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Süre (dk) *</label>
                  <input
                    type="number"
                    value={newService.duration}
                    onChange={(e) => setNewService((prev) => ({ ...prev, duration: e.target.value }))}
                    min="1"
                    placeholder="30"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fiyat (₺) *</label>
                  <input
                    type="number"
                    value={newService.price}
                    onChange={(e) => setNewService((prev) => ({ ...prev, price: e.target.value }))}
                    min="0"
                    step="0.01"
                    placeholder="100"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">İptal Süresi</label>
                  <input
                    type="number"
                    value={newService.cancelDuration}
                    onChange={(e) => setNewService((prev) => ({ ...prev, cancelDuration: e.target.value }))}
                    min="0"
                    placeholder="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="newIsActive"
                  checked={newService.isActive}
                  onChange={(e) => setNewService((prev) => ({ ...prev, isActive: e.target.checked }))}
                  className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <label htmlFor="newIsActive" className="text-sm text-gray-700 cursor-pointer">
                  Hizmet aktif olarak başlasın
                </label>
              </div>
            </div>
            <div className="flex justify-end gap-3 p-4 border-t">
              <button
                onClick={() => setCreateModal({ open: false })}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                İptal
              </button>
              <button
                onClick={handleCreateService}
                className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                <Plus className="w-4 h-4" />
                Hizmet Ekle
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
