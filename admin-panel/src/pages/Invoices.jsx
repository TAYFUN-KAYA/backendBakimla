import { useState, useEffect } from 'react';
import { adminService } from '../services/adminService';
import { X, Save, FileText, Plus, Search, Eye, Edit, Trash2, Download, Package } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

// Fatura durumları
const INVOICE_STATUSES = [
  { value: 'draft', label: 'Taslak', color: 'bg-gray-100 text-gray-800' },
  { value: 'sent', label: 'Gönderildi', color: 'bg-blue-100 text-blue-800' },
  { value: 'paid', label: 'Ödendi', color: 'bg-green-100 text-green-800' },
  { value: 'cancelled', label: 'İptal Edildi', color: 'bg-red-100 text-red-800' },
];

const getStatusInfo = (status) => {
  return INVOICE_STATUSES.find((s) => s.value === status) || INVOICE_STATUSES[0];
};

export default function Invoices() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [editModal, setEditModal] = useState({ open: false, invoice: null });
  const [viewModal, setViewModal] = useState({ open: false, invoice: null });
  const [createModal, setCreateModal] = useState({ open: false });

  // Kullanıcı arama için
  const [userSearch, setUserSearch] = useState('');
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Sipariş arama için
  const [orderSearch, setOrderSearch] = useState('');
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Yeni fatura formu
  const [newInvoice, setNewInvoice] = useState({
    userId: '',
    orderId: '',
    appointmentId: '',
    parasutInvoiceId: '',
    invoiceNumber: '',
    invoiceSeries: 'BAKIMLA',
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    subtotal: '',
    tax: '',
    total: '',
    currency: 'TRY',
    status: 'draft',
    pdfUrl: '',
    items: [{ description: '', quantity: 1, unitPrice: 0, vatRate: 20, total: 0 }],
  });

  // Faturaları getir
  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;

      const response = await adminService.invoices.getAll(params);
      if (response.data.success) {
        setInvoices(response.data.data);
        setTotalPages(response.data.totalPages || 1);
      }
    } catch (error) {
      console.error('Fetch error:', error);
      toast.error('Faturalar yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [page, search, statusFilter]);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter]);

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

  // Sipariş arama
  useEffect(() => {
    const searchOrders = async () => {
      if (orderSearch.length < 2) {
        setOrders([]);
        return;
      }
      setLoadingOrders(true);
      try {
        const response = await adminService.getAllOrders({ search: orderSearch, limit: 10 });
        if (response.data.success) {
          setOrders(response.data.data);
        }
      } catch (error) {
        console.error('Order search error:', error);
      } finally {
        setLoadingOrders(false);
      }
    };

    const debounce = setTimeout(searchOrders, 300);
    return () => clearTimeout(debounce);
  }, [orderSearch]);

  const handleEdit = (invoice) => {
    setEditModal({ open: true, invoice: { ...invoice } });
  };

  const handleView = (invoice) => {
    setViewModal({ open: true, invoice });
  };

  const handleCreate = () => {
    const now = new Date();
    const dueDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    setNewInvoice({
      userId: '',
      orderId: '',
      appointmentId: '',
      parasutInvoiceId: `PARASUT-${Date.now()}`,
      invoiceNumber: `INV-${Date.now()}`,
      invoiceSeries: 'BAKIMLA',
      issueDate: now.toISOString().split('T')[0],
      dueDate: dueDate.toISOString().split('T')[0],
      subtotal: '',
      tax: '',
      total: '',
      currency: 'TRY',
      status: 'draft',
      pdfUrl: '',
      items: [{ description: '', quantity: 1, unitPrice: 0, vatRate: 20, total: 0 }],
    });
    setSelectedUser(null);
    setSelectedOrder(null);
    setUserSearch('');
    setOrderSearch('');
    setUsers([]);
    setOrders([]);
    setCreateModal({ open: true });
  };

  const handleSave = async () => {
    try {
      const { _id, userId, orderId, appointmentId, billingAddress, ...data } = editModal.invoice;
      
      // userId için null ve object kontrolü
      const getUserId = (user) => {
        if (!user) return undefined;
        if (typeof user === 'object' && user !== null) return user._id;
        return user;
      };

      const updateData = {
        ...data,
        userId: getUserId(userId),
        orderId: orderId && typeof orderId === 'object' && orderId !== null ? orderId._id : orderId || undefined,
        appointmentId: appointmentId && typeof appointmentId === 'object' && appointmentId !== null ? appointmentId._id : appointmentId || undefined,
        billingAddress: billingAddress && typeof billingAddress === 'object' && billingAddress !== null ? billingAddress._id : billingAddress || undefined,
        subtotal: parseFloat(data.subtotal) || 0,
        tax: parseFloat(data.tax) || 0,
        total: parseFloat(data.total) || 0,
      };

      await adminService.invoices.update(_id, updateData);
      toast.success('Fatura başarıyla güncellendi');
      setEditModal({ open: false, invoice: null });
      fetchInvoices();
    } catch (error) {
      console.error('Update error:', error);
      toast.error('Güncelleme başarısız: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleCreateInvoice = async () => {
    if (!newInvoice.userId) {
      toast.error('Lütfen bir kullanıcı seçin');
      return;
    }
    if (!newInvoice.invoiceNumber || !newInvoice.parasutInvoiceId) {
      toast.error('Fatura numarası ve Paraşüt ID zorunludur');
      return;
    }
    if (!newInvoice.total || parseFloat(newInvoice.total) <= 0) {
      toast.error('Toplam tutar zorunludur');
      return;
    }

    try {
      // Kalem toplamlarını hesapla
      const calculatedItems = newInvoice.items.map(item => ({
        ...item,
        total: item.quantity * item.unitPrice * (1 + item.vatRate / 100),
      }));

      const invoiceData = {
        userId: newInvoice.userId,
        orderId: newInvoice.orderId || undefined,
        appointmentId: newInvoice.appointmentId || undefined,
        parasutInvoiceId: newInvoice.parasutInvoiceId,
        invoiceNumber: newInvoice.invoiceNumber,
        invoiceSeries: newInvoice.invoiceSeries,
        issueDate: new Date(newInvoice.issueDate),
        dueDate: new Date(newInvoice.dueDate),
        subtotal: parseFloat(newInvoice.subtotal) || 0,
        tax: parseFloat(newInvoice.tax) || 0,
        total: parseFloat(newInvoice.total) || 0,
        currency: newInvoice.currency,
        status: newInvoice.status,
        pdfUrl: newInvoice.pdfUrl || undefined,
        items: calculatedItems.filter(item => item.description),
      };

      await adminService.invoices.create(invoiceData);
      toast.success('Fatura başarıyla oluşturuldu');
      setCreateModal({ open: false });
      fetchInvoices();
    } catch (error) {
      console.error('Create error:', error);
      toast.error('Fatura oluşturulamadı: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleDelete = async (invoice) => {
    if (!window.confirm('Bu faturayı silmek istediğinize emin misiniz?')) {
      return;
    }
    try {
      await adminService.invoices.delete(invoice._id);
      toast.success('Fatura başarıyla silindi');
      fetchInvoices();
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Silme başarısız: ' + (error.response?.data?.message || error.message));
    }
  };

  const updateField = (field, value) => {
    setEditModal((prev) => ({
      ...prev,
      invoice: { ...prev.invoice, [field]: value },
    }));
  };

  const selectUser = (user) => {
    setSelectedUser(user);
    setNewInvoice((prev) => ({ ...prev, userId: user._id }));
    setUserSearch('');
    setUsers([]);
  };

  const selectOrder = (order) => {
    setSelectedOrder(order);
    setNewInvoice((prev) => ({ ...prev, orderId: order._id }));
    setOrderSearch('');
    setOrders([]);
  };

  // Fatura kalem ekleme/güncelleme
  const addItem = () => {
    setNewInvoice((prev) => ({
      ...prev,
      items: [...prev.items, { description: '', quantity: 1, unitPrice: 0, vatRate: 20, total: 0 }],
    }));
  };

  const removeItem = (index) => {
    setNewInvoice((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const updateItem = (index, field, value) => {
    setNewInvoice((prev) => {
      const newItems = [...prev.items];
      newItems[index] = { ...newItems[index], [field]: value };
      
      // Toplam hesapla
      const item = newItems[index];
      item.total = item.quantity * item.unitPrice * (1 + item.vatRate / 100);
      
      // Genel toplamları güncelle
      const subtotal = newItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
      const tax = newItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice * item.vatRate / 100), 0);
      const total = subtotal + tax;
      
      return {
        ...prev,
        items: newItems,
        subtotal: subtotal.toFixed(2),
        tax: tax.toFixed(2),
        total: total.toFixed(2),
      };
    });
  };

  // Düzenleme modalında kalem işlemleri
  const addEditItem = () => {
    setEditModal((prev) => ({
      ...prev,
      invoice: {
        ...prev.invoice,
        items: [...(prev.invoice.items || []), { description: '', quantity: 1, unitPrice: 0, vatRate: 20, total: 0 }],
      },
    }));
  };

  const removeEditItem = (index) => {
    setEditModal((prev) => ({
      ...prev,
      invoice: {
        ...prev.invoice,
        items: prev.invoice.items.filter((_, i) => i !== index),
      },
    }));
  };

  const updateEditItem = (index, field, value) => {
    setEditModal((prev) => {
      const newItems = [...(prev.invoice.items || [])];
      newItems[index] = { ...newItems[index], [field]: value };
      
      // Toplam hesapla
      const item = newItems[index];
      item.total = item.quantity * item.unitPrice * (1 + item.vatRate / 100);
      
      // Genel toplamları güncelle
      const subtotal = newItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
      const tax = newItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice * item.vatRate / 100), 0);
      const total = subtotal + tax;
      
      return {
        ...prev,
        invoice: {
          ...prev.invoice,
          items: newItems,
          subtotal: subtotal.toFixed(2),
          tax: tax.toFixed(2),
          total: total.toFixed(2),
        },
      };
    });
  };

  const formatDate = (date) => {
    if (!date) return '-';
    try {
      return format(new Date(date), 'dd.MM.yyyy');
    } catch {
      return '-';
    }
  };

  const formatDateTime = (date) => {
    if (!date) return '-';
    try {
      return format(new Date(date), 'dd.MM.yyyy HH:mm');
    } catch {
      return '-';
    }
  };

  const formatCurrency = (amount, currency = 'TRY') => {
    if (!amount && amount !== 0) return '-';
    const symbol = currency === 'TRY' ? '₺' : currency;
    return `${parseFloat(amount).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${symbol}`;
  };

  const getUserName = (user) => {
    if (!user) return '-';
    if (typeof user === 'object') {
      return `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || '-';
    }
    return user;
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Faturalar</h1>
        <button
          onClick={handleCreate}
          className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Plus className="w-5 h-5 mr-2" />
          Yeni Fatura
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Fatura no, kullanıcı ara..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Tüm Durumlar</option>
            {INVOICE_STATUSES.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
          <div className="text-sm text-gray-500 flex items-center">
            Toplam: {invoices.length} fatura
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="text-center py-12">Yükleniyor...</div>
        ) : invoices.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>Henüz fatura bulunamadı</p>
            <p className="text-sm mt-2">Yeni fatura eklemek için "Yeni Fatura" butonunu kullanın</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fatura No</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kullanıcı</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Düzenleme Tarihi</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vade Tarihi</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ara Toplam</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vergi</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Toplam</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Durum</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">İşlemler</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {invoices.map((invoice) => {
                    const statusInfo = getStatusInfo(invoice.status);
                    return (
                      <tr key={invoice._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{invoice.invoiceNumber}</p>
                            <p className="text-xs text-gray-500">{invoice.invoiceSeries}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{getUserName(invoice.userId)}</p>
                            {invoice.userId?.email && (
                              <p className="text-xs text-gray-500">{invoice.userId.email}</p>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(invoice.issueDate)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(invoice.dueDate)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(invoice.subtotal, invoice.currency)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(invoice.tax, invoice.currency)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-primary-600">
                          {formatCurrency(invoice.total, invoice.currency)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded text-xs ${statusInfo.color}`}>
                            {statusInfo.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleView(invoice)}
                              className="text-blue-600 hover:text-blue-900"
                              title="Görüntüle"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleEdit(invoice)}
                              className="text-green-600 hover:text-green-900"
                              title="Düzenle"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            {invoice.pdfUrl && (
                              <a
                                href={invoice.pdfUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-purple-600 hover:text-purple-900"
                                title="PDF İndir"
                              >
                                <Download className="w-4 h-4" />
                              </a>
                            )}
                            <button
                              onClick={() => handleDelete(invoice)}
                              className="text-red-600 hover:text-red-900"
                              title="Sil"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
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
      {viewModal.open && viewModal.invoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary-600" />
                Fatura Detayı
              </h2>
              <button
                onClick={() => setViewModal({ open: false, invoice: null })}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {/* Fatura Başlık Bilgileri */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <label className="block text-sm font-medium text-gray-500">Fatura No</label>
                  <p className="mt-1 text-lg font-bold text-gray-900">{viewModal.invoice.invoiceNumber}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Seri</label>
                  <p className="mt-1 text-gray-900">{viewModal.invoice.invoiceSeries}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500">Kullanıcı</label>
                  <p className="mt-1 text-gray-900 font-medium">{getUserName(viewModal.invoice.userId)}</p>
                  {viewModal.invoice.userId?.email && (
                    <p className="text-sm text-gray-500">{viewModal.invoice.userId.email}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Durum</label>
                  <p className="mt-1">
                    <span className={`px-2 py-1 rounded text-sm ${getStatusInfo(viewModal.invoice.status).color}`}>
                      {getStatusInfo(viewModal.invoice.status).label}
                    </span>
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500">Düzenleme Tarihi</label>
                  <p className="mt-1 text-gray-900">{formatDate(viewModal.invoice.issueDate)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Vade Tarihi</label>
                  <p className="mt-1 text-gray-900">{formatDate(viewModal.invoice.dueDate)}</p>
                </div>
              </div>

              {viewModal.invoice.orderId && (
                <div>
                  <label className="block text-sm font-medium text-gray-500">İlişkili Sipariş</label>
                  <p className="mt-1 text-gray-900">
                    #{typeof viewModal.invoice.orderId === 'object' ? viewModal.invoice.orderId._id : viewModal.invoice.orderId}
                  </p>
                </div>
              )}

              {/* Fatura Kalemleri */}
              {viewModal.invoice.items && viewModal.invoice.items.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-2">Fatura Kalemleri</label>
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-3 py-2 text-left">Açıklama</th>
                          <th className="px-3 py-2 text-center">Miktar</th>
                          <th className="px-3 py-2 text-right">Birim Fiyat</th>
                          <th className="px-3 py-2 text-center">KDV %</th>
                          <th className="px-3 py-2 text-right">Toplam</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {viewModal.invoice.items.map((item, index) => (
                          <tr key={index}>
                            <td className="px-3 py-2">{item.description}</td>
                            <td className="px-3 py-2 text-center">{item.quantity}</td>
                            <td className="px-3 py-2 text-right">{formatCurrency(item.unitPrice)}</td>
                            <td className="px-3 py-2 text-center">%{item.vatRate}</td>
                            <td className="px-3 py-2 text-right font-medium">{formatCurrency(item.total)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Toplam Bilgileri */}
              <div className="grid grid-cols-3 gap-4 p-4 bg-primary-50 rounded-lg">
                <div>
                  <label className="block text-sm font-medium text-gray-500">Ara Toplam</label>
                  <p className="mt-1 text-xl font-bold text-gray-900">
                    {formatCurrency(viewModal.invoice.subtotal, viewModal.invoice.currency)}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Vergi</label>
                  <p className="mt-1 text-xl font-bold text-gray-900">
                    {formatCurrency(viewModal.invoice.tax, viewModal.invoice.currency)}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Genel Toplam</label>
                  <p className="mt-1 text-xl font-bold text-primary-600">
                    {formatCurrency(viewModal.invoice.total, viewModal.invoice.currency)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm text-gray-500">
                <div>
                  <label className="block font-medium">Paraşüt ID</label>
                  <p className="mt-1">{viewModal.invoice.parasutInvoiceId}</p>
                </div>
                <div>
                  <label className="block font-medium">Oluşturulma</label>
                  <p className="mt-1">{formatDateTime(viewModal.invoice.createdAt)}</p>
                </div>
              </div>

              {viewModal.invoice.pdfUrl && (
                <div className="pt-4 border-t">
                  <a
                    href={viewModal.invoice.pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-primary-600 hover:text-primary-700"
                  >
                    <Download className="w-4 h-4" />
                    PDF Faturayı İndir
                  </a>
                </div>
              )}
            </div>
            <div className="flex justify-end p-4 border-t">
              <button
                onClick={() => setViewModal({ open: false, invoice: null })}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Düzenleme Modal */}
      {editModal.open && editModal.invoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-xl font-semibold">Fatura Düzenle</h2>
              <button
                onClick={() => setEditModal({ open: false, invoice: null })}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="p-3 bg-gray-50 rounded-lg">
                <label className="block text-sm font-medium text-gray-500">Kullanıcı</label>
                <p className="mt-1 text-gray-900 font-medium">{getUserName(editModal.invoice.userId)}</p>
                <p className="text-xs text-gray-400 mt-1">Kullanıcı değiştirilemez</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fatura No *</label>
                  <input
                    type="text"
                    value={editModal.invoice.invoiceNumber || ''}
                    onChange={(e) => updateField('invoiceNumber', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Seri</label>
                  <input
                    type="text"
                    value={editModal.invoice.invoiceSeries || ''}
                    onChange={(e) => updateField('invoiceSeries', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Düzenleme Tarihi *</label>
                  <input
                    type="date"
                    value={editModal.invoice.issueDate ? new Date(editModal.invoice.issueDate).toISOString().split('T')[0] : ''}
                    onChange={(e) => updateField('issueDate', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Vade Tarihi *</label>
                  <input
                    type="date"
                    value={editModal.invoice.dueDate ? new Date(editModal.invoice.dueDate).toISOString().split('T')[0] : ''}
                    onChange={(e) => updateField('dueDate', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Durum</label>
                <select
                  value={editModal.invoice.status || 'draft'}
                  onChange={(e) => updateField('status', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  {INVOICE_STATUSES.map((status) => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Fatura Kalemleri */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">Fatura Kalemleri</label>
                  <button
                    type="button"
                    onClick={addEditItem}
                    className="text-sm text-primary-600 hover:text-primary-700"
                  >
                    + Kalem Ekle
                  </button>
                </div>
                <div className="space-y-2">
                  {(editModal.invoice.items || []).map((item, index) => (
                    <div key={index} className="flex gap-2 p-2 bg-gray-50 rounded-lg">
                      <input
                        type="text"
                        placeholder="Açıklama"
                        value={item.description || ''}
                        onChange={(e) => updateEditItem(index, 'description', e.target.value)}
                        className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded"
                      />
                      <input
                        type="number"
                        placeholder="Miktar"
                        value={item.quantity || ''}
                        onChange={(e) => updateEditItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                        className="w-20 px-2 py-1 text-sm border border-gray-300 rounded"
                        min="1"
                      />
                      <input
                        type="number"
                        placeholder="Fiyat"
                        value={item.unitPrice || ''}
                        onChange={(e) => updateEditItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                        className="w-24 px-2 py-1 text-sm border border-gray-300 rounded"
                        min="0"
                        step="0.01"
                      />
                      <input
                        type="number"
                        placeholder="KDV %"
                        value={item.vatRate || ''}
                        onChange={(e) => updateEditItem(index, 'vatRate', parseFloat(e.target.value) || 0)}
                        className="w-20 px-2 py-1 text-sm border border-gray-300 rounded"
                        min="0"
                      />
                      <button
                        type="button"
                        onClick={() => removeEditItem(index)}
                        className="text-red-500 hover:text-red-700 px-2"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ara Toplam</label>
                  <input
                    type="number"
                    value={editModal.invoice.subtotal || ''}
                    onChange={(e) => updateField('subtotal', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    min="0"
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Vergi</label>
                  <input
                    type="number"
                    value={editModal.invoice.tax || ''}
                    onChange={(e) => updateField('tax', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    min="0"
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Toplam *</label>
                  <input
                    type="number"
                    value={editModal.invoice.total || ''}
                    onChange={(e) => updateField('total', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">PDF URL</label>
                <input
                  type="url"
                  value={editModal.invoice.pdfUrl || ''}
                  onChange={(e) => updateField('pdfUrl', e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 p-4 border-t">
              <button
                onClick={() => setEditModal({ open: false, invoice: null })}
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

      {/* Yeni Fatura Ekleme Modal */}
      {createModal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Plus className="w-5 h-5 text-primary-600" />
                Yeni Fatura Oluştur
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
                      {selectedUser.email && (
                        <p className="text-sm text-gray-500">{selectedUser.email}</p>
                      )}
                    </div>
                    <button
                      onClick={() => {
                        setSelectedUser(null);
                        setNewInvoice((prev) => ({ ...prev, userId: '' }));
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
                        placeholder="Kullanıcı ara (isim, email)..."
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
                            <p className="text-sm text-gray-500">{user.email}</p>
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

              {/* İlişkili Sipariş (Opsiyonel) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">İlişkili Sipariş (Opsiyonel)</label>
                {selectedOrder ? (
                  <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">
                        Sipariş #{selectedOrder._id?.substring(0, 8)}...
                      </p>
                      <p className="text-sm text-gray-500">
                        {formatCurrency(selectedOrder.totalAmount)}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedOrder(null);
                        setNewInvoice((prev) => ({ ...prev, orderId: '' }));
                      }}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <div className="relative">
                      <Package className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="text"
                        value={orderSearch}
                        onChange={(e) => setOrderSearch(e.target.value)}
                        placeholder="Sipariş ID ara..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>
                    {loadingOrders && (
                      <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg mt-1 p-3 text-center text-gray-500 shadow-lg z-10">
                        Aranıyor...
                      </div>
                    )}
                    {!loadingOrders && orders.length > 0 && (
                      <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg mt-1 max-h-48 overflow-y-auto shadow-lg z-10">
                        {orders.map((order) => (
                          <button
                            key={order._id}
                            onClick={() => selectOrder(order)}
                            className="w-full text-left px-4 py-2 hover:bg-gray-50 border-b last:border-b-0"
                          >
                            <p className="font-medium text-gray-900">
                              Sipariş #{order._id?.substring(0, 8)}...
                            </p>
                            <p className="text-sm text-gray-500">
                              {formatCurrency(order.totalAmount)} - {formatDate(order.createdAt)}
                            </p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fatura No *</label>
                  <input
                    type="text"
                    value={newInvoice.invoiceNumber}
                    onChange={(e) => setNewInvoice((prev) => ({ ...prev, invoiceNumber: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Seri</label>
                  <input
                    type="text"
                    value={newInvoice.invoiceSeries}
                    onChange={(e) => setNewInvoice((prev) => ({ ...prev, invoiceSeries: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Paraşüt Fatura ID *</label>
                <input
                  type="text"
                  value={newInvoice.parasutInvoiceId}
                  onChange={(e) => setNewInvoice((prev) => ({ ...prev, parasutInvoiceId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Düzenleme Tarihi *</label>
                  <input
                    type="date"
                    value={newInvoice.issueDate}
                    onChange={(e) => setNewInvoice((prev) => ({ ...prev, issueDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Vade Tarihi *</label>
                  <input
                    type="date"
                    value={newInvoice.dueDate}
                    onChange={(e) => setNewInvoice((prev) => ({ ...prev, dueDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Durum</label>
                <select
                  value={newInvoice.status}
                  onChange={(e) => setNewInvoice((prev) => ({ ...prev, status: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  {INVOICE_STATUSES.map((status) => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Fatura Kalemleri */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">Fatura Kalemleri</label>
                  <button
                    type="button"
                    onClick={addItem}
                    className="text-sm text-primary-600 hover:text-primary-700"
                  >
                    + Kalem Ekle
                  </button>
                </div>
                <div className="space-y-2">
                  {newInvoice.items.map((item, index) => (
                    <div key={index} className="flex gap-2 p-2 bg-gray-50 rounded-lg">
                      <input
                        type="text"
                        placeholder="Açıklama"
                        value={item.description}
                        onChange={(e) => updateItem(index, 'description', e.target.value)}
                        className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded"
                      />
                      <input
                        type="number"
                        placeholder="Miktar"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                        className="w-20 px-2 py-1 text-sm border border-gray-300 rounded"
                        min="1"
                      />
                      <input
                        type="number"
                        placeholder="Fiyat"
                        value={item.unitPrice}
                        onChange={(e) => updateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                        className="w-24 px-2 py-1 text-sm border border-gray-300 rounded"
                        min="0"
                        step="0.01"
                      />
                      <input
                        type="number"
                        placeholder="KDV %"
                        value={item.vatRate}
                        onChange={(e) => updateItem(index, 'vatRate', parseFloat(e.target.value) || 0)}
                        className="w-20 px-2 py-1 text-sm border border-gray-300 rounded"
                        min="0"
                      />
                      {newInvoice.items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          className="text-red-500 hover:text-red-700 px-2"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 p-4 bg-primary-50 rounded-lg">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ara Toplam</label>
                  <input
                    type="number"
                    value={newInvoice.subtotal}
                    onChange={(e) => setNewInvoice((prev) => ({ ...prev, subtotal: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    min="0"
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Vergi</label>
                  <input
                    type="number"
                    value={newInvoice.tax}
                    onChange={(e) => setNewInvoice((prev) => ({ ...prev, tax: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    min="0"
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Toplam *</label>
                  <input
                    type="number"
                    value={newInvoice.total}
                    onChange={(e) => setNewInvoice((prev) => ({ ...prev, total: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent font-bold"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">PDF URL (Opsiyonel)</label>
                <input
                  type="url"
                  value={newInvoice.pdfUrl}
                  onChange={(e) => setNewInvoice((prev) => ({ ...prev, pdfUrl: e.target.value }))}
                  placeholder="https://..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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
                onClick={handleCreateInvoice}
                className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                <Plus className="w-4 h-4" />
                Fatura Oluştur
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
