const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema(
  {
    customerIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer',
        required: true,
      },
    ],
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      // Client uygulamasından gelen kullanıcı (user tipi)
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Şirket ID zorunludur'],
    },
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Çalışan ID zorunludur'],
    },
    appointmentDate: {
      type: Date,
      required: [true, 'Randevu tarihi zorunludur'],
    },
    appointmentTime: {
      type: String,
      required: [true, 'Randevu saati zorunludur'],
      match: [/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, 'Geçerli bir saat formatı giriniz (HH:MM)'],
    },
    serviceCategory: {
      type: String,
      required: [true, 'Hizmet kategorisi zorunludur'],
      trim: true,
    },
    taskType: {
      type: String,
      required: [true, 'Görev tipi zorunludur'],
      trim: true,
    },
    serviceType: {
      type: String,
      required: [true, 'Hizmet tipi zorunludur'],
      trim: true,
    },
    serviceDuration: {
      type: Number,
      required: [true, 'Hizmet süresi zorunludur'],
      min: [1, 'Hizmet süresi en az 1 dakika olmalıdır'],
    },
    servicePrice: {
      type: Number,
      required: [true, 'Hizmet fiyatı zorunludur'],
      min: [0, 'Hizmet fiyatı 0 veya daha büyük olmalıdır'],
    },
    // Birden fazla hizmet seçilebilir (client uygulaması için)
    services: [
      {
        serviceType: String,
        serviceDuration: Number,
        servicePrice: Number,
        personIndex: Number, // Hangi kişi için (0, 1, 2...)
      },
    ],
    personCount: {
      type: Number,
      default: 1,
      min: [1, 'Kişi sayısı en az 1 olmalıdır'],
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'card'],
      required: [true, 'Ödeme tipi zorunludur'],
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'completed', 'cancelled'],
      default: 'pending',
    },
    isApproved: {
      type: Boolean,
      default: false,
    },
    paymentReceived: {
      type: Boolean,
      default: false,
    },
    totalPrice: {
      type: Number,
      min: [0, 'Toplam fiyat 0 veya daha büyük olmalıdır'],
    },
    discount: {
      type: Number,
      default: 0,
      min: [0, 'İndirim 0 veya daha büyük olmalıdır'],
    },
    pointsUsed: {
      type: Number,
      default: 0,
      min: [0, 'Kullanılan puan 0 veya daha büyük olmalıdır'],
    },
    couponId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Coupon',
    },
    campaignId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Campaign',
    },
    notes: {
      type: String,
      trim: true,
    },
    cancellationReason: {
      type: String,
      trim: true,
    },
    // Birden fazla müşteri için birbirine bağlı randevuları gruplamak için
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment',
      default: null,
    },
    // Iyzico payment link ID (SMS ile ödeme için)
    iyzicoLinkId: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

appointmentSchema.index({ companyId: 1, appointmentDate: -1 });
appointmentSchema.index({ employeeId: 1, appointmentDate: -1 });
appointmentSchema.index({ customerIds: 1, appointmentDate: -1 });
appointmentSchema.index({ userId: 1, appointmentDate: -1 });
appointmentSchema.index({ status: 1, isApproved: 1 });
appointmentSchema.index({ paymentReceived: 1 });

module.exports = mongoose.model('Appointment', appointmentSchema);

