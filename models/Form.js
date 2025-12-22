const mongoose = require('mongoose');

const formSchema = new mongoose.Schema(
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
    email: {
      type: String,
      required: [true, 'E-posta zorunludur'],
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Geçerli bir e-posta adresi giriniz'],
    },
    message: {
      type: String,
      required: [true, 'Mesaj zorunludur'],
      trim: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

formSchema.index({ isRead: 1, createdAt: -1 });
formSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Form', formSchema);

