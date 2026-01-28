import { useState } from 'react';
import GenericModelList from '../components/GenericModelList';
import { adminService } from '../services/adminService';
import { X, Save, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Addresses() {
  const [editModal, setEditModal] = useState({ open: false, address: null });
  const [viewModal, setViewModal] = useState({ open: false, address: null });
  const [refreshKey, setRefreshKey] = useState(0);

  const columns = [
    { key: 'user', label: 'Kullanıcı' },
    { key: 'title', label: 'Adres Başlığı' },
    { key: 'fullName', label: 'Ad Soyad' },
    { key: 'phone', label: 'Telefon' },
    { key: 'address', label: 'Adres' },
    { key: 'city', label: 'Şehir' },
    { key: 'district', label: 'İlçe' },
    { key: 'isDefault', label: 'Varsayılan' },
  ];

  const getRowData = (item) => ({
    user: item.userId ? `${item.userId.firstName || ''} ${item.userId.lastName || ''}`.trim() || item.userId.email || '-' : '-',
    title: item.title || '-',
    fullName: `${item.firstName || ''} ${item.lastName || ''}`.trim() || '-',
    phone: item.phoneNumber || '-',
    address: item.addressLine1 ? (item.addressLine1.length > 40 ? item.addressLine1.substring(0, 40) + '...' : item.addressLine1) : '-',
    city: item.city || '-',
    district: item.district || '-',
    isDefault: item.isDefault,
  });

  const handleEdit = (item) => {
    setEditModal({ open: true, address: { ...item } });
  };

  const handleView = (item) => {
    setViewModal({ open: true, address: item });
  };

  const handleSave = async () => {
    try {
      const { _id, ...data } = editModal.address;
      // Sadece değiştirilebilir alanları gönder
      const updateData = {
        title: data.title,
        firstName: data.firstName,
        lastName: data.lastName,
        phoneNumber: data.phoneNumber,
        addressLine1: data.addressLine1,
        addressLine2: data.addressLine2,
        city: data.city,
        district: data.district,
        postalCode: data.postalCode,
        country: data.country,
        isDefault: data.isDefault,
        isBillingAddress: data.isBillingAddress,
        taxNumber: data.taxNumber,
        taxOffice: data.taxOffice,
      };
      await adminService.addresses.update(_id, updateData);
      toast.success('Adres başarıyla güncellendi');
      setEditModal({ open: false, address: null });
      setRefreshKey((k) => k + 1);
    } catch (error) {
      console.error('Update error:', error);
      toast.error('Güncelleme başarısız: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleDelete = async (id) => {
    await adminService.addresses.delete(id);
  };

  const updateField = (field, value) => {
    setEditModal((prev) => ({
      ...prev,
      address: { ...prev.address, [field]: value },
    }));
  };

  return (
    <div>
      <GenericModelList
        title="Adresler"
        service={adminService.addresses}
        columns={columns}
        getRowData={getRowData}
        searchFields={['title', 'firstName', 'lastName', 'phoneNumber', 'addressLine1', 'city', 'district']}
        searchPlaceholder="Ad, telefon, adres veya şehir ara..."
        onEdit={handleEdit}
        onView={handleView}
        onDelete={handleDelete}
        refreshKey={refreshKey}
      />

      {/* Görüntüleme Modal */}
      {viewModal.open && viewModal.address && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary-600" />
                Adres Detayı
              </h2>
              <button
                onClick={() => setViewModal({ open: false, address: null })}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500">Kullanıcı</label>
                  <p className="mt-1 text-gray-900">
                    {viewModal.address.userId
                      ? `${viewModal.address.userId.firstName || ''} ${viewModal.address.userId.lastName || ''}`.trim() ||
                        viewModal.address.userId.email
                      : '-'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Adres Başlığı</label>
                  <p className="mt-1 text-gray-900">{viewModal.address.title || '-'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Ad</label>
                  <p className="mt-1 text-gray-900">{viewModal.address.firstName || '-'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Soyad</label>
                  <p className="mt-1 text-gray-900">{viewModal.address.lastName || '-'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Telefon</label>
                  <p className="mt-1 text-gray-900">{viewModal.address.phoneNumber || '-'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Posta Kodu</label>
                  <p className="mt-1 text-gray-900">{viewModal.address.postalCode || '-'}</p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Adres Satırı 1</label>
                <p className="mt-1 text-gray-900">{viewModal.address.addressLine1 || '-'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Adres Satırı 2</label>
                <p className="mt-1 text-gray-900">{viewModal.address.addressLine2 || '-'}</p>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500">Şehir</label>
                  <p className="mt-1 text-gray-900">{viewModal.address.city || '-'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">İlçe</label>
                  <p className="mt-1 text-gray-900">{viewModal.address.district || '-'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Ülke</label>
                  <p className="mt-1 text-gray-900">{viewModal.address.country || '-'}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500">Varsayılan Adres</label>
                  <p className="mt-1">
                    <span
                      className={`px-2 py-1 rounded text-sm ${
                        viewModal.address.isDefault ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {viewModal.address.isDefault ? 'Evet' : 'Hayır'}
                    </span>
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Fatura Adresi</label>
                  <p className="mt-1">
                    <span
                      className={`px-2 py-1 rounded text-sm ${
                        viewModal.address.isBillingAddress ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {viewModal.address.isBillingAddress ? 'Evet' : 'Hayır'}
                    </span>
                  </p>
                </div>
              </div>
              {viewModal.address.isBillingAddress && (
                <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Vergi Numarası</label>
                    <p className="mt-1 text-gray-900">{viewModal.address.taxNumber || '-'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Vergi Dairesi</label>
                    <p className="mt-1 text-gray-900">{viewModal.address.taxOffice || '-'}</p>
                  </div>
                </div>
              )}
              {(viewModal.address.latitude || viewModal.address.longitude) && (
                <div className="grid grid-cols-2 gap-4 p-4 bg-blue-50 rounded-lg">
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Enlem (Latitude)</label>
                    <p className="mt-1 text-gray-900">{viewModal.address.latitude || '-'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Boylam (Longitude)</label>
                    <p className="mt-1 text-gray-900">{viewModal.address.longitude || '-'}</p>
                  </div>
                </div>
              )}
            </div>
            <div className="flex justify-end p-4 border-t">
              <button
                onClick={() => setViewModal({ open: false, address: null })}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Düzenleme Modal */}
      {editModal.open && editModal.address && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-xl font-semibold">Adres Düzenle</h2>
              <button
                onClick={() => setEditModal({ open: false, address: null })}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Adres Başlığı *</label>
                  <input
                    type="text"
                    value={editModal.address.title || ''}
                    onChange={(e) => updateField('title', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Ev, İş, vb."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Telefon *</label>
                  <input
                    type="text"
                    value={editModal.address.phoneNumber || ''}
                    onChange={(e) => updateField('phoneNumber', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ad *</label>
                  <input
                    type="text"
                    value={editModal.address.firstName || ''}
                    onChange={(e) => updateField('firstName', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Soyad *</label>
                  <input
                    type="text"
                    value={editModal.address.lastName || ''}
                    onChange={(e) => updateField('lastName', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Adres Satırı 1 *</label>
                <textarea
                  value={editModal.address.addressLine1 || ''}
                  onChange={(e) => updateField('addressLine1', e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Mahalle, Sokak, Bina No, Daire"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Adres Satırı 2</label>
                <input
                  type="text"
                  value={editModal.address.addressLine2 || ''}
                  onChange={(e) => updateField('addressLine2', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Ek adres bilgisi (opsiyonel)"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Şehir *</label>
                  <input
                    type="text"
                    value={editModal.address.city || ''}
                    onChange={(e) => updateField('city', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">İlçe *</label>
                  <input
                    type="text"
                    value={editModal.address.district || ''}
                    onChange={(e) => updateField('district', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Posta Kodu</label>
                  <input
                    type="text"
                    value={editModal.address.postalCode || ''}
                    onChange={(e) => updateField('postalCode', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ülke</label>
                <input
                  type="text"
                  value={editModal.address.country || 'Türkiye'}
                  onChange={(e) => updateField('country', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editModal.address.isDefault || false}
                    onChange={(e) => updateField('isDefault', e.target.checked)}
                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-700">Varsayılan Adres</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editModal.address.isBillingAddress || false}
                    onChange={(e) => updateField('isBillingAddress', e.target.checked)}
                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-700">Fatura Adresi</span>
                </label>
              </div>

              {editModal.address.isBillingAddress && (
                <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Vergi Numarası</label>
                    <input
                      type="text"
                      value={editModal.address.taxNumber || ''}
                      onChange={(e) => updateField('taxNumber', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Vergi Dairesi</label>
                    <input
                      type="text"
                      value={editModal.address.taxOffice || ''}
                      onChange={(e) => updateField('taxOffice', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-3 p-4 border-t">
              <button
                onClick={() => setEditModal({ open: false, address: null })}
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
    </div>
  );
}
