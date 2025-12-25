const { Upload } = require('@aws-sdk/lib-storage');
const S3_CONFIG = require('../config/s3');
const path = require('path');
const { randomUUID } = require('crypto');

/**
 * S3 Upload Service
 * Amazon S3'e dosya yükleme servisi
 */

/**
 * Dosya yükle
 * @param {Buffer} fileBuffer - Dosya buffer'ı
 * @param {string} fileName - Dosya adı
 * @param {string} folder - Klasör (images, pdfs, etc.)
 * @param {string} mimeType - MIME type
 * @returns {Promise<Object>}
 */
const uploadFile = async (fileBuffer, fileName, folder = 'uploads', mimeType = 'application/octet-stream') => {
  try {
    if (!S3_CONFIG.bucket) {
      throw new Error('S3 bucket yapılandırması eksik');
    }

    // Dosya adını unique yap
    const fileExtension = path.extname(fileName);
    const uniqueFileName = `${randomUUID()}${fileExtension}`;
    const key = `${folder}/${uniqueFileName}`;

    // S3'e yükle
    const upload = new Upload({
      client: S3_CONFIG.client,
      params: {
        Bucket: S3_CONFIG.bucket,
        Key: key,
        Body: fileBuffer,
        ContentType: mimeType,
        ACL: 'public-read', // Public erişim için
      },
    });

    const result = await upload.done();

    // Public URL oluştur
    const fileUrl = `${S3_CONFIG.baseUrl}/${key}`;

    return {
      success: true,
      url: fileUrl,
      key: key,
      fileName: uniqueFileName,
    };
  } catch (error) {
    console.error('S3 Upload Hatası:', error);
    return {
      success: false,
      message: error.message || 'Dosya yükleme hatası',
    };
  }
};

/**
 * Resim yükle
 * @param {Buffer} imageBuffer - Resim buffer'ı
 * @param {string} fileName - Dosya adı
 * @param {string} subFolder - Alt klasör (stores, users, products, etc.)
 * @returns {Promise<Object>}
 */
const uploadImage = async (imageBuffer, fileName, subFolder = 'images') => {
  try {
    // MIME type belirle
    const ext = path.extname(fileName).toLowerCase();
    const mimeTypes = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
    };
    const mimeType = mimeTypes[ext] || 'image/jpeg';

    return await uploadFile(imageBuffer, fileName, `images/${subFolder}`, mimeType);
  } catch (error) {
    console.error('Resim Yükleme Hatası:', error);
    return {
      success: false,
      message: error.message || 'Resim yükleme hatası',
    };
  }
};

/**
 * PDF yükle
 * @param {Buffer} pdfBuffer - PDF buffer'ı
 * @param {string} fileName - Dosya adı
 * @param {string} subFolder - Alt klasör (documents, certificates, etc.)
 * @returns {Promise<Object>}
 */
const uploadPDF = async (pdfBuffer, fileName, subFolder = 'documents') => {
  try {
    return await uploadFile(pdfBuffer, fileName, `pdfs/${subFolder}`, 'application/pdf');
  } catch (error) {
    console.error('PDF Yükleme Hatası:', error);
    return {
      success: false,
      message: error.message || 'PDF yükleme hatası',
    };
  }
};

/**
 * Dosya sil
 * @param {string} key - S3 key (path)
 * @returns {Promise<Object>}
 */
const deleteFile = async (key) => {
  try {
    const { DeleteObjectCommand } = require('@aws-sdk/client-s3');
    const command = new DeleteObjectCommand({
      Bucket: S3_CONFIG.bucket,
      Key: key,
    });

    await S3_CONFIG.client.send(command);

    return {
      success: true,
      message: 'Dosya başarıyla silindi',
    };
  } catch (error) {
    console.error('S3 Delete Hatası:', error);
    return {
      success: false,
      message: error.message || 'Dosya silme hatası',
    };
  }
};

module.exports = {
  uploadFile,
  uploadImage,
  uploadPDF,
  deleteFile,
};

