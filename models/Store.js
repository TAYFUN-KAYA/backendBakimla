const mongoose = require('mongoose');

const storeSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Şirket ID zorunludur'],
    },
    storeName: {
      type: String,
      required: [true, 'Mağaza adı zorunludur'],
      trim: true,
    },
    authorizedPersonName: {
      type: String,
      required: [true, 'İşletme yetkili ismi zorunludur'],
      trim: true,
    },
    authorizedPersonTCKN: {
      type: String,
      required: [true, 'Yetkili TCKN zorunludur'],
      trim: true,
      match: [/^[0-9]{11}$/, 'TCKN 11 haneli olmalıdır'],
    },
    businessName: {
      type: String,
      required: [true, 'İşletme adı zorunludur'],
      trim: true,
    },
    taxOffice: {
      type: String,
      required: [true, 'Vergi dairesi zorunludur'],
      trim: true,
    },
    taxNumber: {
      type: String,
      required: [true, 'Vergi numarası zorunludur'],
      trim: true,
    },
    iban: {
      type: String,
      required: [true, 'IBAN numarası zorunludur'],
      trim: true,
      match: [/^TR[0-9]{24}$/, 'Geçerli bir IBAN numarası giriniz (TR ile başlamalı)'],
    },
    businessDescription: {
      type: String,
      required: [true, 'İşletme açıklaması zorunludur'],
      trim: true,
    },
    businessPassword: {
      type: String,
      required: [true, 'İşletme parolası zorunludur'],
      minlength: [6, 'İşletme parolası en az 6 karakter olmalıdır'],
    },
    interiorImage: {
      type: String,
      required: [true, 'Mağaza iç görseli zorunludur'],
    },
    exteriorImage: {
      type: String,
      required: [true, 'Mağaza dış görseli zorunludur'],
    },
    appIcon: {
      type: String,
      required: [true, 'App ikonu görseli zorunludur'],
    },
    workingDays: [
      {
        day: {
          type: String,
          enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
          required: true,
        },
        startTime: {
          type: String,
          required: true,
          match: [/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, 'Geçerli bir saat formatı giriniz (HH:MM)'],
        },
        endTime: {
          type: String,
          required: true,
          match: [/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, 'Geçerli bir saat formatı giriniz (HH:MM)'],
        },
        isOpen: {
          type: Boolean,
          default: true,
        },
      },
    ],
    sectors: {
      type: [String],
      required: [true, 'En az bir sektör seçilmelidir'],
    },
    serviceType: {
      type: String,
      required: [true, 'Hizmet tipi zorunludur'],
      trim: true,
    },
    serviceDuration: {
      type: Number,
      required: [true, 'Hizmet süresi zorunludur'],
      min: [1, 'Hizmet süresi en az 1 olmalıdır'],
    },
    servicePrice: {
      type: Number,
      required: [true, 'Hizmet fiyatı zorunludur'],
      min: [0, 'Hizmet fiyatı 0 veya daha büyük olmalıdır'],
    },
    serviceCategory: {
      type: String,
      required: [true, 'Hizmet kategorisi zorunludur'],
      trim: true,
    },
    businessField: {
      type: String,
      required: [true, 'İşletme iş alanı zorunludur'],
      trim: true,
    },
    address: {
      addressName: {
        type: String,
        trim: true,
      },
      fullAddress: {
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
      building: {
        type: String,
        trim: true,
      },
      floor: {
        type: String,
        trim: true,
      },
      apartment: {
        type: String,
        trim: true,
      },
    },
    installmentSettings: {
      enabled: {
        type: Boolean,
        default: true,
      },
      maxInstallment: {
        type: Number,
        default: 12,
        enum: [1, 2, 3, 6, 9, 12],
      },
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Store', storeSchema);

