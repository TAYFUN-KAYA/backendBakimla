import GenericModelList from '../components/GenericModelList';
import { adminService } from '../services/adminService';

export default function WalletTransactions() {
  const columns = [
    { key: 'companyId', label: 'İşletme' },
    { key: 'type', label: 'Tür' },
    { key: 'amount', label: 'Tutar' },
    { key: 'balanceBefore', label: 'Önceki Bakiye' },
    { key: 'balanceAfter', label: 'Sonraki Bakiye' },
    { key: 'status', label: 'Durum' },
    { key: 'createdAt', label: 'Tarih' },
  ];

  const getRowData = (item) => ({
    companyId: item.companyId ? (typeof item.companyId === 'object' ? item.companyId.businessName || item.companyId.storeName : item.companyId) : '-',
    type: item.type || '-',
    amount: item.amount ? `${item.amount} ₺` : '0 ₺',
    balanceBefore: item.balanceBefore ? `${item.balanceBefore} ₺` : '0 ₺',
    balanceAfter: item.balanceAfter ? `${item.balanceAfter} ₺` : '0 ₺',
    status: item.status || '-',
    createdAt: item.createdAt,
  });

  return (
    <GenericModelList
      title="Cüzdan İşlemleri"
      service={adminService.walletTransactions}
      columns={columns}
      getRowData={getRowData}
      filters={[
        {
          key: 'type',
          type: 'select',
          label: 'Tür',
          placeholder: 'Tüm Türler',
          options: [
            { value: 'deposit', label: 'Yatırma' },
            { value: 'withdrawal', label: 'Çekim' },
            { value: 'refund', label: 'İade' },
          ],
        },
        {
          key: 'status',
          type: 'select',
          label: 'Durum',
          placeholder: 'Tüm Durumlar',
          options: [
            { value: 'pending', label: 'Beklemede' },
            { value: 'completed', label: 'Tamamlandı' },
            { value: 'failed', label: 'Başarısız' },
            { value: 'cancelled', label: 'İptal' },
          ],
        },
      ]}
    />
  );
}
