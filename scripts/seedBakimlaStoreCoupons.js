require('dotenv').config();
const mongoose = require('mongoose');
const BakimlaStoreCoupon = require('../models/BakimlaStoreCoupon');
const connectDB = require('../config/db');

const fakeCoupons = [
  {
    code: 'BAKIMLA10',
    name: 'Bakımla Hoş Geldin İndirimi',
    description: 'İlk alışverişinizde %10 indirim',
    discountType: 'percentage',
    discountValue: 10,
    startDate: new Date('2024-01-01'),
    endDate: new Date('2025-12-31'),
    minPurchaseAmount: 100,
    usageLimit: null,
    isActive: true,
  },
  {
    code: '2020',
    name: 'Yılbaşı Özel',
    description: 'Promosyon Kodum 2020',
    discountType: 'percentage',
    discountValue: 10,
    startDate: new Date('2024-01-01'),
    endDate: new Date('2025-12-31'),
    minPurchaseAmount: 0,
    usageLimit: 1000,
    isActive: true,
  },
  {
    code: 'BAKIMLA50',
    name: 'Büyük İndirim',
    description: '50 TL ve üzeri alışverişlerde 50 TL indirim',
    discountType: 'amount',
    discountValue: 50,
    startDate: new Date('2024-01-01'),
    endDate: new Date('2025-12-31'),
    minPurchaseAmount: 500,
    usageLimit: 500,
    isActive: true,
  },
  {
    code: 'YENI15',
    name: 'Yeni Üye İndirimi',
    description: 'Yeni üyelere özel %15 indirim',
    discountType: 'percentage',
    discountValue: 15,
    startDate: new Date('2024-01-01'),
    endDate: new Date('2025-12-31'),
    minPurchaseAmount: 200,
    usageLimit: null,
    isActive: true,
  },
  {
    code: 'SEZON20',
    name: 'Sezon Sonu',
    description: 'Sezon sonu özel %20 indirim',
    discountType: 'percentage',
    discountValue: 20,
    startDate: new Date('2024-01-01'),
    endDate: new Date('2025-12-31'),
    minPurchaseAmount: 300,
    usageLimit: 200,
    isActive: true,
  },
];

const seedCoupons = async () => {
  try {
    await connectDB();
    console.log('Veritabanına bağlandı...');

    // Mevcut kuponları temizle (opsiyonel)
    // await BakimlaStoreCoupon.deleteMany({});
    // console.log('Mevcut kuponlar temizlendi...');

    // Kuponları ekle
    for (const coupon of fakeCoupons) {
      const existingCoupon = await BakimlaStoreCoupon.findOne({ code: coupon.code });
      if (!existingCoupon) {
        await BakimlaStoreCoupon.create(coupon);
        console.log(`✅ Kupon eklendi: ${coupon.code} - ${coupon.name}`);
      } else {
        console.log(`⏭️  Kupon zaten var: ${coupon.code}`);
      }
    }

    console.log('\n✅ Fake kuponlar başarıyla eklendi!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Hata:', error);
    process.exit(1);
  }
};

seedCoupons();
