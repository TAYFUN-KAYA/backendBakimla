import GenericModelList from '../components/GenericModelList';
import { adminService } from '../services/adminService';

export default function Baskets() {
  const columns = [
    { key: 'userId', label: 'Kullanıcı' },
    { key: 'productId', label: 'Ürün' },
    { key: 'quantity', label: 'Adet' },
    { key: 'createdAt', label: 'Oluşturulma' },
  ];

  const getRowData = (item) => ({
    userId: item.userId ? (typeof item.userId === 'object' ? `${item.userId.firstName} ${item.userId.lastName}` : item.userId) : '-',
    productId: item.productId ? (typeof item.productId === 'object' ? item.productId.name : item.productId) : '-',
    quantity: item.quantity || 0,
    createdAt: item.createdAt,
  });

  return (
    <GenericModelList
      title="Sepetler"
      service={adminService.baskets}
      columns={columns}
      getRowData={getRowData}
      searchFields={['userId']}
      searchPlaceholder="Kullanıcı adı veya e-posta ile ara..."
    />
  );
}
