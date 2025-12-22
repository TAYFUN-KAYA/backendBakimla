const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Kullanıcı ID zorunludur'],
    },
    title: {
      type: String,
      required: [true, 'Bildirim başlığı zorunludur'],
      trim: true,
    },
    message: {
      type: String,
      required: [true, 'Bildirim mesajı zorunludur'],
      trim: true,
    },
    type: {
      type: String,
      enum: ['info', 'success', 'warning', 'error', 'appointment', 'payment', 'system'],
      default: 'info',
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    relatedId: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'relatedModel',
    },
    relatedModel: {
      type: String,
      enum: ['Appointment', 'Accounting', 'Customer', 'Store'],
    },
  },
  {
    timestamps: true,
  }
);

notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);

