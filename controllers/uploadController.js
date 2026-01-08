const s3Service = require('../utils/s3Service');

/**
 * uploadImage
 * Resim dosyasını S3'e yükler
 */
const uploadImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Resim dosyası seçilmedi',
            });
        }

        const { folder = 'general' } = req.body;
        
        // DEBUG: Log upload info
        console.log('=== S3 Upload ===');
        console.log('Folder:', folder);
        console.log('File name:', req.file.originalname);
        console.log('File size:', (req.file.size / 1024).toFixed(2), 'KB');
        console.log('=================');
        
        const result = await s3Service.uploadImage(req.file.buffer, req.file.originalname, folder);

        if (!result.success) {
            return res.status(500).json({
                success: false,
                message: result.message,
            });
        }

        console.log('✅ Upload successful:', result.url);

        res.status(200).json({
            success: true,
            message: 'Resim başarıyla yüklendi',
            url: result.url,
            fileName: result.fileName,
            key: result.key, // S3 key
        });
    } catch (error) {
        console.error('❌ Upload error:', error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

module.exports = {
    uploadImage,
};
