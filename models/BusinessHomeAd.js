const mongoose = require('mongoose');

const businessHomeAdSchema = new mongoose.Schema(
  {
    image: {
      type: String,
      required: [true, 'Reklam görseli zorunludur'],
      trim: true,
    },
    link: {
      type: String,
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

businessHomeAdSchema.index({ isActive: 1, order: 1 });
businessHomeAdSchema.index({ startDate: 1, endDate: 1 });

module.exports = mongoose.model('BusinessHomeAd', businessHomeAdSchema);

