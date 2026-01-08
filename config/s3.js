/**
 * Amazon S3 Configuration
 * Resim ve PDF yükleme için S3 yapılandırması
 */

const { S3Client } = require('@aws-sdk/client-s3');

// Check if required S3 environment variables are present
const requiredEnvVars = ['AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'AWS_REGION', 'AWS_S3_BUCKET'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.warn('⚠️  UYARI: AWS S3 yapılandırması eksik! Dosya yükleme çalışmayabilir.');
  console.warn('   Eksik değişkenler:', missingEnvVars.join(', '));
}

// Initialize S3 Client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'eu-west-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

// S3 Configuration
const S3_BUCKET_NAME = process.env.AWS_S3_BUCKET || '';
const S3_REGION = process.env.AWS_REGION || 'eu-west-1';

// Base URL - Supports both CloudFront and S3 direct URLs
const S3_BASE_URL = process.env.AWS_CLOUDFRONT_URL 
  || process.env.AWS_S3_BASE_URL 
  || (S3_BUCKET_NAME ? `https://${S3_BUCKET_NAME}.s3.${S3_REGION}.amazonaws.com` : '');

// Export configuration
module.exports = {
  s3Client,
  S3_BUCKET_NAME,
  S3_REGION,
  S3_BASE_URL,
};

