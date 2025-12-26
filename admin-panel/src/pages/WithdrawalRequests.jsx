import { useState, useEffect } from 'react';
import { adminService } from '../services/adminService';
import { TrendingUp, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';


export default function WithdrawalRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [status, setStatus] = useState('');
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    fetchRequests();
  }, [page, status]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (status) params.status = status;

      const response = await adminService.getAllWithdrawalRequests(params);
      if (response.data.success) {
        setRequests(response.data.data);
        setTotalPages(response.data.totalPages);
      }
    } catch (error) {
      console.error('Withdrawal requests fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProcess = async (id, newStatus, rejectionReason = '') => {
    if (!window.confirm(`Bu talebi ${newStatus === 'completed' ? 'onaylamak' : newStatus === 'rejected' ? 'reddetmek' : 'işleme almak'} istediğinize emin misiniz?`)) {
      return;
    }

    setProcessingId(id);
    try {
      await adminService.processWithdrawalRequest(id, { status: newStatus, rejectionReason });
      fetchRequests();
    } catch (error) {
      alert(error.response?.data?.message || 'İşlem başarısız');
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusBadge = (status) => {
    const configs = {
      pending: { icon: Clock, color: 'bg-yellow-100 text-yellow-800', label: 'Beklemede' },
      processing: { icon: AlertCircle, color: 'bg-blue-100 text-blue-800', label: 'İşleniyor' },
      completed: { icon: CheckCircle, color: 'bg-green-100 text-green-800', label: 'Tamamlandı' },
      rejected: { icon: XCircle, color: 'bg-red-100 text-red-800', label: 'Reddedildi' },
    };
    const config = configs[status] || configs.pending;
    const Icon = config.icon;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${config.color}`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </span>
    );
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Para Çekme Talepleri</h1>
      </div>

      {/* Filter */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
        >
          <option value="">Tüm Durumlar</option>
          <option value="pending">Beklemede</option>
          <option value="processing">İşleniyor</option>
          <option value="completed">Tamamlandı</option>
          <option value="rejected">Reddedildi</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="text-center py-12">Yükleniyor...</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">İşletme</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tutar</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">IBAN</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hesap Sahibi</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Durum</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tarih</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">İşlemler</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {requests.map((request) => (
                    <tr key={request._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        {request.companyId ? (
                          <div className="text-sm font-medium">{request.companyId.firstName} {request.companyId.lastName}</div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-lg font-bold text-emerald-600">
                          {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(request.amount || 0)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-mono">{request.iban}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">{request.accountHolderName}</div>
                        {request.bankName && (
                          <div className="text-xs text-gray-500">{request.bankName}</div>
                        )}
                      </td>
                      <td className="px-6 py-4">{getStatusBadge(request.status)}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {format(new Date(request.createdAt), 'dd MMM yyyy')}
                      </td>
                      <td className="px-6 py-4">
                        {request.status === 'pending' && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleProcess(request._id, 'completed')}
                              disabled={processingId === request._id}
                              className="px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 disabled:opacity-50"
                            >
                              Onayla
                            </button>
                            <button
                              onClick={() => {
                                const reason = prompt('Red nedeni:');
                                if (reason) handleProcess(request._id, 'rejected', reason);
                              }}
                              disabled={processingId === request._id}
                              className="px-3 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700 disabled:opacity-50"
                            >
                              Reddet
                            </button>
                          </div>
                        )}
                        {request.status === 'rejected' && request.rejectionReason && (
                          <div className="text-xs text-red-600">{request.rejectionReason}</div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Pagination */}
            <div className="px-6 py-4 border-t flex justify-between items-center">
              <div className="text-sm text-gray-700">Sayfa {page} / {totalPages}</div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 border rounded-lg disabled:opacity-50"
                >
                  Önceki
                </button>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 border rounded-lg disabled:opacity-50"
                >
                  Sonraki
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

