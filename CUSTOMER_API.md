# Customer API Documentation

## Overview
Müşteri yönetimi için API endpoint'leri. İşletmeler kendi müşterilerini ekleyebilir, listeleyebilir ve müşteri geçmişini görüntüleyebilir.

---

## Authentication
Tüm endpoint'ler `authMiddleware` ile korunmaktadır. JWT token gereklidir.

```
Authorization: Bearer <your-jwt-token>
```

---

## Endpoints

### 1. Get Store Customers
İşletmeye ait tüm müşterileri ve geçmiş randevularını getirir.

**Endpoint:** `GET /api/stores/customers`

**Headers:**
```json
{
  "Authorization": "Bearer <jwt-token>"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "firstName": "Ahmet",
      "lastName": "Yılmaz",
      "phoneNumber": "5551234567",
      "notes": "VIP müşteri",
      "pastAppointments": [
        {
          "_id": "507f1f77bcf86cd799439012",
          "appointmentDate": "2024-12-20T00:00:00.000Z",
          "appointmentTime": "14:30",
          "serviceType": "Saç Kesimi",
          "serviceDuration": 45,
          "servicePrice": 500,
          "status": "completed"
        }
      ]
    }
  ]
}
```

**Error Response (400):**
```json
{
  "success": false,
  "message": "Bu kullanıcı bir şirket değil"
}
```

---

### 2. Create Customer
Yeni müşteri ekler.

**Endpoint:** `POST /api/stores/customers`

**Headers:**
```json
{
  "Authorization": "Bearer <jwt-token>",
  "Content-Type": "application/json"
}
```

**Request Body:**
```json
{
  "firstName": "Ayşe",
  "lastName": "Demir",
  "phoneNumber": "5559876543",
  "notes": "Hassas cilt"
}
```

**Fields:**
- `firstName` (string, required): Müşteri adı
- `lastName` (string, required): Müşteri soyadı
- `phoneNumber` (string, required): Telefon numarası (10-15 rakam)
- `notes` (string, optional): Müşteri hakkında notlar

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Müşteri başarıyla eklendi",
  "data": {
    "_id": "507f1f77bcf86cd799439013",
    "companyId": "507f1f77bcf86cd799439010",
    "firstName": "Ayşe",
    "lastName": "Demir",
    "phoneNumber": "5559876543",
    "notes": "Hassas cilt",
    "createdAt": "2024-12-28T10:00:00.000Z",
    "updatedAt": "2024-12-28T10:00:00.000Z"
  }
}
```

**Error Response (400 - Validation Error):**
```json
{
  "success": false,
  "message": "Ad, soyad ve telefon numarası zorunludur"
}
```

**Error Response (400 - Duplicate):**
```json
{
  "success": false,
  "message": "Bu telefon numarası ile kayıtlı bir müşteri zaten var"
}
```

---

## Customer Model

### Schema
```javascript
{
  companyId: ObjectId (ref: User),
  firstName: String (required),
  lastName: String (required),
  phoneNumber: String (required, 10-15 digits),
  notes: String (optional),
  createdAt: Date,
  updatedAt: Date
}
```

### Indexes
- `{ companyId: 1, phoneNumber: 1 }` (unique)

---

## Notes

### Phone Number Format
- Telefon numaraları otomatik olarak temizlenir (sadece rakamlar)
- Frontend: `+90 555 123 45 67` → Backend: `5551234567`
- Validation: 10-15 rakam arası

### Company Validation
- Sadece `userType: 'company'` olan kullanıcılar müşteri ekleyebilir
- Her müşteri sadece kendi şirketinin verilerini görebilir

### Past Appointments
- `getStoreCustomers` endpoint'i, her müşteri için `status: 'completed'` olan randevuları da getirir
- Randevular tarihe göre azalan sırada (en yeni önce)

---

## Example Usage (JavaScript)

### Get Customers
```javascript
const response = await api.get('/stores/customers');
if (response.data.success) {
  const customers = response.data.data;
  console.log(`Toplam ${customers.length} müşteri bulundu`);
}
```

### Create Customer
```javascript
const newCustomer = await api.post('/stores/customers', {
  firstName: 'Mehmet',
  lastName: 'Öztürk',
  phoneNumber: '5551112233',
  notes: 'Randevulara geç kalıyor'
});

if (newCustomer.data.success) {
  console.log('Müşteri eklendi:', newCustomer.data.data);
}
```

---

## Testing

### cURL Examples

**Get Customers:**
```bash
curl -X GET "http://localhost:5000/api/stores/customers" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Create Customer:**
```bash
curl -X POST "http://localhost:5000/api/stores/customers" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Test",
    "lastName": "User",
    "phoneNumber": "5551234567",
    "notes": "Test müşteri"
  }'
```

---

## Version History
- **v1.0** (2024-12-28): Initial release with `getStoreCustomers` and `createCustomer`

