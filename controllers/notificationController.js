const Notification = require('../models/Notification');
const User = require('../models/User');

/**
 * createNotification
 * Yeni bildirim oluşturur
 */
const createNotification = async (req, res) => {
  try {
    const { userId, title, message, type, relatedId, relatedModel } = req.body;

    if (!userId || !title || !message) {
      return res.status(400).json({
        success: false,
        message: 'userId, title ve message zorunludur',
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Kullanıcı bulunamadı',
      });
    }

    const notification = await Notification.create({
      userId,
      title,
      message,
      type: type || 'info',
      relatedId,
      relatedModel,
    });

    res.status(201).json({
      success: true,
      message: 'Bildirim başarıyla oluşturuldu',
      data: notification,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * getUserNotifications
 * Kullanıcının tüm bildirimlerini getirir
 */
const getUserNotifications = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'userId gereklidir',
      });
    }

    const notifications = await Notification.find({ userId })
      .sort({ createdAt: -1 })
      .populate('relatedId');

    const unreadCount = await Notification.countDocuments({
      userId,
      isRead: false,
    });

    res.status(200).json({
      success: true,
      unreadCount,
      count: notifications.length,
      data: notifications,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * getUnreadNotifications
 * Okunmamış bildirimleri getirir
 */
const getUnreadNotifications = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'userId gereklidir',
      });
    }

    const notifications = await Notification.find({
      userId,
      isRead: false,
    })
      .sort({ createdAt: -1 })
      .populate('relatedId');

    res.status(200).json({
      success: true,
      count: notifications.length,
      data: notifications,
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
 * Bildirimi okundu olarak işaretler
 */
const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await Notification.findByIdAndUpdate(
      id,
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Bildirim bulunamadı',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Bildirim okundu olarak işaretlendi',
      data: notification,
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
 * Kullanıcının tüm bildirimlerini okundu olarak işaretler
 */
const markAllAsRead = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'userId gereklidir',
      });
    }

    const result = await Notification.updateMany(
      { userId, isRead: false },
      { isRead: true }
    );

    res.status(200).json({
      success: true,
      message: `${result.modifiedCount} bildirim okundu olarak işaretlendi`,
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
 * deleteNotification
 * Bildirimi siler
 */
const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await Notification.findByIdAndDelete(id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Bildirim bulunamadı',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Bildirim başarıyla silindi',
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * deleteAllNotifications
 * Kullanıcının tüm bildirimlerini siler
 */
const deleteAllNotifications = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'userId gereklidir',
      });
    }

    const result = await Notification.deleteMany({ userId });

    res.status(200).json({
      success: true,
      message: `${result.deletedCount} bildirim silindi`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createNotification,
  getUserNotifications,
  getUnreadNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllNotifications,
};

