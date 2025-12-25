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
      unique: true,
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
      required: [true, 'Şifre zorunludur'],
      minlength: [6, 'Şifre en az 6 karakter olmalıdır'],
      select: false,
    },
    userType: {
      type: String,
      enum: ['company', 'employee', 'user'],
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
    },
    notificationPreferences: {
      appointmentReminder: {
        type: Boolean,
        default: true,
      },
      campaignNotifications: {
        type: Boolean,
        default: true,
      },
    },
  },
  {
    timestamps: true,
  }
);

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

