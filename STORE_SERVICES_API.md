# Store Services API Documentation

Bu doküman, Store (İşletme) modelinde birden fazla hizmetin nasıl saklandığını ve kullanıldığını açıklar.

## 📋 Store Model - Services Yapısı

### Services Array (Tek Yapı)

Store artık **sadece** `services` array'i kullanıyor. Eski legacy alanlar kaldırıldı.

```javascript
{
  _id: "...",
  storeName: "Güzellik Merkezi",
  companyId: "...",
  // ... diğer alanlar ...
  
  // ✅ Birden fazla hizmet (tek yapı)
  services: [
    {
      name: "Saç Kesim",
      category: "Erkek Kuaförü",
      duration: 30,           // dakika
      price: 150,             // TL
      cancelDuration: 60,     // dakika (iptal edilebilme süresi)
      description: "...",     // opsiyonel
      isActive: true
    },
    {
      name: "Boyama",
      category: "Kadın Kuaförü",
      duration: 90,
      price: 350,
      cancelDuration: 120,
      isActive: true
    },
    {
      name: "Manikür",
      category: "Tırnak Salonu",
      duration: 45,
      price: 100,
      cancelDuration: 60,
      isActive: true
    }
  ],
  
  // ❌ REMOVED: Legacy alanlar kaldırıldı
  // serviceType, serviceDuration, servicePrice, serviceCategory artık YOK
}
```

## 🔧 API Usage

### 1. Store Oluşturma (Create Store)

**Endpoint:** `POST /api/stores`

**Request Body:**
```json
{
  "companyId": "6749...",
  "storeName": "Güzellik Merkezi",
  "authorizedPersonName": "Mehmet Kaya",
  "authorizedPersonTCKN": "12345678901",
  "businessName": "Güzellik Merkezi",
  "taxOffice": "Kadıköy",
  "taxNumber": "1234567890",
  "iban": "TR123456789012345678901234",
  "businessDescription": "Profesyonel güzellik hizmetleri",
  "businessPassword": "optional",
  "interiorImage": "https://s3.../interior.jpg",
  "exteriorImage": "https://s3.../exterior.jpg",
  "appIcon": "https://s3.../icon.jpg",
  "serviceImages": ["https://s3.../service1.jpg"],
  "workingDays": [
    {
      "day": "monday",
      "startTime": "09:00",
      "endTime": "18:00",
      "isOpen": true
    }
  ],
  "sectors": ["Erkek Kuaförü", "Kadın Kuaförü", "Tırnak Salonu"],
  "services": [
    {
      "name": "Saç Kesim",
      "category": "Erkek Kuaförü",
      "duration": 30,
      "price": 150,
      "cancelDuration": 60
    },
    {
      "name": "Boyama",
      "category": "Kadın Kuaförü",
      "duration": 90,
      "price": 350,
      "cancelDuration": 120
    },
    {
      "name": "Manikür",
      "category": "Tırnak Salonu",
      "duration": 45,
      "price": 100,
      "cancelDuration": 60
    }
  ],
  "businessField": "Güzellik",
  "address": {
    "city": "İstanbul",
    "district": "Kadıköy"
  }
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Mağaza bilgileri başarıyla oluşturuldu",
  "data": {
    "_id": "6749a1b2c3d4e5f6a7b8c9d0",
    "companyId": "6749...",
    "storeName": "Güzellik Merkezi",
    "services": [
      {
        "_id": "6749...",
        "name": "Saç Kesim",
        "category": "Erkek Kuaförü",
        "duration": 30,
        "price": 150,
        "cancelDuration": 60,
        "isActive": true
      },
      {
        "_id": "6749...",
        "name": "Boyama",
        "category": "Kadın Kuaförü",
        "duration": 90,
        "price": 350,
        "cancelDuration": 120,
        "isActive": true
      },
      {
        "_id": "6749...",
        "name": "Manikür",
        "category": "Tırnak Salonu",
        "duration": 45,
        "price": 100,
        "cancelDuration": 60,
        "isActive": true
      }
    ],
    "sectors": ["Erkek Kuaförü", "Kadın Kuaförü", "Tırnak Salonu"],
    "serviceType": "Saç Kesim",
    "serviceDuration": 30,
    "servicePrice": 150,
    "serviceCategory": "Erkek Kuaförü",
    "createdAt": "2024-12-28T10:30:00.000Z",
    "updatedAt": "2024-12-28T10:30:00.000Z"
  }
}
```

### 2. Store Bilgilerini Getirme

**Endpoint:** `GET /api/stores/:id`

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "6749...",
    "storeName": "Güzellik Merkezi",
    "services": [
      {
        "_id": "6749...",
        "name": "Saç Kesim",
        "category": "Erkek Kuaförü",
        "duration": 30,
        "price": 150,
        "cancelDuration": 60,
        "description": "",
        "isActive": true
      }
    ],
    "sectors": ["Erkek Kuaförü", "Kadın Kuaförü"],
    "interiorImage": "https://s3.../interior.jpg",
    "exteriorImage": "https://s3.../exterior.jpg",
    "appIcon": "https://s3.../icon.jpg",
    "workingDays": [...]
  }
}
```

## 📱 React Native Frontend Usage

### SetYourBussiness.js

```javascript
// Frontend'de hizmetler bu şekilde hazırlanıyor:
const servicesForApi = services.map(s => ({
  name: s.type,              // "Saç Kesim"
  category: s.sector,        // "Erkek Kuaförü"
  duration: parseInt(s.duration) || 30,
  price: parseFloat(s.price) || 0,
  cancelDuration: parseInt(s.cancelDuration) || 0
}));

// API'ye gönderme:
const storeResult = await storeService.createStore({
  // ... diğer alanlar ...
  services: servicesForApi,  // ✅ Birden fazla hizmet
  sectors: [...new Set(services.map(s => s.sector))], // Unique sektörler
  // ... diğer alanlar ...
});
```

### Kullanıcı Akışı

1. **Sektör Seçimi**: Kullanıcı 1-3 sektör seçer
   - Örnek: "Erkek Kuaförü", "Kadın Kuaförü", "Tırnak Salonu"

2. **Hizmet Ekleme**: Her sektör için birden fazla hizmet ekler
   - Hizmet 1: Saç Kesim (Erkek Kuaförü, 30dk, 150₺, 1 saat iptal)
   - Hizmet 2: Boyama (Kadın Kuaförü, 90dk, 350₺, 2 saat iptal)
   - Hizmet 3: Manikür (Tırnak Salonu, 45dk, 100₺, 1 saat iptal)

3. **Backend'e Gönderim**: Tüm hizmetler `services` array'i olarak gönderilir

4. **Database'e Kayıt**: Store document'inde `services` array'inde saklanır

## 🔄 Önemli Değişiklik

**⚠️ BREAKING CHANGE:** Legacy alanlar tamamen kaldırıldı!

### Kaldırılan Alanlar:
- ❌ `serviceType` (tek hizmet adı)
- ❌ `serviceDuration` (tek hizmet süresi)
- ❌ `servicePrice` (tek hizmet fiyatı)
- ❌ `serviceCategory` (tek hizmet kategorisi)

### Yeni Yapı:
- ✅ `services` array (tüm hizmetler burada)
- ✅ Her store için birden fazla hizmet
- ✅ Her hizmetin kendi name, category, duration, price, cancelDuration değerleri var

## ✅ Validation Rules

### Services Array Validation

1. **En az 1 hizmet** olmalı
2. Her hizmet şunları içermeli:
   - `name` (string, zorunlu)
   - `category` (string, zorunlu)
   - `duration` (number, min: 1, zorunlu)
   - `price` (number, min: 0, zorunlu)
   - `cancelDuration` (number, min: 0, opsiyonel)
   - `description` (string, opsiyonel)
   - `isActive` (boolean, default: true)

### Controller Validation

```javascript
if (!services || !Array.isArray(services) || services.length === 0) {
  return res.status(400).json({
    success: false,
    message: 'En az bir hizmet eklenmelidir'
  });
}

for (const service of services) {
  if (!service.name || !service.category || !service.duration || service.price === undefined) {
    return res.status(400).json({
      success: false,
      message: 'Her hizmet için ad, kategori, süre ve fiyat zorunludur'
    });
  }
}
```

## 📊 Database Indexes

Store collection'da hızlı arama için:

```javascript
// Sektöre göre arama
db.stores.createIndex({ "sectors": 1 });

// Hizmet kategorisine göre arama
db.stores.createIndex({ "services.category": 1 });

// Aktif hizmetlere göre arama
db.stores.createIndex({ "services.isActive": 1 });

// Fiyat aralığına göre arama
db.stores.createIndex({ "services.price": 1 });
```

## 🎯 Use Cases

### 1. Tüm Hizmetleri Listeleme

```javascript
const store = await Store.findById(storeId);
const allServices = store.services;
console.log(`${allServices.length} hizmet bulundu`);
```

### 2. Aktif Hizmetleri Filtreleme

```javascript
const activeServices = store.services.filter(s => s.isActive);
```

### 3. Kategoriye Göre Hizmetler

```javascript
const hairServices = store.services.filter(s => 
  s.category === 'Erkek Kuaförü' || s.category === 'Kadın Kuaförü'
);
```

### 4. Fiyat Aralığına Göre

```javascript
const affordableServices = store.services.filter(s => 
  s.price >= 100 && s.price <= 200
);
```

### 5. En Ucuz/Pahalı Hizmet

```javascript
const cheapest = store.services.reduce((min, s) => 
  s.price < min.price ? s : min, store.services[0]
);

const expensive = store.services.reduce((max, s) => 
  s.price > max.price ? s : max, store.services[0]
);
```

## 📝 Notes

- ✅ Birden fazla hizmet artık destekleniyor
- ✅ Her hizmetin kendi kategorisi, fiyatı ve süresi var
- ✅ İptal süreleri hizmet bazında ayarlanabiliyor
- ✅ Hizmetler aktif/pasif yapılabiliyor
- ✅ **TEK YAPI:** Sadece `services` array kullanılıyor
- ❌ **Legacy alanlar kaldırıldı:** serviceType, serviceDuration, servicePrice, serviceCategory artık yok

## 🚀 Next Steps

1. **Backend'i restart edin**: `npm run dev`
2. **React Native app'ten test edin**: Birden fazla hizmet ekleyin
3. **MongoDB'yi kontrol edin**: `services` array'inin doğru kaydedildiğini görün
4. **API response'u kontrol edin**: Sadece `services` array'inin döndüğünden emin olun (legacy alanlar yok)

