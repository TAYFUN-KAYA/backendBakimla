import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminService } from '../services/adminService';
import { Search, Store, MapPin, Phone, Eye } from 'lucide-react';
import { format } from 'date-fns';


export default function Stores() {
  const navigate = useNavigate();
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchStores();
  }, [page, search]);

  const fetchStores = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (search) params.search = search;

      const response = await adminService.getAllStores(params);
      if (response.data.success) {
        setStores(response.data.data);
        setTotalPages(response.data.totalPages);
      }
    } catch (error) {
      console.error('Stores fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">İşletmeler</h1>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="İşletme adı ile ara..."
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
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">İşletme</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sahibi</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Adres</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sektör</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Oluşturulma</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">İşlemler</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {stores.map((store) => (
                    <tr key={store._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <Store className="w-5 h-5 text-primary-600 mr-3" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">{store.storeName}</div>
                            <div className="text-sm text-gray-500">{store.businessName}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {store.companyId ? (
                          <div className="text-sm">
                            <div className="font-medium">{store.companyId.firstName} {store.companyId.lastName}</div>
                            <div className="text-gray-500">{store.companyId.email}</div>
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600">
                          <div className="flex items-center mb-1">
                            <MapPin className="w-4 h-4 mr-2" />
                            {store.address?.city}, {store.address?.district}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {store.sectors?.slice(0, 2).map((sector, idx) => (
                            <span key={sector?.id ?? sector?._id ?? idx} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                              {typeof sector === 'object' && sector !== null
                                ? (sector.name || sector.key || '-')
                                : String(sector ?? '')}
                            </span>
                          ))}
                          {store.sectors?.length > 2 && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                              +{store.sectors.length - 2}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {format(new Date(store.createdAt), 'dd MMM yyyy')}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => navigate(`/stores/${store._id}`)}
                          className="flex items-center px-3 py-1 bg-primary-600 text-white rounded text-xs hover:bg-primary-700 transition-colors"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Detay
                        </button>
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

