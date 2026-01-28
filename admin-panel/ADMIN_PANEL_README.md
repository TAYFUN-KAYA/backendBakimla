# Bakimla Admin Panel

Vite + React ile geliştirilmiş kapsamlı admin paneli. Tüm backend modelleri için CRUD işlemleri yapabilirsiniz.

## Özellikler

- ✅ Tüm modeller için CRUD işlemleri (Create, Read, Update, Delete)
- ✅ Arama ve filtreleme
- ✅ Sayfalama (Pagination)
- ✅ Responsive tasarım
- ✅ Modern UI/UX (Tailwind CSS)
- ✅ Toast bildirimleri
- ✅ Authentication ve Authorization

## Kurulum

```bash
cd admin-panel
npm install
npm run dev
```

## Kullanılabilir Modeller

### Ana Modeller
- **Users** - Kullanıcılar
- **Stores** - İşletmeler
- **Appointments** - Randevular
- **Quick Appointments** - Hızlı Randevular
- **Payments** - Ödemeler
- **Payment Methods** - Ödeme Yöntemleri
- **Orders** - Siparişler
- **Wallets** - Cüzdanlar
- **Withdrawal Requests** - Para Çekme Talepleri
- **Products** - Ürünler
- **Baskets** - Sepetler
- **Favorites** - Favoriler
- **Reviews** - Yorumlar
- **Employees** - Çalışanlar
- **Customers** - Müşteriler

### Kampanya ve Kupon Modelleri
- **Campaigns** - Kampanyalar
- **Coupons** - Kuponlar
- **Bakimla Store Coupons** - Bakimla Store Kuponları
- **User Campaigns** - Kullanıcı Kampanyaları
- **User Coupons** - Kullanıcı Kuponları
- **User Favorite Stores** - Kullanıcı Favori İşletmeleri

### Diğer Modeller
- **Addresses** - Adresler
- **Notifications** - Bildirimler
- **Services** - Hizmetler
- **Invoices** - Faturalar
- **Points** - Puanlar
- **Rewards** - Ödüller
- **Accounting** - Muhasebe
- **Forms** - Formlar
- **Business Home Ads** - İşletme Ana Sayfa Reklamları
- **Client Home Ads** - Müşteri Ana Sayfa Reklamları
- **Client Center Ads** - Müşteri Merkez Reklamları

## API Endpoints

Tüm endpoint'ler `/api/admin/` prefix'i ile başlar:

- `GET /api/admin/{model}` - Tüm kayıtları listele
- `GET /api/admin/{model}/:id` - Tek kayıt getir
- `POST /api/admin/{model}` - Yeni kayıt oluştur
- `PUT /api/admin/{model}/:id` - Kayıt güncelle
- `DELETE /api/admin/{model}/:id` - Kayıt sil

Örnek:
- `GET /api/admin/campaigns` - Tüm kampanyaları listele
- `GET /api/admin/campaigns/:id` - Kampanya detayı
- `POST /api/admin/campaigns` - Yeni kampanya oluştur
- `PUT /api/admin/campaigns/:id` - Kampanya güncelle
- `DELETE /api/admin/campaigns/:id` - Kampanya sil

## Generic CRUD Component

`GenericModelList` component'i tüm modeller için kullanılabilir:

```jsx
<GenericModelList
  title="Kampanyalar"
  service={adminService.campaigns}
  columns={columns}
  getRowData={getRowData}
  searchFields={['title', 'description']}
  filters={[...]}
  onEdit={(item) => {...}}
  onCreate={() => {...}}
  onDelete={true}
/>
```

## Environment Variables

`.env` dosyası oluşturun:

```
VITE_API_URL=http://localhost:3001/api
```

## Authentication

Admin paneli için admin kullanıcısı ile giriş yapmanız gerekmektedir. Token localStorage'da saklanır.

## Yapı

```
admin-panel/
├── src/
│   ├── components/
│   │   ├── GenericModelList.jsx    # Generic CRUD component
│   │   └── modals/
│   │       └── CampaignModal.jsx  # Örnek modal
│   ├── layouts/
│   │   └── Layout.jsx              # Ana layout
│   ├── pages/
│   │   ├── Dashboard.jsx
│   │   ├── Users.jsx
│   │   ├── Campaigns.jsx
│   │   └── ...                     # Tüm model sayfaları
│   ├── services/
│   │   ├── api.js                  # Axios instance
│   │   ├── adminService.js         # Admin API servisleri
│   │   └── authService.js          # Auth servisleri
│   └── App.jsx                     # Ana app component
```

## Backend Generic Controller

Backend'de `adminGenericController.js` tüm modeller için generic CRUD işlemleri sağlar. Her model için otomatik olarak:

- Pagination
- Search
- Filtering
- Sorting
- Population (ilişkili veriler)

## Notlar

- Tüm endpoint'ler `adminMiddleware` ile korunmaktadır
- Generic controller otomatik olarak populate işlemleri yapar
- Search alanları model'e göre otomatik belirlenir
- Date formatları otomatik formatlanır
