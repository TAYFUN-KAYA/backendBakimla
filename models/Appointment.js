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
    paymentMethod: {
      type: String,
      enum: ['cash', 'card'],
      required: [true, 'Ödeme tipi zorunludur'],
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'cancelled'],
      default: 'pending',
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

appointmentSchema.index({ companyId: 1, appointmentDate: -1 });
appointmentSchema.index({ employeeId: 1, appointmentDate: -1 });
appointmentSchema.index({ customerIds: 1, appointmentDate: -1 });

module.exports = mongoose.model('Appointment', appointmentSchema);

