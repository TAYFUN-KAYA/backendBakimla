const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcrypt');
const path = require('path');

// Models
const User = require('../models/User');
const Store = require('../models/Store');
const Product = require('../models/Product');
const Appointment = require('../models/Appointment');
const Customer = require('../models/Customer');
const { Wallet, WalletTransaction, WithdrawalRequest } = require('../models/Wallet');
const Campaign = require('../models/Campaign');
const Coupon = require('../models/Coupon');
const Accounting = require('../models/Accounting');
const Address = require('../models/Address');
const Basket = require('../models/Basket');
const Favorite = require('../models/Favorite');
const Form = require('../models/Form');
const Invoice = require('../models/Invoice');
const Notification = require('../models/Notification');
const OTP = require('../models/OTP');
const Order = require('../models/Order');
const Payment = require('../models/Payment');
const PaymentMethod = require('../models/PaymentMethod');
const { Points, PointsTransaction } = require('../models/Points');
const Review = require('../models/Review');

// Load env vars
dotenv.config({ path: path.join(__dirname, '../.env') });

const seedData = async () => {
  try {
    console.log('⏳ Veritabanına bağlanılıyor...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Bağlandı.');

    console.log('🧹 Eski veriler temizleniyor...');
    const modelMapping = {
      User, Store, Product, Appointment, Customer, Wallet, WalletTransaction, WithdrawalRequest,
      Campaign, Coupon, Accounting, Address, Basket, Favorite, Form, Invoice, Notification,
      OTP, Order, Payment, PaymentMethod, Points, PointsTransaction, Review
    };

    for (const [name, model] of Object.entries(modelMapping)) {
      if (model && typeof model.deleteMany === 'function') {
        process.stdout.write(`  - ${name} temizleniyor... `);
        await model.deleteMany({});
        console.log('✅');
      } else {
        console.warn(`  ⚠️  Hatalı model: ${name} (deleteMany fonksiyonu bulunamadı!)`);
      }
    }
    console.log('✅ Tüm koleksiyonlar temizlendi.');

    console.log('🚀 100% Kapsamlı Fake datalar oluşturuluyor...');

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);

    // 1. Users
    const adminUser = await User.create({
      firstName: 'Admin', lastName: 'Bakimla', gender: 'male', email: 'admin@bakimla.com',
      phoneNumber: '5550000001', password: hashedPassword, userType: 'admin', isApproved: true
    });

    const companyUser = await User.create({
      firstName: 'Ahmet', lastName: 'Sirket', gender: 'male', email: 'company@este.com',
      phoneNumber: '5441112233', password: hashedPassword, userType: 'company', isApproved: true
    });

    const employeeUser = await User.create({
      firstName: 'Mehmet', lastName: 'Calisan', gender: 'male', email: 'employee@este.com',
      phoneNumber: '5331112233', password: hashedPassword, userType: 'employee',
      companyId: companyUser._id, isApproved: true
    });

    const normalUser = await User.create({
      firstName: 'Ali', lastName: 'Musteri', gender: 'male', email: 'ali@user.com',
      phoneNumber: '5051112233', password: hashedPassword, userType: 'user', isApproved: true
    });

    // 2. Stores
    const stores = await Store.create([{
      companyId: companyUser._id,
      storeName: 'Este Saç Tasarım',
      authorizedPersonName: 'Ahmet Sirket',
      authorizedPersonTCKN: '12345678901',
      businessName: 'Este LTD',
      taxOffice: 'Beşiktaş', taxNumber: '1234567890',
      iban: 'TR123456789012345678901234',
      businessDescription: 'Profesyonel saç tasarımı merkezi.',
      businessPassword: 'password123',
      interiorImage: 'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f',
      exteriorImage: 'https://images.unsplash.com/photo-1560066984-138dadb4c035',
      appIcon: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9',
      sectors: ['Erkek Kuaförü'],
      serviceType: 'Haircut', serviceDuration: 45, servicePrice: 500,
      serviceCategory: 'Hair', businessField: 'Beauty',
      workingDays: [{ day: 'monday', startTime: '09:00', endTime: '20:00', isOpen: true }]
    }]);
    const store = stores[0];

    // Update company with active store
    companyUser.activeStoreId = store._id;
    await companyUser.save();

    // 3. Addresses
    const addresses = await Address.create([{
      userId: normalUser._id, title: 'Ev', firstName: 'Ali', lastName: 'Musteri',
      phoneNumber: '5051112233', addressLine1: 'Etiler Mah. No:1', city: 'İstanbul', district: 'Beşiktaş',
      isDefault: true, isBillingAddress: true
    }]);
    const address = addresses[0];

    // 4. Products
    const products = await Product.create([{
      companyId: companyUser._id, name: 'Saç Serumu', price: 200, category: 'Bakım', stock: 100, isPublished: true
    }]);
    const product = products[0];

    // 5. Campaigns & Coupons
    const campaigns = await Campaign.create([{
      companyId: companyUser._id, title: 'Yaz Fırsatı', shortDescription: '%20 İndirim', serviceCategory: 'Hair',
      discountType: 'percentage', discountValue: 20, startDate: new Date(), endDate: new Date(Date.now() + 10e8),
      visibilityDuration: 30, image: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9', isActive: true
    }]);
    const coupons = await Coupon.create([{
      companyId: companyUser._id, code: 'WELCOME20', title: 'Hoşgeldin', description: 'İlk randevu indirimi',
      discountType: 'amount', discountValue: 50, startDate: new Date(), endDate: new Date(Date.now() + 10e8), isActive: true
    }]);

    // 6. Customers
    const customers = await Customer.create([{
      companyId: companyUser._id, firstName: 'Ali', lastName: 'Musteri', email: 'ali@user.com', phoneNumber: '5051112233', gender: 'male'
    }]);
    const customer = customers[0];

    // 7. Appointments
    const appointments = await Appointment.create([{
      customerIds: [customer._id], userId: normalUser._id, companyId: companyUser._id, employeeId: employeeUser._id,
      appointmentDate: new Date(), appointmentTime: '10:00', serviceCategory: 'Hair', taskType: 'Standard',
      serviceType: 'Haircut', serviceDuration: 45, servicePrice: 500, paymentMethod: 'card', status: 'completed',
      isApproved: true, paymentReceived: true, totalPrice: 500
    }]);
    const appointment = appointments[0];

    // 8. Payments
    const payments = await Payment.create([{
      companyId: companyUser._id, appointmentId: appointment._id, price: 500, paymentStatus: 'success', buyerId: customer._id
    }]);
    const payment = payments[0];

    // 9. Orders
    const orders = await Order.create([{
      userId: normalUser._id, orderNumber: `ORD-${Date.now()}-123`,
      items: [{ productId: product._id, productName: product.name, quantity: 1, unitPrice: 200, totalPrice: 200 }],
      subtotal: 200, total: 200, shippingAddress: address._id, billingAddress: address._id, paymentMethod: 'card', paymentStatus: 'paid', status: 'delivered'
    }]);
    const order = orders[0];

    // 10. Accounting
    await Accounting.create([{
      companyId: companyUser._id, employeeId: employeeUser._id, date: new Date(), income: 500, description: 'Randevu ödemesi', category: 'Hizmet', paymentMethod: 'card'
    }]);

    // 11. Wallets
    const wallet = await Wallet.create({ companyId: companyUser._id, balance: 500, totalEarnings: 500 });
    await WalletTransaction.create({
      walletId: wallet._id, companyId: companyUser._id, type: 'deposit', amount: 500,
      balanceBefore: 0, balanceAfter: 500, status: 'completed', description: 'Initial seed deposit'
    });

    // 12. Points
    await Points.create({ userId: normalUser._id, totalPoints: 100, availablePoints: 100, totalValueInTL: 10 });
    await PointsTransaction.create({ userId: normalUser._id, type: 'earned', points: 100, source: 'appointment', sourceAmount: 500, appointmentId: appointment._id });

    // 13. Notifications
    await Notification.create([{ userId: normalUser._id, title: 'Randevu Onaylandı', message: 'Randevunuz onaylandı.', type: 'appointment', relatedId: appointment._id, relatedModel: 'Appointment' }]);

    // 14. Reviews
    await Review.create([{
      userId: normalUser._id, companyId: companyUser._id, appointmentId: appointment._id, employeeId: employeeUser._id,
      rating: 5, comment: 'Harika hizmet!', reviewType: 'appointment', isPublished: true, isVerified: true
    }]);

    // 15. Basket
    await Basket.create([{ userId: normalUser._id, items: [{ productId: product._id, quantity: 1 }], subtotal: 200, total: 200 }]);

    // 16. Favorites
    await Favorite.create([
      { userId: normalUser._id, favoriteType: 'store', storeId: store._id },
      { userId: normalUser._id, favoriteType: 'product', productId: product._id }
    ]);

    // 17. Forms
    await Form.create([{ firstName: 'Ziyaretçi', lastName: 'Bir', email: 'ziyaretci@mail.com', message: 'İletişim mesajı' }]);

    // 18. Invoices
    await Invoice.create([{
      userId: normalUser._id, appointmentId: appointment._id, parasutInvoiceId: 'INV-123456', invoiceNumber: 'A-001',
      issueDate: new Date(), dueDate: new Date(), subtotal: 500, total: 500, status: 'paid', billingAddress: address._id
    }]);

    // 19. OTP
    await OTP.create([{ phoneNumber: '5051112233', code: '123456', purpose: 'login', expiresAt: new Date(Date.now() + 300000) }]);

    // 20. PaymentMethods
    await PaymentMethod.create([{
      userId: normalUser._id, iyzicoCardToken: 'token123', iyzicoCardUserKey: 'key123', lastFourDigits: '1234', cardHolderName: 'Ali Musteri', isDefault: true
    }]);

    console.log('✨ TÜM VERİLER BAŞARIYLA OLUŞTURULDU!');
    process.exit(0);
  } catch (error) {
    console.error('❌ HATA:', error.message);
    if (error.errors) {
      console.error('📋 Detaylar:', Object.entries(error.errors).map(([key, err]) => `${key}: ${err.message}`).join(', '));
    }
    process.exit(1);
  }
};

seedData();
