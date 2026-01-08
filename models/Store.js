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
      // Relaxed validation - pre-save hook will format it
      minlength: [10, 'IBAN çok kısa'],
      maxlength: [50, 'IBAN çok uzun'],
    },
    businessDescription: {
      type: String,
      required: [true, 'İşletme açıklaması zorunludur'],
      trim: true,
    },
    businessPassword: {
      type: String,
      required: false, // Made optional for registration flow
      minlength: [6, 'İşletme parolası en az 6 karakter olmalıdır'],
      default: null,
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
    serviceImages: {
      type: [String],
      default: [],
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
    sectors: [
      {
        id: {
          type: Number,
          required: [true, 'Sektör ID zorunludur'],
        },
        name: {
          type: String,
          required: [true, 'Sektör adı zorunludur'],
          trim: true,
        },
        key: {
          type: String,
          required: [true, 'Sektör key zorunludur'],
          trim: true,
        },
      },
    ],
    // Multiple services array (new structure)
    services: [
      {
        name: {
          type: String,
          required: [true, 'Hizmet adı zorunludur'],
          trim: true,
        },
        category: {
          type: String,
          required: [true, 'Hizmet kategorisi zorunludur'],
          trim: true,
        },
        duration: {
          type: Number,
          required: [true, 'Hizmet süresi zorunludur'],
          min: [1, 'Hizmet süresi en az 1 dakika olmalıdır'],
          // Duration is stored in minutes
        },
        price: {
          type: Number,
          required: [true, 'Hizmet fiyatı zorunludur'],
          min: [0, 'Hizmet fiyatı 0 veya daha büyük olmalıdır'],
        },
        cancelDuration: {
          type: Number,
          default: 0,
          min: [0, 'İptal süresi 0 veya daha büyük olmalıdır'],
          // Cancel duration is stored in minutes
        },
        description: {
          type: String,
          trim: true,
        },
        isActive: {
          type: Boolean,
          default: true,
        },
      },
    ],
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
      no: {
        type: String,
        trim: true,
      },
      addressDetail: {
        type: String,
        trim: true,
      },
    },
    location: {
      latitude: {
        type: Number,
        required: false,
      },
      longitude: {
        type: Number,
        required: false,
      },
      address: {
        type: String,
        trim: true,
      },
    },
    storeCode: {
      type: String,
      unique: true,
      sparse: true, // Allow null values but ensure uniqueness when present
      trim: true,
      match: [/^[0-9]{6}$/, 'Store code must be exactly 6 digits'],
    },
    storeLink: {
      type: String,
      unique: true,
      sparse: true, // Allow null values but ensure uniqueness when present
      trim: true,
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
    isOpen: {
      type: Boolean,
      default: true,
    },
    alwaysAcceptAppointmentRequests: {
      type: Boolean,
      default: false,
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

// Pre-save hook to format IBAN
storeSchema.pre('save', function(next) {
  if (this.iban) {
    // Remove spaces and convert to uppercase
    let iban = this.iban.replace(/\s/g, '').toUpperCase();
    
    // Add TR prefix if not present
    if (!iban.startsWith('TR')) {
      iban = 'TR' + iban;
    }
    
    // Ensure exactly 26 characters
    if (iban.length < 26) {
      // Pad with zeros after TR
      const digitsNeeded = 26 - iban.length;
      iban = 'TR' + '0'.repeat(digitsNeeded) + iban.slice(2);
    } else if (iban.length > 26) {
      // Truncate to 26 characters
      iban = iban.slice(0, 26);
    }
    
    this.iban = iban;
  }
  next();
});

module.exports = mongoose.model('Store', storeSchema);

