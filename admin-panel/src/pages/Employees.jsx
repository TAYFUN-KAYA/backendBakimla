import { useState, useEffect } from 'react';
import { adminService } from '../services/adminService';
import { UserCheck, CheckCircle, XCircle, Clock, Search } from 'lucide-react';
import { format } from 'date-fns';


export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isApproved, setIsApproved] = useState('');
  const [processingId, setProcessingId] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => { setPage(1); }, [search]);
  useEffect(() => {
    fetchEmployees();
  }, [page, isApproved, search]);

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (isApproved) params.isApproved = isApproved;
      if (search.trim()) params.search = search.trim();

      const response = await adminService.getAllEmployees(params);
      if (response.data.success) {
        setEmployees(response.data.data);
        setTotalPages(response.data.totalPages);
      }
    } catch (error) {
      console.error('Employees fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    setProcessingId(id);
    try {
      await adminService.approveEmployee(id);
      fetchEmployees();
    } catch (error) {
      alert(error.response?.data?.message || 'İşlem başarısız');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id) => {
    if (!window.confirm('Bu çalışanı reddetmek istediğinize emin misiniz? (Silinecek)')) {
      return;
    }
    setProcessingId(id);
    try {
      await adminService.rejectEmployee(id);
      fetchEmployees();
    } catch (error) {
      alert(error.response?.data?.message || 'İşlem başarısız');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Çalışanlar</h1>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Ad, e-posta veya telefon ile ara..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <select
            value={isApproved}
            onChange={(e) => setIsApproved(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Tüm Çalışanlar</option>
            <option value="true">Onaylı</option>
            <option value="false">Onay Bekleyen</option>
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Çalışan</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">İşletme</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">İletişim</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Durum</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kayıt Tarihi</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">İşlemler</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {employees.map((employee) => (
                    <tr key={employee._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <UserCheck className="w-5 h-5 text-primary-600 mr-3" />
                          <div>
                            <div className="text-sm font-medium">{employee.firstName} {employee.lastName}</div>
                            <div className="text-xs text-gray-500">{employee.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {employee.companyId ? (
                          <div className="text-sm">
                            <div className="font-medium">{employee.companyId.firstName} {employee.companyId.lastName}</div>
                            <div className="text-xs text-gray-500">{employee.companyId.email}</div>
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600">{employee.phoneNumber}</div>
                      </td>
                      <td className="px-6 py-4">
                        {employee.isApproved ? (
                          <span className="flex items-center px-2 py-1 bg-green-100 text-green-800 rounded text-xs w-fit">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Onaylı
                          </span>
                        ) : (
                          <span className="flex items-center px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs w-fit">
                            <Clock className="w-3 h-3 mr-1" />
                            Onay Bekliyor
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {format(new Date(employee.createdAt), 'dd MMM yyyy')}
                      </td>
                      <td className="px-6 py-4">
                        {!employee.isApproved && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleApprove(employee._id)}
                              disabled={processingId === employee._id}
                              className="px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 disabled:opacity-50"
                            >
                              Onayla
                            </button>
                            <button
                              onClick={() => handleReject(employee._id)}
                              disabled={processingId === employee._id}
                              className="px-3 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700 disabled:opacity-50"
                            >
                              Reddet
                            </button>
                          </div>
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

