import { useState, useEffect } from 'react';
import { adminService } from '../services/adminService';
import { Star, Eye, EyeOff, Search } from 'lucide-react';
import { format } from 'date-fns';


export default function Reviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [reviewType, setReviewType] = useState('');
  const [isPublished, setIsPublished] = useState('');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');

  useEffect(() => { setPage(1); }, [search, sortBy, sortOrder]);
  useEffect(() => {
    fetchReviews();
  }, [page, reviewType, isPublished, search, sortBy, sortOrder]);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 20, sortBy, sortOrder };
      if (reviewType) params.reviewType = reviewType;
      if (isPublished) params.isPublished = isPublished;
      if (search.trim()) params.search = search.trim();

      const response = await adminService.getAllReviews(params);
      if (response.data.success) {
        setReviews(response.data.data);
        setTotalPages(response.data.totalPages);
      }
    } catch (error) {
      console.error('Reviews fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePublish = async (id) => {
    try {
      await adminService.toggleReviewPublish(id);
      fetchReviews();
    } catch (error) {
      alert(error.response?.data?.message || 'İşlem başarısız');
    }
  };

  const renderStars = (rating) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
      />
    ));
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Yorumlar</h1>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Kullanıcı adı, e-posta veya yorum ile ara..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <select
            value={reviewType}
            onChange={(e) => setReviewType(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Tüm Tipler</option>
            <option value="appointment">Randevu</option>
            <option value="product">Ürün</option>
            <option value="employee">Çalışan</option>
            <option value="store">İşletme</option>
          </select>
          <select
            value={isPublished}
            onChange={(e) => setIsPublished(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Tüm Yorumlar</option>
            <option value="true">Yayında</option>
            <option value="false">Yayında Değil</option>
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          >
            <option value="createdAt">Tarih</option>
            <option value="rating">Puan</option>
            <option value="reviewType">Tip</option>
          </select>
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          >
            <option value="desc">Yeniden eskiye</option>
            <option value="asc">Eskiden yeniye</option>
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kullanıcı</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tip</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Puan</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Yorum</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Durum</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tarih</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">İşlem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {reviews.map((review) => (
                    <tr key={review._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        {review.userId ? (
                          <div className="text-sm font-medium">{review.userId.firstName} {review.userId.lastName}</div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs capitalize">
                          {review.reviewType}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1">
                          {renderStars(review.rating)}
                          <span className="ml-2 text-sm font-medium">{review.rating}/5</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600 max-w-xs truncate">
                          {review.comment || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {review.isPublished ? (
                          <span className="flex items-center px-2 py-1 bg-green-100 text-green-800 rounded text-xs w-fit">
                            <Eye className="w-3 h-3 mr-1" />
                            Yayında
                          </span>
                        ) : (
                          <span className="flex items-center px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs w-fit">
                            <EyeOff className="w-3 h-3 mr-1" />
                            Yayında Değil
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {format(new Date(review.createdAt), 'dd MMM yyyy')}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleTogglePublish(review._id)}
                          className="px-3 py-1 bg-primary-600 text-white rounded text-xs hover:bg-primary-700"
                        >
                          {review.isPublished ? 'Yayından Kaldır' : 'Yayınla'}
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

