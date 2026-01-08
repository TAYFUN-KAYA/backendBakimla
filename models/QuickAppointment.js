const mongoose = require('mongoose');

const quickAppointmentSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Şirket ID zorunludur'],
    },
    customerIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer',
        required: true,
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
quickAppointmentSchema.index({ companyId: 1, createdAt: -1 });

module.exports = mongoose.model('QuickAppointment', quickAppointmentSchema);

