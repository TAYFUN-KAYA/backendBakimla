const { Reward, RewardTransaction } = require('../models/Reward');
const Appointment = require('../models/Appointment');
const User = require('../models/User');
const Store = require('../models/Store');

/**
 * getRewardStats
 * İşletme için ödül istatistiklerini getir
 * RewardTransaction tablosundan 'earn' tipindeki kayıtları sayar (activeStoreId ile eşleşen)
 */
const getRewardStats = async (req, res) => {
    try {
        const userId = req.user?._id || req.user?.id || req.companyId;
        
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Kullanıcı bilgisi bulunamadı',
            });
        }

        // Get activeStoreId from user
        const user = await User.findById(userId).select('activeStoreId activeStoreIds userType').lean();
        
        let activeStoreId = null;
        if (user?.userType === 'company' && user?.activeStoreIds && Array.isArray(user.activeStoreIds) && user.activeStoreIds.length > 0) {
            activeStoreId = user.activeStoreId?.toString() || user.activeStoreIds[0]?.toString() || null;
        } else {
            activeStoreId = user?.activeStoreId?.toString() || null;
        }

        if (!activeStoreId) {
            return res.status(400).json({
                success: false,
                message: 'Aktif işletme bulunamadı. Lütfen bir işletme seçin.',
            });
        }

        // Get store to find the owner's companyId
        const store = await Store.findById(activeStoreId).select('companyId').lean();
        if (!store) {
            return res.status(404).json({
                success: false,
                message: 'İşletme bulunamadı',
            });
        }

        // Reward is linked to the owner's companyId (User._id)
        const companyId = store.companyId?._id || store.companyId;

        // Count 'earn' type RewardTransaction records for this companyId
        const earnTransactionsCount = await RewardTransaction.countDocuments({
            companyId,
            type: 'earn',
            status: 'completed',
        });

        // Calculate total earned from earn transactions (1 TL per transaction)
        const totalEarned = earnTransactionsCount * 1;

        let reward = await Reward.findOne({ companyId });

        if (!reward) {
            reward = await Reward.create({
                companyId,
                completedAppointmentCount: earnTransactionsCount,
                totalEarned: totalEarned,
                withdrawnAmount: 0,
                balance: totalEarned, // Balance = total earned - withdrawn
            });
        } else {
            // Update reward stats based on RewardTransaction count
            // Preserve withdrawnAmount, only update counts and recalculate balance
            const previousWithdrawn = reward.withdrawnAmount || 0;
            reward.completedAppointmentCount = earnTransactionsCount;
            reward.totalEarned = totalEarned;
            // Balance = total earned - withdrawn (preserve withdrawn amount)
            reward.balance = Math.max(0, totalEarned - previousWithdrawn);
            reward.lastUpdate = new Date();
            await reward.save();
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
 * Sadece online/kredi kartı ödemeli randevular için ödül verilir
 */
const processRewardOnCompletion = async (appointmentId) => {
    try {
        const appointment = await Appointment.findById(appointmentId);
        // Only process if appointment is completed AND payment method is 'card' or 'online'
        if (!appointment || appointment.status !== 'completed') {
            return;
        }

        const paymentMethod = appointment.paymentMethod;
        const isOnlinePayment = paymentMethod === 'card' || paymentMethod === 'online';
        
        if (!isOnlinePayment) {
            return;
        }

        const companyId = appointment.companyId;
        const rewardAmount = 1; // Randevu başına 1 TL (her randevu 1 değer arttırır)

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
            description: 'Randevu tamamlama ödülü (Online ödeme)',
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
