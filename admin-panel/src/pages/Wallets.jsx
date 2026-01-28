import { useState, useEffect } from 'react';
import { adminService } from '../services/adminService';
import { Wallet, DollarSign, TrendingUp, TrendingDown, Eye, Search, Edit, ArrowDownLeft, ArrowUpRight, RotateCcw, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import WalletDetailModal from '../components/modals/WalletDetailModal';

export default function Wallets() {
  const [activeTab, setActiveTab] = useState('wallets'); // 'wallets', 'transactions', 'withdrawals'
  
  // Wallets state
  const [wallets, setWallets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalBalance, setTotalBalance] = useState(0);
  const [detailId, setDetailId] = useState(null);
  const [search, setSearch] = useState('');

  // Transactions state
  const [transactions, setTransactions] = useState([]);
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  const [transactionsPage, setTransactionsPage] = useState(1);
  const [transactionsTotalPages, setTransactionsTotalPages] = useState(1);
  const [transactionTypeFilter, setTransactionTypeFilter] = useState('');
  const [transactionStatusFilter, setTransactionStatusFilter] = useState('');

  // Withdrawal requests state
  const [withdrawals, setWithdrawals] = useState([]);
  const [withdrawalsLoading, setWithdrawalsLoading] = useState(false);
  const [withdrawalsPage, setWithdrawalsPage] = useState(1);
  const [withdrawalsTotalPages, setWithdrawalsTotalPages] = useState(1);
  const [withdrawalStatusFilter, setWithdrawalStatusFilter] = useState('');
  const [withdrawalSourceFilter, setWithdrawalSourceFilter] = useState('');
  const [processingId, setProcessingId] = useState(null);
  const [rejectModal, setRejectModal] = useState({ open: false, request: null, reason: '' });

  useEffect(() => { setPage(1); }, [search]);
  useEffect(() => {
    if (activeTab === 'wallets') {
    fetchWallets();
    } else if (activeTab === 'transactions') {
      fetchTransactions();
    } else if (activeTab === 'withdrawals') {
      fetchWithdrawals();
    }
  }, [page, search, activeTab, transactionsPage, transactionTypeFilter, transactionStatusFilter, withdrawalsPage, withdrawalStatusFilter, withdrawalSourceFilter]);

  // Tab değiştiğinde sayfaları sıfırla
  useEffect(() => {
    if (activeTab === 'transactions') {
      setTransactionsPage(1);
    } else if (activeTab === 'withdrawals') {
      setWithdrawalsPage(1);
    }
  }, [activeTab]);

  const fetchWallets = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (search.trim()) params.search = search.trim();
      const response = await adminService.getAllWallets(params);
      if (response.data.success) {
        setWallets(response.data.data);
        setTotalPages(response.data.totalPages);
        setTotalBalance(response.data.totalBalance || 0);
      }
    } catch (error) {
      console.error('Wallets fetch error:', error);
      toast.error('Cüzdanlar yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async () => {
    setTransactionsLoading(true);
    try {
      const params = { page: transactionsPage, limit: 20 };
      if (transactionTypeFilter) params.type = transactionTypeFilter;
      if (transactionStatusFilter) params.status = transactionStatusFilter;

      const response = await adminService.walletTransactions.getAll(params);
      if (response.data.success) {
        setTransactions(response.data.data || []);
        setTransactionsTotalPages(response.data.totalPages || 1);
      }
    } catch (error) {
      console.error('Fetch transactions error:', error);
      toast.error('İşlemler yüklenirken hata oluştu');
    } finally {
      setTransactionsLoading(false);
    }
  };

  const fetchWithdrawals = async () => {
    setWithdrawalsLoading(true);
    try {
      const params = { page: withdrawalsPage, limit: 20, source: 'wallet' };
      if (withdrawalStatusFilter) params.status = withdrawalStatusFilter;
      if (withdrawalSourceFilter) params.source = withdrawalSourceFilter;

      const response = await adminService.getAllWithdrawalRequests(params);
      if (response.data.success) {
        setWithdrawals(response.data.data || []);
        setWithdrawalsTotalPages(response.data.totalPages || 1);
      }
    } catch (error) {
      console.error('Fetch withdrawals error:', error);
      toast.error('Para çekme talepleri yüklenirken hata oluştu');
    } finally {
      setWithdrawalsLoading(false);
    }
  };

  const handleProcessWithdrawal = async (id, status, rejectionReason = '') => {
    if (status === 'rejected' && !rejectionReason) {
      setRejectModal({ open: true, request: withdrawals.find(w => w._id === id), reason: '' });
      return;
    }

    if (!window.confirm(`Bu talebi ${status === 'completed' ? 'onaylamak' : status === 'rejected' ? 'reddetmek' : 'işleme almak'} istediğinize emin misiniz?`)) {
      return;
    }

    setProcessingId(id);
    try {
      await adminService.processWithdrawalRequest(id, { status, rejectionReason });
      toast.success('Para çekme talebi başarıyla işlendi');
      fetchWithdrawals();
    } catch (error) {
      console.error('Process withdrawal error:', error);
      toast.error('İşlem başarısız: ' + (error.response?.data?.message || error.message));
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectSubmit = async () => {
    if (!rejectModal.reason.trim()) {
      toast.error('Lütfen red nedeni girin');
      return;
    }

    await handleProcessWithdrawal(rejectModal.request._id, 'rejected', rejectModal.reason);
    setRejectModal({ open: false, request: null, reason: '' });
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { label: 'Beklemede', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      processing: { label: 'İşleniyor', color: 'bg-blue-100 text-blue-800', icon: AlertCircle },
      completed: { label: 'Tamamlandı', color: 'bg-green-100 text-green-800', icon: CheckCircle },
      rejected: { label: 'Reddedildi', color: 'bg-red-100 text-red-800', icon: XCircle },
      cancelled: { label: 'İptal Edildi', color: 'bg-gray-100 text-gray-800', icon: XCircle },
    };
    const badge = badges[status] || badges.pending;
    const Icon = badge.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${badge.color}`}>
        <Icon className="w-3 h-3" />
        {badge.label}
      </span>
    );
  };

  const getTransactionIcon = (type) => {
    if (type === 'deposit') return <ArrowDownLeft className="w-4 h-4 text-green-600" />;
    if (type === 'withdrawal') return <ArrowUpRight className="w-4 h-4 text-red-600" />;
    return <RotateCcw className="w-4 h-4 text-amber-600" />;
  };

  const getTransactionLabel = (type) => {
    const labels = { deposit: 'Yatırma', withdrawal: 'Çekim', refund: 'İade' };
    return labels[type] || type;
  };

  const getStatusLabel = (status) => {
    const labels = { pending: 'Beklemede', completed: 'Tamamlandı', failed: 'Başarısız', cancelled: 'İptal' };
    return labels[status] || status;
  };

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return '-';
    return `${parseFloat(amount).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺`;
  };

  const formatDateTime = (date) => {
    if (!date) return '-';
    try {
      return format(new Date(date), 'dd.MM.yyyy HH:mm');
    } catch {
      return '-';
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Cüzdan İşlemleri</h1>
        {activeTab === 'wallets' && (
        <div className="text-right">
          <div className="text-sm text-gray-600">Toplam Bakiye</div>
          <div className="text-2xl font-bold text-emerald-600">
              {formatCurrency(totalBalance)}
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('wallets')}
              className={`px-6 py-3 border-b-2 font-medium text-sm flex items-center gap-2 ${
                activeTab === 'wallets'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Wallet className="w-4 h-4" />
              Cüzdanlar
            </button>
            <button
              onClick={() => setActiveTab('transactions')}
              className={`px-6 py-3 border-b-2 font-medium text-sm flex items-center gap-2 ${
                activeTab === 'transactions'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <ArrowDownLeft className="w-4 h-4" />
              Cüzdan Hareketleri
            </button>
            <button
              onClick={() => setActiveTab('withdrawals')}
              className={`px-6 py-3 border-b-2 font-medium text-sm flex items-center gap-2 ${
                activeTab === 'withdrawals'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <TrendingDown className="w-4 h-4" />
              Para Çekme Talepleri ({withdrawals.filter(w => w.status === 'pending').length})
            </button>
          </nav>
        </div>
      </div>

      {/* Cüzdanlar Tab */}
      {activeTab === 'wallets' && (
        <>
      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="İşletme adı veya e-posta ile ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="text-center py-12">Yükleniyor...</div>
            ) : wallets.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Wallet className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>Cüzdan bulunamadı</p>
              </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">İşletme</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bakiye</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Toplam Kazanç</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Toplam Çekim</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Son İşlem</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">İşlemler</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {wallets.map((wallet) => (
                    <tr key={wallet._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        {wallet.companyId ? (
                          <div className="flex items-center">
                            <Wallet className="w-5 h-5 text-primary-600 mr-3" />
                            <div>
                              <div className="text-sm font-medium">{wallet.companyId.firstName} {wallet.companyId.lastName}</div>
                              <div className="text-xs text-gray-500">{wallet.companyId.email}</div>
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center text-lg font-bold text-emerald-600">
                          <DollarSign className="w-5 h-5 mr-1" />
                              {formatCurrency(wallet.balance)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center text-sm text-green-600">
                          <TrendingUp className="w-4 h-4 mr-1" />
                              {formatCurrency(wallet.totalEarnings)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center text-sm text-red-600">
                          <TrendingDown className="w-4 h-4 mr-1" />
                              {formatCurrency(wallet.totalWithdrawals)}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {wallet.lastTransactionDate
                              ? formatDateTime(wallet.lastTransactionDate)
                          : '-'}
                      </td>
                      <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setDetailId(wallet._id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg border border-blue-200"
                                title="Düzenle"
                        >
                                <Edit className="w-4 h-4" />
                                Düzenle
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
            <div className="px-6 py-4 border-t flex justify-between items-center">
              <div className="text-sm text-gray-700">Sayfa {page} / {totalPages}</div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                        className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Önceki
                </button>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                        className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
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

      {/* Cüzdan Hareketleri Tab */}
      {activeTab === 'transactions' && (
        <>
          {/* Filters */}
          <div className="bg-white rounded-lg shadow p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <select
                value={transactionTypeFilter}
                onChange={(e) => setTransactionTypeFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Tüm Türler</option>
                <option value="deposit">Yatırma</option>
                <option value="withdrawal">Çekim</option>
                <option value="refund">İade</option>
              </select>
              <select
                value={transactionStatusFilter}
                onChange={(e) => setTransactionStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Tüm Durumlar</option>
                <option value="pending">Beklemede</option>
                <option value="completed">Tamamlandı</option>
                <option value="failed">Başarısız</option>
                <option value="cancelled">İptal</option>
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
                <ArrowDownLeft className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>Henüz işlem bulunamadı</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">İşletme</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tür</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tutar</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Önceki Bakiye</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sonraki Bakiye</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Durum</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Açıklama</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tarih</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {transactions.map((transaction) => {
                        const companyName = transaction.companyId 
                          ? (typeof transaction.companyId === 'object' 
                              ? `${transaction.companyId.firstName || ''} ${transaction.companyId.lastName || ''}`.trim() || transaction.companyId.email || '-'
                              : transaction.companyId)
                          : '-';
                        return (
                          <tr key={transaction._id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              {companyName}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-1">
                                {getTransactionIcon(transaction.type)}
                                <span className="text-sm">{getTransactionLabel(transaction.type)}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`text-sm font-bold ${
                                transaction.type === 'deposit' ? 'text-green-600' : 
                                transaction.type === 'withdrawal' ? 'text-red-600' : 
                                'text-amber-600'
                              }`}>
                                {transaction.type === 'deposit' ? '+' : '-'}
                                {formatCurrency(transaction.amount)}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatCurrency(transaction.balanceBefore)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatCurrency(transaction.balanceAfter)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 rounded text-xs ${
                                transaction.status === 'completed' ? 'bg-green-100 text-green-800' :
                                transaction.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                transaction.status === 'failed' ? 'bg-red-100 text-red-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {getStatusLabel(transaction.status)}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                              {transaction.description || '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatDateTime(transaction.createdAt)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {/* Pagination */}
                {transactionsTotalPages > 1 && (
                  <div className="px-6 py-4 border-t flex justify-between items-center">
                    <div className="text-sm text-gray-700">Sayfa {transactionsPage} / {transactionsTotalPages}</div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setTransactionsPage(p => Math.max(1, p - 1))}
                        disabled={transactionsPage === 1}
                        className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                      >
                        Önceki
                      </button>
                      <button
                        onClick={() => setTransactionsPage(p => Math.min(transactionsTotalPages, p + 1))}
                        disabled={transactionsPage === transactionsTotalPages}
                        className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
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

      {/* Para Çekme Talepleri Tab */}
      {activeTab === 'withdrawals' && (
        <>
          {/* Filters */}
          <div className="bg-white rounded-lg shadow p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <select
                value={withdrawalStatusFilter}
                onChange={(e) => setWithdrawalStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Tüm Durumlar</option>
                <option value="pending">Beklemede</option>
                <option value="processing">İşleniyor</option>
                <option value="completed">Tamamlandı</option>
                <option value="rejected">Reddedildi</option>
                <option value="cancelled">İptal Edildi</option>
              </select>
              <select
                value={withdrawalSourceFilter}
                onChange={(e) => setWithdrawalSourceFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Tüm Kaynaklar</option>
                <option value="wallet">Cüzdan</option>
                <option value="islet_kazan">İşlet Kazan</option>
              </select>
              <div className="text-sm text-gray-500 flex items-center">
                Toplam: {withdrawals.length} talep
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            {withdrawalsLoading ? (
              <div className="text-center py-12">Yükleniyor...</div>
            ) : withdrawals.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <TrendingDown className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>Henüz para çekme talebi bulunamadı</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">İşletme</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kaynak</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tutar</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">IBAN</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hesap Sahibi</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Durum</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tarih</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">İşlemler</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {withdrawals.map((withdrawal) => {
                        const companyName = withdrawal.companyId 
                          ? (typeof withdrawal.companyId === 'object' 
                              ? `${withdrawal.companyId.firstName || ''} ${withdrawal.companyId.lastName || ''}`.trim() || withdrawal.companyId.email || '-'
                              : withdrawal.companyId)
                          : '-';
                        return (
                          <tr key={withdrawal._id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium">{companyName}</div>
                              {withdrawal.companyId?.email && (
                                <div className="text-xs text-gray-500">{withdrawal.companyId.email}</div>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                withdrawal.source === 'islet_kazan' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'
                              }`}>
                                {withdrawal.source === 'islet_kazan' ? 'İşlet Kazan' : 'Cüzdan'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-lg font-bold text-emerald-600">
                                {formatCurrency(withdrawal.amount)}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-mono">{withdrawal.iban}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium">{withdrawal.accountHolderName}</div>
                              {withdrawal.bankName && (
                                <div className="text-xs text-gray-500">{withdrawal.bankName}</div>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {getStatusBadge(withdrawal.status)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatDateTime(withdrawal.createdAt)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                {withdrawal.status === 'pending' && (
                                  <>
                                    <button
                                      onClick={() => handleProcessWithdrawal(withdrawal._id, 'completed')}
                                      disabled={processingId === withdrawal._id}
                                      className="text-green-600 hover:text-green-900 disabled:opacity-50"
                                      title="Onayla"
                                    >
                                      <CheckCircle className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => handleProcessWithdrawal(withdrawal._id, 'rejected')}
                                      disabled={processingId === withdrawal._id}
                                      className="text-red-600 hover:text-red-900 disabled:opacity-50"
                                      title="Reddet"
                                    >
                                      <XCircle className="w-4 h-4" />
                                    </button>
                                  </>
                                )}
                                {withdrawal.status === 'processing' && (
                                  <button
                                    onClick={() => handleProcessWithdrawal(withdrawal._id, 'completed')}
                                    disabled={processingId === withdrawal._id}
                                    className="text-green-600 hover:text-green-900 disabled:opacity-50"
                                    title="Tamamla"
                                  >
                                    <CheckCircle className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {/* Pagination */}
                {withdrawalsTotalPages > 1 && (
                  <div className="px-6 py-4 border-t flex justify-between items-center">
                    <div className="text-sm text-gray-700">Sayfa {withdrawalsPage} / {withdrawalsTotalPages}</div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setWithdrawalsPage(p => Math.max(1, p - 1))}
                        disabled={withdrawalsPage === 1}
                        className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                      >
                        Önceki
                      </button>
                      <button
                        onClick={() => setWithdrawalsPage(p => Math.min(withdrawalsTotalPages, p + 1))}
                        disabled={withdrawalsPage === withdrawalsTotalPages}
                        className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
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

      {/* Cüzdan Düzenleme Modal */}
      {detailId && (
        <WalletDetailModal
          walletId={detailId}
          onClose={() => setDetailId(null)}
          onSave={() => {
            setDetailId(null);
            fetchWallets();
          }}
        />
      )}

      {/* Reddetme Modal */}
      {rejectModal.open && rejectModal.request && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-xl font-semibold">Para Çekme Talebini Reddet</h2>
              <button
                onClick={() => setRejectModal({ open: false, request: null, reason: '' })}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600">İşletme</div>
                <div className="font-medium">
                  {rejectModal.request.companyId 
                    ? (typeof rejectModal.request.companyId === 'object' 
                        ? `${rejectModal.request.companyId.firstName || ''} ${rejectModal.request.companyId.lastName || ''}`.trim() || rejectModal.request.companyId.email || '-'
                        : rejectModal.request.companyId)
                    : '-'}
                </div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600">Tutar</div>
                <div className="font-bold text-emerald-600">{formatCurrency(rejectModal.request.amount)}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Red Nedeni *</label>
                <textarea
                  value={rejectModal.reason}
                  onChange={(e) => setRejectModal({ ...rejectModal, reason: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  placeholder="Red nedeni girin..."
                  required
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 p-4 border-t">
              <button
                onClick={() => setRejectModal({ open: false, request: null, reason: '' })}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                İptal
              </button>
              <button
                onClick={handleRejectSubmit}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Reddet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

