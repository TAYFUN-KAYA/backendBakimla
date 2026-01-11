const mongoose = require('mongoose');

const clientHomeAdSchema = new mongoose.Schema(
  {
    image: {
      type: String,
      required: [true, 'Reklam görseli zorunludur'],
      trim: true,
    },
    title: {
      type: String,
      trim: true,
    },
    subtitle: {
      type: String,
      trim: true,
    },
    link: {
      type: String,
      trim: true,
    },
    color: {
      type: String,
      default: '#6B25FF',
      trim: true,
    },
    order: {
      type: Number,
      default: 0,
      min: [0, 'Sıralama 0 veya daha büyük olmalıdır'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    startDate: {
      type: Date,
    },
    endDate: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

clientHomeAdSchema.index({ isActive: 1, order: 1 });
clientHomeAdSchema.index({ startDate: 1, endDate: 1 });

module.exports = mongoose.model('ClientHomeAd', clientHomeAdSchema);

