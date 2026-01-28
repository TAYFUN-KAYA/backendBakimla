import GenericModelList from '../components/GenericModelList';
import { adminService } from '../services/adminService';

export default function Forms() {
  const columns = [
    { key: 'formName', label: 'Form Adı' },
    { key: 'formType', label: 'Tür' },
    { key: 'status', label: 'Durum' },
    { key: 'createdAt', label: 'Oluşturulma' },
  ];

  const getRowData = (item) => ({
    formName: item.formName || '-',
    formType: item.formType || '-',
    status: item.status || '-',
    createdAt: item.createdAt,
  });

  return (
    <GenericModelList
      title="Formlar"
      service={adminService.forms}
      columns={columns}
      getRowData={getRowData}
      searchFields={['formName']}
    />
  );
}
