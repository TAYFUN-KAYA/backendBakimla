import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminService } from '../services/adminService';
import { Gift, TrendingUp, Building2, CalendarCheck, Banknote, ArrowRight, Search } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export default function IsletKazan() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [payingId, setPayingId] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchList();
  }, [search]);

  const fetchList = async () => {
    setLoading(true);
    try {
      const params = search.trim() ? { search: search.trim() } : {};
      const res = await adminService.getIsletKazanList(params);
      if (res.data?.success) setList(res.data.data || []);
    } catch (e) {
      toast.error('Liste yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const handlePay = async (id) => {
    if (!window.confirm('Bekleyen randevu primlerini cüzdana yatırmak istediğinize emin misiniz?')) return;
    setPayingId(id);
    try {
      const res = await adminService.payIsletKazanPending(id);
      if (res.data?.success) {
        toast.success(res.data.message || 'Primler cüzdana yatırıldı');
        fetchList();
      } else toast.error(res.data?.message || 'İşlem başarısız');
    } catch (e) {
      toast.error(e.response?.data?.message || 'İşlem başarısız');
    } finally {
      setPayingId(null);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">İşlet Kazan</h1>
          <p className="text-gray-500 mt-1">Her 50 tamamlanan randevu için işletmeye 20 TL prim. Takip ve ödemeler.</p>
        </div>
        <Link
          to="/withdrawal-requests"
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          <Banknote className="w-4 h-4" />
          Para Çekme Talepleri
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Search */}
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

      {/* Kural kutusu */}
      <div className="bg-gradient-to-r from-primary-50 to-emerald-50 border border-primary-200 rounded-xl p-4 mb-6 flex items-center gap-4">
        <div className="p-3 bg-primary-100 rounded-lg">
          <Gift className="w-8 h-8 text-primary-600" />
        </div>
        <div>
          <div className="font-semibold text-gray-800">Kural</div>
          <div className="text-sm text-gray-600">Her <strong>50 tamamlanan randevu</strong> için işletmeye <strong>20 TL</strong> prim. Ödemeler cüzdana eklenir; işletme Para Çekme Talepleri üzerinden çekebilir.</div>
        </div>
      </div>

      {/* Tablo */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="text-center py-12">Yükleniyor...</div>
        ) : list.length === 0 ? (
          <div className="text-center py-12 text-gray-500">Tamamlanmış randevusu olan işletme bulunamadı.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">İşletme</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Tamamlanan Randevu</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Ödenen Ödül (adet)</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Ödenen Tutar</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Bekleyen Ödül</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Bekleyen Tutar</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Son Ödeme</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {list.map((row) => {
                  const c = row.companyId;
                  const name = c ? `${c.firstName || ''} ${c.lastName || ''}`.trim() || c.email : '-';
                  return (
                    <tr key={row._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-gray-400" />
                          <div>
                            <div className="font-medium text-gray-800">{name}</div>
                            {c?.email && <div className="text-xs text-gray-500">{c.email}</div>}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="inline-flex items-center gap-1 text-gray-700">
                          <CalendarCheck className="w-4 h-4 text-gray-400" />
                          {row.completedCount ?? 0}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-gray-600">{row.paidMilestoneCount ?? 0}</td>
                      <td className="px-6 py-4 text-right font-medium text-green-600">
                        {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(row.totalAmountPaid ?? 0)}
                      </td>
                      <td className="px-6 py-4 text-right">{row.pendingMilestoneCount ?? 0}</td>
                      <td className="px-6 py-4 text-right font-medium text-amber-600">
                        {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(row.pendingAmount ?? 0)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {row.lastPaidAt ? format(new Date(row.lastPaidAt), 'dd.MM.yyyy HH:mm') : '-'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {(row.pendingMilestoneCount || 0) > 0 && (
                          <button
                            onClick={() => handlePay(row._id)}
                            disabled={payingId === row._id}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg disabled:opacity-50"
                          >
                            <TrendingUp className="w-4 h-4" />
                            {payingId === row._id ? 'Ödeniyor…' : 'Öde'}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
