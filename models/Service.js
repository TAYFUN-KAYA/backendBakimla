const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema(
    {
        companyId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Şirket ID zorunludur'],
        },
        name: {
            type: String,
            required: [true, 'Hizmet adı zorunludur'],
            trim: true,
        },
        description: {
            type: String,
            trim: true,
        },
        price: {
            type: Number,
            required: [true, 'Hizmet fiyatı zorunludur'],
            min: [0, 'Fiyat 0 veya daha büyük olmalıdır'],
        },
        duration: {
            type: Number, // Dakika cinsinden
            required: [true, 'Hizmet süresi zorunludur'],
            min: [1, 'Süre en az 1 dakika olmalıdır'],
        },
        category: {
            type: String,
            required: [true, 'Hizmet kategorisi zorunludur'],
            trim: true,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);

serviceSchema.index({ companyId: 1, isActive: 1 });

module.exports = mongoose.model('Service', serviceSchema);
