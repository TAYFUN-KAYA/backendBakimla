const Form = require('../models/Form');

/**
 * submitForm
 * Yeni form gönderir
 */
const submitForm = async (req, res) => {
  try {
    const { firstName, lastName, email, message } = req.body;

    if (!firstName || !lastName || !email || !message) {
      return res.status(400).json({
        success: false,
        message: 'Tüm alanlar zorunludur',
      });
    }

    const form = await Form.create({
      firstName,
      lastName,
      email: email.toLowerCase(),
      message,
    });

    res.status(201).json({
      success: true,
      message: 'Form başarıyla gönderildi',
      data: form,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * getAllForms
 * Tüm formları listeler
 */
const getAllForms = async (req, res) => {
  try {
    const { isRead } = req.query;

    const query = {};
    if (isRead !== undefined) {
      query.isRead = isRead === 'true';
    }

    const forms = await Form.find(query).sort({ createdAt: -1 });

    const unreadCount = await Form.countDocuments({ isRead: false });

    res.status(200).json({
      success: true,
      unreadCount,
      count: forms.length,
      data: forms,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * getFormById
 * ID ile form getirir
 */
const getFormById = async (req, res) => {
  try {
    const { id } = req.params;

    const form = await Form.findById(id);

    if (!form) {
      return res.status(404).json({
        success: false,
        message: 'Form bulunamadı',
      });
    }

    res.status(200).json({
      success: true,
      data: form,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * markAsRead
 * Formu okundu olarak işaretler
 */
const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;

    const form = await Form.findByIdAndUpdate(
      id,
      { isRead: true },
      { new: true }
    );

    if (!form) {
      return res.status(404).json({
        success: false,
        message: 'Form bulunamadı',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Form okundu olarak işaretlendi',
      data: form,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * markAllAsRead
 * Tüm formları okundu olarak işaretler
 */
const markAllAsRead = async (req, res) => {
  try {
    const result = await Form.updateMany(
      { isRead: false },
      { isRead: true }
    );

    res.status(200).json({
      success: true,
      message: `${result.modifiedCount} form okundu olarak işaretlendi`,
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * deleteForm
 * Formu siler
 */
const deleteForm = async (req, res) => {
  try {
    const { id } = req.params;

    const form = await Form.findByIdAndDelete(id);

    if (!form) {
      return res.status(404).json({
        success: false,
        message: 'Form bulunamadı',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Form başarıyla silindi',
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  submitForm,
  getAllForms,
  getFormById,
  markAsRead,
  markAllAsRead,
  deleteForm,
};

