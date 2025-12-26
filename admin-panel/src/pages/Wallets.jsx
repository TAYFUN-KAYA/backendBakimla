import { useState, useEffect } from 'react';
import { adminService } from '../services/adminService';
import { Wallet, DollarSign, TrendingUp, TrendingDown } from 'lucide-react';

export default function Wallets() {
  const [wallets, setWallets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalBalance, setTotalBalance] = useState(0);

  useEffect(() => {
    fetchWallets();
  }, [page]);

  const fetchWallets = async () => {
    setLoading(true);
    try {
      const response = await adminService.getAllWallets({ page, limit: 20 });
      if (response.data.success) {
        setWallets(response.data.data);
        setTotalPages(response.data.totalPages);
        setTotalBalance(response.data.totalBalance || 0);
      }
    } catch (error) {
      console.error('Wallets fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Cüzdanlar</h1>
        <div className="text-right">
          <div className="text-sm text-gray-600">Toplam Bakiye</div>
          <div className="text-2xl font-bold text-emerald-600">
            {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(totalBalance)}
          </div>
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bakiye</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Toplam Kazanç</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Toplam Çekim</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Son İşlem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {wallets.map((wallet) => (
                    <tr key={wallet._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        {wallet.companyId ? (
                          <div className="flex items-center">
                            <Wallet className="w-5 h-5 text-primary-600 mr-3" />
                            <div>
                              <div className="text-sm font-medium">{wallet.companyId.firstName} {wallet.companyId.lastName}</div>
                              <div className="text-xs text-gray-500">{wallet.companyId.email}</div>
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center text-lg font-bold text-emerald-600">
                          <DollarSign className="w-5 h-5 mr-1" />
                          {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(wallet.balance || 0)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center text-sm text-green-600">
                          <TrendingUp className="w-4 h-4 mr-1" />
                          {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(wallet.totalEarnings || 0)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center text-sm text-red-600">
                          <TrendingDown className="w-4 h-4 mr-1" />
                          {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(wallet.totalWithdrawals || 0)}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {wallet.lastTransactionDate
                          ? new Date(wallet.lastTransactionDate).toLocaleDateString('tr-TR')
                          : '-'}
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

