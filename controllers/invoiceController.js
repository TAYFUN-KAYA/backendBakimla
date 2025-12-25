const Invoice = require('../models/Invoice');
const Order = require('../models/Order');
const Appointment = require('../models/Appointment');
const { createInvoice, createOrGetContact } = require('../utils/parasutService');
const User = require('../models/User');
const Address = require('../models/Address');

/**
 * getInvoices
 * Faturaları listele
 */
const getInvoices = async (req, res) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 20 } = req.query;

    const invoices = await Invoice.find({ userId })
      .populate('orderId', 'orderNumber total')
      .populate('appointmentId', 'appointmentDate servicePrice')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Invoice.countDocuments({ userId });

    res.status(200).json({
      success: true,
      count: invoices.length,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit),
      data: invoices,
    });
  } catch (error) {
    console.error('Get Invoices Error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * getInvoice
 * Fatura detayını getir
 */
const getInvoice = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    const invoice = await Invoice.findOne({ _id: id, userId })
      .populate('orderId')
      .populate('appointmentId')
      .populate('billingAddress');

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Fatura bulunamadı',
      });
    }

    res.status(200).json({
      success: true,
      data: invoice,
    });
  } catch (error) {
    console.error('Get Invoice Error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * createInvoiceForOrder
 * Sipariş için fatura oluştur (internal use)
 */
const createInvoiceForOrder = async (orderId) => {
  try {
    const order = await Order.findById(orderId).populate('userId').populate('billingAddress');
    if (!order || order.paymentStatus !== 'paid') {
      return { success: false, error: 'Sipariş bulunamadı veya ödenmemiş' };
    }

    const user = order.userId;
    const address = order.billingAddress;

    // Paraşüt'te müşteri oluştur veya getir
    const contactResult = await createOrGetContact({
      name: `${user.firstName} ${user.lastName}`,
      email: user.email,
      phone: user.phoneNumber,
      address: address?.addressLine1 || '',
      city: address?.city || '',
      district: address?.district || '',
      taxNumber: address?.taxNumber || '',
      taxOffice: address?.taxOffice || '',
    });

    if (!contactResult.success) {
      return { success: false, error: contactResult.message };
    }

    // Paraşüt'te fatura oluştur
    const invoiceItems = order.items.map((item) => ({
      description: item.productName,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      vatRate: 20, // %20 KDV
      discountType: 'percentage',
      discountValue: 0,
      total: item.totalPrice,
    }));

    const invoiceResult = await createInvoice({
      contactId: contactResult.contactId,
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: new Date().toISOString().split('T')[0],
      description: `Bakimla Sipariş - ${order.orderNumber}`,
      items: invoiceItems,
      currency: 'TRY',
    });

    if (!invoiceResult.success) {
      return { success: false, error: invoiceResult.message };
    }

    // Fatura kaydı oluştur
    const invoice = await Invoice.create({
      userId: user._id,
      orderId: order._id,
      parasutInvoiceId: invoiceResult.invoiceId,
      invoiceNumber: invoiceResult.data?.data?.attributes?.invoice_no || order.orderNumber,
      invoiceSeries: 'BAKIMLA',
      issueDate: new Date(),
      dueDate: new Date(),
      subtotal: order.subtotal,
      tax: order.subtotal * 0.2,
      total: order.total,
      currency: 'TRY',
      status: 'sent',
      items: invoiceItems,
      billingAddress: address?._id,
      parasutContactId: contactResult.contactId,
    });

    return { success: true, invoice };
  } catch (error) {
    console.error('Create Invoice for Order Error:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  getInvoices,
  getInvoice,
  createInvoiceForOrder, // Internal
};

