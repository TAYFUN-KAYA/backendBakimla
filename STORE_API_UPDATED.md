# Store API - Güncellenmiş Versiyon

## Sektör Yapısı

Sektörler artık **ID tabanlı** bir sistemle çalışıyor. Her sektörün benzersiz bir ID'si var.

### Mevcut Sektörler

```javascript
{
  1: "Erkek Kuaförü",
  2: "Kadın Kuaförü",
  3: "Unisex Kuaför Salonu",
  4: "Güzellik Merkezi",
  5: "Tırnak Salonu",
  6: "Masaj Salonu",
  7: "Makyaj Uzmanı",
  8: "Spa & Wellness",
  9: "Barber Shop"
}
```

## Store Oluşturma (Create Store)

### Endpoint
```
POST /api/stores/create
```

### Request Body

```json
{
  "companyId": "507f1f77bcf86cd799439011",
  "storeName": "Güzellik Merkezi",
  "authorizedPersonName": "Mehmet Kaya",
  "authorizedPersonTCKN": "12345678901",
  "businessName": "Güzellik Ltd. Şti.",
  "taxOffice": "Kadıköy",
  "taxNumber": "1234567890",
  "iban": "TR000000000000000000000000",
  "businessDescription": "Profesyonel güzellik hizmetleri",
  "interiorImage": "https://example.com/interior.jpg",
  "exteriorImage": "https://example.com/exterior.jpg",
  "appIcon": "https://example.com/icon.jpg",
  "serviceImages": [
    "https://example.com/service1.jpg",
    "https://example.com/service2.jpg"
  ],
  "workingDays": [
    {
      "day": "monday",
      "startTime": "09:00",
      "endTime": "18:00",
      "isOpen": true
    },
    {
      "day": "tuesday",
      "startTime": "09:00",
      "endTime": "18:00",
      "isOpen": true
    }
  ],
  "sectors": [1, 2, 4],
  "services": [
    {
      "name": "Saç Kesim",
      "category": "Erkek Kuaförü, Kadın Kuaförü",
      "duration": 30,
      "price": 150,
      "cancelDuration": 60
    },
    {
      "name": "Boyama",
      "category": "Kadın Kuaförü",
      "duration": 120,
      "price": 500,
      "cancelDuration": 120
    }
  ],
  "businessField": "Güzellik",
  "address": {
    "city": "İstanbul",
    "district": "Kadıköy"
  }
}
```

### Önemli Notlar

#### 1. Sektörler (sectors)
- ✅ **ID array olarak gönderilmeli**: `[1, 2, 4]`
- ❌ **String array olarak GÖNDERİLMEMELİ**: `["Erkek Kuaförü", "Kadın Kuaförü"]`
- Backend, ID'leri otomatik olarak sektör objesine çevirir:
  ```json
  {
    "id": 1,
    "name": "Erkek Kuaförü",
    "key": "erkek_kuafor"
  }
  ```

#### 2. Hizmet Süreleri (duration & cancelDuration)
- ✅ **Dakika cinsinden NUMBER olarak gönderilmeli**: `30`, `60`, `120`
- ❌ **String olarak GÖNDERİLMEMELİ**: `"30 dk"`, `"1 saat"`

**Örnekler:**
```javascript
// ✅ DOĞRU
{
  "duration": 30,        // 30 dakika
  "cancelDuration": 120  // 2 saat (120 dakika)
}

// ❌ YANLIŞ
{
  "duration": "30 dk",
  "cancelDuration": "2 saat"
}
```

#### 3. Çalışma Günleri (workingDays)
- Sadece `isOpen: true` olan günler API'ye gönderilmeli
- Frontend tarafında filtrelenmeli

### Response

```json
{
  "success": true,
  "message": "Mağaza bilgileri başarıyla oluşturuldu",
  "data": {
    "_id": "507f1f77bcf86cd799439012",
    "companyId": "507f1f77bcf86cd799439011",
    "storeName": "Güzellik Merkezi",
    "sectors": [
      {
        "id": 1,
        "name": "Erkek Kuaförü",
        "key": "erkek_kuafor"
      },
      {
        "id": 2,
        "name": "Kadın Kuaförü",
        "key": "kadin_kuafor"
      },
      {
        "id": 4,
        "name": "Güzellik Merkezi",
        "key": "guzellik_merkezi"
      }
    ],
    "services": [
      {
        "name": "Saç Kesim",
        "category": "Erkek Kuaförü, Kadın Kuaförü",
        "duration": 30,
        "price": 150,
        "cancelDuration": 60,
        "isActive": true,
        "_id": "..."
      }
    ],
    "createdAt": "2025-12-28T12:00:00.000Z",
    "updatedAt": "2025-12-28T12:00:00.000Z"
  }
}
```

## Frontend - Backend Entegrasyonu

### Frontend (React Native)

```javascript
import { getSectorDataForUI, getSectorById } from '../../constants/sectors';

// Sektör seçimi (ID olarak sakla)
const [selectedSectors, setSelectedSectors] = useState([1, 2]); // ID'ler

// API'ye gönderirken
const servicesForApi = services.map((s) => {
  // Duration: "30 dk" -> 30
  const durationMatch = s.duration.match(/(\d+)/);
  const durationInMinutes = durationMatch ? parseInt(durationMatch[1]) : 30;

  // Cancel Duration: "2 saat" -> 120
  const cancelMatch = s.cancelDuration.match(/(\d+)/);
  const cancelInMinutes = cancelMatch ? parseInt(cancelMatch[1]) * 60 : 0;

  return {
    name: s.type,
    category: s.sector,
    duration: durationInMinutes, // NUMBER (dakika)
    price: parseFloat(s.price) || 0,
    cancelDuration: cancelInMinutes, // NUMBER (dakika)
  };
});

await storeService.createStore({
  // ...
  sectors: selectedSectors, // [1, 2, 4]
  services: servicesForApi,
  // ...
});
```

### Backend (Node.js)

```javascript
const { validateSectorIds, getSectorById } = require('../constants/sectors');

// Sektör validation
const sectorValidation = validateSectorIds(sectors);
if (!sectorValidation.valid) {
  return res.status(400).json({
    success: false,
    message: sectorValidation.message,
  });
}

// ID'leri objeleye çevir
const sectorObjects = sectors.map(sectorId => {
  const sector = getSectorById(sectorId);
  return {
    id: sector.id,
    name: sector.name,
    key: sector.key
  };
});

// Store oluştur
await Store.create({
  sectors: sectorObjects,
  services: services, // duration ve cancelDuration number olarak gelir
  // ...
});
```

## Validasyon Hataları

### Sektör Hataları
```json
{
  "success": false,
  "message": "Geçersiz sektör ID'leri: 99, 100"
}
```

### Hizmet Süre Hataları
```json
{
  "success": false,
  "message": "Hizmet süresi dakika cinsinden pozitif bir sayı olmalıdır"
}
```

```json
{
  "success": false,
  "message": "İptal süresi dakika cinsinden pozitif bir sayı veya 0 olmalıdır"
}
```

## Migration Notları

### Eski Versiyon (String Array)
```json
{
  "sectors": ["Erkek Kuaförü", "Kadın Kuaförü"]
}
```

### Yeni Versiyon (ID Array → Object Array)
```json
{
  "sectors": [1, 2]  // Frontend gönderir
}

// Backend'de şuna dönüşür:
{
  "sectors": [
    { "id": 1, "name": "Erkek Kuaförü", "key": "erkek_kuafor" },
    { "id": 2, "name": "Kadın Kuaförü", "key": "kadin_kuafor" }
  ]
}
```

## Örnek Kullanım Senaryoları

### Senaryo 1: Unisex Kuaför
```json
{
  "sectors": [3],  // Unisex Kuaför Salonu
  "services": [
    {
      "name": "Saç Kesim",
      "category": "Unisex",
      "duration": 30,
      "price": 100,
      "cancelDuration": 60
    }
  ]
}
```

### Senaryo 2: Güzellik Merkezi (Çoklu Hizmet)
```json
{
  "sectors": [2, 4, 5],  // Kadın Kuaförü + Güzellik Merkezi + Tırnak Salonu
  "services": [
    {
      "name": "Saç Kesim",
      "duration": 45,
      "cancelDuration": 120
    },
    {
      "name": "Manikür",
      "duration": 60,
      "cancelDuration": 60
    },
    {
      "name": "Cilt Bakımı",
      "duration": 90,
      "cancelDuration": 180
    }
  ]
}
```

### Senaryo 3: Barber Shop (Sadece Erkek)
```json
{
  "sectors": [9],  // Barber Shop
  "services": [
    {
      "name": "Saç + Sakal",
      "duration": 45,
      "price": 200,
      "cancelDuration": 60
    }
  ]
}
```

