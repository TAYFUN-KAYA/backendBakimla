// MongoDB Query - User ve Store İlişkisini Kontrol Et

// 1. User'ın _id'sini al
db.users.findOne({ _id: ObjectId("6950e7e508938f953c57a8fe") })

// Sonuç:
{
  _id: ObjectId("6950e7e508938f953c57a8fe"),
  firstName: "Ahmet",
  lastName: "Yılmaz",
  userType: "company",
  activeStoreId: ObjectId("6950ea82b109b5fbc6039032") // ← Bu user'ın store'u
}

// 2. Bu user'ın store'unu bul
db.stores.findOne({ 
  companyId: ObjectId("6950e7e508938f953c57a8fe") 
})

// SONUÇ: Bu user'a ait store olmalı (companyId eşleşmeli)

// 3. Örneğinizdeki store'u kontrol et
db.stores.findOne({ 
  _id: ObjectId("695027e744db0a4207a530e1") 
})

// Sonuç:
{
  _id: ObjectId("695027e744db0a4207a530e1"),
  companyId: ObjectId("695027e744db0a4207a530db"), // ← FARKLI BİR USER
  storeName: "Este Saç Tasarım"
}

// 4. Bu store'un sahibi olan user'ı bul
db.users.findOne({ 
  _id: ObjectId("695027e744db0a4207a530db") 
})

// SONUÇ: Başka bir user olmalı (muhtemelen eski test data)

// ============================================
// ÖNEMLİ NOKTA
// ============================================

// User: 6950e7e508938f953c57a8fe (Ahmet Yılmaz - OTP ile kayıt)
//   ↓ activeStoreId
// Store: 6950ea82b109b5fbc6039032 (Bu user'ın store'u - react native'den oluşturuldu)

// User: 695027e744db0a4207a530db (Başka bir user - eski test)
//   ↓ 
// Store: 695027e744db0a4207a530e1 (Este Saç Tasarım - manuel veya eski API'den)

// Bu iki kayıt FARKLI user'lar ve store'lar!

