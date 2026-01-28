import { useState, useEffect } from 'react';
import { X, Plus, Trash2, Upload } from 'lucide-react';
import { adminService } from '../../services/adminService';
import toast from 'react-hot-toast';
import { PRODUCT_CATEGORIES, getAllCategoryValues } from '../../constants/productCategories';

const emptyForm = () => ({
  companyId: '',
  name: '',
  description: '',
  shortDescription: '',
  price: '',
  discountPrice: '',
  discountPercent: '',
  category: '',
  subCategory: '',
  brand: '',
  imagesText: '',
  stock: 0,
  options: [],
  freeShipping: false,
  shippingCost: 0,
  estimatedDelivery: '2-4 iş günü',
  returnable: true,
  returnDays: 14,
  returnDescription: 'Ücretsiz iade',
  ratingAverage: 0,
  ratingCount: 0,
  targetGender: 'mix',
  isActive: true,
  isPublished: false,
  isFeatured: false,
  soldCount: 0,
});

const productToForm = (p) => {
  if (!p) return emptyForm();
  return {
    companyId: p.companyId?._id || p.companyId || '',
    name: p.name || '',
    description: p.description || '',
    shortDescription: p.shortDescription || '',
    price: p.price ?? '',
    discountPrice: p.discountPrice ?? '',
    discountPercent: p.discountPercent ?? '',
    category: p.category || '',
    subCategory: p.subCategory || '',
    brand: p.brand || '',
    imagesText: (p.images || []).join('\n'),
    stock: p.stock ?? 0,
    options: (p.options || []).map((o) => ({ name: o.name || '', values: (o.values || []).join(', ') })),
    freeShipping: p.shippingInfo?.freeShipping ?? false,
    shippingCost: p.shippingInfo?.shippingCost ?? 0,
    estimatedDelivery: p.shippingInfo?.estimatedDelivery || '2-4 iş günü',
    returnable: p.returnPolicy?.returnable ?? true,
    returnDays: p.returnPolicy?.returnDays ?? 14,
    returnDescription: p.returnPolicy?.returnDescription || 'Ücretsiz iade',
    ratingAverage: p.rating?.average ?? 0,
    ratingCount: p.rating?.count ?? 0,
    targetGender: p.targetGender || 'mix',
    isActive: p.isActive !== undefined ? p.isActive : true,
    isPublished: p.isPublished ?? false,
    isFeatured: p.isFeatured ?? false,
    soldCount: p.soldCount ?? 0,
  };
};

const formToPayload = (f) => {
  const payload = {
    companyId: f.companyId || null,
    name: f.name || undefined,
    description: f.description || undefined,
    shortDescription: f.shortDescription || undefined,
    price: f.price === '' ? undefined : parseFloat(f.price),
    discountPrice: f.discountPrice === '' ? undefined : parseFloat(f.discountPrice),
    discountPercent: f.discountPercent === '' ? undefined : parseFloat(f.discountPercent),
    category: f.category || undefined,
    subCategory: f.subCategory || undefined,
    brand: f.brand || undefined,
    images: f.imagesText ? f.imagesText.split('\n').map((u) => u.trim()).filter(Boolean) : [],
    stock: typeof f.stock === 'number' ? f.stock : parseInt(f.stock, 10) || 0,
    options: (f.options || [])
      .filter((o) => (o.name || '').trim())
      .map((o) => ({
        name: (o.name || '').trim(),
        values: (o.values || '').split(',').map((v) => v.trim()).filter(Boolean),
      }))
      .filter((o) => o.values.length > 0),
    shippingInfo: {
      freeShipping: !!f.freeShipping,
      shippingCost: parseFloat(f.shippingCost) || 0,
      estimatedDelivery: f.estimatedDelivery || '2-4 iş günü',
    },
    returnPolicy: {
      returnable: !!f.returnable,
      returnDays: parseInt(f.returnDays, 10) || 14,
      returnDescription: f.returnDescription || 'Ücretsiz iade',
    },
    rating: {
      average: parseFloat(f.ratingAverage) || 0,
      count: parseInt(f.ratingCount, 10) || 0,
    },
    targetGender: f.targetGender || 'mix',
    isActive: !!f.isActive,
    isPublished: !!f.isPublished,
    isFeatured: !!f.isFeatured,
    soldCount: parseInt(f.soldCount, 10) || 0,
  };
  return payload;
};

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export default function ProductModal({ productId, companies, onClose, onSave }) {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(!!productId);
  const [formData, setFormData] = useState(emptyForm());
  const [pendingFiles, setPendingFiles] = useState([]);

  useEffect(() => {
    setPendingFiles([]);
    if (productId) {
      setFetching(true);
      adminService
        .getProductById(productId)
        .then((res) => {
          if (res.data?.success && res.data?.data) {
            setFormData(productToForm(res.data.data));
          }
        })
        .catch(() => toast.error('Ürün yüklenemedi'))
        .finally(() => setFetching(false));
    } else {
      setFormData(emptyForm());
    }
  }, [productId]);

  const update = (key, value) => setFormData((prev) => ({ ...prev, [key]: value }));

  const updateOption = (index, key, value) => {
    setFormData((prev) => {
      const arr = [...(prev.options || [])];
      arr[index] = { ...(arr[index] || {}), [key]: value };
      return { ...prev, options: arr };
    });
  };

  const addOption = () => {
    setFormData((prev) => ({ ...prev, options: [...(prev.options || []), { name: '', values: '' }] }));
  };

  const removeOption = (index) => {
    setFormData((prev) => ({
      ...prev,
      options: (prev.options || []).filter((_, i) => i !== index),
    }));
  };

  const addFiles = (e) => {
    const files = Array.from(e.target.files || []);
    for (const f of files) {
      if (f.size > MAX_FILE_SIZE) {
        toast.error(`"${f.name}" 5MB'dan büyük, atlandı`);
        continue;
      }
      setPendingFiles((prev) => [...prev, f]);
    }
    e.target.value = '';
  };

  const removePending = (idx) => setPendingFiles((prev) => prev.filter((_, i) => i !== idx));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.category) {
      toast.error('Ürün adı ve kategori zorunludur');
      return;
    }
    const price = formData.price === '' ? NaN : parseFloat(formData.price);
    if (isNaN(price) || price < 0) {
      toast.error('Geçerli bir fiyat girin');
      return;
    }
    setLoading(true);
    try {
      const uploadedUrls = [];
      for (const file of pendingFiles) {
        try {
          const res = await adminService.uploadImage(file, 'products');
          if (res.data?.url) uploadedUrls.push(res.data.url);
        } catch (err) {
          toast.error(`"${file.name}" yüklenemedi`);
        }
      }
      const fromTextarea = (formData.imagesText || '')
        .split('\n')
        .map((u) => u.trim())
        .filter(Boolean);
      const payload = formToPayload(formData);
      payload.images = [...uploadedUrls, ...fromTextarea];

      if (productId) {
        await adminService.updateProduct(productId, payload);
        toast.success('Ürün güncellendi');
      } else {
        await adminService.createProduct(payload);
        toast.success('Ürün oluşturuldu');
      }
      onSave();
    } catch (err) {
      console.error('Product save error:', err);
      toast.error(err.response?.data?.message || 'Kayıt işlemi başarısız');
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

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b shrink-0">
          <h2 className="text-xl font-bold text-gray-800">
            {productId ? 'Ürünü Düzenle' : 'Yeni Ürün'}
          </h2>
          <button type="button" onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="p-4 overflow-y-auto space-y-4 flex-1">
            {/* Temel */}
            <section>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Temel bilgiler</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-sm text-gray-600 mb-1">İşletme (boş = Kozmetik mağaza, admin ürünü)</label>
                  <select
                    value={formData.companyId}
                    onChange={(e) => update('companyId', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">Kozmetik mağaza (Admin) – işletmesiz</option>
                    {(companies || []).map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.firstName} {c.lastName} {c.email ? `(${c.email})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm text-gray-600 mb-1">Ürün adı *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => update('name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Kategori *</label>
                  <select
                    required
                    value={formData.category}
                    onChange={(e) => update('category', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">Kategori seçin</option>
                    {productId && formData.category && !getAllCategoryValues().includes(formData.category) && (
                      <optgroup label="— Önceki değer —">
                        <option value={formData.category}>{formData.category}</option>
                      </optgroup>
                    )}
                    {PRODUCT_CATEGORIES.map((g) => (
                      <optgroup key={g.group} label={g.group}>
                        {g.items.map((item) => (
                          <option key={item} value={item}>
                            {item}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Alt kategori</label>
                  <input
                    type="text"
                    value={formData.subCategory}
                    onChange={(e) => update('subCategory', e.target.value)}
                    placeholder="İsteğe bağlı"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Marka</label>
                  <input
                    type="text"
                    value={formData.brand}
                    onChange={(e) => update('brand', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Cinsiyet (targetGender)</label>
                  <select
                    value={formData.targetGender}
                    onChange={(e) => update('targetGender', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="woman">Kadın</option>
                    <option value="man">Erkek</option>
                    <option value="mix">Unisex</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm text-gray-600 mb-1">Kısa açıklama</label>
                  <input
                    type="text"
                    value={formData.shortDescription}
                    onChange={(e) => update('shortDescription', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm text-gray-600 mb-1">Açıklama</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => update('description', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
            </section>

            {/* Fiyat & Stok */}
            <section>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Fiyat & stok</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Fiyat (TRY) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => update('price', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">İndirimli fiyat</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.discountPrice}
                    onChange={(e) => update('discountPrice', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">İndirim %</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={formData.discountPercent}
                    onChange={(e) => update('discountPercent', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Stok</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.stock}
                    onChange={(e) => update('stock', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
            </section>

            {/* Görseller */}
            <section>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Görseller</h3>
              <div className="mb-2">
                <label className="flex items-center gap-2 cursor-pointer w-fit px-3 py-2 border border-dashed border-gray-400 rounded-lg hover:bg-gray-50 text-sm text-gray-600">
                  <Upload className="w-4 h-4" />
                  Dosyadan yükle (Oluştur/Güncelle’ye basınca S3’e yüklenecek, max 5MB)
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    multiple
                    className="hidden"
                    onChange={addFiles}
                  />
                </label>
              </div>
              {pendingFiles.length > 0 && (
                <ul className="mb-2 space-y-1">
                  {pendingFiles.map((f, i) => (
                    <li key={i} className="flex items-center justify-between text-sm text-gray-600 bg-gray-50 px-2 py-1 rounded">
                      <span className="truncate">{f.name}</span>
                      <button type="button" onClick={() => removePending(i)} className="p-1 text-red-600 hover:bg-red-50 rounded">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <div>
                <label className="block text-sm text-gray-600 mb-1">Veya URL’leri yapıştır (her satıra bir adet)</label>
                <textarea
                  value={formData.imagesText}
                  onChange={(e) => update('imagesText', e.target.value)}
                  rows={2}
                  placeholder="https://..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </section>

            {/* Seçenekler */}
            <section>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-gray-700">Seçenekler (örn. Hacim, Renk)</h3>
                <button
                  type="button"
                  onClick={addOption}
                  className="flex items-center gap-1 text-sm text-primary-600 hover:underline"
                >
                  <Plus className="w-4 h-4" /> Ekle
                </button>
              </div>
              <div className="space-y-2">
                {(formData.options || []).map((o, i) => (
                  <div key={i} className="flex gap-2 items-start">
                    <input
                      type="text"
                      placeholder="Ad (Hacim)"
                      value={o.name}
                      onChange={(e) => updateOption(i, 'name', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                    />
                    <input
                      type="text"
                      placeholder="Değerler (virgülle: 30ml, 50ml)"
                      value={o.values}
                      onChange={(e) => updateOption(i, 'values', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => removeOption(i)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </section>

            {/* Kargo */}
            <section>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Kargo</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.freeShipping}
                    onChange={(e) => update('freeShipping', e.target.checked)}
                    className="rounded border-gray-300 text-primary-600"
                  />
                  <span className="text-sm">Ücretsiz kargo</span>
                </label>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Kargo ücreti (TRY)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.shippingCost}
                    onChange={(e) => update('shippingCost', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Tahmini teslimat</label>
                  <input
                    type="text"
                    value={formData.estimatedDelivery}
                    onChange={(e) => update('estimatedDelivery', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
            </section>

            {/* İade */}
            <section>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">İade</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.returnable}
                    onChange={(e) => update('returnable', e.target.checked)}
                    className="rounded border-gray-300 text-primary-600"
                  />
                  <span className="text-sm">İade kabul</span>
                </label>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">İade süresi (gün)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.returnDays}
                    onChange={(e) => update('returnDays', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm text-gray-600 mb-1">İade açıklaması</label>
                  <input
                    type="text"
                    value={formData.returnDescription}
                    onChange={(e) => update('returnDescription', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
            </section>

            {/* Rating & satış */}
            <section>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Değerlendirme & satış</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Puan (0-5)</label>
                  <input
                    type="number"
                    min="0"
                    max="5"
                    step="0.1"
                    value={formData.ratingAverage}
                    onChange={(e) => update('ratingAverage', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Değerlendirme sayısı</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.ratingCount}
                    onChange={(e) => update('ratingCount', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Satış adedi</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.soldCount}
                    onChange={(e) => update('soldCount', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
            </section>

            {/* Bayraklar */}
            <section>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Durum</h3>
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => update('isActive', e.target.checked)}
                    className="rounded border-gray-300 text-primary-600"
                  />
                  <span className="text-sm">Aktif</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.isPublished}
                    onChange={(e) => update('isPublished', e.target.checked)}
                    className="rounded border-gray-300 text-primary-600"
                  />
                  <span className="text-sm">Yayında</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.isFeatured}
                    onChange={(e) => update('isFeatured', e.target.checked)}
                    className="rounded border-gray-300 text-primary-600"
                  />
                  <span className="text-sm">Öne çıkan</span>
                </label>
              </div>
            </section>
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
              {loading ? 'Kaydediliyor...' : productId ? 'Güncelle' : 'Oluştur'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
