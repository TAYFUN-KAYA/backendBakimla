import { useState, useEffect } from 'react';
import { X, Wallet, User, DollarSign, TrendingUp, TrendingDown, ArrowDownLeft, ArrowUpRight, RotateCcw } from 'lucide-react';
import { adminService } from '../../services/adminService';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const TYPE_LABELS = { deposit: 'Yatırma', withdrawal: 'Çekim', refund: 'İade' };
const STATUS_LABELS = { pending: 'Beklemede', completed: 'Tamamlandı', failed: 'Başarısız', cancelled: 'İptal' };

export default function WalletDetailModal({ walletId, onClose, onSave }) {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(!!walletId);
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [form, setForm] = useState({
    balance: 0,
    totalEarnings: 0,
    totalWithdrawals: 0,
    lastTransactionDate: '',
  });

  useEffect(() => {
    if (walletId) {
      setFetching(true);
      Promise.all([
        adminService.getWalletById(walletId),
        adminService.walletTransactions.getAll({ walletId, limit: 20 }).catch(() => ({ data: { success: true, data: [] } })),
      ])
        .then(([wRes, tRes]) => {
          if (wRes.data?.success && wRes.data?.data) {
            const w = wRes.data.data;
            setWallet(w);
            setForm({
              balance: w.balance ?? 0,
              totalEarnings: w.totalEarnings ?? 0,
              totalWithdrawals: w.totalWithdrawals ?? 0,
              lastTransactionDate: w.lastTransactionDate
                ? format(new Date(w.lastTransactionDate), "yyyy-MM-dd'T'HH:mm")
                : '',
            });
          }
          if (tRes?.data?.success && Array.isArray(tRes.data.data)) {
            setTransactions(tRes.data.data);
          }
        })
        .catch(() => toast.error('Cüzdan yüklenemedi'))
        .finally(() => setFetching(false));
    } else {
      setWallet(null);
      setTransactions([]);
    }
  }, [walletId]);

  const updateForm = (key, value) => setForm((p) => ({ ...p, [key]: value }));

  const handleSave = async (e) => {
    e.preventDefault();
    if (!walletId) return;
    const balance = parseFloat(form.balance);
    const totalEarnings = parseFloat(form.totalEarnings);
    const totalWithdrawals = parseFloat(form.totalWithdrawals);
    if (balance < 0 || totalEarnings < 0 || totalWithdrawals < 0) {
      toast.error('Bakiye, toplam kazanç ve toplam çekim 0 veya daha büyük olmalıdır');
      return;
    }
    setLoading(true);
    try {
      const payload = {
        balance: Number.isFinite(balance) ? balance : wallet.balance,
        totalEarnings: Number.isFinite(totalEarnings) ? totalEarnings : wallet.totalEarnings,
        totalWithdrawals: Number.isFinite(totalWithdrawals) ? totalWithdrawals : wallet.totalWithdrawals,
        lastTransactionDate: form.lastTransactionDate ? new Date(form.lastTransactionDate) : null,
      };
      await adminService.updateWallet(walletId, payload);
      toast.success('Cüzdan güncellendi');
      onSave?.();
      const res = await adminService.getWalletById(walletId);
      if (res.data?.success && res.data?.data) setWallet(res.data.data);
      setForm({
        balance: res.data?.data?.balance ?? 0,
        totalEarnings: res.data?.data?.totalEarnings ?? 0,
        totalWithdrawals: res.data?.data?.totalWithdrawals ?? 0,
        lastTransactionDate: res.data?.data?.lastTransactionDate
          ? format(new Date(res.data.data.lastTransactionDate), "yyyy-MM-dd'T'HH:mm")
          : '',
      });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Güncelleme başarısız');
    } finally {
      setLoading(false);
    }
  };

  const typeIcon = (t) => {
    if (t === 'deposit') return <ArrowDownLeft className="w-4 h-4 text-green-600" />;
    if (t === 'withdrawal') return <ArrowUpRight className="w-4 h-4 text-red-600" />;
    return <RotateCcw className="w-4 h-4 text-amber-600" />;
  };

  if (fetching) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-8">Yükleniyor...</div>
      </div>
    );
  }

  if (!wallet) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
        <div className="bg-white rounded-xl p-8 shadow-xl max-w-md" onClick={(e) => e.stopPropagation()}>
          <p className="text-gray-500">Cüzdan bulunamadı</p>
          <button type="button" onClick={onClose} className="mt-4 px-4 py-2 bg-gray-200 rounded-lg">Kapat</button>
        </div>
      </div>
    );
  }

  const c = wallet.companyId;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-800">Cüzdan detayı</h2>
          <button type="button" onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* İşletme (read-only) */}
          <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
            <User className="w-5 h-5 text-gray-500 mt-0.5" />
            <div>
              <div className="text-sm font-medium text-gray-600">İşletme</div>
              <div className="font-medium text-gray-800">
                {c ? `${c.firstName || ''} ${c.lastName || ''}`.trim() || c.email : wallet.companyId || '-'}
              </div>
              {c?.email && <div className="text-sm text-gray-600">{c.email}</div>}
            </div>
          </div>

          <form onSubmit={handleSave} className="space-y-6">
            {/* Düzenlenebilir alanlar – model ile uyumlu */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bakiye (₺)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.balance}
                  onChange={(e) => updateForm('balance', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Toplam kazanç (₺)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.totalEarnings}
                  onChange={(e) => updateForm('totalEarnings', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Toplam çekim (₺)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.totalWithdrawals}
                  onChange={(e) => updateForm('totalWithdrawals', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Son işlem tarihi</label>
                <input
                  type="datetime-local"
                  value={form.lastTransactionDate}
                  onChange={(e) => updateForm('lastTransactionDate', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
            </div>

            {/* Özet (model alanları) */}
            <div className="grid grid-cols-2 gap-3 text-sm p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Wallet className="w-4 h-4 text-gray-500" />
                <span className="text-gray-600">Bakiye</span>
              </div>
              <div className="text-right font-semibold text-emerald-600">
                {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(wallet.balance ?? 0)}
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-green-600" />
                <span className="text-gray-600">Toplam kazanç</span>
              </div>
              <div className="text-right">{new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(wallet.totalEarnings ?? 0)}</div>
              <div className="flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-red-600" />
                <span className="text-gray-600">Toplam çekim</span>
              </div>
              <div className="text-right">{new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(wallet.totalWithdrawals ?? 0)}</div>
              <div className="text-gray-600">Son işlem</div>
              <div className="text-right text-gray-700">
                {wallet.lastTransactionDate ? format(new Date(wallet.lastTransactionDate), 'dd.MM.yyyy HH:mm') : '-'}
              </div>
            </div>

            <div className="text-xs text-gray-500 border-t pt-4">
              Oluşturulma: {format(new Date(wallet.createdAt), 'dd.MM.yyyy HH:mm')} · Güncelleme: {format(new Date(wallet.updatedAt), 'dd.MM.yyyy HH:mm')}
            </div>

            <div className="flex justify-end pt-2">
              <button type="submit" disabled={loading} className="px-5 py-2.5 bg-primary-600 text-white rounded-lg font-medium disabled:opacity-50">
                {loading ? 'Kaydediliyor…' : 'Kaydet'}
              </button>
            </div>
          </form>

          {/* Son işlemler (WalletTransaction) */}
          {transactions.length > 0 && (
            <div>
              <div className="text-sm font-medium text-gray-700 mb-2">Son işlemler</div>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Tip</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Tutar</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Önce</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Sonra</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Durum</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Tarih</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {transactions.map((t) => (
                      <tr key={t._id}>
                        <td className="px-4 py-2 flex items-center gap-1">{typeIcon(t.type)} {TYPE_LABELS[t.type] || t.type}</td>
                        <td className="px-4 py-2 text-right font-medium">{new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(t.amount ?? 0)}</td>
                        <td className="px-4 py-2 text-right text-gray-500">{new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(t.balanceBefore ?? 0)}</td>
                        <td className="px-4 py-2 text-right text-gray-500">{new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(t.balanceAfter ?? 0)}</td>
                        <td className="px-4 py-2">{STATUS_LABELS[t.status] || t.status}</td>
                        <td className="px-4 py-2 text-gray-500">{t.createdAt ? format(new Date(t.createdAt), 'dd.MM.yy HH:mm') : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
