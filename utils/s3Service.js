const { PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { s3Client, S3_BUCKET_NAME, S3_BASE_URL } = require('../config/s3');
const crypto = require('crypto');
const path = require('path');

/**
 * S3 Upload Service
 * Amazon S3'e dosya yükleme servisi
 */

/**
 * Upload file to S3
 * @param {Buffer} fileBuffer - File buffer
 * @param {string} originalName - Original file name
 * @param {string} folder - Folder path in S3 (e.g., 'stores', 'users', 'products')
 * @param {string} mimetype - MIME type of the file
 * @returns {Promise<{success: boolean, url?: string, key?: string, fileName?: string, message?: string}>}
 */
const uploadToS3 = async (fileBuffer, originalName, folder = 'uploads', mimetype = 'image/jpeg') => {
  try {
    // Validate S3 configuration
    if (!S3_BUCKET_NAME) {
      throw new Error('S3 bucket yapılandırması eksik');
    }

    // Generate unique file name
    const fileExtension = path.extname(originalName).toLowerCase();
    const fileName = `${crypto.randomUUID()}${fileExtension}`;
    const key = `${folder}/${fileName}`;

    // Upload to S3
    const command = new PutObjectCommand({
      Bucket: S3_BUCKET_NAME,
      Key: key,
      Body: fileBuffer,
      ContentType: mimetype,
      // Note: ACL is deprecated. Use bucket policy for public access instead.
      // Make sure your S3 bucket has a policy that allows public read access.
    });

    await s3Client.send(command);

    // Return public URL (ensure base URL doesn't have trailing slash)
    const baseUrl = S3_BASE_URL.endsWith('/') ? S3_BASE_URL.slice(0, -1) : S3_BASE_URL;
    const url = `${baseUrl}/${key}`;

    return {
      success: true,
      url,
      key,
      fileName,
    };
  } catch (error) {
    console.error('S3 Upload Error:', error);
    return {
      success: false,
      message: error.message || 'Dosya yükleme hatası',
    };
  }
};

/**
 * Delete file from S3
 * @param {string} key - S3 object key (full path or just key)
 * @returns {Promise<{success: boolean, message?: string}>}
 */
const deleteFromS3 = async (key) => {
  try {
    // Extract key from URL if full URL is provided
    let s3Key = key;
    
    // Handle both CloudFront and S3 URLs
    if (key && typeof key === 'string' && key.startsWith('http')) {
      s3Key = extractS3Key(key);
      if (!s3Key) {
        throw new Error('Geçersiz S3 URL');
      }
    }

    const command = new DeleteObjectCommand({
      Bucket: S3_BUCKET_NAME,
      Key: s3Key,
    });

    await s3Client.send(command);

    return {
      success: true,
      message: 'Dosya başarıyla silindi',
    };
  } catch (error) {
    console.error('S3 Delete Error:', error);
    return {
      success: false,
      message: error.message || 'Dosya silme hatası',
    };
  }
};

/**
 * Extract S3 key from URL
 * @param {string} url - Full S3 URL
 * @returns {string|null} - S3 key or null
 */
const extractS3Key = (url) => {
  if (!url || typeof url !== 'string' || !url.startsWith('http')) {
    return null;
  }
  
  // Handle both CloudFront and S3 URLs
  const baseUrl = S3_BASE_URL.endsWith('/') ? S3_BASE_URL.slice(0, -1) : S3_BASE_URL;
  if (!url.includes(baseUrl)) {
    return null;
  }
  
  let key = url.replace(`${baseUrl}/`, '').replace(baseUrl, '');
  // Remove leading slash if exists
  if (key.startsWith('/')) {
    key = key.slice(1);
  }
  
  return key || null;
};

/**
 * Resim yükle (Backward compatibility wrapper)
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

    return await uploadToS3(imageBuffer, fileName, `images/${subFolder}`, mimeType);
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
    return await uploadToS3(pdfBuffer, fileName, `pdfs/${subFolder}`, 'application/pdf');
  } catch (error) {
    console.error('PDF Yükleme Hatası:', error);
    return {
      success: false,
      message: error.message || 'PDF yükleme hatası',
    };
  }
};

/**
 * Dosya sil (Backward compatibility wrapper)
 * @param {string} key - S3 key (path)
 * @returns {Promise<Object>}
 */
const deleteFile = async (key) => {
  return await deleteFromS3(key);
};

module.exports = {
  uploadToS3,
  deleteFromS3,
  extractS3Key,
  uploadFile: uploadToS3, // Alias for backward compatibility
  uploadImage,
  uploadPDF,
  deleteFile,
};

