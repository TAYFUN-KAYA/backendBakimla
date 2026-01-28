/**
 * Ürün kategorileri – admin panel ürün eklerken/düzenlerken kullanılır.
 * Her grup altındaki maddeler `category` alanına yazılır.
 */
export const PRODUCT_CATEGORIES = [
  {
    group: 'Saç Bakımı',
    items: [
      'Şampuanlar',
      'Saç Kremleri',
      'Saç Maskeleri',
      'Saç Serumu & Yağları',
      'Kepek Karşıtı Ürünler',
      'Dökülme Karşıtı Ürünler',
      'Şekillendiriciler (wax, jöle, sprey)',
    ],
  },
  {
    group: 'Cilt Bakımı',
    items: [
      'Yüz Temizleyiciler',
      'Tonikler',
      'Nemlendiriciler',
      'Serumlar',
      'Güneş Kremleri',
      'Peeling & Maskeler',
      'Akne Karşıtı Ürünler',
      'Leke Karşıtı Ürünler',
    ],
  },
  {
    group: 'Sakal & Erkek Bakımı',
    items: [
      'Sakal Yağları',
      'Sakal Şampuanları',
      'Sakal Balm & Kremleri',
      'Tıraş Köpükleri / Jelleri',
      'Tıraş Sonrası Ürünler',
    ],
  },
  {
    group: 'El, Ayak & Tırnak Bakımı',
    items: [
      'El Kremleri',
      'Ayak Bakım Kremleri',
      'Topuk Bakım Ürünleri',
      'Tırnak Güçlendiriciler',
      'Kütikül Yağları',
    ],
  },
  {
    group: 'Vücut Bakımı',
    items: [
      'Vücut Kremleri',
      'Vücut Yağları',
      'Scrub & Peeling',
      'Selülit Karşıtı Ürünler',
      'Masaj Yağları',
    ],
  },
  {
    group: 'Makyaj Ürünleri',
    items: [
      'Fondöten',
      'Kapatıcı',
      'Allık & Aydınlatıcı',
      'Maskara',
      'Ruj & Dudak Bakımı',
    ],
  },
  {
    group: 'Profesyonel Salon Ürünleri',
    items: [
      'Profesyonel Şampuanlar',
      'Saç Boyaları',
      'Oksidan & Açıcılar',
      'Keratin & Botoks Ürünleri',
      'Profesyonel Maskeler',
    ],
  },
  {
    group: 'Cihazlar & Aksesuarlar',
    items: [
      'Saç Kurutma Makineleri',
      'Düzleştirici & Maşa',
      'Tıraş Makineleri',
      'Tarak & Fırçalar',
      'Manikür – Pedikür Setleri',
    ],
  },
  {
    group: 'Doğal & Organik Ürünler',
    items: [
      'Bitkisel Yağlar',
      'Organik Şampuanlar',
      'Parabensiz Ürünler',
      'Vegan Bakım Ürünleri',
    ],
  },
  {
    group: 'Kampanyalar & Setler',
    items: [
      'Bakım Setleri',
      'Salon Özel Paketleri',
      'İndirimli Ürünler',
      'Yeni Gelenler',
    ],
  },
  {
    group: 'Hijyen & Sterilizasyon',
    items: [
      'Dezenfektanlar',
      'Tek Kullanımlık Ürünler',
      'Sterilizasyon Solüsyonları',
      'Eldiven & Maske',
    ],
  },
];

/** Tüm kategori değerlerini düz liste olarak döner (örn. select value kontrolü için) */
export function getAllCategoryValues() {
  return PRODUCT_CATEGORIES.flatMap((g) => g.items);
}
