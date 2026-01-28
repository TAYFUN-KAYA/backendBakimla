import GenericModelList from '../components/GenericModelList';
import { adminService } from '../services/adminService';

export default function Customers() {
  const columns = [
    { key: 'firstName', label: 'Ad' },
    { key: 'lastName', label: 'Soyad' },
    { key: 'email', label: 'E-posta' },
    { key: 'phoneNumber', label: 'Telefon' },
    { key: 'createdAt', label: 'Oluşturulma' },
  ];

  const getRowData = (item) => ({
    firstName: item.firstName || '-',
    lastName: item.lastName || '-',
    email: item.email || '-',
    phoneNumber: item.phoneNumber || '-',
    createdAt: item.createdAt,
  });

  return (
    <GenericModelList
      title="Müşteriler"
      service={adminService.customers}
      columns={columns}
      getRowData={getRowData}
      searchFields={['firstName', 'lastName', 'email', 'phoneNumber']}
    />
  );
}
