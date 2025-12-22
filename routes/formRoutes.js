const express = require('express');
const router = express.Router();
const {
  submitForm,
  getAllForms,
  getFormById,
  markAsRead,
  markAllAsRead,
  deleteForm,
} = require('../controllers/formController');

router.post('/', submitForm);
router.get('/', getAllForms);
router.get('/:id', getFormById);
router.put('/:id/read', markAsRead);
router.put('/read-all', markAllAsRead);
router.delete('/:id', deleteForm);

module.exports = router;

