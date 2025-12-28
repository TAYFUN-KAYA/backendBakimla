const mongoose = require('mongoose');

const rewardSchema = new mongoose.Schema({
    companyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true,
    },
    completedAppointmentCount: {
        type: Number,
        default: 0,
    },
    totalEarned: {
        type: Number,
        default: 0,
    },
    withdrawnAmount: {
        type: Number,
        default: 0,
    },
    balance: {
        type: Number,
        default: 0,
    },
    lastUpdate: {
        type: Date,
        default: Date.now,
    },
}, { timestamps: true });

const rewardTransactionSchema = new mongoose.Schema({
    companyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    type: {
        type: String,
        enum: ['earn', 'withdrawal'],
        required: true,
    },
    amount: {
        type: Number,
        required: true,
    },
    appointmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Appointment',
    },
    status: {
        type: String,
        enum: ['pending', 'completed', 'failed'],
        default: 'completed',
    },
    description: String,
}, { timestamps: true });

const Reward = mongoose.model('Reward', rewardSchema);
const RewardTransaction = mongoose.model('RewardTransaction', rewardTransactionSchema);

module.exports = { Reward, RewardTransaction };
