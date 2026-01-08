# Dashboard API Dokümantasyonu

## Genel Bakış

Bu endpoint, işletme sahiplerinin ana sayfa (dashboard) için ihtiyaç duyduğu tüm verileri tek bir istekle getirir. Bu sayede birden fazla API çağrısı yapmak yerine tek bir endpoint kullanılarak performans artışı sağlanır.

---

## Endpoint

```
GET /api/user/dashboard
```

### Authentication

Bu endpoint **authMiddleware** ile korunmaktadır. İstek header'ında geçerli bir JWT token bulunmalıdır.

```
Authorization: Bearer <token>
```

---

## Response

### Success Response (200 OK)

```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "507f1f77bcf86cd799439011",
      "firstName": "Ahmet",
      "lastName": "Yılmaz",
      "email": "ahmet@example.com",
      "phoneNumber": "5551234567",
      "userType": "company",
      "profileImage": "https://example.com/profile.jpg",
      "city": "İstanbul",
      "district": "Beşiktaş",
      "points": 250,
      "isApproved": true,
      "notificationPreferences": {
        "appointmentReminder": true,
        "campaignNotifications": true
      }
    },
    "campaigns": [
      {
        "_id": "507f1f77bcf86cd799439012",
        "title": "Yılbaşı Kampanyası",
        "shortDescription": "Tüm saç bakım hizmetlerinde %30 indirim",
        "image": "https://example.com/campaign.jpg",
        "discountType": "percentage",
        "discountValue": 30,
        "startDate": "2025-12-01T00:00:00.000Z",
        "endDate": "2025-12-31T23:59:59.999Z"
      }
    ],
    "pendingAppointments": [
      {
        "_id": "507f1f77bcf86cd799439013",
        "appointmentDate": "2025-12-28T00:00:00.000Z",
        "appointmentTime": "14:00",
        "serviceType": "Saç Kesimi",
        "servicePrice": 150,
        "customerIds": [
          {
            "_id": "507f1f77bcf86cd799439014",
            "firstName": "Ayşe",
            "lastName": "Demir",
            "phoneNumber": "5559876543",
            "profileImage": "https://example.com/customer.jpg"
          }
        ],
        "employeeId": {
          "_id": "507f1f77bcf86cd799439015",
          "firstName": "Mehmet",
          "lastName": "Kaya"
        }
      }
    ],
    "earnings": {
      "records": [
        {
          "_id": "507f1f77bcf86cd799439016",
          "income": 150,
          "expense": 0,
          "category": "Saç Kesimi",
          "date": "2025-12-28T10:30:00.000Z",
          "employeeId": {
            "_id": "507f1f77bcf86cd799439015",
            "firstName": "Mehmet",
            "lastName": "Kaya"
          }
        }
      ],
      "summary": {
        "totalIncome": 450,
        "totalExpense": 50,
        "netProfit": 400
      }
    }
  }
}
```

### Error Response (401 Unauthorized)

```json
{
  "success": false,
  "message": "Token geçersiz veya bulunamadı"
}
```

### Error Response (404 Not Found)

```json
{
  "success": false,
  "message": "Kullanıcı bulunamadı"
}
```

### Error Response (500 Internal Server Error)

```json
{
  "success": false,
  "message": "Sunucu hatası"
}
```

---

## Response Alanları Açıklaması

### `user` (Object)
Giriş yapmış kullanıcının detaylı profil bilgileri. `password` alanı güvenlik için response'da **dahil edilmez**.

### `campaigns` (Array)
- İşletmenin **aktif** kampanyaları
- Bugünün tarihi, kampanyanın `startDate` ve `endDate` aralığında olan kampanyalar
- En fazla **5 adet** kampanya döner
- Tarih sırasına göre azalan (en yeni ilk) sıralanır

### `pendingAppointments` (Array)
- Statüsü **"pending"** olan randevular
- Müşteri ve çalışan bilgileri populate edilir
- Randevu tarihi ve saatine göre artan (en yakın ilk) sıralanır
- En fazla **10 adet** randevu döner

### `earnings` (Object)
#### `records` (Array)
- **Bugünün** gelir/gider kayıtları
- Çalışan bilgileri populate edilir
- En fazla **10 adet** kayıt döner
- Tarihe göre azalan sıralanır

#### `summary` (Object)
- `totalIncome`: Bugünün toplam geliri
- `totalExpense`: Bugünün toplam gideri
- `netProfit`: Net kâr (gelir - gider)

---

## Kullanım Örneği

### Frontend (React Native)

```javascript
import userService from '../services/userService';

const fetchDashboardData = async () => {
  try {
    const dashboardData = await userService.getDashboard();
    
    if (dashboardData.success && dashboardData.data) {
      const { user, campaigns, pendingAppointments, earnings } = dashboardData.data;
      
      setUser(user);
      setCampaigns(campaigns);
      setPendingAppointments(pendingAppointments);
      setEarnings(earnings);
      
      console.log('Bugünün toplam geliri:', earnings.summary.totalIncome);
    }
  } catch (error) {
    console.error('Dashboard verisi yüklenemedi:', error);
  }
};
```

### cURL Örneği

```bash
curl -X GET \
  http://localhost:5000/api/user/dashboard \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
```

---

## Notlar

1. **Performans**: Bu endpoint, birden fazla collection'dan veri çekerek tek response'da birleştirir. Bu sayede frontend'de 4 farklı API çağrısı yapmak yerine tek bir çağrı yeterlidir.

2. **Güvenlik**: 
   - `authMiddleware` ile korunur
   - Sadece kendi verilerine erişebilir (req.user._id kullanılır)
   - Password alanı response'a dahil edilmez

3. **Optimizasyon**:
   - Kampanyalar için limit: 5
   - Randevular için limit: 10
   - Kazanç kayıtları için limit: 10
   - Sadece gerekli alanlar populate edilir

4. **Tarih Filtreleme**:
   - Kampanyalar: Aktif ve tarihleri geçerli olanlar
   - Randevular: Pending status'ta olanlar
   - Kazançlar: Sadece bugünün kayıtları

---

## İlgili Dosyalar

- **Backend Controller**: `/backendBakimla/controllers/userController.js` → `getDashboard`
- **Backend Route**: `/backendBakimla/routes/userRoutes.js`
- **Frontend Service**: `/BakimlaBusinessV2/src/services/userService.js` → `getDashboard`
- **Frontend Component**: `/BakimlaBusinessV2/src/home/Home.js`

---

## Version History

- **v1.0** (2025-12-28): İlk versiyon oluşturuldu
  - User profile
  - Active campaigns
  - Pending appointments
  - Today's earnings summary

