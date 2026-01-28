import GenericModelList from '../components/GenericModelList';
import { adminService } from '../services/adminService';

export default function UserCoupons() {
  const columns = [
    { key: 'userId', label: 'Kullanıcı' },
    { key: 'couponId', label: 'Kupon' },
    { key: 'usedAt', label: 'Kullanım Tarihi' },
    { key: 'isUsed', label: 'Kullanıldı' },
  ];

  const getRowData = (item) => ({
    userId: item.userId ? (typeof item.userId === 'object' ? `${item.userId.firstName} ${item.userId.lastName}` : item.userId) : '-',
    couponId: item.couponId ? (typeof item.couponId === 'object' ? item.couponId.code : item.couponId) : '-',
    usedAt: item.usedAt || '-',
    isUsed: item.isUsed,
  });

  return (
    <GenericModelList
      title="Kullanıcı Kuponları"
      service={adminService.userCoupons}
      columns={columns}
      getRowData={getRowData}
    />
  );
}
