const express = require('express');
const router = express.Router();
const {
  getAllUsers,
  getAllEmployees,
  getUserById,
  createUser,
  createEmployee,
  updateUserType,
  updateUser,
  updateProfile,
  updateNotificationPreferences,
  updatePassword,
  deleteUser,
  getEmployeeStats,
  getDashboard,
} = require('../controllers/userController');
const { authMiddleware, companyMiddleware } = require('../middleware/authMiddleware');

router.get('/', getAllUsers);
router.get('/employees', authMiddleware, getAllEmployees); // authMiddleware ekledik - token'dan user bilgisi almak için
router.get('/dashboard', authMiddleware, getDashboard); // Dashboard endpoint
router.get('/:id', getUserById);
router.post('/', createUser);
router.post('/employee', companyMiddleware, createEmployee);
router.put('/profile', authMiddleware, updateProfile);
router.put('/notification-preferences', authMiddleware, updateNotificationPreferences);
router.put('/password', authMiddleware, updatePassword);
// Kullanıcı kendi hesabını silebilir (req.user._id kullanılır) - /:id'den önce olmalı
router.delete('/account', authMiddleware, deleteUser);
router.put('/:id/userType', authMiddleware, updateUserType);
router.put('/:id', authMiddleware, updateUser);
router.get('/:id/stats', companyMiddleware, getEmployeeStats);
// Admin veya başka kullanıcıları silmek için (req.params.id kullanılır)
router.delete('/:id', authMiddleware, deleteUser);

module.exports = router;

