require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');

// Models
const User = require('../models/User');
const Store = require('../models/Store');
const Customer = require('../models/Customer');
const Product = require('../models/Product');
const Appointment = require('../models/Appointment');
const { Wallet, WalletTransaction, WithdrawalRequest } = require('../models/Wallet');
const { Points, PointsTransaction } = require('../models/Points');
const Address = require('../models/Address');
const Order = require('../models/Order');
const Coupon = require('../models/Coupon');

const seedData = async () => {
  try {
    await connectDB();
    console.log('✅ Veritabanına bağlandı');

    const clean = process.argv.includes('--clean');

    if (clean) {
      console.log('⚠️  Veritabanı temizleniyor...');
      await User.deleteMany({});
      await Store.deleteMany({});
      await Customer.deleteMany({});
      await Product.deleteMany({});
      await Appointment.deleteMany({});
      await Wallet.deleteMany({});
      await WalletTransaction.deleteMany({});
      await Points.deleteMany({});
      await PointsTransaction.deleteMany({});
      await Address.deleteMany({});
      await Order.deleteMany({});
      await Coupon.deleteMany({});
      await WithdrawalRequest.deleteMany({});
      console.log('✅ Veritabanı temizlendi');
    }

    // --- 1. Admin Oluştur ---
    console.log('🚀 Admin oluşturuluyor...');
    const admin = await User.create({
      firstName: 'Bakimla',
      lastName: 'Admin',
      email: 'admin@bakimla.com',
      phoneNumber: '5550000000',
      gender: 'male',
      password: 'Admin123!',
      userType: 'admin',
      isApproved: true
    });
    console.log('✅ Admin oluşturuldu');

    // --- 2. Normal Kullanıcılar ---
    console.log('🚀 Normal kullanıcılar oluşturuluyor...');
    const usersData = [
      { firstName: 'Murat', lastName: 'Boz', email: 'murat@gmail.com', phoneNumber: '5559998877', gender: 'male', password: 'User123!', userType: 'user', isApproved: true },
      { firstName: 'Selin', lastName: 'Işık', email: 'selin@gmail.com', phoneNumber: '5559994433', gender: 'female', password: 'User123!', userType: 'user', isApproved: true }
    ];

    const createdUsers = [];
    for (const u of usersData) {
      const user = await User.create(u);
      
      // Her kullanıcı için puan hesabı oluştur
      await Points.create({
        userId: user._id,
        totalPoints: 500,
        availablePoints: 500,
        totalValueInTL: 50
      });

      await PointsTransaction.create({
        userId: user._id,
        type: 'earned',
        points: 500,
        valueInTL: 50,
        description: 'Hoş geldin bonusu',
        source: 'bonus'
      });

      // Her kullanıcı için bir adres oluştur
      await Address.create({
        userId: user._id,
        title: 'Ev',
        firstName: user.firstName,
        lastName: user.lastName,
        phoneNumber: user.phoneNumber,
        addressLine1: 'Atatürk Mah. Gül Sokak No:5',
        city: 'İstanbul',
        district: 'Ataşehir',
        isDefault: true
      });

      createdUsers.push(user);
    }
    console.log('✅ Normal kullanıcılar, puanları ve adresleri oluşturuldu');

    // --- 3. Şirketler ve Verileri ---
    const companiesData = [
      {
        firstName: 'Ahmet',
        lastName: 'Yılmaz',
        email: 'ahmet@berber.com',
        phoneNumber: '5551111111',
        gender: 'male',
        password: 'Password123!',
        userType: 'company',
        isApproved: true,
        store: {
          storeName: 'Elite Erkek Kuaförü',
          authorizedPersonName: 'Ahmet Yılmaz',
          authorizedPersonTCKN: '12345678901',
          businessName: 'Yılmaz Berber Ltd. Şti.',
          taxOffice: 'Kadıköy',
          taxNumber: '1112223334',
          iban: 'TR123456789012345678901234',
          businessDescription: 'Profesyonel erkek saç ve sakal tasarımı.',
          businessPassword: 'storepassword123',
          interiorImage: 'https://picsum.photos/800/600',
          exteriorImage: 'https://picsum.photos/800/600',
          appIcon: 'https://picsum.photos/200/200',
          workingDays: [
            { day: 'monday', startTime: '09:00', endTime: '20:00' },
            { day: 'tuesday', startTime: '09:00', endTime: '20:00' },
            { day: 'wednesday', startTime: '09:00', endTime: '20:00' },
            { day: 'thursday', startTime: '09:00', endTime: '20:00' },
            { day: 'friday', startTime: '09:00', endTime: '20:00' },
            { day: 'saturday', startTime: '09:00', endTime: '22:00' }
          ],
          sectors: ['Berber'],
          serviceType: 'Haircut',
          serviceDuration: 30,
          servicePrice: 150,
          serviceCategory: 'Men',
          businessField: 'Beauty'
        },
        employees: [
          { firstName: 'Mehmet', lastName: 'Can', email: 'mehmet@berber.com', phoneNumber: '5551111112', gender: 'male' },
          { firstName: 'Can', lastName: 'Demir', email: 'can@berber.com', phoneNumber: '5551111113', gender: 'male' }
        ],
        products: [
          { name: 'Saç Jölesi', price: 80, category: 'Bakım', stock: 20 },
          { name: 'Sakal Yağı', price: 120, category: 'Bakım', stock: 15 }
        ],
        customers: [
          { firstName: 'Veli', lastName: 'Öztürk', phoneNumber: '5552221122', notes: 'Düzenli müşteri' }
        ]
      },
      {
        firstName: 'Ayşe',
        lastName: 'Kaya',
        email: 'ayse@guzellik.com',
        phoneNumber: '5553333333',
        gender: 'female',
        password: 'Password123!',
        userType: 'company',
        isApproved: true,
        store: {
          storeName: 'Gül Güzellik Salonu',
          authorizedPersonName: 'Ayşe Kaya',
          authorizedPersonTCKN: '98765432101',
          businessName: 'Kaya Güzellik A.Ş.',
          taxOffice: 'Beşiktaş',
          taxNumber: '4443332221',
          iban: 'TR987654321098765432109876',
          businessDescription: 'Cilt bakımı ve lazer epilasyon uzmanı.',
          businessPassword: 'storepassword456',
          interiorImage: 'https://picsum.photos/800/600',
          exteriorImage: 'https://picsum.photos/800/600',
          appIcon: 'https://picsum.photos/200/200',
          workingDays: [
            { day: 'monday', startTime: '10:00', endTime: '19:00' },
            { day: 'tuesday', startTime: '10:00', endTime: '19:00' },
            { day: 'wednesday', startTime: '10:00', endTime: '19:00' },
            { day: 'thursday', startTime: '10:00', endTime: '19:00' },
            { day: 'friday', startTime: '10:00', endTime: '19:00' }
          ],
          sectors: ['Güzellik Salonu'],
          serviceType: 'Skin Care',
          serviceDuration: 60,
          servicePrice: 450,
          serviceCategory: 'Women',
          businessField: 'Beauty'
        },
        employees: [
          { firstName: 'Fatma', lastName: 'Aydın', email: 'fatma@guzellik.com', phoneNumber: '5553333334', gender: 'female' }
        ],
        products: [
          { name: 'Yüz Kremi', price: 350, category: 'Cilt Bakımı', stock: 10 }
        ],
        customers: [
          { firstName: 'Zeynep', lastName: 'Aksoy', phoneNumber: '5554443322', notes: 'Lazer müşterisi' }
        ]
      }
    ];

    for (const compData of companiesData) {
      console.log(`🚀 ${compData.store.storeName} için veriler oluşturuluyor...`);
      
      const { store, employees, products, customers, ...userData } = compData;
      
      // Şirket Kullanıcısı
      const companyUser = await User.create(userData);
      
      // Şirket Cüzdanı
      const wallet = await Wallet.create({
        companyId: companyUser._id,
        balance: 2500,
        totalEarnings: 3000,
        totalWithdrawals: 500
      });

      await WalletTransaction.create({
        walletId: wallet._id,
        companyId: companyUser._id,
        type: 'deposit',
        amount: 3000,
        balanceBefore: 0,
        balanceAfter: 3000,
        description: 'Satış kazançları',
        status: 'completed'
      });

      // Para Çekme Talebi
      await WithdrawalRequest.create({
        companyId: companyUser._id,
        walletId: wallet._id,
        amount: 400,
        iban: compData.store.iban,
        accountHolderName: compData.store.authorizedPersonName,
        status: 'pending'
      });
      
      // Mağaza
      const newStore = await Store.create({
        ...store,
        companyId: companyUser._id
      });
      
      // Şirket kullanıcısını mağazaya bağla
      companyUser.activeStoreId = newStore._id;
      await companyUser.save();

      // Çalışanlar
      const createdEmployees = [];
      for (const emp of employees) {
        const employee = await User.create({
          ...emp,
          password: 'Employee123!',
          userType: 'employee',
          companyId: companyUser._id,
          isApproved: true
        });
        createdEmployees.push(employee);
      }

      // Ürünler
      const createdProducts = [];
      for (const prod of products) {
        const product = await Product.create({
          ...prod,
          companyId: companyUser._id,
          isPublished: true
        });
        createdProducts.push(product);
      }

      // Kupon
      const coupon = await Coupon.create({
        companyId: companyUser._id,
        code: `${compData.store.storeName.substring(0, 3).toUpperCase()}20`,
        title: 'Açılışa Özel İndirim',
        description: 'Tüm hizmetlerde %20 indirim',
        discountType: 'percentage',
        discountValue: 20,
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        isActive: true
      });

      // Müşteriler
      const createdCustomers = [];
      for (const cust of customers) {
        const customer = await Customer.create({
          ...cust,
          companyId: companyUser._id
        });
        createdCustomers.push(customer);
      }

      // Randevular
      console.log(`📅 ${compData.store.storeName} için randevular...`);
      await Appointment.create({
        customerIds: [createdCustomers[0]._id],
        companyId: companyUser._id,
        employeeId: createdEmployees[0]._id,
        appointmentDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
        appointmentTime: '10:00',
        serviceCategory: compData.store.serviceCategory,
        taskType: compData.store.serviceType,
        serviceType: 'Standart Hizmet',
        serviceDuration: compData.store.serviceDuration,
        servicePrice: compData.store.servicePrice,
        paymentMethod: 'cash',
        status: 'completed',
        isApproved: true,
        paymentReceived: true,
        totalPrice: compData.store.servicePrice
      });

      // Sipariş (Murat Boz için)
      console.log(`📦 ${compData.store.storeName} için sipariş...`);
      const userAddr = await Address.findOne({ userId: createdUsers[0]._id });
      await Order.create({
        userId: createdUsers[0]._id,
        orderNumber: `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        items: [
          {
            productId: createdProducts[0]._id,
            productName: createdProducts[0].name,
            quantity: 2,
            unitPrice: createdProducts[0].price,
            totalPrice: createdProducts[0].price * 2
          }
        ],
        subtotal: createdProducts[0].price * 2,
        total: createdProducts[0].price * 2,
        shippingAddress: userAddr._id,
        billingAddress: userAddr._id,
        paymentMethod: 'card',
        paymentStatus: 'paid',
        status: 'confirmed'
      });
      
      console.log(`✅ ${compData.store.storeName} verileri tamamlandı`);
    }

    console.log('\n✨ Seeding tamamlandı! ✨');
    process.exit(0);
  } catch (error) {
    console.error('❌ Hata:', error);
    process.exit(1);
  }
};

seedData();
