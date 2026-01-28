import { useState, useEffect } from 'react';
import { X, Package, User, MapPin, Truck, CreditCard, Phone } from 'lucide-react';
import { adminService } from '../../services/adminService';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Sipariş Alındı' },
  { value: 'confirmed', label: 'Onaylandı' },
  { value: 'preparing', label: 'Hazırlanıyor' },
  { value: 'shipped', label: 'Kargoya Verildi' },
  { value: 'delivered', label: 'Teslim Edildi' },
  { value: 'cancelled', label: 'İptal' },
  { value: 'returned', label: 'İade' },
];

const PAYMENT_STATUS_OPTIONS = [
  { value: 'pending', label: 'Beklemede' },
  { value: 'paid', label: 'Ödendi' },
  { value: 'failed', label: 'Başarısız' },
  { value: 'refunded', label: 'İade Edildi' },
];

function formatAddress(addr) {
  if (!addr || typeof addr !== 'object') return null;
  const parts = [
    addr.title,
    [addr.addressLine1, addr.addressLine2].filter(Boolean).join(', '),
    [addr.district, addr.city].filter(Boolean).join(' / '),
    addr.postalCode,
    [addr.firstName, addr.lastName].filter(Boolean).join(' '),
  ].filter(Boolean);
  return parts.join(' · ') || null;
}

export default function OrderDetailModal({ orderId, onClose, onSave }) {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(!!orderId);
  const [order, setOrder] = useState(null);
  const [form, setForm] = useState({
    status: '',
    paymentStatus: '',
    shippingCompany: '',
    trackingNumber: '',
    notes: '',
    cancellationReason: '',
  });

  useEffect(() => {
    if (orderId) {
      setFetching(true);
      adminService
        .getOrderById(orderId)
        .then((res) => {
          if (res.data?.success && res.data?.data) {
            const o = res.data.data;
            setOrder(o);
            setForm({
              status: o.status || 'pending',
              paymentStatus: o.paymentStatus || 'pending',
              shippingCompany: o.shippingCompany || '',
              trackingNumber: o.trackingNumber || '',
              notes: o.notes || '',
              cancellationReason: o.cancellationReason || '',
            });
          }
        })
        .catch(() => toast.error('Sipariş yüklenemedi'))
        .finally(() => setFetching(false));
    } else {
      setOrder(null);
    }
  }, [orderId]);

  const updateForm = (key, value) => setForm((p) => ({ ...p, [key]: value }));

  const handleSave = async (e) => {
    e.preventDefault();
    if (!orderId) return;
    setLoading(true);
    try {
      const payload = { ...form };
      if (form.status === 'shipped' && !order.shippedAt) payload.shippedAt = new Date();
      if (form.status === 'delivered' && !order.deliveredAt) payload.deliveredAt = new Date();
      if (form.status === 'cancelled' && !order.cancelledAt) payload.cancelledAt = new Date();
      await adminService.updateOrder(orderId, payload);
      toast.success('Sipariş güncellendi');
      onSave?.();
      const res = await adminService.getOrderById(orderId);
      if (res.data?.success && res.data?.data) setOrder(res.data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Güncelleme başarısız');
    } finally {
      setLoading(false);
    }
  };

  const setStatus = (s) => updateForm('status', s);

  if (fetching) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-8">Yükleniyor...</div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
        <div className="bg-white rounded-xl p-8 shadow-xl max-w-md" onClick={(e) => e.stopPropagation()}>
          <p className="text-gray-500">Sipariş bulunamadı</p>
          <button type="button" onClick={onClose} className="mt-4 px-4 py-2 bg-gray-200 rounded-lg">
            Kapat
          </button>
        </div>
      </div>
    );
  }

  const u = order.userId;
  const ship = order.shippingAddress;
  const bill = order.billingAddress;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-800">Sipariş: {order.orderNumber}</h2>
          <button type="button" onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Hızlı durum butonları */}
          <div>
            <div className="text-sm font-medium text-gray-700 mb-2">Sipariş durumu</div>
            <div className="flex flex-wrap gap-2">
              {STATUS_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setStatus(opt.value)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                    form.status === opt.value
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSave} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sipariş durumu</label>
                <select
                  value={form.status}
                  onChange={(e) => updateForm('status', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  {STATUS_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ödeme durumu</label>
                <select
                  value={form.paymentStatus}
                  onChange={(e) => updateForm('paymentStatus', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  {PAYMENT_STATUS_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kargo firması</label>
                <input
                  type="text"
                  value={form.shippingCompany}
                  onChange={(e) => updateForm('shippingCompany', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Örn. Yurtiçi Kargo"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Takip no</label>
                <input
                  type="text"
                  value={form.trackingNumber}
                  onChange={(e) => updateForm('trackingNumber', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Kargo takip numarası"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">İptal sebebi</label>
              <input
                type="text"
                value={form.cancellationReason}
                onChange={(e) => updateForm('cancellationReason', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="İptal edildiyse sebep"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notlar</label>
              <textarea
                value={form.notes}
                onChange={(e) => updateForm('notes', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <User className="w-5 h-5 text-gray-500 mt-0.5" />
                    <div>
                      <div className="font-medium text-gray-800">
                        {u ? `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email : '-'}
                      </div>
                      {u?.email && <div className="text-sm text-gray-600">{u.email}</div>}
                      {u?.phoneNumber && <div className="text-sm text-gray-600">{u.phoneNumber}</div>}
                    </div>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="text-sm font-medium text-gray-700">Ödeme</div>
                    <div className="text-sm">
                      {order.paymentMethod === 'card' ? 'Kredi/Banka Kartı' : 'Kapıda Ödeme'} · {form.paymentStatus === 'paid' ? 'Ödendi' : form.paymentStatus || order.paymentStatus}
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <Package className="w-4 h-4" /> Ürünler
                  </div>
                  <div className="border rounded-lg divide-y">
                    {(order.items || []).map((it, i) => (
                      <div key={i} className="px-4 py-3 flex justify-between text-sm">
                        <span>{it.productName} x{it.quantity}</span>
                        <span className="font-medium">
                          {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(it.totalPrice ?? it.unitPrice * it.quantity)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>Ara toplam</div>
                  <div className="text-right">{new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(order.subtotal ?? 0)}</div>
                  {(order.discount ?? 0) > 0 && (
                    <>
                      <div>İndirim</div>
                      <div className="text-right">-{new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(order.discount)}</div>
                    </>
                  )}
                  {(order.pointsUsed ?? 0) > 0 && (
                    <>
                      <div>Kullanılan puan</div>
                      <div className="text-right">-{new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format((order.pointsUsed || 0) * 0.02)}</div>
                    </>
                  )}
                  <div>Kargo</div>
                  <div className="text-right">{new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(order.shippingCost ?? 0)}</div>
                  <div className="font-semibold">Toplam</div>
                  <div className="text-right font-semibold">{new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(order.total ?? 0)}</div>
                </div>

                <div>
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <MapPin className="w-4 h-4" /> Teslimat adresi
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg text-sm space-y-2">
                    {formatAddress(ship) && <div>{formatAddress(ship)}</div>}
                    {ship?.phoneNumber && (
                      <div className={`flex items-center gap-2 ${formatAddress(ship) ? 'pt-2 mt-2 border-t border-gray-200' : ''}`}>
                        <Phone className="w-4 h-4 text-gray-500 shrink-0" />
                        <span>Telefon: {ship.phoneNumber}</span>
                      </div>
                    )}
                    {!formatAddress(ship) && !ship?.phoneNumber && <span className="text-gray-400">-</span>}
                  </div>
                </div>

            {(form.shippingCompany || form.trackingNumber || order.shippedAt || order.deliveredAt) && (
              <div>
                <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <Truck className="w-4 h-4" /> Kargo
                </div>
                <div className="p-3 bg-gray-50 rounded-lg text-sm">
                  {(form.shippingCompany || order.shippingCompany) && <div>{form.shippingCompany || order.shippingCompany}</div>}
                  {(form.trackingNumber || order.trackingNumber) && <div>Takip: {form.trackingNumber || order.trackingNumber}</div>}
                  {order.shippedAt && <div className="text-xs text-gray-500 mt-1">Kargoya verilme: {format(new Date(order.shippedAt), 'dd.MM.yyyy HH:mm')}</div>}
                  {order.deliveredAt && <div className="text-xs text-gray-500 mt-1">Teslim: {format(new Date(order.deliveredAt), 'dd.MM.yyyy HH:mm')}</div>}
                </div>
              </div>
            )}

            <div className="text-xs text-gray-500 border-t pt-4">
              Oluşturulma: {format(new Date(order.createdAt), 'dd.MM.yyyy HH:mm')} · Son güncelleme: {format(new Date(order.updatedAt), 'dd.MM.yyyy HH:mm')}
            </div>

            <div className="flex justify-end pt-2">
              <button type="submit" disabled={loading} className="px-5 py-2.5 bg-primary-600 text-white rounded-lg font-medium disabled:opacity-50">
                {loading ? 'Kaydediliyor…' : 'Kaydet'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
