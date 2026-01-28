import { useState, useEffect } from 'react';
import GenericModelList from '../components/GenericModelList';
import { adminService } from '../services/adminService';
import { X, Save, Bell, Send, Search } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Notifications() {
  const [editModal, setEditModal] = useState({ open: false, notification: null });
  const [viewModal, setViewModal] = useState({ open: false, notification: null });
  const [createModal, setCreateModal] = useState({ open: false });
  const [refreshKey, setRefreshKey] = useState(0);
  
  // Kullanıcı arama için
  const [userSearch, setUserSearch] = useState('');
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  
  // Yeni bildirim formu
  const [newNotification, setNewNotification] = useState({
    userId: '',
    title: '',
    message: '',
    type: 'info',
    kind: 'other',
  });

  const columns = [
    { key: 'user', label: 'Kullanıcı' },
    { key: 'title', label: 'Başlık' },
    { key: 'message', label: 'Mesaj' },
    { key: 'type', label: 'Tip' },
    { key: 'kind', label: 'Tür' },
    { key: 'isRead', label: 'Okundu' },
    { key: 'createdAt', label: 'Oluşturulma' },
  ];

  const typeLabels = {
    info: { label: 'Bilgi', color: 'bg-blue-100 text-blue-800' },
    success: { label: 'Başarılı', color: 'bg-green-100 text-green-800' },
    warning: { label: 'Uyarı', color: 'bg-yellow-100 text-yellow-800' },
    error: { label: 'Hata', color: 'bg-red-100 text-red-800' },
    appointment: { label: 'Randevu', color: 'bg-purple-100 text-purple-800' },
    payment: { label: 'Ödeme', color: 'bg-indigo-100 text-indigo-800' },
    system: { label: 'Sistem', color: 'bg-gray-100 text-gray-800' },
  };

  const kindLabels = {
    upcoming: { label: 'Yaklaşan', color: 'bg-cyan-100 text-cyan-800' },
    cancel: { label: 'İptal', color: 'bg-red-100 text-red-800' },
    campaign: { label: 'Kampanya', color: 'bg-pink-100 text-pink-800' },
    other: { label: 'Diğer', color: 'bg-gray-100 text-gray-800' },
    order: { label: 'Sipariş', color: 'bg-orange-100 text-orange-800' },
    payment_success: { label: 'Ödeme Başarılı', color: 'bg-green-100 text-green-800' },
    payment_failed: { label: 'Ödeme Başarısız', color: 'bg-red-100 text-red-800' },
  };

  const getRowData = (item) => ({
    user: item.userId
      ? `${item.userId.firstName || ''} ${item.userId.lastName || ''}`.trim() || item.userId.email || item.userId.phoneNumber || '-'
      : '-',
    title: item.title || '-',
    message: item.message ? (item.message.length > 40 ? item.message.substring(0, 40) + '...' : item.message) : '-',
    type: item.type || 'info',
    kind: item.kind || 'other',
    isRead: item.isRead,
    createdAt: item.createdAt,
  });

  // Kullanıcı arama
  useEffect(() => {
    const searchUsers = async () => {
      if (userSearch.length < 2) {
        setUsers([]);
        return;
      }
      setLoadingUsers(true);
      try {
        const response = await adminService.getAllUsers({ search: userSearch, limit: 10 });
        if (response.data.success) {
          setUsers(response.data.data);
        }
      } catch (error) {
        console.error('User search error:', error);
      } finally {
        setLoadingUsers(false);
      }
    };

    const debounce = setTimeout(searchUsers, 300);
    return () => clearTimeout(debounce);
  }, [userSearch]);

  const handleEdit = (item) => {
    setEditModal({ open: true, notification: { ...item } });
  };

  const handleView = (item) => {
    setViewModal({ open: true, notification: item });
  };

  const handleCreate = () => {
    setNewNotification({
      userId: '',
      title: '',
      message: '',
      type: 'info',
      kind: 'other',
    });
    setSelectedUser(null);
    setUserSearch('');
    setUsers([]);
    setCreateModal({ open: true });
  };

  const handleSave = async () => {
    try {
      const { _id, userId, ...data } = editModal.notification;
      const updateData = {
        title: data.title,
        message: data.message,
        type: data.type,
        kind: data.kind,
        isRead: data.isRead,
      };
      await adminService.notifications.update(_id, updateData);
      toast.success('Bildirim başarıyla güncellendi');
      setEditModal({ open: false, notification: null });
      setRefreshKey((k) => k + 1);
    } catch (error) {
      console.error('Update error:', error);
      toast.error('Güncelleme başarısız: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleSendNotification = async () => {
    if (!newNotification.userId) {
      toast.error('Lütfen bir kullanıcı seçin');
      return;
    }
    if (!newNotification.title || !newNotification.message) {
      toast.error('Başlık ve mesaj zorunludur');
      return;
    }

    try {
      await adminService.notifications.create(newNotification);
      toast.success('Bildirim başarıyla gönderildi');
      setCreateModal({ open: false });
      setRefreshKey((k) => k + 1);
    } catch (error) {
      console.error('Create error:', error);
      toast.error('Bildirim gönderilemedi: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleDelete = async (id) => {
    await adminService.notifications.delete(id);
  };

  const updateField = (field, value) => {
    setEditModal((prev) => ({
      ...prev,
      notification: { ...prev.notification, [field]: value },
    }));
  };

  const selectUser = (user) => {
    setSelectedUser(user);
    setNewNotification((prev) => ({ ...prev, userId: user._id }));
    setUserSearch('');
    setUsers([]);
  };

  return (
    <div>
      <GenericModelList
        title="Bildirimler"
        service={adminService.notifications}
        columns={columns}
        getRowData={getRowData}
        searchFields={['title', 'message']}
        searchPlaceholder="Başlık, mesaj veya kullanıcı ara..."
        onCreate={handleCreate}
        onEdit={handleEdit}
        onView={handleView}
        onDelete={handleDelete}
        refreshKey={refreshKey}
        filters={[
          {
            key: 'type',
            type: 'select',
            label: 'Tip',
            placeholder: 'Tüm Tipler',
            options: [
              { value: 'info', label: 'Bilgi' },
              { value: 'success', label: 'Başarılı' },
              { value: 'warning', label: 'Uyarı' },
              { value: 'error', label: 'Hata' },
              { value: 'appointment', label: 'Randevu' },
              { value: 'payment', label: 'Ödeme' },
              { value: 'system', label: 'Sistem' },
            ],
          },
          {
            key: 'kind',
            type: 'select',
            label: 'Tür',
            placeholder: 'Tüm Türler',
            options: [
              { value: 'upcoming', label: 'Yaklaşan' },
              { value: 'cancel', label: 'İptal' },
              { value: 'campaign', label: 'Kampanya' },
              { value: 'order', label: 'Sipariş' },
              { value: 'payment_success', label: 'Ödeme Başarılı' },
              { value: 'payment_failed', label: 'Ödeme Başarısız' },
              { value: 'other', label: 'Diğer' },
            ],
          },
          {
            key: 'isRead',
            type: 'select',
            label: 'Okundu',
            placeholder: 'Tümü',
            options: [
              { value: 'true', label: 'Okundu' },
              { value: 'false', label: 'Okunmadı' },
            ],
          },
        ]}
      />

      {/* Görüntüleme Modal */}
      {viewModal.open && viewModal.notification && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Bell className="w-5 h-5 text-primary-600" />
                Bildirim Detayı
              </h2>
              <button
                onClick={() => setViewModal({ open: false, notification: null })}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-500">Kullanıcı</label>
                <p className="mt-1 text-gray-900">
                  {viewModal.notification.userId
                    ? `${viewModal.notification.userId.firstName || ''} ${viewModal.notification.userId.lastName || ''}`.trim() ||
                      viewModal.notification.userId.email ||
                      viewModal.notification.userId.phoneNumber
                    : '-'}
                </p>
                {viewModal.notification.userId?.email && (
                  <p className="text-sm text-gray-500">{viewModal.notification.userId.email}</p>
                )}
                {viewModal.notification.userId?.phoneNumber && (
                  <p className="text-sm text-gray-500">{viewModal.notification.userId.phoneNumber}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Başlık</label>
                <p className="mt-1 text-gray-900 font-medium">{viewModal.notification.title || '-'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Mesaj</label>
                <p className="mt-1 text-gray-900 whitespace-pre-wrap">{viewModal.notification.message || '-'}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500">Tip</label>
                  <p className="mt-1">
                    <span className={`px-2 py-1 rounded text-sm ${typeLabels[viewModal.notification.type]?.color || 'bg-gray-100 text-gray-800'}`}>
                      {typeLabels[viewModal.notification.type]?.label || viewModal.notification.type}
                    </span>
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Tür</label>
                  <p className="mt-1">
                    <span className={`px-2 py-1 rounded text-sm ${kindLabels[viewModal.notification.kind]?.color || 'bg-gray-100 text-gray-800'}`}>
                      {kindLabels[viewModal.notification.kind]?.label || viewModal.notification.kind}
                    </span>
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500">Okundu</label>
                  <p className="mt-1">
                    <span
                      className={`px-2 py-1 rounded text-sm ${
                        viewModal.notification.isRead ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {viewModal.notification.isRead ? 'Evet' : 'Hayır'}
                    </span>
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Oluşturulma</label>
                  <p className="mt-1 text-gray-900">
                    {viewModal.notification.createdAt
                      ? new Date(viewModal.notification.createdAt).toLocaleString('tr-TR')
                      : '-'}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex justify-end p-4 border-t">
              <button
                onClick={() => setViewModal({ open: false, notification: null })}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Düzenleme Modal */}
      {editModal.open && editModal.notification && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-xl font-semibold">Bildirim Düzenle</h2>
              <button
                onClick={() => setEditModal({ open: false, notification: null })}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="p-3 bg-gray-50 rounded-lg">
                <label className="block text-sm font-medium text-gray-500">Kullanıcı</label>
                <p className="mt-1 text-gray-900">
                  {editModal.notification.userId
                    ? `${editModal.notification.userId.firstName || ''} ${editModal.notification.userId.lastName || ''}`.trim() ||
                      editModal.notification.userId.email
                    : '-'}
                </p>
                <p className="text-xs text-gray-400 mt-1">Kullanıcı değiştirilemez</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Başlık *</label>
                <input
                  type="text"
                  value={editModal.notification.title || ''}
                  onChange={(e) => updateField('title', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mesaj *</label>
                <textarea
                  value={editModal.notification.message || ''}
                  onChange={(e) => updateField('message', e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tip</label>
                  <select
                    value={editModal.notification.type || 'info'}
                    onChange={(e) => updateField('type', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="info">Bilgi</option>
                    <option value="success">Başarılı</option>
                    <option value="warning">Uyarı</option>
                    <option value="error">Hata</option>
                    <option value="appointment">Randevu</option>
                    <option value="payment">Ödeme</option>
                    <option value="system">Sistem</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tür</label>
                  <select
                    value={editModal.notification.kind || 'other'}
                    onChange={(e) => updateField('kind', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="upcoming">Yaklaşan</option>
                    <option value="cancel">İptal</option>
                    <option value="campaign">Kampanya</option>
                    <option value="order">Sipariş</option>
                    <option value="payment_success">Ödeme Başarılı</option>
                    <option value="payment_failed">Ödeme Başarısız</option>
                    <option value="other">Diğer</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isRead"
                  checked={editModal.notification.isRead || false}
                  onChange={(e) => updateField('isRead', e.target.checked)}
                  className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <label htmlFor="isRead" className="text-sm text-gray-700 cursor-pointer">
                  Okundu olarak işaretle
                </label>
              </div>
            </div>
            <div className="flex justify-end gap-3 p-4 border-t">
              <button
                onClick={() => setEditModal({ open: false, notification: null })}
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

      {/* Yeni Bildirim Gönderme Modal */}
      {createModal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Send className="w-5 h-5 text-primary-600" />
                Yeni Bildirim Gönder
              </h2>
              <button
                onClick={() => setCreateModal({ open: false })}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {/* Kullanıcı Seçimi */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kullanıcı *</label>
                {selectedUser ? (
                  <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">
                        {`${selectedUser.firstName || ''} ${selectedUser.lastName || ''}`.trim() || selectedUser.email}
                      </p>
                      <p className="text-sm text-gray-500">{selectedUser.email || selectedUser.phoneNumber}</p>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedUser(null);
                        setNewNotification((prev) => ({ ...prev, userId: '' }));
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
                        value={userSearch}
                        onChange={(e) => setUserSearch(e.target.value)}
                        placeholder="Kullanıcı ara (isim, email veya telefon)..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>
                    {loadingUsers && (
                      <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg mt-1 p-3 text-center text-gray-500 shadow-lg z-10">
                        Aranıyor...
                      </div>
                    )}
                    {!loadingUsers && users.length > 0 && (
                      <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg mt-1 max-h-48 overflow-y-auto shadow-lg z-10">
                        {users.map((user) => (
                          <button
                            key={user._id}
                            onClick={() => selectUser(user)}
                            className="w-full text-left px-4 py-2 hover:bg-gray-50 border-b last:border-b-0"
                          >
                            <p className="font-medium text-gray-900">
                              {`${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email}
                            </p>
                            <p className="text-sm text-gray-500">
                              {user.email} {user.phoneNumber && `• ${user.phoneNumber}`}
                            </p>
                            <p className="text-xs text-gray-400">
                              {user.userType === 'user' ? 'Kullanıcı' : user.userType === 'company' ? 'İşletme' : user.userType === 'employee' ? 'Çalışan' : user.userType}
                            </p>
                          </button>
                        ))}
                      </div>
                    )}
                    {!loadingUsers && userSearch.length >= 2 && users.length === 0 && (
                      <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg mt-1 p-3 text-center text-gray-500 shadow-lg z-10">
                        Kullanıcı bulunamadı
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Başlık *</label>
                <input
                  type="text"
                  value={newNotification.title}
                  onChange={(e) => setNewNotification((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="Bildirim başlığı"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mesaj *</label>
                <textarea
                  value={newNotification.message}
                  onChange={(e) => setNewNotification((prev) => ({ ...prev, message: e.target.value }))}
                  rows={4}
                  placeholder="Bildirim mesajı"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tip</label>
                  <select
                    value={newNotification.type}
                    onChange={(e) => setNewNotification((prev) => ({ ...prev, type: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="info">Bilgi</option>
                    <option value="success">Başarılı</option>
                    <option value="warning">Uyarı</option>
                    <option value="error">Hata</option>
                    <option value="appointment">Randevu</option>
                    <option value="payment">Ödeme</option>
                    <option value="system">Sistem</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tür</label>
                  <select
                    value={newNotification.kind}
                    onChange={(e) => setNewNotification((prev) => ({ ...prev, kind: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="upcoming">Yaklaşan</option>
                    <option value="cancel">İptal</option>
                    <option value="campaign">Kampanya</option>
                    <option value="order">Sipariş</option>
                    <option value="payment_success">Ödeme Başarılı</option>
                    <option value="payment_failed">Ödeme Başarısız</option>
                    <option value="other">Diğer</option>
                  </select>
                </div>
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
                onClick={handleSendNotification}
                className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                <Send className="w-4 h-4" />
                Gönder
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
