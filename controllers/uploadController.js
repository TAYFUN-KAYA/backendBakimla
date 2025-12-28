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
        const result = await s3Service.uploadImage(req.file.buffer, req.file.originalname, folder);

        if (!result.success) {
            return res.status(500).json({
                success: false,
                message: result.message,
            });
        }

        res.status(200).json({
            success: true,
            message: 'Resim başarıyla yüklendi',
            url: result.url,
            fileName: result.fileName,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

module.exports = {
    uploadImage,
};
