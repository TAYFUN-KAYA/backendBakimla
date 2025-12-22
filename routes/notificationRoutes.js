const express = require('express');
const router = express.Router();
const {
  createNotification,
  getUserNotifications,
  getUnreadNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllNotifications,
} = require('../controllers/notificationController');
const { authMiddleware } = require('../middleware/authMiddleware');

router.post('/', authMiddleware, createNotification);
router.post('/user', authMiddleware, getUserNotifications);
router.post('/unread', authMiddleware, getUnreadNotifications);
router.put('/:id/read', authMiddleware, markAsRead);
router.put('/read-all', authMiddleware, markAllAsRead);
router.delete('/:id', authMiddleware, deleteNotification);
router.delete('/all', authMiddleware, deleteAllNotifications);

module.exports = router;

