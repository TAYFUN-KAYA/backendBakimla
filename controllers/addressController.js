const Address = require('../models/Address');

/**
 * createAddress
 * Adres oluştur
 */
const createAddress = async (req, res) => {
  try {
    const userId = req.user._id;
    const addressData = { ...req.body, userId };

    const address = await Address.create(addressData);

    res.status(201).json({
      success: true,
      message: 'Adres başarıyla oluşturuldu',
      data: address,
    });
  } catch (error) {
    console.error('Create Address Error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * getAddresses
 * Kullanıcının adreslerini listele
 */
const getAddresses = async (req, res) => {
  try {
    const userId = req.user._id;

    const addresses = await Address.find({ userId }).sort({ isDefault: -1, createdAt: -1 });

    res.status(200).json({
      success: true,
      count: addresses.length,
      data: addresses,
    });
  } catch (error) {
    console.error('Get Addresses Error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * updateAddress
 * Adres güncelle
 */
const updateAddress = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    const address = await Address.findOne({ _id: id, userId });
    if (!address) {
      return res.status(404).json({
        success: false,
        message: 'Adres bulunamadı',
      });
    }

    Object.assign(address, req.body);
    await address.save();

    res.status(200).json({
      success: true,
      message: 'Adres başarıyla güncellendi',
      data: address,
    });
  } catch (error) {
    console.error('Update Address Error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * deleteAddress
 * Adres sil
 */
const deleteAddress = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    const address = await Address.findOneAndDelete({ _id: id, userId });
    if (!address) {
      return res.status(404).json({
        success: false,
        message: 'Adres bulunamadı',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Adres başarıyla silindi',
    });
  } catch (error) {
    console.error('Delete Address Error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createAddress,
  getAddresses,
  updateAddress,
  deleteAddress,
};

