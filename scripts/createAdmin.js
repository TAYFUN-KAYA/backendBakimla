const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');
const connectDB = require('../config/db');

/**
 * İlk admin kullanıcı oluşturma scripti
 * 
 * Kullanım:
 * node scripts/createAdmin.js
 * 
 * Veya parametrelerle:
 * node scripts/createAdmin.js "Admin" "User" "admin@bakimla.com" "5551234567" "male" "1234"
 */

const createAdmin = async () => {
  try {
    // Veritabanına bağlan
    await connectDB();
    console.log('✅ Veritabanına bağlandı');

    // Komut satırı argümanlarını al
    const args = process.argv.slice(2);
    const firstName = args[0] || 'Admin';
    const lastName = args[1] || 'User';
    const email = args[2] || 'admin@bakimla.com';
    const phoneNumber = args[3] || '5554444444';
    const gender = args[4] || 'male';
    const password = args[5] || '123456';

    // Mevcut admin kontrolü
    const existingAdmin = await User.findOne({
      $or: [
        { email },
        { phoneNumber },
        { userType: 'admin' }
      ]
    });

    if (existingAdmin) {
      if (existingAdmin.userType === 'admin') {
        console.log('⚠️  Zaten bir admin kullanıcı mevcut:');
        console.log(`   Email: ${existingAdmin.email}`);
        console.log(`   Telefon: ${existingAdmin.phoneNumber}`);
        console.log('\n❌ Yeni admin oluşturulamadı. Mevcut admin kullanıcısını kullanın.');
        process.exit(1);
      } else {
        console.log(`⚠️  Bu email (${email}) veya telefon (${phoneNumber}) zaten kullanılıyor.`);
        process.exit(1);
      }
    }

    // Admin kullanıcı oluştur
    const admin = await User.create({
      firstName,
      lastName,
      email,
      phoneNumber,
      gender,
      password,
      userType: 'admin',
      isApproved: true, // Admin otomatik onaylı
    });

    console.log('\n✅ Admin kullanıcı başarıyla oluşturuldu!');
    console.log('\n📋 Admin Bilgileri:');
    console.log(`   Ad Soyad: ${admin.firstName} ${admin.lastName}`);
    console.log(`   Email: ${admin.email}`);
    console.log(`   Telefon: ${admin.phoneNumber}`);
    console.log(`   Kullanıcı Tipi: ${admin.userType}`);
    console.log(`   Şifre: ${password}`);
    console.log('\n⚠️  GÜVENLİK UYARISI: Şifreyi güvenli bir yerde saklayın ve ilk girişten sonra değiştirin!');
    console.log('\n🔐 Admin paneline giriş için:');
    console.log(`   1. Telefon numarası: ${phoneNumber}`);
    console.log('   2. OTP kodu gönderin');
    console.log('   3. Gelen OTP kodunu girin\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Hata:', error.message);
    if (error.code === 11000) {
      console.error('⚠️  Bu email veya telefon numarası zaten kullanılıyor.');
    }
    process.exit(1);
  }
};

// Scripti çalıştır
createAdmin();

