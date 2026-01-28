import { useState, useEffect } from 'react';
import { adminService } from '../services/adminService';
import { Package, Search, Eye, EyeOff, Plus, Pencil, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import ProductModal from '../components/modals/ProductModal';

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [isPublished, setIsPublished] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [companies, setCompanies] = useState([]);

  useEffect(() => {
    fetchProducts();
  }, [page, search, isPublished]);

  useEffect(() => {
    adminService.getAllUsers({ userType: 'company', limit: 500, page: 1 }).then((res) => {
      if (res.data?.success && res.data?.data) setCompanies(res.data.data);
    }).catch(() => {});
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (search) params.search = search;
      if (isPublished) params.isPublished = isPublished;

      const response = await adminService.getAllProducts(params);
      if (response.data.success) {
        setProducts(response.data.data);
        setTotalPages(response.data.totalPages);
      }
    } catch (error) {
      console.error('Products fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => { setEditingId(null); setModalOpen(true); };
  const openEdit = (p) => { setEditingId(p._id); setModalOpen(true); };
  const closeModal = () => { setModalOpen(false); setEditingId(null); };
  const onModalSave = () => { closeModal(); fetchProducts(); };

  const handleDelete = async (product) => {
    if (!window.confirm(`"${product.name}" ürününü silmek istediğinize emin misiniz?`)) return;
    try {
      await adminService.deleteProduct(product._id);
      toast.success('Ürün silindi');
      fetchProducts();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Silme başarısız');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Ürünler</h1>
        <button
          type="button"
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          <Plus className="w-5 h-5" /> Ürün Ekle
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Ürün adı ile ara..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <select
            value={isPublished}
            onChange={(e) => setIsPublished(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Tüm Ürünler</option>
            <option value="true">Yayında</option>
            <option value="false">Yayında Değil</option>
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ürün</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">İşletme</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kategori</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cinsiyet</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fiyat</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stok</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Durum</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tarih</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">İşlemler</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {products.map((product) => (
                    <tr key={product._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <Package className="w-5 h-5 text-primary-600 mr-3" />
                          <div>
                            <div className="text-sm font-medium">{product.name}</div>
                            {product.description && (
                              <div className="text-xs text-gray-500 line-clamp-1">{product.description}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {product.companyId ? (
                          <div className="text-sm">{product.companyId.firstName} {product.companyId.lastName}</div>
                        ) : (
                          <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs">Kozmetik Mağaza</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">{product.category}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                          {product.targetGender === 'woman' ? 'Kadın' : product.targetGender === 'man' ? 'Erkek' : 'Unisex'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-bold">
                          {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(product.price || 0)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          product.stock > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {product.stock || 0}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {product.isPublished ? (
                            <span className="flex items-center px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                              <Eye className="w-3 h-3 mr-1" />
                              Yayında
                            </span>
                          ) : (
                            <span className="flex items-center px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs">
                              <EyeOff className="w-3 h-3 mr-1" />
                              Yayında Değil
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {format(new Date(product.createdAt), 'dd MMM yyyy')}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => openEdit(product)}
                            className="p-1.5 text-gray-600 hover:bg-gray-100 rounded"
                            title="Düzenle"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(product)}
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

      {modalOpen && (
        <ProductModal
          productId={editingId}
          companies={companies}
          onClose={closeModal}
          onSave={onModalSave}
        />
      )}
    </div>
  );
}

