const express = require('express');
const router = express.Router();
const multer = require('multer');
const uploadController = require('../controllers/uploadController');
const { authMiddleware } = require('../middleware/authMiddleware');

// Multer memory storage (S3'e buffer göndermek için)
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    },
});

/**
 * @route   POST /api/upload/image
 * @desc    Upload an image to S3
 * @access  Private
 */
router.post('/image', authMiddleware, upload.single('image'), uploadController.uploadImage);

module.exports = router;
