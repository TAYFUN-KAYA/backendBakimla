import { useState, useEffect } from 'react';
import { adminService } from '../services/adminService';
import { X, Save, Award, Plus, Search, Eye, Edit, Trash2, TrendingUp, TrendingDown, Gift, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

// İşlem tipleri
const TRANSACTION_TYPES = [
  { value: 'earned', label: 'Kazanıldı', color: 'bg-green-100 text-green-800', icon: TrendingUp },
  { value: 'used', label: 'Kullanıldı', color: 'bg-blue-100 text-blue-800', icon: TrendingDown },
  { value: 'expired', label: 'Süresi Doldu', color: 'bg-gray-100 text-gray-800', icon: RefreshCw },
  { value: 'refunded', label: 'İade Edildi', color: 'bg-orange-100 text-orange-800', icon: RefreshCw },
];

// Kaynak tipleri
const SOURCE_TYPES = [
  { value: 'appointment', label: 'Randevu' },
  { value: 'order', label: 'Sipariş' },
  { value: 'bonus', label: 'Bonus' },
  { value: 'refund', label: 'İade' },
];

const getTransactionInfo = (type) => {
  return TRANSACTION_TYPES.find((t) => t.value === type) || TRANSACTION_TYPES[0];
};

export default function Points() {
  // Points state
  const [points, setPoints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');

  // Transactions state
  const [transactions, setTransactions] = useState([]);
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  const [transactionsPage, setTransactionsPage] = useState(1);
  const [transactionsTotalPages, setTransactionsTotalPages] = useState(1);
  const [transactionTypeFilter, setTransactionTypeFilter] = useState('');

  // Active tab
  const [activeTab, setActiveTab] = useState('points'); // 'points' or 'transactions'

  // Modals
  const [editModal, setEditModal] = useState({ open: false, point: null });
  const [viewModal, setViewModal] = useState({ open: false, point: null });
  const [createModal, setCreateModal] = useState({ open: false });
  const [transactionModal, setTransactionModal] = useState({ open: false });

  // Kullanıcı arama için
  const [userSearch, setUserSearch] = useState('');
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Yeni puan formu
  const [newPoint, setNewPoint] = useState({
    userId: '',
    totalPoints: 0,
    usedPoints: 0,
    availablePoints: 0,
    totalValueInTL: 0,
  });

  // Yeni işlem formu
  const [newTransaction, setNewTransaction] = useState({
    userId: '',
    type: 'earned',
    points: 0,
    valueInTL: 0,
    description: '',
    source: 'bonus',
    sourceAmount: 0,
  });

  // Puanları getir
  const fetchPoints = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (search) params.search = search;

      const response = await adminService.points.getAll(params);
      if (response.data.success) {
        setPoints(response.data.data);
        setTotalPages(response.data.totalPages || 1);
      }
    } catch (error) {
      console.error('Fetch error:', error);
      toast.error('Puanlar yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  // İşlemleri getir
  const fetchTransactions = async () => {
    setTransactionsLoading(true);
    try {
      const params = { page: transactionsPage, limit: 20 };
      if (transactionTypeFilter) params.type = transactionTypeFilter;

      const response = await adminService.pointsTransactions.getAll(params);
      if (response.data.success) {
        setTransactions(response.data.data);
        setTransactionsTotalPages(response.data.totalPages || 1);
      }
    } catch (error) {
      console.error('Fetch transactions error:', error);
      toast.error('İşlemler yüklenirken hata oluştu');
    } finally {
      setTransactionsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'points') {
      fetchPoints();
    } else {
      fetchTransactions();
    }
  }, [page, search, activeTab, transactionsPage, transactionTypeFilter]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  useEffect(() => {
    setTransactionsPage(1);
  }, [transactionTypeFilter]);

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

  const handleEdit = (point) => {
    setEditModal({ open: true, point: { ...point } });
  };

  const handleView = (point) => {
    setViewModal({ open: true, point });
  };

  const handleCreate = () => {
    setNewPoint({
      userId: '',
      totalPoints: 0,
      usedPoints: 0,
      availablePoints: 0,
      totalValueInTL: 0,
    });
    setSelectedUser(null);
    setUserSearch('');
    setUsers([]);
    setCreateModal({ open: true });
  };

  const handleCreateTransaction = () => {
    setNewTransaction({
      userId: '',
      type: 'earned',
      points: 0,
      valueInTL: 0,
      description: '',
      source: 'bonus',
      sourceAmount: 0,
    });
    setSelectedUser(null);
    setUserSearch('');
    setUsers([]);
    setTransactionModal({ open: true });
  };

  const handleSave = async () => {
    try {
      const { _id, userId, ...data } = editModal.point;
      
      const updateData = {
        ...data,
        userId: userId && typeof userId === 'object' && userId !== null ? userId._id : userId,
        totalPoints: parseInt(data.totalPoints) || 0,
        usedPoints: parseInt(data.usedPoints) || 0,
        availablePoints: parseInt(data.availablePoints) || 0,
        totalValueInTL: parseFloat(data.totalValueInTL) || 0,
      };

      await adminService.points.update(_id, updateData);
      toast.success('Puan başarıyla güncellendi');
      setEditModal({ open: false, point: null });
      fetchPoints();
    } catch (error) {
      console.error('Update error:', error);
      toast.error('Güncelleme başarısız: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleCreatePoint = async () => {
    if (!newPoint.userId) {
      toast.error('Lütfen bir kullanıcı seçin');
      return;
    }

    try {
      const pointData = {
        userId: newPoint.userId,
        totalPoints: parseInt(newPoint.totalPoints) || 0,
        usedPoints: parseInt(newPoint.usedPoints) || 0,
        availablePoints: parseInt(newPoint.availablePoints) || 0,
        totalValueInTL: parseFloat(newPoint.totalValueInTL) || 0,
      };

      await adminService.points.create(pointData);
      toast.success('Puan başarıyla oluşturuldu');
      setCreateModal({ open: false });
      fetchPoints();
    } catch (error) {
      console.error('Create error:', error);
      toast.error('Puan oluşturulamadı: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleCreateTransactionSubmit = async () => {
    if (!newTransaction.userId) {
      toast.error('Lütfen bir kullanıcı seçin');
      return;
    }
    if (!newTransaction.points || newTransaction.points <= 0) {
      toast.error('Puan miktarı zorunludur');
      return;
    }

    try {
      // TL değerini hesapla (10 puan = 1 TL)
      const valueInTL = newTransaction.points / 10;

      const transactionData = {
        userId: newTransaction.userId,
        type: newTransaction.type,
        points: parseInt(newTransaction.points) || 0,
        valueInTL: parseFloat(valueInTL) || 0,
        description: newTransaction.description,
        source: newTransaction.source,
        sourceAmount: parseFloat(newTransaction.sourceAmount) || 0,
      };

      await adminService.pointsTransactions.create(transactionData);
      toast.success('İşlem başarıyla oluşturuldu');
      setTransactionModal({ open: false });
      
      // Hem işlemleri hem de puanları yenile
      fetchTransactions();
      fetchPoints();
    } catch (error) {
      console.error('Create transaction error:', error);
      toast.error('İşlem oluşturulamadı: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleDelete = async (point) => {
    if (!window.confirm('Bu puan kaydını silmek istediğinize emin misiniz?')) {
      return;
    }
    try {
      await adminService.points.delete(point._id);
      toast.success('Puan başarıyla silindi');
      fetchPoints();
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Silme başarısız: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleDeleteTransaction = async (transaction) => {
    if (!window.confirm('Bu işlemi silmek istediğinize emin misiniz?')) {
      return;
    }
    try {
      await adminService.pointsTransactions.delete(transaction._id);
      toast.success('İşlem başarıyla silindi');
      fetchTransactions();
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Silme başarısız: ' + (error.response?.data?.message || error.message));
    }
  };

  const updateField = (field, value) => {
    setEditModal((prev) => ({
      ...prev,
      point: { ...prev.point, [field]: value },
    }));
  };

  const selectUser = (user) => {
    setSelectedUser(user);
    setNewPoint((prev) => ({ ...prev, userId: user._id }));
    setNewTransaction((prev) => ({ ...prev, userId: user._id }));
    setUserSearch('');
    setUsers([]);
  };

  const formatDateTime = (date) => {
    if (!date) return '-';
    try {
      return format(new Date(date), 'dd.MM.yyyy HH:mm');
    } catch {
      return '-';
    }
  };

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return '-';
    return `${parseFloat(amount).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺`;
  };

  const getUserName = (user) => {
    if (!user) return '-';
    if (typeof user === 'object' && user !== null) {
      return `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || '-';
    }
    return user;
  };

  // Otomatik hesaplama
  const calculateAvailablePoints = (total, used) => {
    return Math.max(0, (parseInt(total) || 0) - (parseInt(used) || 0));
  };

  const calculateTLValue = (availablePoints) => {
    return (parseInt(availablePoints) || 0) / 10;
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Puan Sistemi</h1>
        <div className="flex gap-2">
          <button
            onClick={handleCreateTransaction}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <TrendingUp className="w-5 h-5 mr-2" />
            Puan İşlemi
          </button>
          <button
            onClick={handleCreate}
            className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Plus className="w-5 h-5 mr-2" />
            Yeni Puan Kaydı
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('points')}
              className={`px-6 py-3 border-b-2 font-medium text-sm ${
                activeTab === 'points'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Award className="w-4 h-4 inline mr-2" />
              Kullanıcı Puanları
            </button>
            <button
              onClick={() => setActiveTab('transactions')}
              className={`px-6 py-3 border-b-2 font-medium text-sm ${
                activeTab === 'transactions'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <TrendingUp className="w-4 h-4 inline mr-2" />
              İşlem Geçmişi
            </button>
          </nav>
        </div>
      </div>

      {/* Puanlar Tab */}
      {activeTab === 'points' && (
        <>
          {/* Filters */}
          <div className="bg-white rounded-lg shadow p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Kullanıcı ara..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div className="text-sm text-gray-500 flex items-center">
                Toplam: {points.length} kayıt
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            {loading ? (
              <div className="text-center py-12">Yükleniyor...</div>
            ) : points.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Award className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>Henüz puan kaydı bulunamadı</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kullanıcı</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Toplam Puan</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kullanılan</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mevcut Puan</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">TL Değeri</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Güncelleme</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">İşlemler</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {points.map((point) => (
                        <tr key={point._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <p className="text-sm font-medium text-gray-900">{getUserName(point.userId)}</p>
                              {point.userId?.email && (
                                <p className="text-xs text-gray-500">{point.userId.email}</p>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm font-medium text-gray-900">
                              {(point.totalPoints || 0).toLocaleString('tr-TR')}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-red-600">
                              -{(point.usedPoints || 0).toLocaleString('tr-TR')}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 py-1 bg-green-100 text-green-800 rounded font-bold">
                              {(point.availablePoints || 0).toLocaleString('tr-TR')}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-primary-600">
                            {formatCurrency(point.totalValueInTL || (point.availablePoints || 0) / 10)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDateTime(point.updatedAt)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => handleView(point)}
                                className="text-blue-600 hover:text-blue-900"
                                title="Görüntüle"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleEdit(point)}
                                className="text-green-600 hover:text-green-900"
                                title="Düzenle"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(point)}
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
        </>
      )}

      {/* İşlemler Tab */}
      {activeTab === 'transactions' && (
        <>
          {/* Filters */}
          <div className="bg-white rounded-lg shadow p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <select
                value={transactionTypeFilter}
                onChange={(e) => setTransactionTypeFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Tüm İşlem Tipleri</option>
                {TRANSACTION_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
              <div className="text-sm text-gray-500 flex items-center">
                Toplam: {transactions.length} işlem
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            {transactionsLoading ? (
              <div className="text-center py-12">Yükleniyor...</div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <TrendingUp className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>Henüz işlem bulunamadı</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kullanıcı</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tip</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Puan</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">TL Değeri</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kaynak</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Açıklama</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tarih</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">İşlemler</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {transactions.map((transaction) => {
                        const typeInfo = getTransactionInfo(transaction.type);
                        const TypeIcon = typeInfo.icon;
                        return (
                          <tr key={transaction._id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div>
                                <p className="text-sm font-medium text-gray-900">{getUserName(transaction.userId)}</p>
                                {transaction.userId?.email && (
                                  <p className="text-xs text-gray-500">{transaction.userId.email}</p>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs ${typeInfo.color}`}>
                                <TypeIcon className="w-3 h-3" />
                                {typeInfo.label}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`text-sm font-bold ${
                                transaction.type === 'earned' || transaction.type === 'refunded' 
                                  ? 'text-green-600' 
                                  : 'text-red-600'
                              }`}>
                                {transaction.type === 'earned' || transaction.type === 'refunded' ? '+' : '-'}
                                {(transaction.points || 0).toLocaleString('tr-TR')}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatCurrency(transaction.valueInTL)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs">
                                {SOURCE_TYPES.find(s => s.value === transaction.source)?.label || transaction.source}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                              {transaction.description || '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatDateTime(transaction.createdAt)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <button
                                onClick={() => handleDeleteTransaction(transaction)}
                                className="text-red-600 hover:text-red-900"
                                title="Sil"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {transactionsTotalPages > 1 && (
                  <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                    <div className="text-sm text-gray-700">
                      Sayfa {transactionsPage} / {transactionsTotalPages}
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setTransactionsPage(Math.max(1, transactionsPage - 1))}
                        disabled={transactionsPage === 1}
                        className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                      >
                        Önceki
                      </button>
                      <button
                        onClick={() => setTransactionsPage(Math.min(transactionsTotalPages, transactionsPage + 1))}
                        disabled={transactionsPage === transactionsTotalPages}
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
        </>
      )}

      {/* Görüntüleme Modal */}
      {viewModal.open && viewModal.point && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Award className="w-5 h-5 text-primary-600" />
                Puan Detayı
              </h2>
              <button
                onClick={() => setViewModal({ open: false, point: null })}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-500">Kullanıcı</label>
                <p className="mt-1 text-gray-900 font-medium">{getUserName(viewModal.point.userId)}</p>
                {viewModal.point.userId?.email && (
                  <p className="text-sm text-gray-500">{viewModal.point.userId.email}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 p-4 bg-primary-50 rounded-lg">
                <div>
                  <label className="block text-sm font-medium text-gray-500">Toplam Puan</label>
                  <p className="mt-1 text-2xl font-bold text-gray-900">
                    {(viewModal.point.totalPoints || 0).toLocaleString('tr-TR')}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Kullanılan Puan</label>
                  <p className="mt-1 text-2xl font-bold text-red-600">
                    -{(viewModal.point.usedPoints || 0).toLocaleString('tr-TR')}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 p-4 bg-green-50 rounded-lg">
                <div>
                  <label className="block text-sm font-medium text-gray-500">Mevcut Puan</label>
                  <p className="mt-1 text-2xl font-bold text-green-600">
                    {(viewModal.point.availablePoints || 0).toLocaleString('tr-TR')}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">TL Değeri</label>
                  <p className="mt-1 text-2xl font-bold text-primary-600">
                    {formatCurrency(viewModal.point.totalValueInTL || (viewModal.point.availablePoints || 0) / 10)}
                  </p>
                </div>
              </div>

              <div className="text-xs text-gray-500 p-3 bg-gray-50 rounded-lg">
                <p>💡 10 Puan = 1 TL değerindedir</p>
                <p className="mt-1">Kullanıcı randevu oluşturdukça puan kazanır (randevu tutarının %10'u)</p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm text-gray-500">
                <div>
                  <label className="block font-medium">Oluşturulma</label>
                  <p className="mt-1">{formatDateTime(viewModal.point.createdAt)}</p>
                </div>
                <div>
                  <label className="block font-medium">Son Güncelleme</label>
                  <p className="mt-1">{formatDateTime(viewModal.point.updatedAt)}</p>
                </div>
              </div>
            </div>
            <div className="flex justify-end p-4 border-t">
              <button
                onClick={() => setViewModal({ open: false, point: null })}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Düzenleme Modal */}
      {editModal.open && editModal.point && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-xl font-semibold">Puan Düzenle</h2>
              <button
                onClick={() => setEditModal({ open: false, point: null })}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="p-3 bg-gray-50 rounded-lg">
                <label className="block text-sm font-medium text-gray-500">Kullanıcı</label>
                <p className="mt-1 text-gray-900 font-medium">{getUserName(editModal.point.userId)}</p>
                <p className="text-xs text-gray-400 mt-1">Kullanıcı değiştirilemez</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Toplam Puan</label>
                  <input
                    type="number"
                    value={editModal.point.totalPoints || ''}
                    onChange={(e) => {
                      const total = e.target.value;
                      const available = calculateAvailablePoints(total, editModal.point.usedPoints);
                      updateField('totalPoints', total);
                      updateField('availablePoints', available);
                      updateField('totalValueInTL', calculateTLValue(available));
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Kullanılan Puan</label>
                  <input
                    type="number"
                    value={editModal.point.usedPoints || ''}
                    onChange={(e) => {
                      const used = e.target.value;
                      const available = calculateAvailablePoints(editModal.point.totalPoints, used);
                      updateField('usedPoints', used);
                      updateField('availablePoints', available);
                      updateField('totalValueInTL', calculateTLValue(available));
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    min="0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 p-4 bg-green-50 rounded-lg">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mevcut Puan</label>
                  <input
                    type="number"
                    value={editModal.point.availablePoints || ''}
                    onChange={(e) => {
                      updateField('availablePoints', e.target.value);
                      updateField('totalValueInTL', calculateTLValue(e.target.value));
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">TL Değeri</label>
                  <input
                    type="number"
                    value={editModal.point.totalValueInTL || ''}
                    onChange={(e) => updateField('totalValueInTL', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 p-4 border-t">
              <button
                onClick={() => setEditModal({ open: false, point: null })}
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

      {/* Yeni Puan Kaydı Modal */}
      {createModal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Plus className="w-5 h-5 text-primary-600" />
                Yeni Puan Kaydı
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
                        setNewPoint((prev) => ({ ...prev, userId: '' }));
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Toplam Puan</label>
                  <input
                    type="number"
                    value={newPoint.totalPoints}
                    onChange={(e) => {
                      const total = parseInt(e.target.value) || 0;
                      const available = Math.max(0, total - newPoint.usedPoints);
                      setNewPoint((prev) => ({
                        ...prev,
                        totalPoints: total,
                        availablePoints: available,
                        totalValueInTL: available / 10,
                      }));
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Kullanılan Puan</label>
                  <input
                    type="number"
                    value={newPoint.usedPoints}
                    onChange={(e) => {
                      const used = parseInt(e.target.value) || 0;
                      const available = Math.max(0, newPoint.totalPoints - used);
                      setNewPoint((prev) => ({
                        ...prev,
                        usedPoints: used,
                        availablePoints: available,
                        totalValueInTL: available / 10,
                      }));
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    min="0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 p-4 bg-green-50 rounded-lg">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mevcut Puan</label>
                  <p className="text-2xl font-bold text-green-600">
                    {newPoint.availablePoints.toLocaleString('tr-TR')}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">TL Değeri</label>
                  <p className="text-2xl font-bold text-primary-600">
                    {formatCurrency(newPoint.totalValueInTL)}
                  </p>
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
                onClick={handleCreatePoint}
                className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                <Plus className="w-4 h-4" />
                Puan Kaydı Oluştur
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Yeni İşlem Modal */}
      {transactionModal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                Yeni Puan İşlemi
              </h2>
              <button
                onClick={() => setTransactionModal({ open: false })}
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
                        setNewTransaction((prev) => ({ ...prev, userId: '' }));
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">İşlem Tipi *</label>
                  <select
                    value={newTransaction.type}
                    onChange={(e) => setNewTransaction((prev) => ({ ...prev, type: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    {TRANSACTION_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Kaynak *</label>
                  <select
                    value={newTransaction.source}
                    onChange={(e) => setNewTransaction((prev) => ({ ...prev, source: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    {SOURCE_TYPES.map((source) => (
                      <option key={source.value} value={source.value}>
                        {source.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Puan Miktarı *</label>
                  <input
                    type="number"
                    value={newTransaction.points}
                    onChange={(e) => setNewTransaction((prev) => ({ ...prev, points: parseInt(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    min="0"
                    placeholder="100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Kaynak Tutarı (₺)</label>
                  <input
                    type="number"
                    value={newTransaction.sourceAmount}
                    onChange={(e) => setNewTransaction((prev) => ({ ...prev, sourceAmount: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    min="0"
                    step="0.01"
                    placeholder="1000"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Açıklama</label>
                <textarea
                  value={newTransaction.description}
                  onChange={(e) => setNewTransaction((prev) => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  placeholder="İşlem açıklaması..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div className="p-4 bg-primary-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">TL Değeri (otomatik hesaplanır)</span>
                  <span className="text-xl font-bold text-primary-600">
                    {formatCurrency(newTransaction.points / 10)}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">10 puan = 1 TL</p>
              </div>
            </div>
            <div className="flex justify-end gap-3 p-4 border-t">
              <button
                onClick={() => setTransactionModal({ open: false })}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                İptal
              </button>
              <button
                onClick={handleCreateTransactionSubmit}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <TrendingUp className="w-4 h-4" />
                İşlem Oluştur
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
