const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');
const connectDB = require('../config/db');

/**
 * Estetisyen tipinde 3 çalışan kullanıcı oluşturma scripti
 * 
 * Kullanım:
 * node scripts/seedEstetisyenEmployees.js
 * 
 * Script önce bir company user bulur veya oluşturur,
 * sonra bu company'e bağlı 3 Estetisyen çalışan ekler.
 */

const seedEstetisyenEmployees = async () => {
  try {
    // Veritabanına bağlan
    await connectDB();
    console.log('✅ Veritabanına bağlandı');

    // Önce bir company user bul veya oluştur
    let companyUser = await User.findOne({ userType: 'company' });

    if (!companyUser) {
      console.log('⚠️  Company user bulunamadı, yeni bir tane oluşturuluyor...');
      companyUser = await User.create({
        firstName: 'Güzellik',
        lastName: 'Merkezi',
        gender: 'female',
        email: 'guzellik.merkezi@bakimla.com',
        phoneNumber: '5551112233',
        userType: 'company',
        isApproved: true,
      });
      console.log(`✅ Company user oluşturuldu: ${companyUser.firstName} ${companyUser.lastName} (ID: ${companyUser._id})`);
    } else {
      console.log(`✅ Mevcut company user kullanılıyor: ${companyUser.firstName} ${companyUser.lastName} (ID: ${companyUser._id})`);
    }

    // Estetisyen çalışanları oluştur
    const estetisyenEmployees = [
      {
        firstName: 'Mert',
        lastName: 'Köse',
        gender: 'male',
        email: 'mert.kose@bakimla.com',
        phoneNumber: '5551112234',
        userType: 'employee',
        companyId: companyUser._id,
        jobTitle: 'Estetisyen',
        position: 'estetisyen',
        profileImage: 'https://randomuser.me/api/portraits/men/32.jpg',
        isApproved: true,
        bio: '5 yıllık tecrübeli estetisyen. Cilt bakımı ve makyaj konusunda uzman.',
        expertiseDocuments: [
          'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=800',
          'https://images.unsplash.com/photo-1605497788044-5a32c7078486?w=800',
          'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800',
        ],
        workExamples: [
          {
            type: 'öncesi',
            url: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=800',
          },
          {
            type: 'sonrası',
            url: 'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=800',
          },
          {
            type: 'öncesi',
            url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800',
          },
          {
            type: 'sonrası',
            url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800',
          },
        ],
      },
      {
        firstName: 'Zeynep',
        lastName: 'Yolcu',
        gender: 'female',
        email: 'zeynep.yolcu@bakimla.com',
        phoneNumber: '5551112235',
        userType: 'employee',
        companyId: companyUser._id,
        jobTitle: 'Estetisyen',
        position: 'estetisyen',
        profileImage: 'https://randomuser.me/api/portraits/women/45.jpg',
        isApproved: true,
        bio: 'Profesyonel estetisyen. Kalıcı makyaj ve cilt bakım hizmetleri sunmaktadır.',
        expertiseDocuments: [
          'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=800',
          'https://images.unsplash.com/photo-1594750018712-77643025beb6?w=800',
          'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800',
        ],
        workExamples: [
          {
            type: 'öncesi',
            url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=800',
          },
          {
            type: 'sonrası',
            url: 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=800',
          },
          {
            type: 'öncesi',
            url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800',
          },
          {
            type: 'sonrası',
            url: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=800',
          },
        ],
      },
      {
        firstName: 'Elif',
        lastName: 'Demir',
        gender: 'female',
        email: 'elif.demir@bakimla.com',
        phoneNumber: '5551112236',
        userType: 'employee',
        companyId: companyUser._id,
        jobTitle: 'Estetisyen',
        position: 'estetisyen',
        profileImage: 'https://randomuser.me/api/portraits/women/68.jpg',
        isApproved: true,
        bio: 'Uzman estetisyen. Gelin makyajı ve özel günler için makyaj hizmetleri.',
        expertiseDocuments: [
          'https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?w=800',
          'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800',
          'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=800',
        ],
        workExamples: [
          {
            type: 'öncesi',
            url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=800',
          },
          {
            type: 'sonrası',
            url: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=800',
          },
          {
            type: 'öncesi',
            url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800',
          },
          {
            type: 'sonrası',
            url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800',
          },
        ],
      },
    ];

    console.log('\n🚀 Estetisyen çalışanları oluşturuluyor...\n');

    const createdEmployees = [];

    for (const employeeData of estetisyenEmployees) {
      // Mevcut kullanıcı kontrolü (email ve phoneNumber+userType kombinasyonu)
      const existingUserByEmail = await User.findOne({ email: employeeData.email });
      const existingUserByPhone = await User.findOne({
        phoneNumber: employeeData.phoneNumber,
        userType: 'employee',
      });

      if (existingUserByEmail || existingUserByPhone) {
        console.log(`⚠️  ${employeeData.firstName} ${employeeData.lastName} zaten mevcut (email: ${employeeData.email} veya telefon: ${employeeData.phoneNumber})`);
        continue;
      }

      try {
        const employee = await User.create(employeeData);
        createdEmployees.push(employee);
        console.log(`✅ ${employee.firstName} ${employee.lastName} oluşturuldu`);
        console.log(`   Email: ${employee.email}`);
        console.log(`   Telefon: ${employee.phoneNumber}`);
        console.log(`   Profile Image: ${employee.profileImage || 'Yok'}`);
        console.log(`   Expertise Documents: ${employee.expertiseDocuments?.length || 0} adet`);
        console.log(`   Work Examples: ${employee.workExamples?.length || 0} adet`);
        console.log(`   Company ID: ${employee.companyId}`);
        console.log(`   Job Title: ${employee.jobTitle}`);
        console.log(`   Position: ${employee.position}\n`);
      } catch (error) {
        if (error.code === 11000) {
          console.log(`⚠️  ${employeeData.firstName} ${employeeData.lastName} zaten mevcut (duplicate key error)`);
        } else {
          console.error(`❌ ${employeeData.firstName} ${employeeData.lastName} oluşturulurken hata:`, error.message);
        }
      }
    }

    console.log(`\n✅ Toplam ${createdEmployees.length} estetisyen çalışanı başarıyla oluşturuldu!`);

    if (createdEmployees.length === 0) {
      console.log('⚠️  Yeni çalışan oluşturulmadı. Tüm çalışanlar zaten mevcut olabilir.');
    }

    console.log('\n📋 Oluşturulan Çalışanlar:');
    createdEmployees.forEach((emp, index) => {
      console.log(`\n${index + 1}. ${emp.firstName} ${emp.lastName}`);
      console.log(`   Email: ${emp.email}`);
      console.log(`   Telefon: ${emp.phoneNumber}`);
      console.log(`   Profile Image: ${emp.profileImage || 'Yok'}`);
      console.log(`   Expertise Documents: ${emp.expertiseDocuments?.length || 0} adet`);
      console.log(`   Work Examples: ${emp.workExamples?.length || 0} adet`);
      console.log(`   User ID: ${emp._id}`);
      console.log(`   Company ID: ${emp.companyId}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Hata:', error.message);
    if (error.code === 11000) {
      console.error('⚠️  Bu email veya telefon numarası zaten kullanılıyor.');
    }
    console.error('Error stack:', error.stack);
    process.exit(1);
  }
};

// Scripti çalıştır
seedEstetisyenEmployees();
