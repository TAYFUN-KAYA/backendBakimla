/**
 * Amazon S3 Configuration
 * Resim ve PDF yükleme için S3 yapılandırması
 */

const { S3Client } = require('@aws-sdk/client-s3');

if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY || !process.env.AWS_REGION || !process.env.AWS_S3_BUCKET) {
  console.warn('⚠️  UYARI: AWS S3 yapılandırması eksik! Dosya yükleme çalışmayabilir.');
}

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'eu-west-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

const S3_CONFIG = {
  bucket: process.env.AWS_S3_BUCKET || '',
  region: process.env.AWS_REGION || 'eu-west-1',
  baseUrl: process.env.AWS_S3_BASE_URL || `https://${process.env.AWS_S3_BUCKET || ''}.s3.${process.env.AWS_REGION || 'eu-west-1'}.amazonaws.com`,
  client: s3Client,
};

module.exports = S3_CONFIG;

