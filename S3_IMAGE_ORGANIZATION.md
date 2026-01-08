# S3 Image Upload Organization

## 📂 Klasör Yapısı

Tüm resimler company bazında organize edilir:

```
s3://bakimla-storage/
└── images/
    ├── {companyId1}/
    │   ├── interior/
    │   │   └── uuid.jpg          # İç mekan görseli
    │   ├── exterior/
    │   │   └── uuid.jpg          # Dış mekan görseli
    │   ├── icon/
    │   │   └── uuid.jpg          # App ikonu
    │   └── services/
    │       ├── uuid1.jpg         # Hizmet görseli 1
    │       └── uuid2.jpg         # Hizmet görseli 2
    ├── {companyId2}/
    │   ├── interior/
    │   ├── exterior/
    │   ├── icon/
    │   └── services/
    └── ...
```

## 🎯 Örnek URL'ler

**Interior Image:**
```
https://bakimla-storage.s3.eu-west-1.amazonaws.com/images/6950ed8ab109b5fbc6039043/interior/550e8400-e29b-41d4-a716-446655440000.jpg
```

**Exterior Image:**
```
https://bakimla-storage.s3.eu-west-1.amazonaws.com/images/6950ed8ab109b5fbc6039043/exterior/7a3f9c12-4b5d-4e8f-9c3a-1a2b3c4d5e6f.jpg
```

**App Icon:**
```
https://bakimla-storage.s3.eu-west-1.amazonaws.com/images/6950ed8ab109b5fbc6039043/icon/8b4g0d23-5c6e-5f9g-0d4b-2b3c4d5e6f7g.jpg
```

**Service Image:**
```
https://bakimla-storage.s3.eu-west-1.amazonaws.com/images/6950ed8ab109b5fbc6039043/services/9c5h1e34-6d7f-6g0h-1e5c-3c4d5e6f7g8h.jpg
```

## 📱 Frontend Usage (React Native)

### SetYourBussiness.js

```javascript
// Upload interior image
const result = await storeService.uploadImage(
  imageAsset,          // React Native image asset
  user._id,            // Company ID
  'interior'           // Sub-folder
);

// Upload exterior image
const result = await storeService.uploadImage(
  imageAsset,
  user._id,
  'exterior'
);

// Upload app icon
const result = await storeService.uploadImage(
  imageAsset,
  user._id,
  'icon'
);

// Upload service images
const result = await storeService.uploadImage(
  imageAsset,
  user._id,
  'services'
);
```

### storeService.js

```javascript
uploadImage: async (imageAsset, companyId, subFolder = '') => {
  const formData = new FormData();
  formData.append('image', {
    uri: imageAsset.uri,
    type: imageAsset.type || 'image/jpeg',
    name: imageAsset.fileName || 'upload.jpg',
  });
  
  // Klasör: images/{companyId}/{subFolder}
  const folder = subFolder 
    ? `${companyId}/${subFolder}` 
    : companyId;
  
  formData.append('folder', folder);
  
  const response = await api.post('/upload/image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  
  return response.data;
}
```

## 🔧 Backend Flow

### 1. Upload Controller

```javascript
// POST /api/upload/image
const { folder } = req.body; // e.g., "6950ed8a.../interior"

console.log('Folder:', folder); // "6950ed8ab109b5fbc6039043/interior"

const result = await s3Service.uploadImage(
  req.file.buffer,
  req.file.originalname,
  folder
);
```

### 2. S3 Service

```javascript
// utils/s3Service.js
const uploadImage = async (imageBuffer, fileName, subFolder = 'images') => {
  const ext = path.extname(fileName).toLowerCase();
  const mimeType = mimeTypes[ext] || 'image/jpeg';
  
  // Final path: images/{subFolder}
  return await uploadToS3(
    imageBuffer,
    fileName,
    `images/${subFolder}`,  // e.g., "images/6950ed8a.../interior"
    mimeType
  );
};
```

### 3. Final S3 Key

```
images/6950ed8ab109b5fbc6039043/interior/550e8400-e29b-41d4-a716-446655440000.jpg
└─┬──┘ └──────────────┬──────────────┘ └──┬──┘ └──────────────┬──────────────┘
  │                   │                    │                    │
Base                Company ID          Sub-folder          Unique filename
```

## ✅ Avantajlar

1. **Organizasyon**: Her company'nin resimleri ayrı klasörde
2. **Kolay Silme**: Bir company silindiğinde tüm klasörü sil
3. **Yönetim**: Company bazında storage kullanımı izlenebilir
4. **Güvenlik**: Company'ler arası dosya karışıklığı önlenir
5. **Performans**: Alt klasörlerle dosya arama daha hızlı

## 🔍 S3 Console'da Görünüm

```
S3 Bucket: bakimla-storage
└── images/
    ├── 6950ed8ab109b5fbc6039043/ (Company 1)
    │   ├── interior/
    │   │   └── 550e8400-e29b-41d4-a716-446655440000.jpg (2.3 MB)
    │   ├── exterior/
    │   │   └── 7a3f9c12-4b5d-4e8f-9c3a-1a2b3c4d5e6f.jpg (1.8 MB)
    │   ├── icon/
    │   │   └── 8b4g0d23-5c6e-5f9g-0d4b-2b3c4d5e6f7g.jpg (512 KB)
    │   └── services/
    │       ├── 9c5h1e34-6d7f-6g0h-1e5c-3c4d5e6f7g8h.jpg (1.2 MB)
    │       └── 0d6i2f45-7e8g-7h1i-2f6d-4d5e6f7g8h9i.jpg (1.5 MB)
    │
    └── 6950f1a2c3d4e5f6a7b8c9d0/ (Company 2)
        ├── interior/
        ├── exterior/
        ├── icon/
        └── services/
```

## 📊 Storage Monitoring

Company bazında storage kullanımını izlemek için:

```bash
# AWS CLI
aws s3 ls s3://bakimla-storage/images/6950ed8ab109b5fbc6039043/ --recursive --human-readable --summarize

# Output:
# 2025-12-28  interior/550e8400...jpg  (2.3 MiB)
# 2025-12-28  exterior/7a3f9c12...jpg  (1.8 MiB)
# 2025-12-28  icon/8b4g0d23...jpg      (512 KiB)
# 2025-12-28  services/9c5h1e34...jpg  (1.2 MiB)
# 2025-12-28  services/0d6i2f45...jpg  (1.5 MiB)
# 
# Total Size: 7.3 MiB
```

## 🧹 Cleanup Operations

Company silindiğinde tüm dosyalarını silmek:

```javascript
// Backend utility function
const deleteCompanyImages = async (companyId) => {
  const prefix = `images/${companyId}/`;
  
  // List all objects with this prefix
  const objects = await listS3Objects(prefix);
  
  // Delete all objects
  for (const obj of objects) {
    await s3Service.deleteFromS3(obj.Key);
  }
  
  console.log(`Deleted ${objects.length} images for company ${companyId}`);
};
```

## 🎯 Best Practices

1. **Always pass companyId**: Her upload'da mutlaka company ID gönder
2. **Use sub-folders**: Resim tipine göre alt klasör kullan
3. **Unique filenames**: Backend otomatik UUID üretir
4. **Check file size**: Frontend'de upload öncesi boyut kontrolü yap
5. **Handle errors**: Upload başarısız olursa kullanıcıya bildir

## 📝 Example Flow

```
User Registration Flow:
1. User creates account → User ID: 6950ed8a...
2. Uploads interior image → images/6950ed8a.../interior/uuid.jpg
3. Uploads exterior image → images/6950ed8a.../exterior/uuid.jpg
4. Uploads app icon → images/6950ed8a.../icon/uuid.jpg
5. Uploads service images → images/6950ed8a.../services/uuid1.jpg, uuid2.jpg
6. Store created with all image URLs
7. All images organized under company folder ✅
```

## 🔐 Security

S3 Bucket Policy:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::bakimla-storage/images/*"
    }
  ]
}
```

**Note**: Sadece okuma public, yazma backend üzerinden kontrollü.

