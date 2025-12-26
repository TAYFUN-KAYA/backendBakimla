# Bakimla Admin Panel

Bakimla yönetim paneli - Vite + React

## Kurulum

```bash
npm install
```

## Geliştirme

```bash
npm run dev
```

Admin panel `http://localhost:3002` adresinde çalışacaktır.

## Yapı

- **src/pages/** - Sayfa bileşenleri
- **src/components/** - Yeniden kullanılabilir bileşenler
- **src/services/** - API servisleri
- **src/layouts/** - Layout bileşenleri
- **src/utils/** - Yardımcı fonksiyonlar

## Özellikler

- Dashboard (İstatistikler)
- Kullanıcı Yönetimi
- İşletme Yönetimi
- Randevu Yönetimi
- Ödeme Yönetimi
- Sipariş Yönetimi
- Cüzdan Yönetimi
- Para Çekme Talepleri
- Ürün Yönetimi
- Yorum Yönetimi
- Çalışan Onaylama

## Environment Variables

`.env` dosyası oluşturun:

```env
VITE_API_URL=http://localhost:3001/api
```

