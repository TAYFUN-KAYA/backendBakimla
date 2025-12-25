const { Wallet, WalletTransaction, WithdrawalRequest } = require('../models/Wallet');
const User = require('../models/User');
const Payment = require('../models/Payment');

/**
 * getWallet
 * İşletmenin cüzdan bilgilerini getir
 */
const getWallet = async (req, res) => {
  try {
    const companyId = req.companyId || req.user._id;

    let wallet = await Wallet.findOne({ companyId });

    // Cüzdan yoksa oluştur
    if (!wallet) {
      wallet = await Wallet.create({
        companyId,
        balance: 0,
        totalEarnings: 0,
        totalWithdrawals: 0,
      });
    }

    res.status(200).json({
      success: true,
      data: wallet,
    });
  } catch (error) {
    console.error('Get Wallet Error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * getWalletTransactions
 * Cüzdan işlem geçmişini getir
 */
const getWalletTransactions = async (req, res) => {
  try {
    const companyId = req.companyId || req.user._id;
    const { page = 1, limit = 20, type } = req.query;

    const wallet = await Wallet.findOne({ companyId });
    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: 'Cüzdan bulunamadı',
      });
    }

    const query = { walletId: wallet._id };
    if (type) {
      query.type = type;
    }

    const transactions = await WalletTransaction.find(query)
      .populate('paymentId', 'price paymentStatus')
      .populate('appointmentId', 'appointmentDate servicePrice')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await WalletTransaction.countDocuments(query);

    res.status(200).json({
      success: true,
      count: transactions.length,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit),
      data: transactions,
    });
  } catch (error) {
    console.error('Get Wallet Transactions Error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * createWithdrawalRequest
 * Para çekme talebi oluştur
 */
const createWithdrawalRequest = async (req, res) => {
  try {
    const companyId = req.companyId || req.user._id;
    const { amount, iban, accountHolderName, bankName } = req.body;

    if (!amount || !iban || !accountHolderName) {
      return res.status(400).json({
        success: false,
        message: 'amount, iban ve accountHolderName zorunludur',
      });
    }

    if (amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Tutar 0\'dan büyük olmalıdır',
      });
    }

    const wallet = await Wallet.findOne({ companyId });
    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: 'Cüzdan bulunamadı',
      });
    }

    if (wallet.balance < amount) {
      return res.status(400).json({
        success: false,
        message: 'Yetersiz bakiye',
      });
    }

    // IBAN'ı Store'dan al (varsa)
    const store = await require('../models/Store').findOne({ companyId });
    const finalIban = iban || store?.iban;

    if (!finalIban) {
      return res.status(400).json({
        success: false,
        message: 'IBAN bilgisi bulunamadı',
      });
    }

    const withdrawalRequest = await WithdrawalRequest.create({
      companyId,
      walletId: wallet._id,
      amount,
      iban: finalIban,
      accountHolderName: accountHolderName || store?.authorizedPersonName,
      bankName,
      status: 'pending',
    });

    res.status(201).json({
      success: true,
      message: 'Para çekme talebi oluşturuldu',
      data: withdrawalRequest,
    });
  } catch (error) {
    console.error('Create Withdrawal Request Error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * getWithdrawalRequests
 * Para çekme taleplerini listele
 */
const getWithdrawalRequests = async (req, res) => {
  try {
    const companyId = req.companyId || req.user._id;
    const { page = 1, limit = 20, status } = req.query;

    const query = { companyId };
    if (status) {
      query.status = status;
    }

    const requests = await WithdrawalRequest.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await WithdrawalRequest.countDocuments(query);

    res.status(200).json({
      success: true,
      count: requests.length,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit),
      data: requests,
    });
  } catch (error) {
    console.error('Get Withdrawal Requests Error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * addToWallet
 * Online ödeme başarılı olduğunda cüzdana ekle (internal use)
 */
const addToWallet = async (companyId, amount, paymentId, appointmentId, description) => {
  try {
    let wallet = await Wallet.findOne({ companyId });

    if (!wallet) {
      wallet = await Wallet.create({
        companyId,
        balance: 0,
        totalEarnings: 0,
        totalWithdrawals: 0,
      });
    }

    const balanceBefore = wallet.balance;
    wallet.balance += amount;
    wallet.totalEarnings += amount;
    wallet.lastTransactionDate = new Date();
    await wallet.save();

    // İşlem kaydı oluştur
    await WalletTransaction.create({
      walletId: wallet._id,
      companyId,
      type: 'deposit',
      amount,
      balanceBefore,
      balanceAfter: wallet.balance,
      description: description || 'Online ödeme',
      paymentId,
      appointmentId,
      status: 'completed',
    });

    return { success: true, wallet };
  } catch (error) {
    console.error('Add to Wallet Error:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  getWallet,
  getWalletTransactions,
  createWithdrawalRequest,
  getWithdrawalRequests,
  addToWallet, // Internal function
};

