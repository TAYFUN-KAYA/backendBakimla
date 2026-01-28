/**
 * Sektör Tipleri – businessField key ile eşleşir
 * BakimlaBusinessV2 ile senkron
 */

export const SECTORS = {
  ERKEK_KUAFOR: {
    id: 1,
    name: "Erkek Kuaförü",
    key: "erkek_kuafor",
    employeeTypes: ["Berber", "Usta Berber", "Kalfa", "Çırak"],
    services: [
      "Saç Kesimi",
      "Sakal Tıraşı",
      "Saç + Sakal",
      "Çocuk Saç Kesimi",
      "Saç Yıkama",
      "Saç Şekillendirme",
      "Fön",
      "Keratin Bakımı",
      "Saç Boyama",
      "Saç Ağartma",
      "Perma",
      "Cilt Bakımı",
      "Kaş Alma",
      "Kulak Burun Kılı Temizleme",
      "Maske Bakımı",
    ],
  },

  KADIN_KUAFOR: {
    id: 2,
    name: "Kadın Kuaförü",
    key: "kadin_kuafor",
    employeeTypes: ["Kuaför", "Saç Stilisti", "Renklendirme Uzmanı", "Kalfa", "Çırak"],
    services: [
      "Saç Kesimi",
      "Fön",
      "Maşa",
      "Saç Boyama",
      "Dip Boya",
      "Ombre",
      "Sombre",
      "Balayage",
      "Saç Açma",
      "Keratin Bakımı",
      "Brezilya Fönü",
      "Perma",
      "Topuz",
      "Gelin Saçı",
      "Nişan Saçı",
      "Kaş Alma",
      "Saç Bakımı",
      "Saç Yıkama",
    ],
  },

  UNISEX_KUAFOR: {
    id: 3,
    name: "Unisex Kuaför Salonu",
    key: "unisex_kuafor",
    employeeTypes: ["Kuaför", "Berber", "Saç Stilisti", "Renklendirme Uzmanı", "Kalfa", "Çırak"],
    services: [
      "Saç Kesimi",
      "Saç Yıkama",
      "Saç Şekillendirme",
      "Fön",
      "Keratin Bakımı",
      "Perma",
      "Saç Boyama",
      "Kaş Alma",
      "Cilt Bakımı",
      "Sakal Tıraşı",
      "Saç + Sakal",
      "Çocuk Saç Kesimi",
      "Saç Ağartma",
      "Kulak Burun Kılı Temizleme",
      "Maske Bakımı",
      "Maşa",
      "Dip Boya",
      "Ombre",
      "Sombre",
      "Balayage",
      "Saç Açma",
      "Brezilya Fönü",
      "Topuz",
      "Gelin Saçı",
      "Nişan Saçı",
      "Saç Bakımı",
    ],
  },

  GUZELLIK_MERKEZI: {
    id: 4,
    name: "Güzellik Merkezi",
    key: "guzellik_merkezi",
    employeeTypes: ["Estetisyen", "Güzellik Uzmanı", "Cilt Bakım Uzmanı", "Lazer Epilasyon Uzmanı", "Kalıcı Makyaj Uzmanı"],
    services: [
      "Cilt Bakımı",
      "Derin Cilt Temizliği",
      "Hydrafacial",
      "Lazer Epilasyon",
      "İğneli Epilasyon",
      "Bölgesel İncelme",
      "Selülit Tedavisi",
      "Kirpik Lifting",
      "Kirpik Perması",
      "Kaş Laminasyonu",
      "Kaş Tasarımı",
      "Kalıcı Makyaj",
      "Microblading",
      "BB Glow",
      "G5 Masajı",
    ],
  },

  TIRNAK_SALONU: {
    id: 5,
    name: "Tırnak Salonu",
    key: "tirnak_salonu",
    employeeTypes: ["Nail Artist", "Tırnak Uzmanı", "Manikürist", "Pedikürist"],
    services: [
      "Manikür",
      "Pedikür",
      "Klasik Manikür",
      "Klasik Pedikür",
      "Jel Tırnak",
      "Akrilik Tırnak",
      "Protez Tırnak",
      "Kalıcı Oje",
      "Nail Art",
      "Tırnak Bakımı",
      "Tırnak Güçlendirme",
      "Tırnak Onarımı",
    ],
  },

  MASAJ_SALONU: {
    id: 6,
    name: "Masaj Salonu",
    key: "masaj_salonu",
    employeeTypes: ["Masör", "Masöz", "Masaj Terapisti", "Fizyoterapist"],
    services: [
      "Klasik Masaj",
      "Aromaterapi Masajı",
      "Spor Masajı",
      "Derin Doku Masajı",
      "Thai Masajı",
      "Refleksoloji",
      "Medikal Masaj",
      "Relax Masaj",
      "Sıcak Taş Masajı",
      "Lenf Drenaj Masajı",
      "Bölgesel Masaj",
    ],
  },

  MAKYAJ_UZMANI: {
    id: 7,
    name: "Makyaj Uzmanı",
    key: "makyaj_uzmani",
    employeeTypes: ["Makyaj Uzmanı", "Profesyonel Makeup Artist", "Gelin Makyaj Uzmanı", "Estetisyen"],
    services: [
      "Günlük Makyaj",
      "Gece Makyajı",
      "Profesyonel Makyaj",
      "Gelin Makyajı",
      "Nişan Makyajı",
      "Kına Makyajı",
      "Fotoğraf Çekimi Makyajı",
      "Podyum Makyajı",
      "Özel Gün Makyajı",
    ],
  },
};

/**
 * businessField (key) ile sektör döner
 */
export const getSectorByKey = (key) => {
  if (!key) return null;
  return Object.values(SECTORS).find((s) => s.key === key) || null;
};

/**
 * businessField select için { value, label } listesi
 */
export const getBusinessFieldOptions = () =>
  Object.values(SECTORS).map((s) => ({ value: s.key, label: s.name }));
