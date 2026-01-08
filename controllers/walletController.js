const { Wallet, WalletTransaction, WithdrawalRequest } = require('../models/Wallet');
const User = require('../models/User');
const Payment = require('../models/Payment');
const Store = require('../models/Store');

/**
 * getWallet
 * İşletmenin cüzdan bilgilerini getir (activeStoreId ile)
 */
const getWallet = async (req, res) => {
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

    // Wallet is linked to the owner's companyId (User._id)
    const companyId = store.companyId?._id || store.companyId;

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
 * Cüzdan işlem geçmişini getir (activeStoreId ile, withdrawal request'leri dahil)
 */
const getWalletTransactions = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id || req.companyId;
    const { page = 1, limit = 20, type } = req.query;

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

    // Wallet is linked to the owner's companyId (User._id)
    const companyId = store.companyId?._id || store.companyId;

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

    // Get wallet transactions
    const transactions = await WalletTransaction.find(query)
      .populate('paymentId', 'price paymentStatus')
      .populate('appointmentId', 'appointmentDate servicePrice')
      .populate('withdrawalRequestId')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    // Get withdrawal requests for this company
    const withdrawalRequests = await WithdrawalRequest.find({ companyId })
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    // Combine transactions and withdrawal requests
    const allTransactions = transactions.map(tx => ({
      ...tx.toObject(),
      _id: tx._id,
      type: tx.type,
      amount: tx.amount,
      description: tx.description,
      status: tx.status,
      createdAt: tx.createdAt,
      isWithdrawalRequest: false,
    }));

    // Add withdrawal requests as transactions
    withdrawalRequests.forEach(wr => {
      allTransactions.push({
        _id: wr._id,
        type: 'withdrawal',
        amount: wr.amount,
        description: `Para çekme talebi - ${wr.accountHolderName}`,
        status: wr.status === 'pending' ? 'pending' : wr.status === 'processing' ? 'pending' : wr.status === 'completed' ? 'completed' : 'failed',
        createdAt: wr.createdAt,
        isWithdrawalRequest: true,
        withdrawalRequest: {
          _id: wr._id,
          iban: wr.iban,
          accountHolderName: wr.accountHolderName,
          eftDescription: wr.eftDescription,
          status: wr.status,
          createdAt: wr.createdAt,
          processedAt: wr.processedAt,
        },
      });
    });

    // Sort by createdAt descending
    allTransactions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const total = await WalletTransaction.countDocuments(query);
    const totalWithdrawals = await WithdrawalRequest.countDocuments({ companyId });
    const totalCount = total + totalWithdrawals;

    res.status(200).json({
      success: true,
      count: allTransactions.length,
      total: totalCount,
      page: parseInt(page),
      totalPages: Math.ceil(totalCount / limit),
      data: allTransactions,
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
 * Para çekme talebi oluştur (activeStoreId ile)
 */
const createWithdrawalRequest = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id || req.companyId;
    const { amount, iban, accountHolderName, bankName, eftDescription } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Kullanıcı bilgisi bulunamadı',
      });
    }

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

    // Wallet is linked to the owner's companyId (User._id)
    const companyId = store.companyId?._id || store.companyId;

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

    // Clean IBAN (remove spaces)
    const cleanIban = iban.replace(/\s/g, '').toUpperCase();

    // Generate EFT description if not provided
    const finalEftDescription = eftDescription || `bakimla_${new Date().toLocaleDateString('tr-TR').replace(/\./g, '-')}_${new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }).replace(':', '-')}`;

    const withdrawalRequest = await WithdrawalRequest.create({
      companyId,
      walletId: wallet._id,
      amount,
      iban: cleanIban,
      accountHolderName: accountHolderName.trim(),
      bankName: bankName?.trim() || null,
      eftDescription: finalEftDescription,
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

/**
 * refundFromWallet
 * Ödeme iade edildiğinde cüzdandan düş (internal use)
 */
const refundFromWallet = async (companyId, amount, paymentId, appointmentId, description) => {
  try {
    const wallet = await Wallet.findOne({ companyId });

    if (!wallet) {
      return { success: false, error: 'Cüzdan bulunamadı' };
    }

    const balanceBefore = wallet.balance;
    wallet.balance -= amount;
    // Toplam kazançtan da düşüyoruz çünkü bu bir iade
    wallet.totalEarnings -= amount;
    wallet.lastTransactionDate = new Date();
    await wallet.save();

    // İşlem kaydı oluştur
    await WalletTransaction.create({
      walletId: wallet._id,
      companyId,
      type: 'refund',
      amount,
      balanceBefore,
      balanceAfter: wallet.balance,
      description: description || 'Ödeme iadesi',
      paymentId,
      appointmentId,
      status: 'completed',
    });

    return { success: true, wallet };
  } catch (error) {
    console.error('Refund from Wallet Error:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  getWallet,
  getWalletTransactions,
  createWithdrawalRequest,
  getWithdrawalRequests,
  addToWallet, // Internal function
  refundFromWallet, // Internal function
};

