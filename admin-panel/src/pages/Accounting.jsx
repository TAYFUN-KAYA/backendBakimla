import { useState, useEffect } from 'react';
import GenericModelList from '../components/GenericModelList';
import { adminService } from '../services/adminService';
import { X, Save, Plus, Search, Calendar, ShoppingCart, Building2, User } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export default function Accounting() {
  const [createModal, setCreateModal] = useState({ open: false });
  const [editModal, setEditModal] = useState({ open: false, item: null });
  const [companies, setCompanies] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [orders, setOrders] = useState([]);
  const [companySearch, setCompanySearch] = useState('');
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [appointmentSearch, setAppointmentSearch] = useState('');
  const [orderSearch, setOrderSearch] = useState('');
  const [sourceType, setSourceType] = useState('manual'); // 'manual', 'appointment', 'order'

  const [newAccounting, setNewAccounting] = useState({
    companyId: '',
    employeeId: '',
    appointmentId: '',
    orderId: '',
    date: new Date().toISOString().split('T')[0],
    income: 0,
    expense: 0,
    description: '',
    category: '',
    paymentMethod: 'nakit',
  });

  const columns = [
    { key: 'companyId', label: 'İşletme' },
    { key: 'source', label: 'Kaynak' },
    { key: 'amount', label: 'Tutar' },
    { key: 'description', label: 'Açıklama' },
    { key: 'date', label: 'Tarih' },
    { key: 'paymentMethod', label: 'Ödeme Yöntemi' },
  ];

  const getRowData = (item) => {
    const companyName = item.companyId 
      ? (typeof item.companyId === 'object' 
          ? `${item.companyId.firstName || ''} ${item.companyId.lastName || ''}`.trim() || item.companyId.email || '-'
          : item.companyId)
      : '-';
    
    let source = 'Manuel';
    if (item.appointmentId) {
      source = item.appointmentId 
        ? (typeof item.appointmentId === 'object' 
            ? `Randevu: ${item.appointmentId.serviceType || item.appointmentId._id}` 
            : `Randevu: ${item.appointmentId}`)
        : 'Manuel';
    } else if (item.orderId) {
      source = item.orderId 
        ? (typeof item.orderId === 'object' 
            ? `Sipariş: ${item.orderId.orderNumber || item.orderId._id}` 
            : `Sipariş: ${item.orderId}`)
        : 'Manuel';
    }

    const amount = item.income > 0 
      ? `+${item.income.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺`
      : item.expense > 0
      ? `-${item.expense.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺`
      : '0 ₺';

    return {
      companyId: companyName,
      source: source,
      amount: amount,
      description: item.description ? (item.description.length > 50 ? item.description.substring(0, 50) + '...' : item.description) : '-',
      date: item.date || item.createdAt,
      paymentMethod: item.paymentMethod === 'nakit' ? 'Nakit' : item.paymentMethod === 'iban' ? 'IBAN' : item.paymentMethod === 'online' ? 'Online' : item.paymentMethod || '-',
    };
  };

  // İşletme arama
  useEffect(() => {
    const searchCompanies = async () => {
      if (companySearch.length < 2) {
        setCompanies([]);
        return;
      }
      setLoadingCompanies(true);
      try {
        const response = await adminService.getAllUsers({ search: companySearch, userType: 'company', limit: 10 });
        if (response.data.success) {
          const companyUsers = response.data.data.filter(u => u.userType === 'company');
          setCompanies(companyUsers);
        }
      } catch (error) {
        console.error('Company search error:', error);
      } finally {
        setLoadingCompanies(false);
      }
    };

    const debounce = setTimeout(searchCompanies, 300);
    return () => clearTimeout(debounce);
  }, [companySearch]);

  // Randevu arama
  useEffect(() => {
    const searchAppointments = async () => {
      if (!selectedCompany || appointmentSearch.length < 2) {
        setAppointments([]);
        return;
      }
      try {
        const companyId = typeof selectedCompany === 'object' ? selectedCompany._id : selectedCompany;
        const response = await adminService.getAllAppointments({ 
          companyId, 
          search: appointmentSearch,
          limit: 10 
        });
        if (response.data.success) {
          setAppointments(response.data.data || []);
        }
      } catch (error) {
        console.error('Appointment search error:', error);
      }
    };

    const debounce = setTimeout(searchAppointments, 300);
    return () => clearTimeout(debounce);
  }, [appointmentSearch, selectedCompany]);

  // Sipariş arama
  useEffect(() => {
    const searchOrders = async () => {
      if (!selectedCompany || orderSearch.length < 2) {
        setOrders([]);
        return;
      }
      try {
        const response = await adminService.getAllOrders({ 
          search: orderSearch,
          limit: 10 
        });
        if (response.data.success) {
          // Siparişlerde companyId yok, userId var - bu durumda tüm siparişleri göster
          setOrders(response.data.data || []);
        }
      } catch (error) {
        console.error('Order search error:', error);
      }
    };

    const debounce = setTimeout(searchOrders, 300);
    return () => clearTimeout(debounce);
  }, [orderSearch, selectedCompany]);

  const handleCreate = () => {
    setNewAccounting({
      companyId: '',
      employeeId: '',
      appointmentId: '',
      orderId: '',
      date: new Date().toISOString().split('T')[0],
      income: 0,
      expense: 0,
      description: '',
      category: '',
      paymentMethod: 'nakit',
    });
    setSelectedCompany(null);
    setCompanySearch('');
    setSourceType('manual');
    setCreateModal({ open: true });
  };

  const handleEdit = (item) => {
    setEditModal({ open: true, item: { ...item } });
    if (item.appointmentId) {
      setSourceType('appointment');
    } else if (item.orderId) {
      setSourceType('order');
    } else {
      setSourceType('manual');
    }
  };

  const handleCreateSubmit = async () => {
    if (!newAccounting.companyId) {
      toast.error('Lütfen bir işletme seçin');
      return;
    }
    if (!newAccounting.date) {
      toast.error('Lütfen bir tarih seçin');
      return;
    }
    if (newAccounting.income === 0 && newAccounting.expense === 0) {
      toast.error('Gelir veya gider tutarı girmelisiniz');
      return;
    }

    try {
      const accountingData = {
        companyId: newAccounting.companyId,
        date: newAccounting.date,
        income: parseFloat(newAccounting.income) || 0,
        expense: parseFloat(newAccounting.expense) || 0,
        description: newAccounting.description,
        category: newAccounting.category,
        paymentMethod: newAccounting.paymentMethod,
      };

      if (sourceType === 'appointment' && newAccounting.appointmentId) {
        accountingData.appointmentId = newAccounting.appointmentId;
      } else if (sourceType === 'order' && newAccounting.orderId) {
        accountingData.orderId = newAccounting.orderId;
      }

      if (newAccounting.employeeId) {
        accountingData.employeeId = newAccounting.employeeId;
      }

      await adminService.accounting.create(accountingData);
      toast.success('Muhasebe kaydı başarıyla oluşturuldu');
      setCreateModal({ open: false });
      window.location.reload(); // Refresh list
    } catch (error) {
      console.error('Create error:', error);
      toast.error('Kayıt oluşturulamadı: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleEditSubmit = async () => {
    if (!editModal.item.companyId) {
      toast.error('Lütfen bir işletme seçin');
      return;
    }
    if (!editModal.item.date) {
      toast.error('Lütfen bir tarih seçin');
      return;
    }

    try {
      const accountingData = {
        companyId: typeof editModal.item.companyId === 'object' 
          ? editModal.item.companyId._id 
          : editModal.item.companyId,
        date: editModal.item.date,
        income: parseFloat(editModal.item.income) || 0,
        expense: parseFloat(editModal.item.expense) || 0,
        description: editModal.item.description || '',
        category: editModal.item.category || '',
        paymentMethod: editModal.item.paymentMethod || 'nakit',
      };

      if (editModal.item.appointmentId) {
        accountingData.appointmentId = typeof editModal.item.appointmentId === 'object' 
          ? editModal.item.appointmentId._id 
          : editModal.item.appointmentId;
      }

      if (editModal.item.orderId) {
        accountingData.orderId = typeof editModal.item.orderId === 'object' 
          ? editModal.item.orderId._id 
          : editModal.item.orderId;
      }

      if (editModal.item.employeeId) {
        accountingData.employeeId = typeof editModal.item.employeeId === 'object' 
          ? editModal.item.employeeId._id 
          : editModal.item.employeeId;
      }

      await adminService.accounting.update(editModal.item._id, accountingData);
      toast.success('Muhasebe kaydı başarıyla güncellendi');
      setEditModal({ open: false, item: null });
      window.location.reload(); // Refresh list
    } catch (error) {
      console.error('Update error:', error);
      toast.error('Kayıt güncellenemedi: ' + (error.response?.data?.message || error.message));
    }
  };

  const selectCompany = (company) => {
    setSelectedCompany(company);
    setNewAccounting({ ...newAccounting, companyId: company._id });
    setCompanySearch('');
    setCompanies([]);
  };

  const selectAppointment = (appointment) => {
    setNewAccounting({ 
      ...newAccounting, 
      appointmentId: appointment._id,
      orderId: '',
      income: appointment.totalPrice || appointment.servicePrice || 0,
      expense: 0,
      description: `Randevu: ${appointment.serviceType || 'Hizmet'}`,
      category: appointment.serviceCategory || appointment.serviceType || 'Randevu',
      paymentMethod: appointment.paymentMethod === 'card' ? 'online' : 'nakit',
      date: appointment.appointmentDate ? format(new Date(appointment.appointmentDate), 'yyyy-MM-dd') : newAccounting.date,
    });
    setAppointmentSearch('');
    setAppointments([]);
  };

  const selectOrder = (order) => {
    setNewAccounting({ 
      ...newAccounting, 
      orderId: order._id,
      appointmentId: '',
      income: order.total || 0,
      expense: 0,
      description: `Sipariş: ${order.orderNumber || order._id}`,
      category: 'Ürün Satışı',
      paymentMethod: order.paymentMethod === 'card' ? 'online' : 'nakit',
      date: order.createdAt ? format(new Date(order.createdAt), 'yyyy-MM-dd') : newAccounting.date,
    });
    setOrderSearch('');
    setOrders([]);
  };

  return (
    <>
      <GenericModelList
        title="Muhasebe"
        service={adminService.accounting}
        columns={columns}
        getRowData={getRowData}
        searchFields={['description']}
        onCreate={handleCreate}
        onEdit={handleEdit}
        onDelete={true}
      />

      {/* Create Modal */}
      {createModal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Plus className="w-5 h-5 text-primary-600" />
                Yeni Muhasebe Kaydı
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
                {selectedCompany ? (
                  <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-5 h-5 text-green-600" />
                      <div>
                        <p className="font-medium text-gray-900">
                          {`${selectedCompany.firstName || ''} ${selectedCompany.lastName || ''}`.trim() || selectedCompany.email}
                        </p>
                        {selectedCompany.email && (
                          <p className="text-sm text-gray-500">{selectedCompany.email}</p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedCompany(null);
                        setNewAccounting({ ...newAccounting, companyId: '' });
                      }}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      value={companySearch}
                      onChange={(e) => setCompanySearch(e.target.value)}
                      placeholder="İşletme ara (isim, email)..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                    {loadingCompanies && (
                      <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg mt-1 p-3 text-center text-gray-500 shadow-lg z-10">
                        Aranıyor...
                      </div>
                    )}
                    {!loadingCompanies && companies.length > 0 && (
                      <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg mt-1 max-h-48 overflow-y-auto shadow-lg z-10">
                        {companies.map((company) => (
                          <button
                            key={company._id}
                            onClick={() => selectCompany(company)}
                            className="w-full text-left px-4 py-2 hover:bg-gray-50 border-b last:border-b-0"
                          >
                            <div className="flex items-center gap-2">
                              <Building2 className="w-4 h-4 text-gray-400" />
                              <div>
                                <p className="font-medium text-gray-900">
                                  {`${company.firstName || ''} ${company.lastName || ''}`.trim() || company.email}
                                </p>
                                <p className="text-sm text-gray-500">{company.email}</p>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Kaynak Tipi */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kaynak Tipi</label>
                <select
                  value={sourceType}
                  onChange={(e) => {
                    setSourceType(e.target.value);
                    setNewAccounting({ ...newAccounting, appointmentId: '', orderId: '' });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                  <option value="manual">Manuel Kayıt</option>
                  <option value="appointment">Randevu</option>
                  <option value="order">Ürün Satışı (Sipariş)</option>
                </select>
              </div>

              {/* Randevu Seçimi */}
              {sourceType === 'appointment' && selectedCompany && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Randevu Seç</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      value={appointmentSearch}
                      onChange={(e) => setAppointmentSearch(e.target.value)}
                      placeholder="Randevu ara..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                    {appointments.length > 0 && (
                      <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg mt-1 max-h-48 overflow-y-auto shadow-lg z-10">
                        {appointments.map((appointment) => (
                          <button
                            key={appointment._id}
                            onClick={() => selectAppointment(appointment)}
                            className="w-full text-left px-4 py-2 hover:bg-gray-50 border-b last:border-b-0"
                          >
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-gray-400" />
                              <div>
                                <p className="font-medium text-gray-900">
                                  {appointment.serviceType} - {format(new Date(appointment.appointmentDate), 'dd.MM.yyyy')} {appointment.appointmentTime}
                                </p>
                                <p className="text-sm text-gray-500">
                                  {formatCurrency(appointment.totalPrice || appointment.servicePrice || 0)}
                                </p>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Sipariş Seçimi */}
              {sourceType === 'order' && selectedCompany && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sipariş Seç</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      value={orderSearch}
                      onChange={(e) => setOrderSearch(e.target.value)}
                      placeholder="Sipariş ara (sipariş no)..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                    {orders.length > 0 && (
                      <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg mt-1 max-h-48 overflow-y-auto shadow-lg z-10">
                        {orders.map((order) => (
                          <button
                            key={order._id}
                            onClick={() => selectOrder(order)}
                            className="w-full text-left px-4 py-2 hover:bg-gray-50 border-b last:border-b-0"
                          >
                            <div className="flex items-center gap-2">
                              <ShoppingCart className="w-4 h-4 text-gray-400" />
                              <div>
                                <p className="font-medium text-gray-900">
                                  Sipariş: {order.orderNumber || order._id}
                                </p>
                                <p className="text-sm text-gray-500">
                                  {formatCurrency(order.total || 0)} - {format(new Date(order.createdAt), 'dd.MM.yyyy')}
                                </p>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tarih *</label>
                  <input
                    type="date"
                    value={newAccounting.date}
                    onChange={(e) => setNewAccounting({ ...newAccounting, date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ödeme Yöntemi</label>
                  <select
                    value={newAccounting.paymentMethod}
                    onChange={(e) => setNewAccounting({ ...newAccounting, paymentMethod: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="nakit">Nakit</option>
                    <option value="iban">IBAN</option>
                    <option value="online">Online</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Gelir (₺)</label>
                  <input
                    type="number"
                    value={newAccounting.income || ''}
                    onChange={(e) => setNewAccounting({ ...newAccounting, income: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    step="0.01"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Gider (₺)</label>
                  <input
                    type="number"
                    value={newAccounting.expense || ''}
                    onChange={(e) => setNewAccounting({ ...newAccounting, expense: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    step="0.01"
                    min="0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Açıklama</label>
                <textarea
                  value={newAccounting.description}
                  onChange={(e) => setNewAccounting({ ...newAccounting, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  placeholder="Açıklama..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
                <input
                  type="text"
                  value={newAccounting.category}
                  onChange={(e) => setNewAccounting({ ...newAccounting, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  placeholder="Kategori..."
                />
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
                onClick={handleCreateSubmit}
                className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                <Save className="w-4 h-4" />
                Kaydet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editModal.open && editModal.item && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-xl font-semibold">Muhasebe Kaydı Düzenle</h2>
              <button
                onClick={() => setEditModal({ open: false, item: null })}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="p-3 bg-gray-50 rounded-lg">
                <label className="block text-sm font-medium text-gray-500">İşletme</label>
                <p className="mt-1 text-gray-900 font-medium">
                  {editModal.item.companyId 
                    ? (typeof editModal.item.companyId === 'object' 
                        ? `${editModal.item.companyId.firstName || ''} ${editModal.item.companyId.lastName || ''}`.trim() || editModal.item.companyId.email || '-'
                        : editModal.item.companyId)
                    : '-'}
                </p>
                <p className="text-xs text-gray-400 mt-1">İşletme değiştirilemez</p>
              </div>

              {editModal.item.appointmentId && (
                <div className="p-3 bg-blue-50 rounded-lg">
                  <label className="block text-sm font-medium text-blue-700">Randevu</label>
                  <p className="mt-1 text-blue-900">
                    {typeof editModal.item.appointmentId === 'object' 
                      ? `Randevu: ${editModal.item.appointmentId.serviceType || editModal.item.appointmentId._id}`
                      : `Randevu ID: ${editModal.item.appointmentId}`}
                  </p>
                </div>
              )}

              {editModal.item.orderId && (
                <div className="p-3 bg-purple-50 rounded-lg">
                  <label className="block text-sm font-medium text-purple-700">Sipariş</label>
                  <p className="mt-1 text-purple-900">
                    {typeof editModal.item.orderId === 'object' 
                      ? `Sipariş: ${editModal.item.orderId.orderNumber || editModal.item.orderId._id}`
                      : `Sipariş ID: ${editModal.item.orderId}`}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tarih *</label>
                  <input
                    type="date"
                    value={editModal.item.date ? format(new Date(editModal.item.date), 'yyyy-MM-dd') : ''}
                    onChange={(e) => setEditModal({ ...editModal, item: { ...editModal.item, date: e.target.value } })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ödeme Yöntemi</label>
                  <select
                    value={editModal.item.paymentMethod || 'nakit'}
                    onChange={(e) => setEditModal({ ...editModal, item: { ...editModal.item, paymentMethod: e.target.value } })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="nakit">Nakit</option>
                    <option value="iban">IBAN</option>
                    <option value="online">Online</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Gelir (₺)</label>
                  <input
                    type="number"
                    value={editModal.item.income || ''}
                    onChange={(e) => setEditModal({ ...editModal, item: { ...editModal.item, income: parseFloat(e.target.value) || 0 } })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    step="0.01"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Gider (₺)</label>
                  <input
                    type="number"
                    value={editModal.item.expense || ''}
                    onChange={(e) => setEditModal({ ...editModal, item: { ...editModal.item, expense: parseFloat(e.target.value) || 0 } })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    step="0.01"
                    min="0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Açıklama</label>
                <textarea
                  value={editModal.item.description || ''}
                  onChange={(e) => setEditModal({ ...editModal, item: { ...editModal.item, description: e.target.value } })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  placeholder="Açıklama..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
                <input
                  type="text"
                  value={editModal.item.category || ''}
                  onChange={(e) => setEditModal({ ...editModal, item: { ...editModal.item, category: e.target.value } })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  placeholder="Kategori..."
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 p-4 border-t">
              <button
                onClick={() => setEditModal({ open: false, item: null })}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                İptal
              </button>
              <button
                onClick={handleEditSubmit}
                className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                <Save className="w-4 h-4" />
                Kaydet
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

const formatCurrency = (amount) => {
  if (!amount && amount !== 0) return '-';
  return `${parseFloat(amount).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺`;
};
