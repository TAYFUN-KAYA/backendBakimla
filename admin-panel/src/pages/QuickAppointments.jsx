import { useState, useEffect } from 'react';
import { adminService } from '../services/adminService';
import { Search, Building2, Users, Calendar, Trash2, Eye } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import QuickAppointmentDetailModal from '../components/modals/QuickAppointmentDetailModal';

export default function QuickAppointments() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [detailId, setDetailId] = useState(null);

  useEffect(() => {
    fetchData();
  }, [page, search]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (typeof search === 'string' && search.trim().length > 0) params.search = search.trim();

      const res = await adminService.quickAppointments.getAll(params);
      if (res.data?.success) {
        setData(res.data.data || []);
        setTotalPages(res.data.totalPages ?? 1);
        setTotal(res.data.total ?? 0);
      }
    } catch (e) {
      console.error('QuickAppointments fetch error:', e);
      toast.error('Veri yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setSearch(searchInput.trim());
    setPage(1);
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setSearch('');
    setPage(1);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bu hızlı randevuyu silmek istediğinize emin misiniz?')) return;
    try {
      await adminService.quickAppointments.delete(id);
      toast.success('Silindi');
      fetchData();
    } catch (e) {
      console.error('Delete error:', e);
      toast.error(e.response?.data?.message || 'Silme başarısız');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Hızlı Randevular</h1>
      </div>

      {/* Arama */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="İşletme, müşteri adı veya telefon..."
              className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
            {searchInput && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                title="Temizle"
              >
                ×
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={handleSearch}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center justify-center gap-2"
          >
            <Search className="w-4 h-4" />
            Ara
          </button>
        </div>
      </div>

      {/* Tablo */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="text-center py-12">Yükleniyor...</div>
        ) : data.length === 0 ? (
          <div className="text-center py-12 text-gray-500">Hızlı randevu bulunamadı</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">İşletme</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Müşteriler</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Oluşturulma</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">İşlemler</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {data.map((item) => (
                    <tr key={item._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        {item.companyId ? (
                          <div className="flex items-center gap-2 text-sm">
                            <Building2 className="w-4 h-4 text-gray-400" />
                            <span className="font-medium">
                              {item.companyId.firstName} {item.companyId.lastName}
                            </span>
                            {item.companyId.email && (
                              <span className="text-gray-500 text-xs">({item.companyId.email})</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {item.customerIds?.length ? (
                          <div className="flex items-start gap-1">
                            <Users className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                            <div className="text-sm space-y-1">
                              {item.customerIds.map((c, i) => (
                                <div key={c._id || i}>
                                  {c.firstName} {c.lastName}
                                  {c.phoneNumber && <span className="text-gray-500"> · {c.phoneNumber}</span>}
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          {item.createdAt ? format(new Date(item.createdAt), 'dd.MM.yyyy HH:mm') : '—'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setDetailId(item._id)}
                            className="p-1.5 text-gray-600 hover:bg-gray-100 rounded"
                            title="Detay"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(item._id)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded"
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
            <div className="px-6 py-4 border-t flex flex-wrap justify-between items-center gap-3">
              <div className="text-sm text-gray-700">
                Toplam <strong>{total}</strong> kayıt
                {total > 0 && (
                  <span className="text-gray-500 ml-1">
                    · Sayfa {page} / {totalPages}
                    <span className="ml-1">
                      ({(page - 1) * 20 + 1}–{Math.min(page * 20, total)})
                    </span>
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50"
                >
                  Önceki
                </button>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50"
                >
                  Sonraki
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {detailId && (
        <QuickAppointmentDetailModal
          quickAppointmentId={detailId}
          onClose={() => setDetailId(null)}
        />
      )}
    </div>
  );
}
