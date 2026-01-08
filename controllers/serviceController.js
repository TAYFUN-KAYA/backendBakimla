const Service = require('../models/Service');

/**
 * Yeni hizmet oluştur
 */
exports.createService = async (req, res) => {
    try {
        const { name, description, price, duration, category } = req.body;
        const companyId = req.companyId || req.user._id;

        const service = await Service.create({
            companyId,
            name,
            description,
            price,
            duration,
            category,
        });

        res.status(201).json({
            success: true,
            data: service,
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};

/**
 * Şirketin tüm hizmetlerini getir
 * Hem company hem employee kullanıcıları erişebilir
 */
exports.getCompanyServices = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Kullanıcı bilgisi bulunamadı',
            });
        }

        console.log('getCompanyServices - User (raw):', JSON.stringify(req.user, null, 2));
        console.log('getCompanyServices - User type check:', {
            userId: req.user._id || req.user.id,
            userType: req.user.userType,
            companyId: req.user.companyId,
            isApproved: req.user.isApproved,
            has_id: !!req.user._id,
            has_id_string: !!req.user.id
        });

        // Company kullanıcısı ise kendi ID'sini, employee ise bağlı olduğu şirketin ID'sini kullan
        let companyId;
        
        // userType kontrolü - hem 'company' hem de 'user' tipindeki kullanıcılar şirket olabilir
        // (bazı eski kayıtlarda userType 'user' olabilir ama aslında şirket - activeStoreId varsa şirkettir)
        if (req.user.userType === 'company') {
            // Company kullanıcısı - kendi ID'sini kullan
            companyId = req.user._id ? req.user._id.toString() : (req.user.id ? req.user.id.toString() : null);
        } else if (req.user.userType === 'user') {
            // 'user' tipindeki kullanıcılar için Store kontrolü yap
            // Eğer activeStoreId varsa veya Store kaydı varsa, bu bir şirket kullanıcısıdır
            const Store = require('../models/Store');
            const userId = req.user._id || req.user.id;
            const store = await Store.findOne({ companyId: userId });
            
            if (store || req.user.activeStoreId) {
                // Bu kullanıcının Store kaydı var, şirket kullanıcısıdır
                companyId = userId ? userId.toString() : null;
            } else {
                // 'user' tipinde ama Store kaydı yok - normal kullanıcı
                console.error('User type but no store found. User:', {
                    userId: userId,
                    userType: req.user.userType,
                    activeStoreId: req.user.activeStoreId
                });
                return res.status(403).json({
                    success: false,
                    message: 'Bu işlem için şirket hesabı gereklidir. Lütfen şirket hesabı ile giriş yapın.',
                });
            }
        } else if (req.user.userType === 'employee') {
            // Employee için companyId kontrolü
            if (req.user.companyId) {
                // companyId ObjectId ise toString() yap, string ise direkt kullan
                companyId = req.user.companyId.toString ? req.user.companyId.toString() : req.user.companyId;
            } else {
                console.error('Employee has no companyId. User data:', JSON.stringify(req.user, null, 2));
                return res.status(403).json({
                    success: false,
                    message: 'Çalışan hesabınız bir şirkete bağlı değil. Lütfen yöneticinizle iletişime geçin.',
                });
            }
        } else {
            console.error('Invalid userType for getCompanyServices. User:', {
                userType: req.user.userType,
                userId: req.user._id || req.user.id,
                fullUser: JSON.stringify(req.user, null, 2)
            });
            return res.status(403).json({
                success: false,
                message: `Bu işlem için şirket veya çalışan yetkisi gereklidir. Mevcut kullanıcı tipi: ${req.user.userType || 'bilinmiyor'}`,
            });
        }

        if (!companyId) {
            console.error('companyId is null/undefined');
            return res.status(400).json({
                success: false,
                message: 'Şirket ID bulunamadı',
            });
        }

        console.log('getCompanyServices - Searching services for companyId:', companyId);
        const services = await Service.find({ companyId, isActive: { $ne: false } });
        console.log('getCompanyServices - Found services:', services.length);

        res.status(200).json({
            success: true,
            data: services,
        });
    } catch (error) {
        console.error('getCompanyServices error:', error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

/**
 * Hizmet güncelle
 */
exports.updateService = async (req, res) => {
    try {
        const { id } = req.params;
        const companyId = req.companyId || req.user._id;

        const service = await Service.findOneAndUpdate(
            { _id: id, companyId },
            req.body,
            { new: true, runValidators: true }
        );

        if (!service) {
            return res.status(404).json({
                success: false,
                message: 'Hizmet bulunamadı',
            });
        }

        res.status(200).json({
            success: true,
            data: service,
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};

/**
 * Hizmet sil (soft delete)
 */
exports.deleteService = async (req, res) => {
    try {
        const { id } = req.params;
        const companyId = req.companyId || req.user._id;

        const service = await Service.findOneAndUpdate(
            { _id: id, companyId },
            { isActive: false },
            { new: true }
        );

        if (!service) {
            return res.status(404).json({
                success: false,
                message: 'Hizmet bulunamadı',
            });
        }

        res.status(200).json({
            success: true,
            message: 'Hizmet silindi',
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};
