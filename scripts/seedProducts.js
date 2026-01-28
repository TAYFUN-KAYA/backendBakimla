require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const Product = require('../models/Product');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB bağlantısı başarılı');
  } catch (error) {
    console.error('MongoDB bağlantı hatası:', error);
    process.exit(1);
  }
};

const products = [
  {
    name: 'Lamer Cilt Bakımı Kremi',
    description: 'Yoğun nemlendirici etkisiyle cildinizi besleyen, yaşlanma karşıtı formülü ile kırışıklıkları azaltan premium cilt bakım kremi. Doğal bileşenlerle zenginleştirilmiş formülü sayesinde cildiniz gün boyu nemli ve pürüzsüz kalır.',
    shortDescription: 'Premium nemlendirici cilt bakım kremi',
    price: 100.00,
    discountPrice: 80.00,
    discountPercent: 20,
    category: 'Cilt Bakımı',
    subCategory: 'Nemlendiriciler',
    brand: 'La Mer',
    images: [
      'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400',
      'https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=400',
    ],
    stock: 50,
    options: [
      { name: 'Hacim', values: ['30ml', '50ml', '100ml'] },
    ],
    shippingInfo: {
      freeShipping: true,
      shippingCost: 0,
      estimatedDelivery: '2-3 iş günü',
    },
    returnPolicy: {
      returnable: true,
      returnDays: 14,
      returnDescription: 'Ücretsiz standart gönderim ve 14 gün ücretsiz iade.',
    },
    rating: { average: 4.7, count: 128 },
    targetGender: 'mix',
    isActive: true,
    isPublished: true,
    isFeatured: true,
    soldCount: 450,
  },
  {
    name: 'Nivea Soft Nemlendirici Krem',
    description: 'Hafif dokusuyla hızla emilen, E vitamini ve Jojoba yağı içeren çok amaçlı nemlendirici krem. Yüz, el ve vücut için uygundur. Cildi yumuşatır ve tüm gün nemlendirir.',
    shortDescription: 'Hafif dokulu çok amaçlı nemlendirici',
    price: 45.00,
    discountPrice: 38.00,
    discountPercent: 15,
    category: 'Cilt Bakımı',
    subCategory: 'Nemlendiriciler',
    brand: 'Nivea',
    images: [
      'https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=400',
    ],
    stock: 200,
    options: [
      { name: 'Hacim', values: ['50ml', '100ml', '200ml'] },
    ],
    shippingInfo: {
      freeShipping: false,
      shippingCost: 15,
      estimatedDelivery: '3-5 iş günü',
    },
    returnPolicy: {
      returnable: true,
      returnDays: 14,
      returnDescription: '14 gün içinde ücretsiz iade',
    },
    rating: { average: 4.5, count: 856 },
    targetGender: 'mix',
    isActive: true,
    isPublished: true,
    isFeatured: true,
    soldCount: 2340,
  },
  {
    name: 'L\'Oreal Paris Elvive Şampuan',
    description: 'Yıpranmış ve kuru saçlar için özel formüle edilmiş onarıcı şampuan. Keratinle zenginleştirilmiş formülü saç kırıklarını onarır ve saça parlak bir görünüm kazandırır.',
    shortDescription: 'Onarıcı saç şampuanı',
    price: 65.00,
    category: 'Saç Bakımı',
    subCategory: 'Şampuanlar',
    brand: 'L\'Oreal Paris',
    images: [
      'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=400',
    ],
    stock: 150,
    options: [
      { name: 'Hacim', values: ['250ml', '400ml', '700ml'] },
    ],
    shippingInfo: {
      freeShipping: false,
      shippingCost: 12,
      estimatedDelivery: '2-4 iş günü',
    },
    returnPolicy: {
      returnable: true,
      returnDays: 14,
      returnDescription: '14 gün içinde iade',
    },
    rating: { average: 4.3, count: 456 },
    targetGender: 'woman',
    isActive: true,
    isPublished: true,
    isFeatured: false,
    soldCount: 1200,
  },
  {
    name: 'MAC Ruby Woo Ruj',
    description: 'İkonik kırmızı tonuyla MAC\'in en çok satan matı rujlarından biri. Yoğun pigmentasyonu ve uzun kalıcı formülü ile dudaklarınızı gün boyu renkli tutar.',
    shortDescription: 'İkonik mat kırmızı ruj',
    price: 220.00,
    discountPrice: 185.00,
    discountPercent: 16,
    category: 'Makyaj',
    subCategory: 'Dudak',
    brand: 'MAC',
    images: [
      'https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=400',
    ],
    stock: 80,
    options: [
      { name: 'Renk', values: ['Ruby Woo', 'Chili', 'Velvet Teddy'] },
    ],
    shippingInfo: {
      freeShipping: true,
      shippingCost: 0,
      estimatedDelivery: '1-2 iş günü',
    },
    returnPolicy: {
      returnable: false,
      returnDays: 0,
      returnDescription: 'Hijyen ürünlerinde iade yapılmamaktadır',
    },
    rating: { average: 4.9, count: 2340 },
    targetGender: 'woman',
    isActive: true,
    isPublished: true,
    isFeatured: true,
    soldCount: 5600,
  },
  {
    name: 'The Ordinary Niacinamide 10% + Zinc 1%',
    description: 'Gözenek görünümünü azaltan ve cilt tonunu eşitleyen serum. Niacinamide ve çinko kombinasyonu ile yağlanmayı kontrol eder ve sivilce izlerini azaltır.',
    shortDescription: 'Gözenek küçültücü serum',
    price: 89.00,
    category: 'Cilt Bakımı',
    subCategory: 'Serumlar',
    brand: 'The Ordinary',
    images: [
      'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400',
    ],
    stock: 120,
    options: [
      { name: 'Hacim', values: ['30ml', '60ml'] },
    ],
    shippingInfo: {
      freeShipping: false,
      shippingCost: 10,
      estimatedDelivery: '2-3 iş günü',
    },
    returnPolicy: {
      returnable: true,
      returnDays: 14,
      returnDescription: 'Açılmamış ürünlerde 14 gün iade',
    },
    rating: { average: 4.6, count: 1890 },
    targetGender: 'mix',
    isActive: true,
    isPublished: true,
    isFeatured: true,
    soldCount: 3400,
  },
  {
    name: 'Chanel No. 5 Parfüm',
    description: 'Efsanevi çiçeksi-aldehit parfüm. Ylang-ylang, gül ve yasemin notalarıyla zamansız bir klasik. 1921\'den beri kadınların vazgeçilmezi.',
    shortDescription: 'Efsanevi kadın parfümü',
    price: 1850.00,
    discountPrice: 1650.00,
    discountPercent: 11,
    category: 'Parfüm',
    subCategory: 'Kadın Parfümleri',
    brand: 'Chanel',
    images: [
      'https://images.unsplash.com/photo-1541643600914-78b084683601?w=400',
    ],
    stock: 30,
    options: [
      { name: 'Hacim', values: ['35ml', '50ml', '100ml'] },
    ],
    shippingInfo: {
      freeShipping: true,
      shippingCost: 0,
      estimatedDelivery: '1-2 iş günü',
    },
    returnPolicy: {
      returnable: false,
      returnDays: 0,
      returnDescription: 'Parfümlerde iade yapılmamaktadır',
    },
    rating: { average: 4.8, count: 3200 },
    targetGender: 'woman',
    isActive: true,
    isPublished: true,
    isFeatured: true,
    soldCount: 890,
  },
  {
    name: 'Gillette Fusion ProGlide Tıraş Bıçağı',
    description: '5 bıçaklı teknolojisi ile yakın ve konforlu tıraş sağlar. FlexBall teknolojisi yüzün her hattına uyum sağlar.',
    shortDescription: 'Premium erkek tıraş bıçağı',
    price: 125.00,
    discountPrice: 99.00,
    discountPercent: 21,
    category: 'Erkek Bakım',
    subCategory: 'Tıraş',
    brand: 'Gillette',
    images: [
      'https://images.unsplash.com/photo-1621607512214-68297480165e?w=400',
    ],
    stock: 200,
    options: [
      { name: 'Yedek Bıçak', values: ['2li', '4lü', '8li'] },
    ],
    shippingInfo: {
      freeShipping: false,
      shippingCost: 15,
      estimatedDelivery: '2-4 iş günü',
    },
    returnPolicy: {
      returnable: true,
      returnDays: 14,
      returnDescription: 'Açılmamış ürünlerde 14 gün iade',
    },
    rating: { average: 4.4, count: 567 },
    targetGender: 'man',
    isActive: true,
    isPublished: true,
    isFeatured: false,
    soldCount: 1800,
  },
  {
    name: 'Clinique Moisture Surge',
    description: '72 saat nemlendirme sağlayan gel krem. Hyaluronik asit ile zenginleştirilmiş formülü cildi yoğun şekilde nemlendirir.',
    shortDescription: '72 saat nemlendirici jel krem',
    price: 350.00,
    category: 'Cilt Bakımı',
    subCategory: 'Nemlendiriciler',
    brand: 'Clinique',
    images: [
      'https://images.unsplash.com/photo-1611930022073-b7a4ba5fcccd?w=400',
    ],
    stock: 60,
    options: [
      { name: 'Hacim', values: ['30ml', '50ml', '75ml'] },
    ],
    shippingInfo: {
      freeShipping: true,
      shippingCost: 0,
      estimatedDelivery: '2-3 iş günü',
    },
    returnPolicy: {
      returnable: true,
      returnDays: 14,
      returnDescription: 'Ücretsiz iade',
    },
    rating: { average: 4.7, count: 890 },
    targetGender: 'mix',
    isActive: true,
    isPublished: true,
    isFeatured: true,
    soldCount: 2100,
  },
  {
    name: 'Bioderma Sensibio H2O Misel Su',
    description: 'Hassas ciltler için özel formüle edilmiş temizleyici misel su. Makyajı ve kirleri nazikçe temizler, cildi tahriş etmez.',
    shortDescription: 'Hassas ciltler için misel su',
    price: 145.00,
    discountPrice: 120.00,
    discountPercent: 17,
    category: 'Cilt Bakımı',
    subCategory: 'Temizleyiciler',
    brand: 'Bioderma',
    images: [
      'https://images.unsplash.com/photo-1570194065650-d99fb4d96598?w=400',
    ],
    stock: 180,
    options: [
      { name: 'Hacim', values: ['100ml', '250ml', '500ml'] },
    ],
    shippingInfo: {
      freeShipping: false,
      shippingCost: 12,
      estimatedDelivery: '2-4 iş günü',
    },
    returnPolicy: {
      returnable: true,
      returnDays: 14,
      returnDescription: '14 gün içinde iade',
    },
    rating: { average: 4.8, count: 2456 },
    targetGender: 'mix',
    isActive: true,
    isPublished: true,
    isFeatured: false,
    soldCount: 4500,
  },
  {
    name: 'Dior Sauvage EDP',
    description: 'Taze ve baharatlı erkek parfümü. Bergamot, biber ve ambroxan notaları ile maskülen ve çekici bir koku.',
    shortDescription: 'Maskülen erkek parfümü',
    price: 1450.00,
    category: 'Parfüm',
    subCategory: 'Erkek Parfümleri',
    brand: 'Dior',
    images: [
      'https://images.unsplash.com/photo-1594035910387-fea47794261f?w=400',
    ],
    stock: 45,
    options: [
      { name: 'Hacim', values: ['60ml', '100ml', '200ml'] },
    ],
    shippingInfo: {
      freeShipping: true,
      shippingCost: 0,
      estimatedDelivery: '1-2 iş günü',
    },
    returnPolicy: {
      returnable: false,
      returnDays: 0,
      returnDescription: 'Parfümlerde iade yapılmamaktadır',
    },
    rating: { average: 4.9, count: 1890 },
    targetGender: 'man',
    isActive: true,
    isPublished: true,
    isFeatured: true,
    soldCount: 1200,
  },
];

const seedProducts = async () => {
  try {
    await connectDB();

    // Kozmetik mağaza ürünleri: companyId yok (admin ürünü), sadece admin panelden yönetilir
    for (const product of products) {
      const existingProduct = await Product.findOne({ name: product.name });
      if (!existingProduct) {
        await Product.create({ ...product, companyId: null });
        console.log(`Ürün eklendi: ${product.name}`);
      } else {
        console.log(`Ürün zaten mevcut: ${product.name}`);
      }
    }

    console.log('Seed işlemi tamamlandı');
    process.exit(0);
  } catch (error) {
    console.error('Seed hatası:', error);
    process.exit(1);
  }
};

seedProducts();
