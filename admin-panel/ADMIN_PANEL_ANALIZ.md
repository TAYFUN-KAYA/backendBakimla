# Admin Panel - Backend Model Bağlantı Analizi

## ✅ Şu Anda Bağlı Modeller

Admin panel şu anda aşağıdaki modellere bağlı ve çalışıyor:

1. **User** - Kullanıcılar (müşteri, işletme, çalışan)
2. **Store** - İşletmeler
3. **Appointment** - Randevular
4. **Payment** - Ödemeler
5. **Order** - Siparişler
6. **Wallet** - Cüzdanlar
7. **WithdrawalRequest** - Para çekme talepleri
8. **Product** - Ürünler
9. **Review** - Yorumlar/Değerlendirmeler

## ❌ Backend'de Var Ama Admin Panelde Eksik Modeller

Aşağıdaki modeller backend'de mevcut ancak admin panelde yönetim sayfaları/endpoint'leri yok:

### 1. **Accounting** (Muhasebe) ⚠️ ÖNEMLİ
- **Açıklama**: İşletmelerin gelir/gider kayıtları
- **Kullanım**: Finansal takip ve raporlama için kritik
- **Önerilen Endpoint**: 
  - `GET /admin/accounting` - Tüm muhasebe kayıtları
  - `GET /admin/accounting/stats` - Muhasebe istatistikleri

### 2. **Campaign** (Kampanyalar) ⚠️ ÖNEMLİ
- **Açıklama**: İşletmelerin oluşturduğu kampanyalar
- **Kullanım**: Kampanya yönetimi ve takibi
- **Önerilen Endpoint**: 
  - `GET /admin/campaigns` - Tüm kampanyalar
  - `PUT /admin/campaigns/:id/toggle-active` - Kampanya aktif/pasif

### 3. **Coupon** (Kuponlar) ⚠️ ÖNEMLİ
- **Açıklama**: İndirim kuponları
- **Kullanım**: Kupon yönetimi ve kullanım takibi
- **Önerilen Endpoint**: 
  - `GET /admin/coupons` - Tüm kuponlar
  - `PUT /admin/coupons/:id/toggle-active` - Kupon aktif/pasif

### 4. **Customer** (Müşteriler) ⚠️ ÖNEMLİ
- **Açıklama**: İşletmelerin müşteri kayıtları
- **Kullanım**: Müşteri yönetimi
- **Önerilen Endpoint**: 
  - `GET /admin/customers` - Tüm müşteriler
  - `GET /admin/customers/:companyId` - İşletmeye özel müşteriler

### 5. **Notification** (Bildirimler) ⚠️ ÖNEMLİ
- **Açıklama**: Sistem bildirimleri
- **Kullanım**: Bildirim yönetimi ve takibi
- **Önerilen Endpoint**: 
  - `GET /admin/notifications` - Tüm bildirimler
  - `GET /admin/notifications/stats` - Bildirim istatistikleri

### 6. **Form** (İletişim Formları) ⚠️ ÖNEMLİ
- **Açıklama**: İletişim formu gönderileri
- **Kullanım**: Form mesajlarını görüntüleme ve yönetme
- **Önerilen Endpoint**: 
  - `GET /admin/forms` - Tüm form gönderileri
  - `PUT /admin/forms/:id/mark-read` - Okundu olarak işaretle

### 7. **Invoice** (Faturalar) ⚠️ ÖNEMLİ
- **Açıklama**: Paraşüt üzerinden oluşturulan faturalar
- **Kullanım**: Fatura yönetimi ve takibi
- **Önerilen Endpoint**: 
  - `GET /admin/invoices` - Tüm faturalar
  - `GET /admin/invoices/:id` - Fatura detayı

### 8. **Points** (Puanlar) ⚠️ ÖNEMLİ
- **Açıklama**: Kullanıcı puan sistemi
- **Kullanım**: Puan takibi ve yönetimi
- **Önerilen Endpoint**: 
  - `GET /admin/points` - Tüm puan kayıtları
  - `GET /admin/points/transactions` - Puan işlem geçmişi

### 9. **Address** (Adresler)
- **Açıklama**: Kullanıcı adresleri
- **Kullanım**: Adres yönetimi (düşük öncelik)
- **Önerilen Endpoint**: 
  - `GET /admin/addresses` - Tüm adresler

## 🔧 Önerilen İyileştirmeler

### Yüksek Öncelikli (Kritik İş Modelleri)
1. **Accounting** - Finansal raporlama için gerekli
2. **Campaign** - Pazarlama yönetimi için gerekli
3. **Coupon** - İndirim yönetimi için gerekli
4. **Invoice** - Fatura takibi için gerekli
5. **Form** - İletişim yönetimi için gerekli

### Orta Öncelikli
6. **Customer** - Müşteri yönetimi
7. **Notification** - Bildirim takibi
8. **Points** - Puan sistemi yönetimi

### Düşük Öncelikli
9. **Address** - Adres yönetimi (genelde kullanıcı bazlı)

## 📋 Mevcut Admin Controller Fonksiyonları

`adminController.js` dosyasında şu fonksiyonlar mevcut:
- ✅ getDashboardStats
- ✅ getAllUsers
- ✅ getAllStores
- ✅ getStoreDetails
- ✅ getAllAppointments
- ✅ getAllPayments
- ✅ getAllOrders
- ✅ getAllWallets
- ✅ getAllWithdrawalRequests
- ✅ processWithdrawalRequest
- ✅ getAllProducts
- ✅ getAllReviews
- ✅ toggleReviewPublish
- ✅ getPendingEmployees
- ✅ getAllEmployees
- ✅ approveEmployee
- ✅ rejectEmployee

## 🎯 Sonuç

**Toplam Backend Modelleri**: 21
**Admin Panelde Bağlı**: 9
**Eksik Modeller**: 12

**Önerilen Aksiyon**: Yukarıdaki yüksek öncelikli modeller için admin endpoint'leri ve frontend sayfaları eklenmeli.

