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
 */
exports.getCompanyServices = async (req, res) => {
    try {
        const companyId = req.companyId || req.user._id;
        const services = await Service.find({ companyId, isActive: true });

        res.status(200).json({
            success: true,
            data: services,
        });
    } catch (error) {
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
