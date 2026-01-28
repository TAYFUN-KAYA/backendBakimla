import { useState } from 'react';
import GenericModelList from '../components/GenericModelList';
import { adminService } from '../services/adminService';
import CampaignModal from '../components/modals/CampaignModal';

export default function Campaigns() {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const columns = [
    { key: 'title', label: 'Başlık' },
    { key: 'description', label: 'Açıklama' },
    { key: 'discountPercent', label: 'İndirim %' },
    { key: 'startDate', label: 'Başlangıç' },
    { key: 'endDate', label: 'Bitiş' },
    { key: 'isActive', label: 'Aktif' },
  ];

  const getRowData = (item) => ({
    title: item.title || '-',
    description: item.description ? item.description.substring(0, 50) + '...' : '-',
    discountPercent: item.discountPercent || 0,
    startDate: item.startDate,
    endDate: item.endDate,
    isActive: item.isActive,
  });

  return (
    <>
      <GenericModelList
        title="Kampanyalar"
        service={adminService.campaigns}
        columns={columns}
        getRowData={getRowData}
        searchFields={['title', 'description']}
        onEdit={(item) => {
          setSelectedItem(item);
          setModalOpen(true);
        }}
        onCreate={() => {
          setSelectedItem(null);
          setModalOpen(true);
        }}
        onDelete={true}
      />
      {modalOpen && (
        <CampaignModal
          item={selectedItem}
          onClose={() => {
            setModalOpen(false);
            setSelectedItem(null);
          }}
          onSave={() => {
            setModalOpen(false);
            setSelectedItem(null);
            window.location.reload();
          }}
        />
      )}
    </>
  );
}
