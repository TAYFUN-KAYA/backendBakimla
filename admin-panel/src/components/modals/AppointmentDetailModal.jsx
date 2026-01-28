import { useState, useEffect } from 'react';
import { X, Plus, Trash2, User, Calendar, DollarSign } from 'lucide-react';
import { adminService } from '../../services/adminService';
import toast from 'react-hot-toast';

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Beklemede' },
  { value: 'approved', label: 'Onaylandı' },
  { value: 'completed', label: 'Tamamlandı' },
  { value: 'cancelled', label: 'İptal' },
];

const PAYMENT_METHOD_OPTIONS = [
  { value: 'cash', label: 'Nakit' },
  { value: 'card', label: 'Kredi/Banka Kartı' },
];

const aptToForm = (a) => {
  if (!a) return null;
  const d = a.appointmentDate ? new Date(a.appointmentDate) : null;
  return {
    appointmentDate: d ? d.toISOString().slice(0, 10) : '',
    appointmentTime: a.appointmentTime || '',
    serviceCategory: a.serviceCategory || '',
    taskType: a.taskType || '',
    serviceType: a.serviceType || '',
    serviceDuration: a.serviceDuration ?? 0,
    servicePrice: a.servicePrice ?? 0,
    totalPrice: a.totalPrice ?? a.servicePrice ?? 0,
    discount: a.discount ?? 0,
    pointsUsed: a.pointsUsed ?? 0,
    paymentMethod: a.paymentMethod || 'cash',
    status: a.status || 'pending',
    isApproved: !!a.isApproved,
    paymentReceived: !!a.paymentReceived,
    notes: a.notes || '',
    cancellationReason: a.cancellationReason || '',
    personCount: a.personCount ?? 1,
    services: (a.services || []).map((s) => ({
      serviceType: s.serviceType || '',
      serviceDuration: s.serviceDuration ?? 0,
      servicePrice: s.servicePrice ?? 0,
      personIndex: s.personIndex ?? 0,
    })),
  };
};

const formToPayload = (f) => {
  const p = {
    appointmentDate: f.appointmentDate ? new Date(f.appointmentDate) : undefined,
    appointmentTime: f.appointmentTime || undefined,
    serviceCategory: f.serviceCategory || undefined,
    taskType: f.taskType || undefined,
    serviceType: f.serviceType || undefined,
    serviceDuration: parseInt(f.serviceDuration, 10) >= 0 ? parseInt(f.serviceDuration, 10) : undefined,
    servicePrice: parseFloat(f.servicePrice) >= 0 ? parseFloat(f.servicePrice) : undefined,
    totalPrice: parseFloat(f.totalPrice) >= 0 ? parseFloat(f.totalPrice) : undefined,
    discount: parseFloat(f.discount) >= 0 ? parseFloat(f.discount) : undefined,
    pointsUsed: parseInt(f.pointsUsed, 10) >= 0 ? parseInt(f.pointsUsed, 10) : undefined,
    paymentMethod: f.paymentMethod || undefined,
    status: f.status || undefined,
    isApproved: !!f.isApproved,
    paymentReceived: !!f.paymentReceived,
    notes: f.notes || undefined,
    cancellationReason: f.cancellationReason || undefined,
    personCount: parseInt(f.personCount, 10) >= 1 ? parseInt(f.personCount, 10) : undefined,
  };
  p.services = (f.services || [])
    .filter((s) => (s.serviceType || '').trim())
    .map((s) => ({
      serviceType: (s.serviceType || '').trim(),
      serviceDuration: parseInt(s.serviceDuration, 10) || 0,
      servicePrice: parseFloat(s.servicePrice) || 0,
      personIndex: parseInt(s.personIndex, 10) || 0,
    }));
  return p;
};

export default function AppointmentDetailModal({ appointmentId, onClose, onSave }) {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(!!appointmentId);
  const [formData, setFormData] = useState(null);
  const [raw, setRaw] = useState(null);

  useEffect(() => {
    if (appointmentId) {
      setFetching(true);
      adminService
        .getAppointmentById(appointmentId)
        .then((res) => {
          if (res.data?.success && res.data?.data) {
            setRaw(res.data.data);
            setFormData(aptToForm(res.data.data));
          }
        })
        .catch(() => toast.error('Randevu yüklenemedi'))
        .finally(() => setFetching(false));
    } else {
      setFormData(null);
      setRaw(null);
    }
  }, [appointmentId]);

  const update = (key, value) => setFormData((prev) => (prev ? { ...prev, [key]: value } : prev));
  const updateService = (idx, key, value) => {
    setFormData((prev) => {
      if (!prev?.services) return prev;
      const s = [...prev.services];
      s[idx] = { ...s[idx], [key]: value };
      return { ...prev, services: s };
    });
  };
  const addService = () =>
    setFormData((prev) => ({
      ...prev,
      services: [...(prev?.services || []), { serviceType: '', serviceDuration: 0, servicePrice: 0, personIndex: 0 }],
    }));
  const removeService = (idx) =>
    setFormData((prev) => ({
      ...prev,
      services: (prev?.services || []).filter((_, i) => i !== idx),
    }));

  const setStatus = (s) => update('status', s);
  const setPaymentReceived = (v) => update('paymentReceived', !!v);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData) return;
    setLoading(true);
    try {
      const payload = formToPayload(formData);
      await adminService.updateAppointment(appointmentId, payload);
      toast.success('Randevu güncellendi');
      onSave();
    } catch (err) {
      console.error('Appointment update error:', err);
      toast.error(err.response?.data?.message || 'Güncelleme başarısız');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-8">Yükleniyor...</div>
      </div>
    );
  }

  if (!formData || !raw) {
    return (
      <div className="fixed inset-0 bg-black/50 flex flex-col items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl p-8">Randevu bulunamadı</div>
        <button type="button" onClick={onClose} className="mt-4 px-4 py-2 text-primary-600 hover:underline">Kapat</button>
      </div>
    );
  }

  const customers = raw.customerIds || [];
  const hasMultiple = customers.length > 1;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b shrink-0">
          <h2 className="text-xl font-bold text-gray-800">Randevu Detayı / Düzenle</h2>
          <button type="button" onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="p-4 overflow-y-auto space-y-4 flex-1">
            {/* Müşteriler (tekli veya çoklu) */}
            <section>
              <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                <User className="w-4 h-4 mr-2" />
                Müşteri{hasMultiple ? 'ler' : ''} ({customers.length})
              </h3>
              <div className="space-y-2">
                {customers.map((c, i) => (
                  <div key={c._id || i} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                    <span className="font-medium">{c.firstName} {c.lastName}</span>
                    <span className="text-gray-500">{c.phoneNumber}</span>
                  </div>
                ))}
                {raw.userId && !customers.length && (
                  <div className="p-2 bg-gray-50 rounded-lg">
                    <span className="font-medium">{raw.userId.firstName} {raw.userId.lastName}</span>
                    <span className="text-gray-500 ml-2">(Kullanıcı)</span>
                  </div>
                )}
                {!customers.length && !raw.userId && <span className="text-gray-400">—</span>}
              </div>
            </section>

            {/* İşletme & Çalışan (salt okunur) */}
            <section className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-gray-600 mb-1">İşletme</label>
                <p className="font-medium">{raw.companyId ? `${raw.companyId.firstName} ${raw.companyId.lastName}` : '—'}</p>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Çalışan</label>
                <p className="font-medium">{raw.employeeId ? `${raw.employeeId.firstName} ${raw.employeeId.lastName}` : '—'}</p>
              </div>
            </section>

            {/* Tarih & Saat */}
            <section>
              <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                <Calendar className="w-4 h-4 mr-2" />
                Tarih & Saat
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Tarih</label>
                  <input
                    type="date"
                    value={formData.appointmentDate}
                    onChange={(e) => update('appointmentDate', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Saat</label>
                  <input
                    type="time"
                    value={formData.appointmentTime}
                    onChange={(e) => update('appointmentTime', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>
            </section>

            {/* Hizmet */}
            <section>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Hizmet</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Kategori</label>
                  <input type="text" value={formData.serviceCategory} onChange={(e) => update('serviceCategory', e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Görev tipi</label>
                  <input type="text" value={formData.taskType} onChange={(e) => update('taskType', e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Hizmet tipi</label>
                  <input type="text" value={formData.serviceType} onChange={(e) => update('serviceType', e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Süre (dk)</label>
                  <input type="number" min={1} value={formData.serviceDuration} onChange={(e) => update('serviceDuration', e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Hizmet fiyatı (₺)</label>
                  <input type="number" step="0.01" min={0} value={formData.servicePrice} onChange={(e) => update('servicePrice', e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Toplam (₺)</label>
                  <input type="number" step="0.01" min={0} value={formData.totalPrice} onChange={(e) => update('totalPrice', e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">İndirim (₺)</label>
                  <input type="number" step="0.01" min={0} value={formData.discount} onChange={(e) => update('discount', e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Kullanılan puan</label>
                  <input type="number" min={0} value={formData.pointsUsed} onChange={(e) => update('pointsUsed', e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Kişi sayısı</label>
                  <input type="number" min={1} value={formData.personCount} onChange={(e) => update('personCount', e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
                </div>
              </div>
            </section>

            {/* Alt hizmetler (services) */}
            <section>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-gray-700">Alt hizmetler</h3>
                <button type="button" onClick={addService} className="text-sm text-primary-600 hover:underline flex items-center">
                  <Plus className="w-4 h-4 mr-1" /> Ekle
                </button>
              </div>
              <div className="space-y-2">
                {(formData.services || []).map((s, idx) => (
                  <div key={idx} className="flex flex-wrap items-end gap-2 p-2 bg-gray-50 rounded-lg">
                    <input type="text" value={s.serviceType} onChange={(e) => updateService(idx, 'serviceType', e.target.value)} placeholder="Hizmet" className="w-32 px-2 py-1 border rounded text-sm" />
                    <input type="number" value={s.serviceDuration} onChange={(e) => updateService(idx, 'serviceDuration', e.target.value)} placeholder="Dk" className="w-16 px-2 py-1 border rounded text-sm" />
                    <input type="number" step="0.01" value={s.servicePrice} onChange={(e) => updateService(idx, 'servicePrice', e.target.value)} placeholder="₺" className="w-20 px-2 py-1 border rounded text-sm" />
                    <input type="number" min={0} value={s.personIndex} onChange={(e) => updateService(idx, 'personIndex', e.target.value)} placeholder="Kişi" className="w-14 px-2 py-1 border rounded text-sm" />
                    <button type="button" onClick={() => removeService(idx)} className="text-red-600">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </section>

            {/* Durum & Hızlı işlemler */}
            <section>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Durum</h3>
              <div className="flex flex-wrap gap-2 mb-3">
                <button type="button" onClick={() => setStatus('cancelled')} className="px-3 py-1.5 bg-red-100 text-red-800 rounded-lg text-sm hover:bg-red-200">
                  İptal
                </button>
                <button type="button" onClick={() => setStatus('completed')} className="px-3 py-1.5 bg-green-100 text-green-800 rounded-lg text-sm hover:bg-green-200">
                  Tamamlandı
                </button>
                <button type="button" onClick={() => setStatus('approved')} className="px-3 py-1.5 bg-blue-100 text-blue-800 rounded-lg text-sm hover:bg-blue-200">
                  Onaylandı
                </button>
                <button type="button" onClick={() => setStatus('pending')} className="px-3 py-1.5 bg-yellow-100 text-yellow-800 rounded-lg text-sm hover:bg-yellow-200">
                  Beklemede
                </button>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Durum</label>
                <select value={formData.status} onChange={(e) => update('status', e.target.value)} className="w-full px-3 py-2 border rounded-lg">
                  {STATUS_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <label className="flex items-center gap-2 mt-2">
                <input type="checkbox" checked={formData.isApproved} onChange={(e) => update('isApproved', e.target.checked)} className="rounded" />
                <span className="text-sm">Onaylı</span>
              </label>
              {formData.status === 'cancelled' && (
                <div className="mt-2">
                  <label className="block text-sm text-gray-600 mb-1">İptal nedeni</label>
                  <input type="text" value={formData.cancellationReason} onChange={(e) => update('cancellationReason', e.target.value)} className="w-full px-3 py-2 border rounded-lg" placeholder="İsteğe bağlı" />
                </div>
              )}
            </section>

            {/* Ödeme alındı & Ödeme tipi */}
            <section>
              <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                <DollarSign className="w-4 h-4 mr-2" />
                Ödeme
              </h3>
              <label className="flex items-center gap-2 mb-2">
                <input type="checkbox" checked={formData.paymentReceived} onChange={(e) => setPaymentReceived(e.target.checked)} className="rounded" />
                <span className="text-sm font-medium">Ödeme alındı</span>
              </label>
              {formData.paymentReceived && (
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Ödeme tipi</label>
                  <select value={formData.paymentMethod} onChange={(e) => update('paymentMethod', e.target.value)} className="w-full px-3 py-2 border rounded-lg">
                    {PAYMENT_METHOD_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
              )}
            </section>

            {/* Notlar */}
            <section>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Notlar</label>
              <textarea value={formData.notes} onChange={(e) => update('notes', e.target.value)} rows={2} className="w-full px-3 py-2 border rounded-lg" />
            </section>
          </div>

          <div className="p-4 border-t flex justify-end gap-2 shrink-0">
            <button type="button" onClick={onClose} className="px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-50">
              İptal
            </button>
            <button type="submit" disabled={loading} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50">
              {loading ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
