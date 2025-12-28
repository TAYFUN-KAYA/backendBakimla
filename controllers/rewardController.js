const { Reward, RewardTransaction } = require('../models/Reward');
const Appointment = require('../models/Appointment');

/**
 * getRewardStats
 * İşletme için ödül istatistiklerini getir
 */
const getRewardStats = async (req, res) => {
    try {
        const companyId = req.companyId || req.user._id;

        let reward = await Reward.findOne({ companyId });

        if (!reward) {
            reward = await Reward.create({
                companyId,
                completedAppointmentCount: 0,
                totalEarned: 0,
                withdrawnAmount: 0,
                balance: 0,
            });
        }

        res.status(200).json({
            success: true,
            data: reward,
        });
    } catch (error) {
        console.error('Get Reward Stats Error:', error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

/**
 * requestWithdrawal
 * Ödül bakiyesini çekme talebi oluştur (50 randevu sınırı)
 */
const requestWithdrawal = async (req, res) => {
    try {
        const companyId = req.companyId || req.user._id;

        const reward = await Reward.findOne({ companyId });

        if (!reward || reward.completedAppointmentCount < 50) {
            return res.status(400).json({
                success: false,
                message: 'Para çekmek için en az 50 randevu tamamlamış olmanız gerekmektedir.',
            });
        }

        if (reward.balance <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Çekilecek bakiyeniz bulunmamaktadır.',
            });
        }

        const withdrawAmount = reward.balance;

        // İşlem kaydı
        await RewardTransaction.create({
            companyId,
            type: 'withdrawal',
            amount: withdrawAmount,
            status: 'pending',
            description: 'İşlet-Kazan bakiye çekim talebi',
        });

        // Bakiyeyi sıfırla, çekilen tutara ekle
        reward.withdrawnAmount += withdrawAmount;
        reward.balance = 0;
        await reward.save();

        res.status(200).json({
            success: true,
            message: 'Bakiye çekim talebiniz alındı.',
            data: reward,
        });
    } catch (error) {
        console.error('Request Withdrawal Error:', error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

/**
 * processRewardOnCompletion
 * Randevu tamamlandığında ödül ekle (Internal use)
 */
const processRewardOnCompletion = async (appointmentId) => {
    try {
        const appointment = await Appointment.findById(appointmentId);
        if (!appointment || appointment.status !== 'completed') return;

        const companyId = appointment.companyId;
        const rewardAmount = 20; // Randevu başına 20 TL

        let reward = await Reward.findOne({ companyId });
        if (!reward) {
            reward = await Reward.create({ companyId });
        }

        // Bu randevu için daha önce ödül verildi mi kontrol et
        const existingTx = await RewardTransaction.findOne({
            companyId,
            appointmentId,
            type: 'earn'
        });

        if (existingTx) return;

        reward.completedAppointmentCount += 1;
        reward.totalEarned += rewardAmount;
        reward.balance += rewardAmount;
        reward.lastUpdate = new Date();
        await reward.save();

        await RewardTransaction.create({
            companyId,
            type: 'earn',
            amount: rewardAmount,
            appointmentId,
            description: 'Randevu tamamlama ödülü',
        });

    } catch (error) {
        console.error('Process Reward Error:', error);
    }
};

module.exports = {
    getRewardStats,
    requestWithdrawal,
    processRewardOnCompletion,
};
