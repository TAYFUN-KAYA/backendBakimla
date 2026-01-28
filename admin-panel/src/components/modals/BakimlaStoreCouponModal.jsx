import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { adminService } from '../../services/adminService';
import toast from 'react-hot-toast';

const emptyForm = () => ({
  code: '',
  name: '',
  description: '',
  discountType: 'percentage',
  discountValue: '',
  startDate: '',
  endDate: '',
  minPurchaseAmount: 0,
  usageLimit: '',
  isActive: true,
});

const couponToForm = (c) => {
  if (!c) return emptyForm();
  return {
    code: c.code || '',
    name: c.name || '',
    description: c.description || '',
    discountType: c.discountType || 'percentage',
    discountValue: c.discountValue ?? '',
    startDate: c.startDate ? new Date(c.startDate).toISOString().split('T')[0] : '',
    endDate: c.endDate ? new Date(c.endDate).toISOString().split('T')[0] : '',
    minPurchaseAmount: c.minPurchaseAmount ?? 0,
    usageLimit: c.usageLimit != null && c.usageLimit !== '' ? String(c.usageLimit) : '',
    isActive: c.isActive !== undefined ? c.isActive : true,
  };
};

const formToPayload = (f) => {
  const payload = {
    code: String(f.code || '').trim().toUpperCase(),
    name: String(f.name || '').trim(),
    description: (f.description || '').trim() || undefined,
    discountType: f.discountType || 'percentage',
    discountValue: parseFloat(f.discountValue) || 0,
    startDate: f.startDate ? new Date(f.startDate) : undefined,
    endDate: f.endDate ? new Date(f.endDate) : undefined,
    minPurchaseAmount: parseFloat(f.minPurchaseAmount) || 0,
    usageLimit: f.usageLimit === '' || f.usageLimit == null ? null : parseInt(f.usageLimit, 10),
    isActive: !!f.isActive,
  };
  return payload;
};

export default function BakimlaStoreCouponModal({ coupon, onClose, onSave }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState(emptyForm());

  useEffect(() => {
    setFormData(couponToForm(coupon));
  }, [coupon]);

  const update = (key, value) => setFormData((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.code || !formData.name) {
      toast.error('Kod ve kupon adı zorunludur');
      return;
    }
    const dVal = parseFloat(formData.discountValue);
    if (isNaN(dVal) || dVal < 0) {
      toast.error('Geçerli bir indirim değeri girin');
      return;
    }
    if (formData.discountType === 'percentage' && (dVal > 100 || dVal < 0)) {
      toast.error('Yüzde indirim 0–100 arasında olmalıdır');
      return;
    }
    if (!formData.startDate || !formData.endDate) {
      toast.error('Başlangıç ve bitiş tarihi zorunludur');
      return;
    }
    if (new Date(formData.endDate) < new Date(formData.startDate)) {
      toast.error('Bitiş tarihi başlangıçtan sonra olmalıdır');
      return;
    }
    setLoading(true);
    try {
      const payload = formToPayload(formData);
      if (coupon?._id) {
        await adminService.bakimlaStoreCoupons.update(coupon._id, payload);
        toast.success('Kupon güncellendi');
      } else {
        await adminService.bakimlaStoreCoupons.create(payload);
        toast.success('Kupon oluşturuldu');
      }
      onSave();
    } catch (err) {
      console.error('BakimlaStoreCoupon save error:', err);
      toast.error(err.response?.data?.message || 'Kayıt işlemi başarısız');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b shrink-0">
          <h2 className="text-xl font-bold text-gray-800">
            {coupon?._id ? 'Kupon Düzenle' : 'Yeni Kupon'}
          </h2>
          <button type="button" onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="p-4 overflow-y-auto space-y-4 flex-1">
            {coupon?._id && (
              <div className="text-sm text-gray-500 bg-gray-50 p-2 rounded">
                Kullanım: {coupon.usedCount ?? 0} / {coupon.usageLimit == null ? '∞' : coupon.usageLimit}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Kupon kodu *</label>
                <input
                  type="text"
                  required
                  value={formData.code}
                  onChange={(e) => update('code', e.target.value)}
                  placeholder="Örn: HOSGELDIN20"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 uppercase"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Kupon adı *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => update('name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">Açıklama</label>
              <textarea
                value={formData.description}
                onChange={(e) => update('description', e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">İndirim tipi *</label>
                <select
                  value={formData.discountType}
                  onChange={(e) => update('discountType', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                  <option value="percentage">Yüzde (%)</option>
                  <option value="amount">Sabit tutar (TL)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  İndirim değeri * {formData.discountType === 'percentage' ? '(0–100)' : '(TL)'}
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  max={formData.discountType === 'percentage' ? 100 : undefined}
                  step={formData.discountType === 'percentage' ? 1 : 0.01}
                  value={formData.discountValue}
                  onChange={(e) => update('discountValue', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Başlangıç tarihi *</label>
                <input
                  type="date"
                  required
                  value={formData.startDate}
                  onChange={(e) => update('startDate', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Bitiş tarihi *</label>
                <input
                  type="date"
                  required
                  value={formData.endDate}
                  onChange={(e) => update('endDate', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Min. alışveriş tutarı (TL)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.minPurchaseAmount}
                  onChange={(e) => update('minPurchaseAmount', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Kullanım limiti (boş = sınırsız)</label>
                <input
                  type="number"
                  min="1"
                  placeholder="Sınırsız"
                  value={formData.usageLimit}
                  onChange={(e) => update('usageLimit', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => update('isActive', e.target.checked)}
                className="rounded border-gray-300 text-primary-600"
              />
              <span className="text-sm">Aktif</span>
            </label>
          </div>

          <div className="p-4 border-t flex justify-end gap-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
            >
              {loading ? 'Kaydediliyor...' : coupon?._id ? 'Güncelle' : 'Oluştur'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
