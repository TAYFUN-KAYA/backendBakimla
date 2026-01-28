import GenericModelList from '../components/GenericModelList';
import { adminService } from '../services/adminService';

export default function PaymentMethods() {
  const columns = [
    { key: 'userId', label: 'Kullanıcı' },
    { key: 'type', label: 'Tür' },
    { key: 'cardLastFour', label: 'Son 4 Hane' },
    { key: 'isDefault', label: 'Varsayılan' },
  ];

  const getRowData = (item) => ({
    userId: item.userId ? (typeof item.userId === 'object' ? `${item.userId.firstName} ${item.userId.lastName}` : item.userId) : '-',
    type: item.type || '-',
    cardLastFour: item.cardLastFour || '-',
    isDefault: item.isDefault,
  });

  return (
    <GenericModelList
      title="Ödeme Yöntemleri"
      service={adminService.paymentMethods}
      columns={columns}
      getRowData={getRowData}
    />
  );
}
