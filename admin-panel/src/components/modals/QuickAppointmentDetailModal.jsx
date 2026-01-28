import { useState, useEffect } from 'react';
import { X, Building2, Users, Calendar, Mail, Phone, FileText, Image as ImageIcon } from 'lucide-react';
import { adminService } from '../../services/adminService';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export default function QuickAppointmentDetailModal({ quickAppointmentId, onClose }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    if (quickAppointmentId) {
      setLoading(true);
      adminService.quickAppointments
        .getById(quickAppointmentId)
        .then((res) => {
          if (res.data?.success && res.data?.data) setData(res.data.data);
        })
        .catch(() => toast.error('Detay yüklenemedi'))
        .finally(() => setLoading(false));
    } else {
      setData(null);
      setLoading(false);
    }
  }, [quickAppointmentId]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-8">Yükleniyor...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl p-8 max-w-md w-full text-center">
          <p className="text-gray-600">Kayıt bulunamadı</p>
          <button type="button" onClick={onClose} className="mt-4 px-4 py-2 text-primary-600 hover:underline">
            Kapat
          </button>
        </div>
      </div>
    );
  }

  const company = data.companyId && typeof data.companyId === 'object' ? data.companyId : null;
  const customers = Array.isArray(data.customerIds) ? data.customerIds : [];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b shrink-0">
          <h2 className="text-xl font-bold text-gray-800">Hızlı Randevu Detayı</h2>
          <button type="button" onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto space-y-5">
          {/* İşletme */}
          <section>
            <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              İşletme
            </h3>
            {company ? (
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <p className="font-medium">
                  {company.firstName} {company.lastName}
                </p>
                {company.email && (
                  <p className="text-sm text-gray-600 flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-400" />
                    {company.email}
                  </p>
                )}
                {company.phoneNumber && (
                  <p className="text-sm text-gray-600 flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-400" />
                    {company.phoneNumber}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">İşletme bilgisi yok (ID: {String(data.companyId || '—')})</p>
            )}
          </section>

          {/* Müşteriler */}
          <section>
            <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Müşteriler ({customers.length})
            </h3>
            {customers.length ? (
              <div className="space-y-3">
                {customers.map((c, i) => (
                  <div key={c._id || i} className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                    <div className="flex gap-3">
                      <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center flex-shrink-0">
                        {c.profileImage ? (
                          <img src={c.profileImage} alt="" className="w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none'; }} />
                        ) : null}
                        {!c.profileImage && <ImageIcon className="w-6 h-6 text-gray-500" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium">
                          {c.firstName} {c.lastName}
                        </p>
                        {c.phoneNumber && (
                          <p className="text-sm text-gray-600 flex items-center gap-1 mt-0.5">
                            <Phone className="w-3.5 h-3.5" />
                            {c.phoneNumber}
                          </p>
                        )}
                        {c.notes && (
                          <p className="text-sm text-gray-600 mt-1 flex items-start gap-1">
                            <FileText className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                            <span>{c.notes}</span>
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">Müşteri yok</p>
            )}
          </section>

          {/* Tarihler */}
          <section>
            <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Tarihler
            </h3>
            <div className="bg-gray-50 rounded-lg p-4 space-y-1 text-sm text-gray-600">
              <p>Oluşturulma: {data.createdAt ? format(new Date(data.createdAt), 'dd.MM.yyyy HH:mm') : '—'}</p>
              <p>Güncelleme: {data.updatedAt ? format(new Date(data.updatedAt), 'dd.MM.yyyy HH:mm') : '—'}</p>
            </div>
          </section>

          {data._id && (
            <p className="text-xs text-gray-400">ID: {data._id}</p>
          )}
        </div>

        <div className="p-4 border-t shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
}
