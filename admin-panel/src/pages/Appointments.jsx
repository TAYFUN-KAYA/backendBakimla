import { useState, useEffect } from 'react';
import { adminService } from '../services/adminService';
import { Calendar, Clock, DollarSign, Pencil, Search } from 'lucide-react';
import { format } from 'date-fns';
import AppointmentDetailModal from '../components/modals/AppointmentDetailModal';

export default function Appointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchAppointments();
  }, [page, status, search]);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (status) params.status = status;
      if (typeof search === 'string' && search.trim().length > 0) params.search = search.trim();

      const response = await adminService.getAllAppointments(params);
      if (response.data.success) {
        setAppointments(response.data.data);
        setTotalPages(response.data.totalPages ?? 1);
        setTotal(response.data.total ?? 0);
      }
    } catch (error) {
      console.error('Appointments fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setSearch(searchInput.trim());
    setPage(1);
  };

  const handleStatusChange = (v) => {
    setStatus(v);
    setPage(1);
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setSearch('');
    setPage(1);
  };

  const getStatusBadge = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    const labels = {
      pending: 'Beklemede',
      approved: 'Onaylandı',
      completed: 'Tamamlandı',
      cancelled: 'İptal',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status] || 'bg-gray-100 text-gray-800'}`}>
        {labels[status] || status}
      </span>
    );
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Randevular</h1>
      </div>

      {/* Filtreler & Arama */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Müşteri, hizmet, işletme, not..."
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
          <select
            value={status}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Tüm Durumlar</option>
            <option value="pending">Beklemede</option>
            <option value="approved">Onaylandı</option>
            <option value="completed">Tamamlandı</option>
            <option value="cancelled">İptal</option>
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tarih/Saat</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Müşteri</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">İşletme</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hizmet</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tutar</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Durum</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">İşlemler</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {appointments.map((apt) => (
                    <tr key={apt._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <div className="flex items-center mb-1">
                            <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                            {format(new Date(apt.appointmentDate), 'dd MMM yyyy')}
                          </div>
                          <div className="flex items-center text-gray-500">
                            <Clock className="w-4 h-4 mr-2" />
                            {apt.appointmentTime}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {apt.customerIds?.length ? (
                          <div className="text-sm space-y-1">
                            {apt.customerIds.map((c, i) => (
                              <div key={c._id || i}>
                                <span className="font-medium">{c.firstName} {c.lastName}</span>
                                {c.phoneNumber && <span className="text-gray-500"> · {c.phoneNumber}</span>}
                              </div>
                            ))}
                          </div>
                        ) : apt.userId ? (
                          <div className="text-sm">
                            <span className="font-medium">{apt.userId.firstName} {apt.userId.lastName}</span>
                            <span className="text-gray-500 text-xs"> (Kullanıcı)</span>
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {apt.companyId ? (
                          <div className="text-sm font-medium">{apt.companyId.firstName} {apt.companyId.lastName}</div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <div className="font-medium">{apt.serviceCategory}</div>
                          <div className="text-gray-500">{apt.serviceType}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center text-sm font-medium">
                          <DollarSign className="w-4 h-4 mr-1" />
                          {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(apt.totalPrice ?? apt.servicePrice ?? 0)}
                        </div>
                      </td>
                      <td className="px-6 py-4">{getStatusBadge(apt.status)}</td>
                      <td className="px-6 py-4">
                        <button
                          type="button"
                          onClick={() => { setEditingId(apt._id); setModalOpen(true); }}
                          className="p-1.5 text-gray-600 hover:bg-gray-100 rounded"
                          title="Detay / Düzenle"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
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

      {modalOpen && (
        <AppointmentDetailModal
          appointmentId={editingId}
          onClose={() => { setModalOpen(false); setEditingId(null); }}
          onSave={() => { setModalOpen(false); setEditingId(null); fetchAppointments(); }}
        />
      )}
    </div>
  );
}

