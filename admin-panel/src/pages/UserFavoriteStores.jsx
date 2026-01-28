import GenericModelList from '../components/GenericModelList';
import { adminService } from '../services/adminService';

export default function UserFavoriteStores() {
  const columns = [
    { key: 'userId', label: 'Kullanıcı' },
    { key: 'storeId', label: 'İşletme' },
    { key: 'order', label: 'Sıra' },
    { key: 'createdAt', label: 'Oluşturulma' },
  ];

  const getRowData = (item) => ({
    userId: item.userId ? (typeof item.userId === 'object' ? `${item.userId.firstName} ${item.userId.lastName}` : item.userId) : '-',
    storeId: item.storeId ? (typeof item.storeId === 'object' ? item.storeId.storeName || item.storeId.businessName : item.storeId) : '-',
    order: item.order || 0,
    createdAt: item.createdAt,
  });

  return (
    <GenericModelList
      title="Kullanıcı Favori İşletmeleri"
      service={adminService.userFavoriteStores}
      columns={columns}
      getRowData={getRowData}
    />
  );
}
