# AWS S3 Yapılandırma Kılavuzu

Bu doküman, Bakimla Backend API'sinde AWS S3 entegrasyonunun nasıl yapılandırılacağını açıklar.

## 🎯 Gereksinimler

- AWS Hesabı
- AWS IAM kullanıcısı (programmatic access)
- S3 Bucket

## 📝 Adım 1: AWS IAM Kullanıcısı Oluşturma

1. AWS Console'a giriş yapın
2. **IAM** servisine gidin
3. **Users** → **Add User** tıklayın
4. Kullanıcı adı girin (örn: `bakimla-s3-user`)
5. **Programmatic access** seçeneğini işaretleyin
6. **Next: Permissions**'a tıklayın
7. **Attach existing policies directly** → `AmazonS3FullAccess` seçin
8. Kullanıcıyı oluşturun
9. **Access Key ID** ve **Secret Access Key**'i kaydedin (bir daha gösterilmeyecek!)

## 📦 Adım 2: S3 Bucket Oluşturma

1. AWS Console'da **S3** servisine gidin
2. **Create bucket** tıklayın
3. Bucket adı girin (örn: `bakimla-storage`)
4. Region seçin (örn: `eu-west-1` - İrlanda)
5. **Block all public access** seçeneğini **KAPATIN** (resimler public olmalı)
6. Bucket'ı oluşturun

## 🔒 Adım 3: Bucket Policy Ayarlama

Bucket'ınıza public okuma erişimi vermek için:

1. Oluşturduğunuz bucket'a tıklayın
2. **Permissions** sekmesine gidin
3. **Bucket Policy** bölümünde **Edit** tıklayın
4. Aşağıdaki policy'yi yapıştırın (bucket adını kendi bucket'ınızla değiştirin):

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::bakimla-storage/*"
        }
    ]
}
```

5. **Save changes** tıklayın

## 🔧 Adım 4: Backend .env Yapılandırması

`backendBakimla` klasöründe `.env` dosyası oluşturun (.env.example'dan kopyalayabilirsiniz):

```bash
# AWS S3 Configuration
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
AWS_REGION=eu-west-1
AWS_S3_BUCKET=bakimla-storage

# Optional: CloudFront CDN URL (if using CloudFront)
# AWS_CLOUDFRONT_URL=https://d1234567890.cloudfront.net
```

**Önemli:** `.env` dosyası `.gitignore`'da olmalıdır (zaten ekli).

## 🚀 Adım 5: Kurulum ve Test

1. Backend'i başlatın:
```bash
cd backendBakimla
npm install
npm run dev
```

2. Console'da şu mesajı görmelisiniz:
```
✅ Sunucu 3001 portunda çalışıyor
✅ MongoDB bağlantısı başarılı
```

3. Eğer S3 yapılandırması eksikse uyarı göreceksiniz:
```
⚠️  UYARI: AWS S3 yapılandırması eksik! Dosya yükleme çalışmayabilir.
   Eksik değişkenler: AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY
```

## 📤 S3 Upload API Kullanımı

### Endpoint
```
POST /api/upload/image
```

### Headers
```
Authorization: Bearer <your_jwt_token>
Content-Type: multipart/form-data
```

### Body (form-data)
- `image`: (file) Resim dosyası
- `folder`: (string, optional) Alt klasör adı (varsayılan: 'general')

### Örnek Response
```json
{
    "success": true,
    "message": "Resim başarıyla yüklendi",
    "url": "https://bakimla-storage.s3.eu-west-1.amazonaws.com/images/stores/550e8400-e29b-41d4-a716-446655440000.jpg",
    "fileName": "550e8400-e29b-41d4-a716-446655440000.jpg"
}
```

## 📂 Klasör Yapısı

S3 bucket'ınızda şu klasör yapısı kullanılır:

```
bakimla-storage/
├── images/
│   ├── stores/        # İşletme resimleri
│   ├── users/         # Kullanıcı profil resimleri
│   ├── products/      # Ürün resimleri
│   ├── services/      # Hizmet resimleri
│   └── general/       # Genel resimler
└── pdfs/
    ├── documents/     # Dökümanlar
    └── certificates/  # Sertifikalar
```

## 🌐 CloudFront (Opsiyonel)

Daha hızlı resim dağıtımı için CloudFront CDN kullanabilirsiniz:

1. AWS Console'da **CloudFront** servisine gidin
2. **Create Distribution** tıklayın
3. **Origin Domain** olarak S3 bucket'ınızı seçin
4. Distribution oluşturun
5. CloudFront URL'ini `.env` dosyasına ekleyin:

```bash
AWS_CLOUDFRONT_URL=https://d1234567890.cloudfront.net
```

## 🔍 Hata Ayıklama

### "S3 bucket yapılandırması eksik" Hatası

**Sebep:** `.env` dosyasında AWS değişkenleri eksik veya yanlış.

**Çözüm:**
1. `.env` dosyasının `backendBakimla/` klasöründe olduğundan emin olun
2. Tüm AWS değişkenlerinin doğru girildiğini kontrol edin
3. Backend'i yeniden başlatın: `npm run dev`

### "Access Denied" Hatası

**Sebep:** IAM kullanıcısının S3 erişim izni yok.

**Çözüm:**
1. IAM Console'da kullanıcınızı bulun
2. `AmazonS3FullAccess` policy'sinin ekli olduğunu kontrol edin
3. Yeni Access Key oluşturup deneyin

### Resimler Yüklenmiyor

**Sebep:** Bucket policy eksik veya yanlış.

**Çözüm:**
1. S3 Console'da bucket'ınıza gidin
2. Permissions → Bucket Policy'yi kontrol edin
3. Public read access'in aktif olduğundan emin olun

## 📚 S3 Service Functions

Backend'de kullanılabilir S3 fonksiyonları:

```javascript
const s3Service = require('./utils/s3Service');

// Resim yükle
const result = await s3Service.uploadImage(buffer, 'profile.jpg', 'users');

// Dosya yükle
const result = await s3Service.uploadToS3(buffer, 'document.pdf', 'documents', 'application/pdf');

// Dosya sil
await s3Service.deleteFromS3('images/users/profile.jpg');

// URL'den S3 key çıkar
const key = s3Service.extractS3Key('https://bakimla-storage.s3.eu-west-1.amazonaws.com/images/users/profile.jpg');
// Result: 'images/users/profile.jpg'
```

## 🔐 Güvenlik Notları

1. **Asla** `.env` dosyasını Git'e commit etmeyin
2. IAM kullanıcısına **minimum gerekli** izinleri verin (least privilege)
3. Access Key'leri düzenli olarak rotate edin
4. Production'da **CloudFront** kullanın (rate limiting ve DDoS koruması için)
5. Bucket versioning'i aktif edin (kazara silmelere karşı)

## 📞 Destek

Sorun yaşarsanız:
- AWS S3 Documentation: https://docs.aws.amazon.com/s3/
- AWS IAM Documentation: https://docs.aws.amazon.com/iam/

