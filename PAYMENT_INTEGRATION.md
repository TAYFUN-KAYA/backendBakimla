# iyzico Ödeme Entegrasyonu

Bu dokümantasyon, projeye entegre edilen iyzico ödeme sisteminin kullanımını açıklar.

## Kurulum

### 1. Environment Variables

`.env` dosyanıza aşağıdaki değişkenleri ekleyin:

```env
# iyzico Sandbox API Keys (Test için)
IYZICO_API_KEY=sandbox-4Fvgxck7XLarL3vMR8nScET5AQ8zSzs7
IYZICO_SECRET_KEY=sandbox-yQYTye6qzDxx6oimzJblVYBZ3qd7Z9ef
IYZICO_URI=https://sandbox-api.iyzipay.com

# Production için:
# IYZICO_URI=https://api.iyzipay.com

# API ve Frontend URL'leri
API_URL=http://localhost:5000
FRONTEND_URL=http://localhost:3000
```

### 2. API Anahtarlarını Alma

1. [iyzico Sandbox](https://sandbox-merchant.iyzipay.com) hesabınıza giriş yapın
2. Sol menüden **Ayarlar > Firma Ayarları** bölümüne gidin
3. **API Anahtarı** ve **Güvenlik Anahtarı** bilgilerinizi kopyalayın
4. `.env` dosyanıza ekleyin

## API Endpoints

### 1. Ödeme Başlatma

**POST** `/api/payments/initialize`

Ödeme işlemini başlatır ve 3D Secure HTML içeriğini döndürür.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "companyId": "60f7b3b3b3b3b3b3b3b3b3b3",
  "appointmentId": "60f7b3b3b3b3b3b3b3b3b3b4", // Opsiyonel
  "buyerId": "60f7b3b3b3b3b3b3b3b3b3b5", // Opsiyonel
  "price": 100.50,
  "currency": "TRY", // Opsiyonel, default: "TRY"
  "installment": 1, // Opsiyonel, default: 1
  "buyerInfo": { // buyerId yoksa kullanılabilir
    "name": "Ahmet",
    "surname": "Yılmaz",
    "email": "ahmet@example.com",
    "phoneNumber": "+905551234567",
    "identityNumber": "11111111111",
    "city": "Istanbul",
    "country": "Turkey",
    "zipCode": "34000",
    "address": "Test Mahallesi, Test Sokak No:1"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Ödeme başlatıldı",
  "data": {
    "payment": {
      "_id": "...",
      "companyId": "...",
      "price": 100.50,
      "paymentStatus": "pending",
      "conversationId": "CONV-...",
      ...
    },
    "htmlContent": "<html>...</html>", // 3D Secure HTML içeriği
    "paymentId": "123456789"
  }
}
```

**Kullanım:**
Frontend'de `htmlContent`'i bir iframe içinde gösterin veya yeni bir pencerede açın.

### 2. Ödeme Callback

**POST** `/api/payments/callback`

iyzico'dan gelen callback'i işler. Bu endpoint otomatik olarak çağrılır, manuel çağrı yapmanıza gerek yoktur.

**Request Body:**
```json
{
  "token": "payment_token_from_iyzico"
}
```

### 3. Ödeme Durumu Sorgulama

**GET** `/api/payments/:paymentId`

Ödeme durumunu sorgular.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "companyId": {...},
    "price": 100.50,
    "paymentStatus": "success", // pending, success, failed, cancelled
    "paymentId": "123456789",
    "cardInfo": {
      "cardType": "CREDIT_CARD",
      "cardAssociation": "MASTER_CARD",
      "lastFourDigits": "1234"
    },
    ...
  }
}
```

### 4. Ödemeleri Listeleme

**GET** `/api/payments/company/:companyId?status=success&startDate=2024-01-01&endDate=2024-01-31&page=1&limit=20`

Şirkete ait ödemeleri listeler.

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `status` (opsiyonel): `pending`, `success`, `failed`, `cancelled`
- `startDate` (opsiyonel): Başlangıç tarihi (YYYY-MM-DD)
- `endDate` (opsiyonel): Bitiş tarihi (YYYY-MM-DD)
- `page` (opsiyonel): Sayfa numarası (default: 1)
- `limit` (opsiyonel): Sayfa başına kayıt (default: 20)

**Response:**
```json
{
  "success": true,
  "count": 10,
  "total": 50,
  "page": 1,
  "totalPages": 3,
  "data": [...]
}
```

### 5. Ödeme İptal

**POST** `/api/payments/:paymentId/cancel`

Başarılı bir ödemeyi iptal eder.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Ödeme başarıyla iptal edildi",
  "data": {...}
}
```

## Test Kartları

Sandbox ortamında test için aşağıdaki kartları kullanabilirsiniz:

### Başarılı Ödeme
- **Kart Numarası:** `5528 7900 0000 0000`
- **Son Kullanma:** `12/30`
- **CVV:** `123`
- **3D Secure Şifresi:** `123456`

### Başarısız Ödeme
- **Kart Numarası:** `5528 7900 0000 0008`
- **Son Kullanma:** `12/30`
- **CVV:** `123`

## Frontend Entegrasyonu Örneği

```javascript
// Ödeme başlatma
const initializePayment = async () => {
  try {
    const response = await fetch('/api/payments/initialize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        companyId: '...',
        price: 100.50,
        buyerId: '...'
      })
    });

    const data = await response.json();
    
    if (data.success) {
      // 3D Secure HTML içeriğini göster
      const iframe = document.createElement('iframe');
      iframe.srcdoc = data.data.htmlContent;
      iframe.style.width = '100%';
      iframe.style.height = '600px';
      document.body.appendChild(iframe);
    }
  } catch (error) {
    console.error('Ödeme başlatma hatası:', error);
  }
};

// Ödeme durumu kontrolü
const checkPaymentStatus = async (paymentId) => {
  const response = await fetch(`/api/payments/${paymentId}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  const data = await response.json();
  return data.data.paymentStatus;
};
```

## Ödeme Durumları

- **pending**: Ödeme başlatıldı, henüz tamamlanmadı
- **success**: Ödeme başarıyla tamamlandı
- **failed**: Ödeme başarısız oldu
- **cancelled**: Ödeme iptal edildi

## Notlar

1. **3D Secure**: Tüm ödemeler 3D Secure ile yapılır
2. **Callback URL**: Callback URL'i `.env` dosyasındaki `API_URL` değişkenine göre otomatik oluşturulur
3. **Taksit**: Varsayılan olarak tek çekim yapılır. Taksit seçenekleri: 2, 3, 6, 9, 12
4. **Production**: Production'a geçerken `.env` dosyasındaki `IYZICO_URI` değerini `https://api.iyzipay.com` olarak güncelleyin

## Hata Yönetimi

Tüm hatalar aşağıdaki formatta döner:

```json
{
  "success": false,
  "message": "Hata mesajı",
  "errorCode": "HATA_KODU" // Opsiyonel
}
```

## Destek

iyzico dokümantasyonu: https://dev.iyzipay.com/tr
iyzico destek: support@iyzipay.com

