import { useState, useEffect } from 'react';
import { Search, Plus, Edit, Trash2, Eye } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

/**
 * Generic Model List Component
 * Tüm modeller için kullanılabilir CRUD listesi
 */
export default function GenericModelList({
  title,
  service,
  columns,
  getRowData,
  onEdit,
  onView,
  onCreate,
  onDelete,
  searchFields = [],
  searchPlaceholder = 'Ara...',
  filters = [],
  formatDate = true,
  refreshKey,
}) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [filterValues, setFilterValues] = useState({});

  useEffect(() => { setPage(1); }, [search]);
  useEffect(() => {
    fetchData();
  }, [page, search, filterValues, refreshKey]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (search) params.search = search;
      Object.keys(filterValues).forEach(key => {
        if (filterValues[key]) params[key] = filterValues[key];
      });

      const response = await service.getAll(params);
      if (response.data.success) {
        setData(response.data.data);
        setTotalPages(response.data.totalPages || 1);
      }
    } catch (error) {
      console.error('Fetch error:', error);
      toast.error('Veri yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bu kaydı silmek istediğinize emin misiniz?')) {
      return;
    }

    try {
      if (onDelete && typeof onDelete === 'function') {
        await onDelete(id);
      } else {
        await service.delete(id);
      }
      toast.success('Kayıt başarıyla silindi');
      fetchData();
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Silme işlemi başarısız');
    }
  };

  const formatValue = (value) => {
    if (value === null || value === undefined) return '-';
    if (typeof value === 'boolean') return value ? 'Evet' : 'Hayır';
    if (value instanceof Date || (typeof value === 'string' && formatDate && value.match(/^\d{4}-\d{2}-\d{2}/))) {
      try {
        return format(new Date(value), 'dd.MM.yyyy HH:mm');
      } catch {
        return value;
      }
    }
    if (typeof value === 'object') {
      if (Array.isArray(value)) return `${value.length} adet`;
      return JSON.stringify(value).substring(0, 50) + '...';
    }
    return String(value);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">{title}</h1>
        {onCreate && (
          <button
            onClick={onCreate}
            className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Plus className="w-5 h-5 mr-2" />
            Yeni Ekle
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {searchFields.length > 0 && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder={searchPlaceholder}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
          )}
          {filters.map((filter) => (
            <div key={filter.key}>
              {filter.type === 'select' ? (
                <select
                  value={filterValues[filter.key] || ''}
                  onChange={(e) => setFilterValues({ ...filterValues, [filter.key]: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">{filter.placeholder || `Tüm ${filter.label}`}</option>
                  {filter.options?.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type={filter.type || 'text'}
                  placeholder={filter.placeholder || filter.label}
                  value={filterValues[filter.key] || ''}
                  onChange={(e) => setFilterValues({ ...filterValues, [filter.key]: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="text-center py-12">Yükleniyor...</div>
        ) : data.length === 0 ? (
          <div className="text-center py-12 text-gray-500">Kayıt bulunamadı</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    {columns.map((col) => (
                      <th
                        key={col.key}
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase"
                      >
                        {col.label}
                      </th>
                    ))}
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      İşlemler
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {data.map((item) => {
                    const rowData = getRowData(item);
                    return (
                      <tr key={item._id || item.id} className="hover:bg-gray-50">
                        {columns.map((col) => (
                          <td key={col.key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {col.render ? col.render(rowData[col.key], item) : formatValue(rowData[col.key])}
                          </td>
                        ))}
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            {onView && (
                              <button
                                onClick={() => onView(item)}
                                className="text-blue-600 hover:text-blue-900"
                                title="Görüntüle"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                            )}
                            {onEdit && (
                              <button
                                onClick={() => onEdit(item)}
                                className="text-green-600 hover:text-green-900"
                                title="Düzenle"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                            )}
                            {(onDelete || onDelete === true) && (
                              <button
                                onClick={() => handleDelete(item._id || item.id)}
                                className="text-red-600 hover:text-red-900"
                                title="Sil"
                              >
                                <Trash2 className="w-4 h-4" />
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
    </div>
  );
}
