import GenericModelList from '../components/GenericModelList';
import { adminService } from '../services/adminService';

export default function Coupons() {
  const columns = [
    { key: 'code', label: 'Kod' },
    { key: 'description', label: 'Açıklama' },
    { key: 'discountPercent', label: 'İndirim %' },
    { key: 'minPurchaseAmount', label: 'Min. Tutar' },
    { key: 'maxDiscountAmount', label: 'Max. İndirim' },
    { key: 'usageLimit', label: 'Kullanım Limiti' },
    { key: 'isActive', label: 'Aktif' },
  ];

  const getRowData = (item) => ({
    code: item.code || '-',
    description: item.description ? item.description.substring(0, 50) + '...' : '-',
    discountPercent: item.discountPercent || 0,
    minPurchaseAmount: item.minPurchaseAmount || 0,
    maxDiscountAmount: item.maxDiscountAmount || 0,
    usageLimit: item.usageLimit || '-',
    isActive: item.isActive,
  });

  return (
    <GenericModelList
      title="Kuponlar"
      service={adminService.coupons}
      columns={columns}
      getRowData={getRowData}
      searchFields={['code', 'description']}
      filters={[
        {
          key: 'isActive',
          type: 'select',
          label: 'Durum',
          placeholder: 'Tüm Durumlar',
          options: [
            { value: 'true', label: 'Aktif' },
            { value: 'false', label: 'Pasif' },
          ],
        },
      ]}
    />
  );
}
