import { useState, useEffect } from 'react';
import { adminService } from '../services/adminService';
import { CreditCard, CheckCircle, XCircle, Clock, RotateCcw, X, Search } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';


export default function Payments() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [paymentStatus, setPaymentStatus] = useState('');
  const [totalAmount, setTotalAmount] = useState(0);
  const [search, setSearch] = useState('');

  useEffect(() => { setPage(1); }, [search]);
  useEffect(() => {
    fetchPayments();
  }, [page, paymentStatus, search]);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (paymentStatus) params.paymentStatus = paymentStatus;
      if (search.trim()) params.search = search.trim();

      const response = await adminService.getAllPayments(params);
      if (response.data.success) {
        setPayments(response.data.data);
        setTotalPages(response.data.totalPages);
        setTotalAmount(response.data.totalAmount || 0);
      }
    } catch (error) {
      console.error('Payments fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefund = async (id) => {
    if (!window.confirm('Bu ödemeyi iade etmek istediğinize emin misiniz?')) return;
    try {
      const res = await adminService.refundPayment(id, { description: 'Yönetici iadesi' });
      if (res.data?.success) {
        toast.success('İade işlemi başarılı');
        fetchPayments();
      } else toast.error(res.data?.message || 'İade başarısız');
    } catch (e) {
      toast.error(e.response?.data?.message || 'İade işlemi başarısız');
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm('Bu ödemeyi iptal etmek istediğinize emin misiniz?')) return;
    try {
      const res = await adminService.cancelPayment(id, { description: 'Yönetici iptali' });
      if (res.data?.success) {
        toast.success('İptal işlemi başarılı');
        fetchPayments();
      } else toast.error(res.data?.message || 'İptal başarısız');
    } catch (e) {
      toast.error(e.response?.data?.message || 'İptal işlemi başarısız');
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'refunded':
        return <RotateCcw className="w-5 h-5 text-blue-500" />;
      case 'cancelled':
        return <X className="w-5 h-5 text-gray-500" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Ödemeler</h1>
        <div className="text-right">
          <div className="text-sm text-gray-600">Toplam Gelir</div>
          <div className="text-2xl font-bold text-emerald-600">
            {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(totalAmount)}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="İşletme / müşteri adı veya e-posta ile ara..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <select
            value={paymentStatus}
            onChange={(e) => setPaymentStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Tüm Durumlar</option>
            <option value="success">Başarılı</option>
            <option value="pending">Beklemede</option>
            <option value="failed">Başarısız</option>
            <option value="cancelled">İptal</option>
            <option value="refunded">İade Edildi</option>
          </select>
        </div>
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Durum</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">İşletme</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tutar</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Taksit</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kart</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tarih</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tip</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">İşlemler</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {payments.map((payment) => (
                    <tr key={payment._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          {getStatusIcon(payment.paymentStatus)}
                          <span className="ml-2 text-sm font-medium capitalize">{payment.paymentStatus}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {payment.companyId ? (
                          <div className="text-sm font-medium">{payment.companyId.firstName} {payment.companyId.lastName}</div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-bold">
                          {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: payment.currency || 'TRY' }).format(payment.price)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {payment.cardInfo?.lastFourDigits ? (
                          <div className="flex items-center text-sm">
                            <CreditCard className="w-4 h-4 mr-2 text-gray-400" />
                            **** {payment.cardInfo.lastFourDigits}
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {format(new Date(payment.createdAt), 'dd MMM yyyy HH:mm')}
                      </td>
                      <td className="px-6 py-4">
                        {payment.appointmentId && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">Randevu</span>
                        )}
                        {payment.orderId && (
                          <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs">Sipariş</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium">
                        {payment.installment > 1 ? (
                          <span className="bg-orange-100 text-orange-800 px-2 py-0.5 rounded-full text-xs">
                            {payment.installment} Taksit
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs font-normal italic">Yok</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {!['cancelled', 'refunded'].includes(payment.paymentStatus) && (
                            <button
                              onClick={() => handleCancel(payment._id)}
                              className="text-amber-600 hover:text-amber-800 text-sm font-medium inline-flex items-center gap-1"
                              title="İptal"
                            >
                              <X className="w-4 h-4" />
                              İptal
                            </button>
                          )}
                          {payment.paymentStatus === 'success' && (
                            <button
                              onClick={() => handleRefund(payment._id)}
                              className="text-blue-600 hover:text-blue-800 text-sm font-medium inline-flex items-center gap-1"
                              title="İade Et"
                            >
                              <RotateCcw className="w-4 h-4" />
                              İade
                            </button>
                          )}
                        </div>
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

