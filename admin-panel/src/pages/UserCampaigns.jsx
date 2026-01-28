import GenericModelList from '../components/GenericModelList';
import { adminService } from '../services/adminService';

export default function UserCampaigns() {
  const columns = [
    { key: 'userId', label: 'Kullanıcı' },
    { key: 'campaignId', label: 'Kampanya' },
    { key: 'usedAt', label: 'Kullanım Tarihi' },
    { key: 'isUsed', label: 'Kullanıldı' },
  ];

  const getRowData = (item) => ({
    userId: item.userId ? (typeof item.userId === 'object' ? `${item.userId.firstName} ${item.userId.lastName}` : item.userId) : '-',
    campaignId: item.campaignId ? (typeof item.campaignId === 'object' ? item.campaignId.title : item.campaignId) : '-',
    usedAt: item.usedAt || '-',
    isUsed: item.isUsed,
  });

  return (
    <GenericModelList
      title="Kullanıcı Kampanyaları"
      service={adminService.userCampaigns}
      columns={columns}
      getRowData={getRowData}
    />
  );
}
