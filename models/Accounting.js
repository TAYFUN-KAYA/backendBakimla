const mongoose = require('mongoose');

const accountingSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Şirket ID zorunludur'],
    },
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    date: {
      type: Date,
      required: [true, 'Tarih zorunludur'],
    },
    income: {
      type: Number,
      default: 0,
      min: [0, 'Gelir 0 veya daha büyük olmalıdır'],
    },
    expense: {
      type: Number,
      default: 0,
      min: [0, 'Gider 0 veya daha büyük olmalıdır'],
    },
    description: {
      type: String,
      trim: true,
    },
    category: {
      type: String,
      trim: true,
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'card', 'transfer', 'other'],
      default: 'cash',
    },
  },
  {
    timestamps: true,
  }
);

accountingSchema.index({ companyId: 1, date: -1 });
accountingSchema.index({ companyId: 1, date: 1 });
accountingSchema.index({ companyId: 1, employeeId: 1, date: -1 });
accountingSchema.index({ employeeId: 1, date: -1 });

module.exports = mongoose.model('Accounting', accountingSchema);

