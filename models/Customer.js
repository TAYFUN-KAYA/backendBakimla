const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Şirket ID zorunludur'],
    },
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
    phoneNumber: {
      type: String,
      required: [true, 'Telefon numarası zorunludur'],
      trim: true,
      match: [/^[0-9]{10,15}$/, 'Geçerli bir telefon numarası giriniz'],
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

customerSchema.index({ companyId: 1, phoneNumber: 1 }, { unique: true });

module.exports = mongoose.model('Customer', customerSchema);

