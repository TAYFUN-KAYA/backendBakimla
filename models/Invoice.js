const mongoose = require('mongoose');

/**
 * Invoice Model
 * Paraşüt üzerinden oluşturulan faturalar
 */
const invoiceSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Kullanıcı ID zorunludur'],
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
    },
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment',
    },
    parasutInvoiceId: {
      type: String,
      required: [true, 'Paraşüt fatura ID zorunludur'],
      unique: true,
    },
    invoiceNumber: {
      type: String,
      required: true,
    },
    invoiceSeries: {
      type: String,
      default: 'BAKIMLA',
    },
    issueDate: {
      type: Date,
      required: true,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    subtotal: {
      type: Number,
      required: true,
      min: [0, 'Ara toplam 0 veya daha büyük olmalıdır'],
    },
    tax: {
      type: Number,
      default: 0,
      min: [0, 'Vergi 0 veya daha büyük olmalıdır'],
    },
    total: {
      type: Number,
      required: true,
      min: [0, 'Toplam 0 veya daha büyük olmalıdır'],
    },
    currency: {
      type: String,
      default: 'TRY',
    },
    status: {
      type: String,
      enum: ['draft', 'sent', 'paid', 'cancelled'],
      default: 'draft',
    },
    pdfUrl: {
      type: String,
      trim: true,
    },
    items: [
      {
        description: {
          type: String,
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          min: [1, 'Miktar en az 1 olmalıdır'],
        },
        unitPrice: {
          type: Number,
          required: true,
          min: [0, 'Birim fiyat 0 veya daha büyük olmalıdır'],
        },
        vatRate: {
          type: Number,
          default: 20,
          min: [0, 'KDV oranı 0 veya daha büyük olmalıdır'],
        },
        total: {
          type: Number,
          required: true,
          min: [0, 'Toplam 0 veya daha büyük olmalıdır'],
        },
      },
    ],
    billingAddress: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Address',
    },
    parasutContactId: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

invoiceSchema.index({ userId: 1, createdAt: -1 });
invoiceSchema.index({ orderId: 1 });
invoiceSchema.index({ appointmentId: 1 });
invoiceSchema.index({ parasutInvoiceId: 1 });
invoiceSchema.index({ invoiceNumber: 1 });

module.exports = mongoose.model('Invoice', invoiceSchema);

