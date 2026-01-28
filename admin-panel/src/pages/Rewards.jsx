import { useState, useEffect } from 'react';
import { adminService } from '../services/adminService';
import { X, Save, Gift, Plus, Search, Eye, Edit, Trash2, TrendingUp, TrendingDown, Wallet, Building2, Calendar, CreditCard } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

// İşlem tipleri
const TRANSACTION_TYPES = [
  { value: 'earn', label: 'Kazanç', color: 'bg-green-100 text-green-800', icon: TrendingUp },
  { value: 'withdrawal', label: 'Çekim', color: 'bg-blue-100 text-blue-800', icon: TrendingDown },
];

// İşlem durumları
const TRANSACTION_STATUSES = [
  { value: 'pending', label: 'Beklemede', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'completed', label: 'Tamamlandı', color: 'bg-green-100 text-green-800' },
  { value: 'failed', label: 'Başarısız', color: 'bg-red-100 text-red-800' },
];

const getTransactionInfo = (type) => {
  return TRANSACTION_TYPES.find((t) => t.value === type) || TRANSACTION_TYPES[0];
};

const getStatusInfo = (status) => {
  return TRANSACTION_STATUSES.find((s) => s.value === status) || TRANSACTION_STATUSES[0];
};

export default function Rewards() {
  // Rewards state
  const [rewards, setRewards] = useState([]);
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
  const [transactionStatusFilter, setTransactionStatusFilter] = useState('');

  // Active tab
  const [activeTab, setActiveTab] = useState('rewards'); // 'rewards' or 'transactions'

  // Modals
  const [editModal, setEditModal] = useState({ open: false, reward: null });
  const [viewModal, setViewModal] = useState({ open: false, reward: null, activeSubTab: 'details' });
  const [createModal, setCreateModal] = useState({ open: false });
  const [transactionModal, setTransactionModal] = useState({ open: false });
  
  // View modal sub-tabs: 'details', 'appointments', 'withdrawals'
  const [viewModalSubTab, setViewModalSubTab] = useState('details');
  
  // View modal data
  const [viewModalAppointments, setViewModalAppointments] = useState([]);
  const [viewModalAppointmentsLoading, setViewModalAppointmentsLoading] = useState(false);
  const [viewModalWithdrawals, setViewModalWithdrawals] = useState([]);
  const [viewModalWithdrawalsLoading, setViewModalWithdrawalsLoading] = useState(false);
  
  // Edit modals for appointments and withdrawals
  const [editAppointmentModal, setEditAppointmentModal] = useState({ open: false, appointment: null });
  const [createAppointmentModal, setCreateAppointmentModal] = useState({ open: false, companyId: null });
  const [newAppointment, setNewAppointment] = useState({
    appointmentDate: new Date().toISOString().split('T')[0],
    appointmentTime: '10:00',
    serviceType: '',
    totalPrice: 0,
    paymentMethod: 'card',
    status: 'completed',
  });
  const [editWithdrawalModal, setEditWithdrawalModal] = useState({ open: false, withdrawal: null });
  const [createWithdrawalModal, setCreateWithdrawalModal] = useState({ open: false, companyId: null });
  const [newWithdrawal, setNewWithdrawal] = useState({
    amount: 0,
    iban: '',
    accountHolderName: '',
    bankName: '',
    status: 'pending',
  });

  // İşletme arama için
  const [companySearch, setCompanySearch] = useState('');
  const [companies, setCompanies] = useState([]);
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);

  // Yeni ödül formu
  const [newReward, setNewReward] = useState({
    companyId: '',
    completedAppointmentCount: 0,
    totalEarned: 0,
    withdrawnAmount: 0,
    balance: 0,
  });

  // Yeni işlem formu
  const [newTransaction, setNewTransaction] = useState({
    companyId: '',
    type: 'earn',
    amount: 0,
    status: 'completed',
    description: '',
  });

  // Ödülleri getir
  const fetchRewards = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (search) params.search = search;

      const response = await adminService.rewards.getAll(params);
      if (response.data.success) {
        setRewards(response.data.data);
        setTotalPages(response.data.totalPages || 1);
      }
    } catch (error) {
      console.error('Fetch error:', error);
      toast.error('Ödüller yüklenirken hata oluştu');
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
      if (transactionStatusFilter) params.status = transactionStatusFilter;

      const response = await adminService.rewardTransactions.getAll(params);
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
    if (activeTab === 'rewards') {
      fetchRewards();
    } else {
      fetchTransactions();
    }
  }, [page, search, activeTab, transactionsPage, transactionTypeFilter, transactionStatusFilter]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  useEffect(() => {
    setTransactionsPage(1);
  }, [transactionTypeFilter, transactionStatusFilter]);

  // İşletme arama (company users)
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
          // Sadece company tipindeki kullanıcıları filtrele
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

  const handleEdit = (reward) => {
    setEditModal({ open: true, reward: { ...reward } });
  };

  const handleView = async (reward) => {
    setViewModal({ open: true, reward, activeSubTab: 'details' });
    setViewModalSubTab('details');
    // Fetch appointments and withdrawals when modal opens
    if (reward?.companyId) {
      const companyId = typeof reward.companyId === 'object' ? reward.companyId._id : reward.companyId;
      fetchViewModalAppointments(companyId);
      fetchViewModalWithdrawals(companyId);
    }
  };
  
  // Fetch completed online appointments for view modal
  const fetchViewModalAppointments = async (companyId) => {
    setViewModalAppointmentsLoading(true);
    try {
      const response = await adminService.getAllAppointments({
        companyId,
        status: 'completed',
        paymentMethod: 'card',
        limit: 100,
      });
      if (response.data.success) {
        setViewModalAppointments(response.data.data || []);
      }
    } catch (error) {
      console.error('Fetch appointments error:', error);
      toast.error('Randevular yüklenirken hata oluştu');
    } finally {
      setViewModalAppointmentsLoading(false);
    }
  };
  
  // Fetch withdrawal requests for view modal
  const fetchViewModalWithdrawals = async (companyId) => {
    setViewModalWithdrawalsLoading(true);
    try {
      const response = await adminService.getAllWithdrawalRequests({
        companyId,
        source: 'islet_kazan',
        limit: 100,
      });
      if (response.data.success) {
        setViewModalWithdrawals(response.data.data || []);
      }
    } catch (error) {
      console.error('Fetch withdrawals error:', error);
      toast.error('Para çekme talepleri yüklenirken hata oluştu');
    } finally {
      setViewModalWithdrawalsLoading(false);
    }
  };

  const handleCreate = () => {
    setNewReward({
      companyId: '',
      completedAppointmentCount: 0,
      totalEarned: 0,
      withdrawnAmount: 0,
      balance: 0,
    });
    setSelectedCompany(null);
    setCompanySearch('');
    setCompanies([]);
    setCreateModal({ open: true });
  };

  const handleCreateTransaction = () => {
    setNewTransaction({
      companyId: '',
      type: 'earn',
      amount: 0,
      status: 'completed',
      description: '',
    });
    setSelectedCompany(null);
    setCompanySearch('');
    setCompanies([]);
    setTransactionModal({ open: true });
  };

  const handleSave = async () => {
    try {
      const { _id, companyId, ...data } = editModal.reward;
      
      const updateData = {
        ...data,
        companyId: companyId && typeof companyId === 'object' && companyId !== null ? companyId._id : companyId,
        completedAppointmentCount: parseInt(data.completedAppointmentCount) || 0,
        totalEarned: parseFloat(data.totalEarned) || 0,
        withdrawnAmount: parseFloat(data.withdrawnAmount) || 0,
        balance: parseFloat(data.balance) || 0,
      };

      await adminService.rewards.update(_id, updateData);
      toast.success('Ödül başarıyla güncellendi');
      setEditModal({ open: false, reward: null });
      fetchRewards();
    } catch (error) {
      console.error('Update error:', error);
      toast.error('Güncelleme başarısız: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleCreateReward = async () => {
    if (!newReward.companyId) {
      toast.error('Lütfen bir işletme seçin');
      return;
    }

    try {
      const rewardData = {
        companyId: newReward.companyId,
        completedAppointmentCount: parseInt(newReward.completedAppointmentCount) || 0,
        totalEarned: parseFloat(newReward.totalEarned) || 0,
        withdrawnAmount: parseFloat(newReward.withdrawnAmount) || 0,
        balance: parseFloat(newReward.balance) || 0,
      };

      await adminService.rewards.create(rewardData);
      toast.success('Ödül kaydı başarıyla oluşturuldu');
      setCreateModal({ open: false });
      fetchRewards();
    } catch (error) {
      console.error('Create error:', error);
      toast.error('Ödül oluşturulamadı: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleCreateTransactionSubmit = async () => {
    if (!newTransaction.companyId) {
      toast.error('Lütfen bir işletme seçin');
      return;
    }
    if (!newTransaction.amount || newTransaction.amount <= 0) {
      toast.error('Tutar zorunludur');
      return;
    }

    try {
      const transactionData = {
        companyId: newTransaction.companyId,
        type: newTransaction.type,
        amount: parseFloat(newTransaction.amount) || 0,
        status: newTransaction.status,
        description: newTransaction.description,
      };

      await adminService.rewardTransactions.create(transactionData);
      toast.success('İşlem başarıyla oluşturuldu');
      setTransactionModal({ open: false });
      
      // Hem işlemleri hem de ödülleri yenile
      fetchTransactions();
      fetchRewards();
    } catch (error) {
      console.error('Create transaction error:', error);
      toast.error('İşlem oluşturulamadı: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleDelete = async (reward) => {
    if (!window.confirm('Bu ödül kaydını silmek istediğinize emin misiniz?')) {
      return;
    }
    try {
      await adminService.rewards.delete(reward._id);
      toast.success('Ödül başarıyla silindi');
      fetchRewards();
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
      await adminService.rewardTransactions.delete(transaction._id);
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
      reward: { ...prev.reward, [field]: value },
    }));
  };

  const selectCompany = (company) => {
    setSelectedCompany(company);
    setNewReward((prev) => ({ ...prev, companyId: company._id }));
    setNewTransaction((prev) => ({ ...prev, companyId: company._id }));
    setCompanySearch('');
    setCompanies([]);
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

  const getCompanyName = (company) => {
    if (!company) return '-';
    if (typeof company === 'object' && company !== null) {
      return `${company.firstName || ''} ${company.lastName || ''}`.trim() || company.email || '-';
    }
    return company;
  };

  // Bakiye hesaplama
  const calculateBalance = (totalEarned, withdrawnAmount) => {
    return Math.max(0, (parseFloat(totalEarned) || 0) - (parseFloat(withdrawnAmount) || 0));
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">İşletme Ödülleri (İşlet Kazan)</h1>
        <div className="flex gap-2">
          <button
            onClick={handleCreateTransaction}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <TrendingUp className="w-5 h-5 mr-2" />
            Ödül İşlemi
          </button>
          <button
            onClick={handleCreate}
            className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Plus className="w-5 h-5 mr-2" />
            Yeni Ödül Kaydı
          </button>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <Gift className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-amber-900">İşlet Kazan Sistemi</h3>
            <p className="text-sm text-amber-700 mt-1">
              İşletmeler her 50 tamamlanan randevuda 20 TL kazanır. Bu sayfa işletmelerin ödül bakiyelerini ve işlem geçmişini yönetir.
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('rewards')}
              className={`px-6 py-3 border-b-2 font-medium text-sm ${
                activeTab === 'rewards'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Gift className="w-4 h-4 inline mr-2" />
              İşletme Ödülleri
            </button>
            <button
              onClick={() => setActiveTab('transactions')}
              className={`px-6 py-3 border-b-2 font-medium text-sm ${
                activeTab === 'transactions'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Wallet className="w-4 h-4 inline mr-2" />
              İşlem Geçmişi
            </button>
          </nav>
        </div>
      </div>

      {/* Ödüller Tab */}
      {activeTab === 'rewards' && (
        <>
          {/* Filters */}
          <div className="bg-white rounded-lg shadow p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="İşletme ara..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div className="text-sm text-gray-500 flex items-center">
                Toplam: {rewards.length} kayıt
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            {loading ? (
              <div className="text-center py-12">Yükleniyor...</div>
            ) : rewards.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Gift className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>Henüz ödül kaydı bulunamadı</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">İşletme</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tamamlanan Randevu</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Toplam Kazanç</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Çekilen</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bakiye</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Son Güncelleme</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">İşlemler</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {rewards.map((reward) => (
                        <tr key={reward._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <Building2 className="w-4 h-4 text-gray-400" />
                              <div>
                                <p className="text-sm font-medium text-gray-900">{getCompanyName(reward.companyId)}</p>
                                {reward.companyId?.email && (
                                  <p className="text-xs text-gray-500">{reward.companyId.email}</p>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm font-medium text-gray-900">
                              {(reward.completedAppointmentCount || 0).toLocaleString('tr-TR')}
                            </span>
                            <span className="text-xs text-gray-500 ml-1">randevu</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-green-600 font-medium">
                              +{formatCurrency(reward.totalEarned)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-red-600">
                              -{formatCurrency(reward.withdrawnAmount)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 py-1 bg-primary-100 text-primary-800 rounded font-bold">
                              {formatCurrency(reward.balance)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDateTime(reward.lastUpdate || reward.updatedAt)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => handleView(reward)}
                                className="text-blue-600 hover:text-blue-900"
                                title="Görüntüle"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleEdit(reward)}
                                className="text-green-600 hover:text-green-900"
                                title="Düzenle"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(reward)}
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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
              <select
                value={transactionStatusFilter}
                onChange={(e) => setTransactionStatusFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Tüm Durumlar</option>
                {TRANSACTION_STATUSES.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
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
                <Wallet className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>Henüz işlem bulunamadı</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">İşletme</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tip</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tutar</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Durum</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Açıklama</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tarih</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">İşlemler</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {transactions.map((transaction) => {
                        const typeInfo = getTransactionInfo(transaction.type);
                        const statusInfo = getStatusInfo(transaction.status);
                        const TypeIcon = typeInfo.icon;
                        return (
                          <tr key={transaction._id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <Building2 className="w-4 h-4 text-gray-400" />
                                <div>
                                  <p className="text-sm font-medium text-gray-900">{getCompanyName(transaction.companyId)}</p>
                                  {transaction.companyId?.email && (
                                    <p className="text-xs text-gray-500">{transaction.companyId.email}</p>
                                  )}
                                </div>
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
                                transaction.type === 'earn' ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {transaction.type === 'earn' ? '+' : '-'}
                                {formatCurrency(transaction.amount)}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 rounded text-xs ${statusInfo.color}`}>
                                {statusInfo.label}
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
      {viewModal.open && viewModal.reward && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Gift className="w-5 h-5 text-primary-600" />
                Ödül Detayı - {getCompanyName(viewModal.reward.companyId)}
              </h2>
              <button
                onClick={() => setViewModal({ open: false, reward: null, activeSubTab: 'details' })}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Sub Tabs */}
            <div className="border-b border-gray-200">
              <nav className="flex -mb-px px-4">
                <button
                  onClick={() => setViewModalSubTab('details')}
                  className={`px-4 py-3 border-b-2 font-medium text-sm ${
                    viewModalSubTab === 'details'
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Özet Bilgiler
                </button>
                <button
                  onClick={() => setViewModalSubTab('appointments')}
                  className={`px-4 py-3 border-b-2 font-medium text-sm flex items-center gap-2 ${
                    viewModalSubTab === 'appointments'
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Calendar className="w-4 h-4" />
                  Tamamlanan Online Randevular ({viewModalAppointments.length})
                </button>
                <button
                  onClick={() => setViewModalSubTab('withdrawals')}
                  className={`px-4 py-3 border-b-2 font-medium text-sm flex items-center gap-2 ${
                    viewModalSubTab === 'withdrawals'
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Wallet className="w-4 h-4" />
                  Para Çekme Talepleri ({viewModalWithdrawals.length})
                </button>
              </nav>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              {viewModalSubTab === 'details' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Building2 className="w-8 h-8 text-gray-400" />
                    <div>
                      <label className="block text-sm font-medium text-gray-500">İşletme</label>
                      <p className="text-gray-900 font-medium">{getCompanyName(viewModal.reward.companyId)}</p>
                      {viewModal.reward.companyId?.email && (
                        <p className="text-sm text-gray-500">{viewModal.reward.companyId.email}</p>
                      )}
                    </div>
                  </div>

                  <div className="p-4 bg-amber-50 rounded-lg text-center">
                    <label className="block text-sm font-medium text-amber-700">Tamamlanan Randevu</label>
                    <p className="text-3xl font-bold text-amber-900 mt-1">
                      {(viewModal.reward.completedAppointmentCount || 0).toLocaleString('tr-TR')}
                    </p>
                    <p className="text-xs text-amber-600 mt-1">Her 50 randevuda 20 TL kazanılır</p>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-3 bg-green-50 rounded-lg text-center">
                      <label className="block text-sm font-medium text-green-700">Toplam Kazanç</label>
                      <p className="text-xl font-bold text-green-600 mt-1">
                        {formatCurrency(viewModal.reward.totalEarned)}
                      </p>
                    </div>
                    <div className="p-3 bg-red-50 rounded-lg text-center">
                      <label className="block text-sm font-medium text-red-700">Çekilen</label>
                      <p className="text-xl font-bold text-red-600 mt-1">
                        {formatCurrency(viewModal.reward.withdrawnAmount)}
                      </p>
                    </div>
                    <div className="p-3 bg-primary-50 rounded-lg text-center">
                      <label className="block text-sm font-medium text-primary-700">Bakiye</label>
                      <p className="text-xl font-bold text-primary-600 mt-1">
                        {formatCurrency(viewModal.reward.balance)}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm text-gray-500">
                    <div>
                      <label className="block font-medium">Oluşturulma</label>
                      <p className="mt-1">{formatDateTime(viewModal.reward.createdAt)}</p>
                    </div>
                    <div>
                      <label className="block font-medium">Son Güncelleme</label>
                      <p className="mt-1">{formatDateTime(viewModal.reward.lastUpdate || viewModal.reward.updatedAt)}</p>
                    </div>
                  </div>
                </div>
              )}
              
              {viewModalSubTab === 'appointments' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">Tamamlanan Online Randevular</h3>
                    <button
                      onClick={() => {
                        const companyId = typeof viewModal.reward.companyId === 'object' 
                          ? viewModal.reward.companyId._id 
                          : viewModal.reward.companyId;
                        setCreateAppointmentModal({ open: true, companyId });
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                    >
                      <Plus className="w-4 h-4" />
                      Yeni Randevu Ekle
                    </button>
                  </div>
                  
                  {viewModalAppointmentsLoading ? (
                    <div className="text-center py-8">Yükleniyor...</div>
                  ) : viewModalAppointments.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>Henüz tamamlanan online randevu bulunamadı</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Tarih/Saat</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Hizmet</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Müşteri</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Tutar</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Ödeme</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">İşlemler</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {viewModalAppointments.map((appointment) => (
                            <tr key={appointment._id} className="hover:bg-gray-50">
                              <td className="px-4 py-3 whitespace-nowrap text-sm">
                                <div>{formatDateTime(appointment.appointmentDate)}</div>
                                <div className="text-xs text-gray-500">{appointment.appointmentTime}</div>
                              </td>
                              <td className="px-4 py-3 text-sm">
                                <div className="font-medium">{appointment.serviceType}</div>
                                <div className="text-xs text-gray-500">{appointment.serviceCategory}</div>
                              </td>
                              <td className="px-4 py-3 text-sm">
                                {appointment.customerIds?.[0] ? (
                                  <div>
                                    <div className="font-medium">
                                      {appointment.customerIds[0].firstName} {appointment.customerIds[0].lastName}
                                    </div>
                                    <div className="text-xs text-gray-500">{appointment.customerIds[0].phoneNumber}</div>
                                  </div>
                                ) : appointment.userId ? (
                                  <div>
                                    <div className="font-medium">
                                      {appointment.userId.firstName} {appointment.userId.lastName}
                                    </div>
                                  </div>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                                {formatCurrency(appointment.totalPrice || appointment.servicePrice)}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                                  {appointment.paymentMethod === 'card' ? 'Kart' : 'Nakit'}
                                </span>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                                <div className="flex items-center space-x-2">
                                  <button
                                    onClick={() => setEditAppointmentModal({ open: true, appointment })}
                                    className="text-green-600 hover:text-green-900"
                                    title="Düzenle"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
              
              {viewModalSubTab === 'withdrawals' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">Para Çekme Talepleri (İşlet Kazan)</h3>
                    <button
                      onClick={() => {
                        const companyId = typeof viewModal.reward.companyId === 'object' 
                          ? viewModal.reward.companyId._id 
                          : viewModal.reward.companyId;
                        setCreateWithdrawalModal({ open: true, companyId });
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                    >
                      <Plus className="w-4 h-4" />
                      Yeni Talep Ekle
                    </button>
                  </div>
                  
                  {viewModalWithdrawalsLoading ? (
                    <div className="text-center py-8">Yükleniyor...</div>
                  ) : viewModalWithdrawals.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Wallet className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>Henüz para çekme talebi bulunamadı</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Tutar</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">IBAN</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Hesap Sahibi</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Durum</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Tarih</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">İşlemler</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {viewModalWithdrawals.map((withdrawal) => (
                            <tr key={withdrawal._id} className="hover:bg-gray-50">
                              <td className="px-4 py-3 whitespace-nowrap text-sm font-bold text-emerald-600">
                                {formatCurrency(withdrawal.amount)}
                              </td>
                              <td className="px-4 py-3 text-sm font-mono">{withdrawal.iban}</td>
                              <td className="px-4 py-3 text-sm">
                                <div className="font-medium">{withdrawal.accountHolderName}</div>
                                {withdrawal.bankName && (
                                  <div className="text-xs text-gray-500">{withdrawal.bankName}</div>
                                )}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <span className={`px-2 py-1 rounded text-xs ${
                                  withdrawal.status === 'completed' ? 'bg-green-100 text-green-800' :
                                  withdrawal.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                  withdrawal.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                                  withdrawal.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {withdrawal.status === 'completed' ? 'Tamamlandı' :
                                   withdrawal.status === 'pending' ? 'Beklemede' :
                                   withdrawal.status === 'processing' ? 'İşleniyor' :
                                   withdrawal.status === 'rejected' ? 'Reddedildi' :
                                   withdrawal.status === 'cancelled' ? 'İptal Edildi' : withdrawal.status}
                                </span>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                {formatDateTime(withdrawal.createdAt)}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                                <div className="flex items-center space-x-2">
                                  <button
                                    onClick={() => setEditWithdrawalModal({ open: true, withdrawal })}
                                    className="text-green-600 hover:text-green-900"
                                    title="Düzenle"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <div className="flex justify-end p-4 border-t">
              <button
                onClick={() => setViewModal({ open: false, reward: null, activeSubTab: 'details' })}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Düzenleme Modal */}
      {editModal.open && editModal.reward && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-xl font-semibold">Ödül Düzenle</h2>
              <button
                onClick={() => setEditModal({ open: false, reward: null })}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="p-3 bg-gray-50 rounded-lg">
                <label className="block text-sm font-medium text-gray-500">İşletme</label>
                <p className="mt-1 text-gray-900 font-medium">{getCompanyName(editModal.reward.companyId)}</p>
                <p className="text-xs text-gray-400 mt-1">İşletme değiştirilemez</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tamamlanan Randevu Sayısı</label>
                <input
                  type="number"
                  value={editModal.reward.completedAppointmentCount || ''}
                  onChange={(e) => updateField('completedAppointmentCount', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  min="0"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Toplam Kazanç (₺)</label>
                  <input
                    type="number"
                    value={editModal.reward.totalEarned || ''}
                    onChange={(e) => {
                      const total = e.target.value;
                      const balance = calculateBalance(total, editModal.reward.withdrawnAmount);
                      updateField('totalEarned', total);
                      updateField('balance', balance);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    min="0"
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Çekilen Tutar (₺)</label>
                  <input
                    type="number"
                    value={editModal.reward.withdrawnAmount || ''}
                    onChange={(e) => {
                      const withdrawn = e.target.value;
                      const balance = calculateBalance(editModal.reward.totalEarned, withdrawn);
                      updateField('withdrawnAmount', withdrawn);
                      updateField('balance', balance);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>

              <div className="p-4 bg-primary-50 rounded-lg">
                <label className="block text-sm font-medium text-gray-700 mb-1">Bakiye (₺)</label>
                <input
                  type="number"
                  value={editModal.reward.balance || ''}
                  onChange={(e) => updateField('balance', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white text-xl font-bold"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 p-4 border-t">
              <button
                onClick={() => setEditModal({ open: false, reward: null })}
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

      {/* Yeni Ödül Kaydı Modal */}
      {createModal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Plus className="w-5 h-5 text-primary-600" />
                Yeni Ödül Kaydı
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
                        setNewReward((prev) => ({ ...prev, companyId: '' }));
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
                        value={companySearch}
                        onChange={(e) => setCompanySearch(e.target.value)}
                        placeholder="İşletme ara (isim, email)..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>
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
                    {!loadingCompanies && companySearch.length >= 2 && companies.length === 0 && (
                      <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg mt-1 p-3 text-center text-gray-500 shadow-lg z-10">
                        İşletme bulunamadı
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tamamlanan Randevu Sayısı</label>
                <input
                  type="number"
                  value={newReward.completedAppointmentCount}
                  onChange={(e) => setNewReward((prev) => ({ ...prev, completedAppointmentCount: parseInt(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  min="0"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Toplam Kazanç (₺)</label>
                  <input
                    type="number"
                    value={newReward.totalEarned}
                    onChange={(e) => {
                      const total = parseFloat(e.target.value) || 0;
                      const balance = Math.max(0, total - newReward.withdrawnAmount);
                      setNewReward((prev) => ({
                        ...prev,
                        totalEarned: total,
                        balance: balance,
                      }));
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    min="0"
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Çekilen Tutar (₺)</label>
                  <input
                    type="number"
                    value={newReward.withdrawnAmount}
                    onChange={(e) => {
                      const withdrawn = parseFloat(e.target.value) || 0;
                      const balance = Math.max(0, newReward.totalEarned - withdrawn);
                      setNewReward((prev) => ({
                        ...prev,
                        withdrawnAmount: withdrawn,
                        balance: balance,
                      }));
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>

              <div className="p-4 bg-primary-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Bakiye (otomatik hesaplanır)</span>
                  <span className="text-2xl font-bold text-primary-600">
                    {formatCurrency(newReward.balance)}
                  </span>
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
                onClick={handleCreateReward}
                className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                <Plus className="w-4 h-4" />
                Ödül Kaydı Oluştur
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
                Yeni Ödül İşlemi
              </h2>
              <button
                onClick={() => setTransactionModal({ open: false })}
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
                        setNewTransaction((prev) => ({ ...prev, companyId: '' }));
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
                        value={companySearch}
                        onChange={(e) => setCompanySearch(e.target.value)}
                        placeholder="İşletme ara (isim, email)..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>
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
                    {!loadingCompanies && companySearch.length >= 2 && companies.length === 0 && (
                      <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg mt-1 p-3 text-center text-gray-500 shadow-lg z-10">
                        İşletme bulunamadı
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Durum *</label>
                  <select
                    value={newTransaction.status}
                    onChange={(e) => setNewTransaction((prev) => ({ ...prev, status: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    {TRANSACTION_STATUSES.map((status) => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tutar (₺) *</label>
                <input
                  type="number"
                  value={newTransaction.amount}
                  onChange={(e) => setNewTransaction((prev) => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  min="0"
                  step="0.01"
                  placeholder="20.00"
                />
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

              <div className="p-3 bg-amber-50 rounded-lg text-sm text-amber-700">
                💡 Her 50 tamamlanan randevuda işletme 20 TL kazanır.
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

      {/* Randevu Düzenleme Modal */}
      {editAppointmentModal.open && editAppointmentModal.appointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-xl font-semibold">Randevu Düzenle</h2>
              <button
                onClick={() => setEditAppointmentModal({ open: false, appointment: null })}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tarih</label>
                  <input
                    type="date"
                    value={editAppointmentModal.appointment.appointmentDate ? format(new Date(editAppointmentModal.appointment.appointmentDate), 'yyyy-MM-dd') : ''}
                    onChange={(e) => setEditAppointmentModal({
                      ...editAppointmentModal,
                      appointment: { ...editAppointmentModal.appointment, appointmentDate: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Saat</label>
                  <input
                    type="time"
                    value={editAppointmentModal.appointment.appointmentTime || ''}
                    onChange={(e) => setEditAppointmentModal({
                      ...editAppointmentModal,
                      appointment: { ...editAppointmentModal.appointment, appointmentTime: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hizmet Tipi</label>
                <input
                  type="text"
                  value={editAppointmentModal.appointment.serviceType || ''}
                  onChange={(e) => setEditAppointmentModal({
                    ...editAppointmentModal,
                    appointment: { ...editAppointmentModal.appointment, serviceType: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tutar (₺)</label>
                  <input
                    type="number"
                    value={editAppointmentModal.appointment.totalPrice || editAppointmentModal.appointment.servicePrice || ''}
                    onChange={(e) => setEditAppointmentModal({
                      ...editAppointmentModal,
                      appointment: { 
                        ...editAppointmentModal.appointment, 
                        totalPrice: parseFloat(e.target.value) || 0,
                        servicePrice: parseFloat(e.target.value) || 0
                      }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ödeme Yöntemi</label>
                  <select
                    value={editAppointmentModal.appointment.paymentMethod || 'card'}
                    onChange={(e) => setEditAppointmentModal({
                      ...editAppointmentModal,
                      appointment: { ...editAppointmentModal.appointment, paymentMethod: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="card">Kart (Online)</option>
                    <option value="cash">Nakit</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Durum</label>
                <select
                  value={editAppointmentModal.appointment.status || 'completed'}
                  onChange={(e) => setEditAppointmentModal({
                    ...editAppointmentModal,
                    appointment: { ...editAppointmentModal.appointment, status: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                  <option value="pending">Beklemede</option>
                  <option value="approved">Onaylandı</option>
                  <option value="completed">Tamamlandı</option>
                  <option value="cancelled">İptal Edildi</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 p-4 border-t">
              <button
                onClick={() => setEditAppointmentModal({ open: false, appointment: null })}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                İptal
              </button>
              <button
                onClick={async () => {
                  try {
                    await adminService.updateAppointment(editAppointmentModal.appointment._id, {
                      appointmentDate: editAppointmentModal.appointment.appointmentDate,
                      appointmentTime: editAppointmentModal.appointment.appointmentTime,
                      serviceType: editAppointmentModal.appointment.serviceType,
                      totalPrice: editAppointmentModal.appointment.totalPrice || editAppointmentModal.appointment.servicePrice,
                      servicePrice: editAppointmentModal.appointment.totalPrice || editAppointmentModal.appointment.servicePrice,
                      paymentMethod: editAppointmentModal.appointment.paymentMethod,
                      status: editAppointmentModal.appointment.status,
                    });
                    toast.success('Randevu başarıyla güncellendi');
                    setEditAppointmentModal({ open: false, appointment: null });
                    if (viewModal.reward?.companyId) {
                      const companyId = typeof viewModal.reward.companyId === 'object' 
                        ? viewModal.reward.companyId._id 
                        : viewModal.reward.companyId;
                      fetchViewModalAppointments(companyId);
                    }
                  } catch (error) {
                    console.error('Update appointment error:', error);
                    toast.error('Randevu güncellenemedi: ' + (error.response?.data?.message || error.message));
                  }
                }}
                className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                <Save className="w-4 h-4" />
                Kaydet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Yeni Randevu Ekleme Modal */}
      {createAppointmentModal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Plus className="w-5 h-5 text-primary-600" />
                Yeni Randevu Ekle
              </h2>
              <button
                onClick={() => setCreateAppointmentModal({ open: false })}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tarih *</label>
                  <input
                    type="date"
                    value={newAppointment.appointmentDate}
                    onChange={(e) => setNewAppointment({ ...newAppointment, appointmentDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Saat *</label>
                  <input
                    type="time"
                    value={newAppointment.appointmentTime}
                    onChange={(e) => setNewAppointment({ ...newAppointment, appointmentTime: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hizmet Tipi *</label>
                <input
                  type="text"
                  placeholder="Örn: Saç Kesimi"
                  value={newAppointment.serviceType}
                  onChange={(e) => setNewAppointment({ ...newAppointment, serviceType: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tutar (₺) *</label>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={newAppointment.totalPrice || ''}
                    onChange={(e) => setNewAppointment({ ...newAppointment, totalPrice: parseFloat(e.target.value) || 0 })}
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ödeme Yöntemi *</label>
                  <select
                    value={newAppointment.paymentMethod}
                    onChange={(e) => setNewAppointment({ ...newAppointment, paymentMethod: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="card">Kart (Online)</option>
                    <option value="cash">Nakit</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Durum *</label>
                <select
                  value={newAppointment.status}
                  onChange={(e) => setNewAppointment({ ...newAppointment, status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                  <option value="pending">Beklemede</option>
                  <option value="approved">Onaylandı</option>
                  <option value="completed">Tamamlandı</option>
                  <option value="cancelled">İptal Edildi</option>
                </select>
              </div>
              <div className="p-3 bg-amber-50 rounded-lg text-sm text-amber-700">
                💡 Online ödeme yöntemi ile tamamlanan randevular İşlet Kazan sistemine dahil edilir.
              </div>
            </div>
            <div className="flex justify-end gap-3 p-4 border-t">
              <button
                onClick={() => setCreateAppointmentModal({ open: false })}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                İptal
              </button>
              <button
                    onClick={async () => {
                  if (!newAppointment.appointmentDate || !newAppointment.appointmentTime || !newAppointment.serviceType || !newAppointment.totalPrice) {
                    toast.error('Lütfen tüm zorunlu alanları doldurun');
                    return;
                  }
                  
                  try {
                    await adminService.createAppointment({
                      companyId: createAppointmentModal.companyId,
                      appointmentDate: newAppointment.appointmentDate,
                      appointmentTime: newAppointment.appointmentTime,
                      serviceType: newAppointment.serviceType,
                      serviceCategory: 'Güzellik',
                      taskType: 'appointment',
                      serviceDuration: 60,
                      servicePrice: parseFloat(newAppointment.totalPrice),
                      totalPrice: parseFloat(newAppointment.totalPrice),
                      paymentMethod: newAppointment.paymentMethod,
                      status: newAppointment.status,
                      isApproved: newAppointment.status === 'approved' || newAppointment.status === 'completed',
                      paymentReceived: newAppointment.paymentMethod === 'card',
                    });
                    toast.success('Randevu başarıyla oluşturuldu');
                    setCreateAppointmentModal({ open: false, companyId: null });
                    setNewAppointment({
                      appointmentDate: new Date().toISOString().split('T')[0],
                      appointmentTime: '10:00',
                      serviceType: '',
                      totalPrice: 0,
                      paymentMethod: 'card',
                      status: 'completed',
                    });
                    if (viewModal.reward?.companyId) {
                      const companyId = typeof viewModal.reward.companyId === 'object' 
                        ? viewModal.reward.companyId._id 
                        : viewModal.reward.companyId;
                      fetchViewModalAppointments(companyId);
                    }
                  } catch (error) {
                    console.error('Create appointment error:', error);
                    toast.error('Randevu oluşturulamadı: ' + (error.response?.data?.message || error.message));
                  }
                }}
                className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                <Plus className="w-4 h-4" />
                Randevu Oluştur
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Para Çekme Talebi Düzenleme Modal */}
      {editWithdrawalModal.open && editWithdrawalModal.withdrawal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-xl font-semibold">Para Çekme Talebi Düzenle</h2>
              <button
                onClick={() => setEditWithdrawalModal({ open: false, withdrawal: null })}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tutar (₺) *</label>
                <input
                  type="number"
                  value={editWithdrawalModal.withdrawal.amount || ''}
                  onChange={(e) => setEditWithdrawalModal({
                    ...editWithdrawalModal,
                    withdrawal: { ...editWithdrawalModal.withdrawal, amount: parseFloat(e.target.value) || 0 }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  step="0.01"
                  min="0.01"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">IBAN *</label>
                <input
                  type="text"
                  value={editWithdrawalModal.withdrawal.iban || ''}
                  onChange={(e) => setEditWithdrawalModal({
                    ...editWithdrawalModal,
                    withdrawal: { ...editWithdrawalModal.withdrawal, iban: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  placeholder="TR00000000000000000000000000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hesap Sahibi *</label>
                <input
                  type="text"
                  value={editWithdrawalModal.withdrawal.accountHolderName || ''}
                  onChange={(e) => setEditWithdrawalModal({
                    ...editWithdrawalModal,
                    withdrawal: { ...editWithdrawalModal.withdrawal, accountHolderName: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Banka Adı</label>
                <input
                  type="text"
                  value={editWithdrawalModal.withdrawal.bankName || ''}
                  onChange={(e) => setEditWithdrawalModal({
                    ...editWithdrawalModal,
                    withdrawal: { ...editWithdrawalModal.withdrawal, bankName: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Durum *</label>
                <select
                  value={editWithdrawalModal.withdrawal.status || 'pending'}
                  onChange={(e) => setEditWithdrawalModal({
                    ...editWithdrawalModal,
                    withdrawal: { ...editWithdrawalModal.withdrawal, status: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                  <option value="pending">Beklemede</option>
                  <option value="processing">İşleniyor</option>
                  <option value="completed">Tamamlandı</option>
                  <option value="rejected">Reddedildi</option>
                  <option value="cancelled">İptal Edildi</option>
                </select>
              </div>
              {editWithdrawalModal.withdrawal.status === 'rejected' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Red Nedeni</label>
                  <textarea
                    value={editWithdrawalModal.withdrawal.rejectionReason || ''}
                    onChange={(e) => setEditWithdrawalModal({
                      ...editWithdrawalModal,
                      withdrawal: { ...editWithdrawalModal.withdrawal, rejectionReason: e.target.value }
                    })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              )}
            </div>
            <div className="flex justify-end gap-3 p-4 border-t">
              <button
                onClick={() => setEditWithdrawalModal({ open: false, withdrawal: null })}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                İptal
              </button>
              <button
                onClick={async () => {
                  try {
                    await adminService.updateWithdrawalRequest(editWithdrawalModal.withdrawal._id, {
                      amount: editWithdrawalModal.withdrawal.amount,
                      iban: editWithdrawalModal.withdrawal.iban,
                      accountHolderName: editWithdrawalModal.withdrawal.accountHolderName,
                      bankName: editWithdrawalModal.withdrawal.bankName,
                      status: editWithdrawalModal.withdrawal.status,
                      rejectionReason: editWithdrawalModal.withdrawal.rejectionReason,
                    });
                    toast.success('Para çekme talebi başarıyla güncellendi');
                    setEditWithdrawalModal({ open: false, withdrawal: null });
                    if (viewModal.reward?.companyId) {
                      const companyId = typeof viewModal.reward.companyId === 'object' 
                        ? viewModal.reward.companyId._id 
                        : viewModal.reward.companyId;
                      fetchViewModalWithdrawals(companyId);
                    }
                  } catch (error) {
                    console.error('Update withdrawal error:', error);
                    toast.error('Para çekme talebi güncellenemedi: ' + (error.response?.data?.message || error.message));
                  }
                }}
                className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                <Save className="w-4 h-4" />
                Kaydet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Yeni Para Çekme Talebi Ekleme Modal */}
      {createWithdrawalModal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Plus className="w-5 h-5 text-primary-600" />
                Yeni Para Çekme Talebi Ekle
              </h2>
              <button
                onClick={() => setCreateWithdrawalModal({ open: false })}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tutar (₺) *</label>
                <input
                  type="number"
                  value={newWithdrawal.amount || ''}
                  onChange={(e) => setNewWithdrawal({ ...newWithdrawal, amount: parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
                  step="0.01"
                  min="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">IBAN *</label>
                <input
                  type="text"
                  value={newWithdrawal.iban}
                  onChange={(e) => setNewWithdrawal({ ...newWithdrawal, iban: e.target.value })}
                  placeholder="TR00000000000000000000000000"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hesap Sahibi *</label>
                <input
                  type="text"
                  value={newWithdrawal.accountHolderName}
                  onChange={(e) => setNewWithdrawal({ ...newWithdrawal, accountHolderName: e.target.value })}
                  placeholder="Ad Soyad"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Banka Adı</label>
                <input
                  type="text"
                  value={newWithdrawal.bankName}
                  onChange={(e) => setNewWithdrawal({ ...newWithdrawal, bankName: e.target.value })}
                  placeholder="Banka Adı"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Durum *</label>
                <select
                  value={newWithdrawal.status}
                  onChange={(e) => setNewWithdrawal({ ...newWithdrawal, status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                  <option value="pending">Beklemede</option>
                  <option value="processing">İşleniyor</option>
                  <option value="completed">Tamamlandı</option>
                  <option value="rejected">Reddedildi</option>
                  <option value="cancelled">İptal Edildi</option>
                </select>
              </div>
              <div className="p-3 bg-amber-50 rounded-lg text-sm text-amber-700">
                💡 İşlet Kazan kaynaklı para çekme talepleri buradan yönetilir.
              </div>
            </div>
            <div className="flex justify-end gap-3 p-4 border-t">
              <button
                onClick={() => setCreateWithdrawalModal({ open: false })}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                İptal
              </button>
              <button
                onClick={async () => {
                  if (!newWithdrawal.amount || !newWithdrawal.iban || !newWithdrawal.accountHolderName) {
                    toast.error('Lütfen tüm zorunlu alanları doldurun');
                    return;
                  }
                  
                  try {
                    // Wallet ID bulmak için önce wallet'ı getir
                    const walletResponse = await adminService.getAllWallets({ 
                      companyId: createWithdrawalModal.companyId,
                      limit: 1 
                    });
                    let walletId = null;
                    if (walletResponse.data.success && walletResponse.data.data?.length > 0) {
                      walletId = walletResponse.data.data[0]._id;
                    }
                    
                    if (!walletId) {
                      toast.error('İşletme için cüzdan bulunamadı');
                      return;
                    }
                    
                    await adminService.createWithdrawalRequest({
                      companyId: createWithdrawalModal.companyId,
                      walletId: walletId,
                      amount: newWithdrawal.amount,
                      iban: newWithdrawal.iban,
                      accountHolderName: newWithdrawal.accountHolderName,
                      bankName: newWithdrawal.bankName || '',
                      status: newWithdrawal.status,
                      source: 'islet_kazan',
                    });
                    toast.success('Para çekme talebi başarıyla oluşturuldu');
                    setCreateWithdrawalModal({ open: false, companyId: null });
                    setNewWithdrawal({
                      amount: 0,
                      iban: '',
                      accountHolderName: '',
                      bankName: '',
                      status: 'pending',
                    });
                    if (viewModal.reward?.companyId) {
                      const companyId = typeof viewModal.reward.companyId === 'object' 
                        ? viewModal.reward.companyId._id 
                        : viewModal.reward.companyId;
                      fetchViewModalWithdrawals(companyId);
                    }
                  } catch (error) {
                    console.error('Create withdrawal error:', error);
                    toast.error('Para çekme talebi oluşturulamadı: ' + (error.response?.data?.message || error.message));
                  }
                }}
                className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                <Plus className="w-4 h-4" />
                Talep Oluştur
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
