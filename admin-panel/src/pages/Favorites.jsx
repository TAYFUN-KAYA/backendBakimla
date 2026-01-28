import GenericModelList from '../components/GenericModelList';
import { adminService } from '../services/adminService';

export default function Favorites() {
  const columns = [
    { key: 'userId', label: 'Kullanıcı' },
    { key: 'productId', label: 'Ürün' },
    { key: 'createdAt', label: 'Oluşturulma' },
  ];

  const getRowData = (item) => ({
    userId: item.userId ? (typeof item.userId === 'object' ? `${item.userId.firstName} ${item.userId.lastName}` : item.userId) : '-',
    productId: item.productId ? (typeof item.productId === 'object' ? item.productId.name : item.productId) : '-',
    createdAt: item.createdAt,
  });

  return (
    <GenericModelList
      title="Favoriler"
      service={adminService.favorites}
      columns={columns}
      getRowData={getRowData}
      searchFields={['userId']}
      searchPlaceholder="Kullanıcı adı, e-posta veya ürün adı ile ara..."
    />
  );
}
