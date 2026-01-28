# Admin Panel - Login ve Kullanıcı Yönetimi

## 🔐 Admin Login Sistemi

Admin panel OTP (One-Time Password) tabanlı giriş sistemi kullanmaktadır.

### Giriş Adımları

1. **Telefon Numarası Girin**
   - Admin paneline giriş sayfasında telefon numaranızı girin
   - Format: `5XXXXXXXXX` (10 haneli)

2. **OTP Kodu Alın**
   - "OTP Kodu Gönder" butonuna tıklayın
   - Telefon numaranıza 6 haneli bir kod gönderilir
   - Kod 10 dakika geçerlidir

3. **OTP Kodunu Girin**
   - Gelen 6 haneli kodu girin
   - "Giriş Yap" butonuna tıklayın

### ⚠️ Önemli Notlar

- **Sadece admin kullanıcılar** admin paneline giriş yapabilir
- Normal kullanıcılar (user, company, employee) admin paneline erişemez
- Admin kullanıcı tipi: `userType: 'admin'`

## 👤 İlk Admin Kullanıcı Oluşturma

### Yöntem 1: Script ile (Önerilen)

```bash
cd backendBakimla
node scripts/createAdmin.js
```

Veya parametrelerle:

```bash
node scripts/createAdmin.js "Admin" "User" "admin@bakimla.com" "5551234567" "male" "1234"
```

**Parametreler:**
1. Ad (varsayılan: "Admin")
2. Soyad (varsayılan: "User")
3. Email (varsayılan: "admin@bakimla.com")
4. Telefon (varsayılan: "5551234567")
5. Cinsiyet: male/female/other (varsayılan: "male")
6. Şifre (varsayılan: "1234")

### Yöntem 2: MongoDB'den Manuel Oluşturma

MongoDB'de User koleksiyonuna şu şekilde bir doküman ekleyin:

```javascript
{
  firstName: "Admin",
  lastName: "User",
  email: "admin@bakimla.com",
  phoneNumber: "5551234567",
  gender: "male",
  password: "$2a$10$...", // bcrypt hash'lenmiş şifre
  userType: "admin",
  isApproved: true
}
```

**Şifre Hash'leme:**
```javascript
const bcrypt = require('bcrypt');
const hashedPassword = await bcrypt.hash('1234', 10);
```

### Yöntem 3: API ile Oluşturma (Gelecekte)

Admin kullanıcı oluşturma için özel bir endpoint eklenebilir.

## 🔒 Güvenlik

1. **Admin Middleware Kontrolü**
   - Tüm admin endpoint'leri `adminMiddleware` ile korunur
   - Sadece `userType: 'admin'` olan kullanıcılar erişebilir

2. **OTP Güvenliği**
   - OTP kodları 10 dakika geçerlidir
   - 5 başarısız denemeden sonra OTP iptal edilir
   - Her OTP sadece bir kez kullanılabilir

3. **Token Yönetimi**
   - JWT token'lar kullanılır
   - Token localStorage'da saklanır
   - 401 hatası durumunda otomatik logout

## 📋 Mevcut Admin Kullanıcıları

Mevcut admin kullanıcılarını görmek için:

```javascript
// MongoDB'de
db.users.find({ userType: 'admin' })
```

## 🛠️ Sorun Giderme

### "Bu panele erişim için admin yetkisi gereklidir" Hatası

- Kullanıcının `userType` değeri `'admin'` olmalıdır
- MongoDB'de kullanıcıyı kontrol edin:
  ```javascript
  db.users.findOne({ phoneNumber: "5551234567" })
  ```

### OTP Kodu Gelmiyor

- Telefon numarası formatını kontrol edin (10 haneli olmalı)
- SMS servisinin çalıştığından emin olun
- Development modunda OTP kodu response'da dönebilir
- **Geliştirme modu:** OTP olarak **001234** kullanabilirsiniz (şifre: 1234)

### Token Geçersiz Hatası

- Token'ın süresi dolmuş olabilir
- localStorage'ı temizleyip tekrar giriş yapın
- Token'ın doğru formatta gönderildiğinden emin olun

## 📝 Notlar

- Admin kullanıcılar için `isApproved` otomatik olarak `true` olarak ayarlanır
- Admin kullanıcılar `companyId` gerektirmez
- Admin kullanıcılar normal kullanıcı endpoint'lerine de erişebilir (gerekirse)

