const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, 'Ad zorunludur'],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, 'Soyad zorunludur'],
      trim: true,
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other'],
      required: [true, 'Cinsiyet zorunludur'],
    },
    email: {
      type: String,
      required: [true, 'E-posta zorunludur'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Geçerli bir e-posta adresi giriniz'],
    },
    phoneNumber: {
      type: String,
      required: [true, 'Telefon numarası zorunludur'],
      trim: true,
      match: [/^[0-9]{10,15}$/, 'Geçerli bir telefon numarası giriniz'],
    },
    username: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    birthDate: {
      type: Date,
    },
    profileImage: {
      type: String,
      trim: true,
    },
    city: {
      type: String,
      trim: true,
    },
    district: {
      type: String,
      trim: true,
    },
    password: {
      type: String,
      required: false, // Password is now optional for OTP-based auth
      minlength: [6, 'Şifre en az 6 karakter olmalıdır'],
      select: false,
    },
    userType: {
      type: String,
      enum: ['company', 'employee', 'user', 'admin'],
      required: [true, 'Kullanıcı tipi zorunludur'],
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: function () {
        return this.userType === 'employee';
      },
    },
    isApproved: {
      type: Boolean,
      default: false,
    },
    activeStoreId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Store',
      // Deprecated: Use activeStoreIds array instead for company users
    },
    activeStoreIds: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: 'Store',
      default: [],
      // For company users: array of store IDs that are active
      // Each new store created is automatically added to this array
    },
    notificationPreferences: {
      appNotifications: {
        type: Boolean,
        default: false,
      },
      campaignNotifications: {
        type: Boolean,
        default: false,
      },
      appointmentReminders: {
        type: Boolean,
        default: true,
      },
    },
    bio: {
      type: String,
      trim: true,
    },
    expertiseDocuments: {
      type: [String],
      default: [],
    },
    workExamples: [
      {
        type: {
          type: String,
          enum: ['öncesi', 'sonrası'],
        },
        url: String,
      },
    ],
    jobTitle: {
      type: String,
      trim: true,
      // Employee pozisyonu: 'Kuaför', 'Estetisyen Doktor', 'Masör', 'Güzellik Uzmanı', 'Tırnakçı'
    },
    position: {
      type: String,
      trim: true,
      // Position key: 'kuaför', 'estetisyen_doktor', 'masör', 'güzellik_uzmanı', 'tırnakçı'
      // Enum şimdilik kaldırıldı - constants dosyasından yönetiliyor
    },
    iyzicoCardUserKey: {
      type: String,
      trim: true,
      // İyzico'da kullanıcıya ait kartları listelemek için kullanılan key
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index: Aynı telefon numarası farklı userType'larda olabilir
// ama aynı telefon+userType kombinasyonu unique olmalı
userSchema.index({ phoneNumber: 1, userType: 1 }, { unique: true });

// Şifre hash'leme - sadece şifre değiştiğinde
userSchema.pre('save', async function (next) {
  // Şifre değişmemişse veya yeni bir kullanıcı değilse, hash'leme
  if (!this.isModified('password')) {
    return next();
  }

  try {
    // Şifre zaten hash'lenmiş mi kontrol et (bcrypt hash'i $2a$, $2b$ veya $2y$ ile başlar)
    if (this.password.startsWith('$2')) {
      return next();
    }

    // Şifreyi hash'le
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

module.exports = mongoose.model('User', userSchema);

