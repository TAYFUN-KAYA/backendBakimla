require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const adminRoutes = require('./routes/adminRoutes');
const storeRoutes = require('./routes/storeRoutes');
const accountingRoutes = require('./routes/accountingRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const campaignRoutes = require('./routes/campaignRoutes');
const couponRoutes = require('./routes/couponRoutes');
const formRoutes = require('./routes/formRoutes');
const productRoutes = require('./routes/productRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const walletRoutes = require('./routes/walletRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const orderRoutes = require('./routes/orderRoutes');
const addressRoutes = require('./routes/addressRoutes');
const pointsRoutes = require('./routes/pointsRoutes');
const favoriteRoutes = require('./routes/favoriteRoutes');
const cartRoutes = require('./routes/cartRoutes');
const invoiceRoutes = require('./routes/invoiceRoutes');
const paymentMethodRoutes = require('./routes/paymentMethodRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const serviceRoutes = require('./routes/serviceRoutes');

connectDB();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files (test sayfası için) - API route'larından ÖNCE olmalı
app.use(express.static(__dirname + '/public'));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/stores', storeRoutes);
app.use('/api/accounting', accountingRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/rewards', require('./routes/rewardRoutes'));
app.use('/api/appointments', appointmentRoutes);
app.use('/api/campaigns', campaignRoutes);
// Debug: Route test endpoint
app.get('/api/test-campaigns', (req, res) => {
  res.json({ message: 'Campaign routes are working', path: '/api/campaigns' });
});
app.use('/api/coupons', couponRoutes);
app.use('/api/forms', formRoutes);
app.use('/api/products', productRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/addresses', addressRoutes);
app.use('/api/points', pointsRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/payment-methods', paymentMethodRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/services', serviceRoutes);

app.get('/', (req, res) => {
  res.json({
    message: 'Bakimla API',
    version: '1.0.0',
  });
});

// 404 handler - Tüm route'lardan SONRA olmalı
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route bulunamadı',
  });
});

app.use((err, req, res, next) => {
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Sunucu hatası',
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Sunucu ${PORT} portunda çalışıyor`);
});

