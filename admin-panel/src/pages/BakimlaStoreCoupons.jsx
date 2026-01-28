import { useState } from 'react';
import GenericModelList from '../components/GenericModelList';
import { adminService } from '../services/adminService';
import BakimlaStoreCouponModal from '../components/modals/BakimlaStoreCouponModal';
import { format } from 'date-fns';

export default function BakimlaStoreCoupons() {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const columns = [
    { key: 'code', label: 'Kod' },
    { key: 'name', label: 'Ad' },
    { key: 'discount', label: 'İndirim' },
    { key: 'minPurchaseAmount', label: 'Min. Tutar' },
    { key: 'validity', label: 'Geçerlilik' },
    { key: 'usage', label: 'Kullanım' },
    { key: 'isActive', label: 'Aktif' },
  ];

  const getRowData = (item) => {
    const disc = item.discountType === 'percentage'
      ? `%${item.discountValue || 0}`
      : `${item.discountValue || 0} TL`;
    const start = item.startDate ? format(new Date(item.startDate), 'dd.MM.yy') : '-';
    const end = item.endDate ? format(new Date(item.endDate), 'dd.MM.yy') : '-';
    const usage = item.usageLimit == null
      ? `${item.usedCount ?? 0} / ∞`
      : `${item.usedCount ?? 0} / ${item.usageLimit}`;
    return {
      code: item.code || '-',
      name: item.name || '-',
      discount: disc,
      minPurchaseAmount: item.minPurchaseAmount != null ? `${Number(item.minPurchaseAmount).toLocaleString('tr-TR')} TL` : '-',
      validity: `${start} – ${end}`,
      usage,
      isActive: item.isActive,
    };
  };

  const openCreate = () => { setEditingCoupon(null); setModalOpen(true); };
  const openEdit = (item) => { setEditingCoupon(item); setModalOpen(true); };
  const closeModal = () => { setModalOpen(false); setEditingCoupon(null); };
  const onModalSave = () => { closeModal(); setRefreshKey((k) => k + 1); };

  return (
    <>
      <GenericModelList
        title="Bakimla Store Kuponları"
        service={adminService.bakimlaStoreCoupons}
        columns={columns}
        getRowData={getRowData}
        searchFields={['code', 'name', 'description']}
        searchPlaceholder="Kod, ad veya açıklama ile ara..."
        onCreate={openCreate}
        onEdit={openEdit}
        onDelete
        refreshKey={refreshKey}
      />
      {modalOpen && (
        <BakimlaStoreCouponModal
          coupon={editingCoupon}
          onClose={closeModal}
          onSave={onModalSave}
        />
      )}
    </>
  );
}
