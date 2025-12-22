const Product = require('../models/Product');
const User = require('../models/User');

/**
 * createProduct
 * Yeni ürün oluşturur
 */
const createProduct = async (req, res) => {
  try {
    const { companyId, name, description, price, category, images, stock } = req.body;

    if (!companyId || !name || !price || !category) {
      return res.status(400).json({
        success: false,
        message: 'companyId, name, price ve category zorunludur',
      });
    }

    const company = await User.findById(companyId);
    if (!company || company.userType !== 'company') {
      return res.status(404).json({
        success: false,
        message: 'Şirket bulunamadı',
      });
    }

    const product = await Product.create({
      companyId,
      name,
      description,
      price,
      category,
      images: images || [],
      stock: stock || 0,
    });

    res.status(201).json({
      success: true,
      message: 'Ürün başarıyla oluşturuldu',
      data: product,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * getAllProducts
 * Tüm yayınlanmış ürünleri listeler (e-ticaret için)
 */
const getAllProducts = async (req, res) => {
  try {
    const { companyId, category, minPrice, maxPrice } = req.query;

    const query = { isPublished: true, isActive: true };

    if (companyId) {
      query.companyId = companyId;
    }

    if (category) {
      query.category = category;
    }

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) {
        query.price.$gte = parseFloat(minPrice);
      }
      if (maxPrice) {
        query.price.$lte = parseFloat(maxPrice);
      }
    }

    const products = await Product.find(query)
      .populate('companyId', 'firstName lastName')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: products.length,
      data: products,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * filterProducts
 * Ürünleri filtreleme ile listeler (POST - mobile için)
 */
const filterProducts = async (req, res) => {
  try {
    const {
      companyId,
      category,
      minPrice,
      maxPrice,
      minStock,
      maxStock,
      search,
      sortBy,
      sortOrder,
      page,
      limit,
    } = req.body;

    const query = { isPublished: true, isActive: true };

    if (companyId) {
      query.companyId = companyId;
    }

    if (category) {
      if (Array.isArray(category)) {
        query.category = { $in: category };
      } else {
        query.category = category;
      }
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      query.price = {};
      if (minPrice !== undefined) {
        query.price.$gte = parseFloat(minPrice);
      }
      if (maxPrice !== undefined) {
        query.price.$lte = parseFloat(maxPrice);
      }
    }

    if (minStock !== undefined || maxStock !== undefined) {
      query.stock = {};
      if (minStock !== undefined) {
        query.stock.$gte = parseInt(minStock);
      }
      if (maxStock !== undefined) {
        query.stock.$lte = parseInt(maxStock);
      }
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const sortOptions = {};
    if (sortBy) {
      const validSortFields = ['price', 'name', 'createdAt', 'stock'];
      if (validSortFields.includes(sortBy)) {
        sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;
      } else {
        sortOptions.createdAt = -1;
      }
    } else {
      sortOptions.createdAt = -1;
    }

    const pageNumber = parseInt(page) || 1;
    const pageSize = parseInt(limit) || 20;
    const skip = (pageNumber - 1) * pageSize;

    const products = await Product.find(query)
      .populate('companyId', 'firstName lastName profileImage')
      .sort(sortOptions)
      .skip(skip)
      .limit(pageSize);

    const totalCount = await Product.countDocuments(query);

    res.status(200).json({
      success: true,
      count: products.length,
      totalCount,
      page: pageNumber,
      totalPages: Math.ceil(totalCount / pageSize),
      data: products,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * getCompanyProducts
 * Şirketin tüm ürünlerini listeler
 */
const getCompanyProducts = async (req, res) => {
  try {
    const { companyId } = req.body;
    const { isPublished, isActive } = req.query;

    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: 'companyId gereklidir',
      });
    }

    const query = { companyId };
    if (isPublished !== undefined) {
      query.isPublished = isPublished === 'true';
    }
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    const products = await Product.find(query)
      .populate('companyId', 'firstName lastName')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: products.length,
      data: products,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * getProductById
 * ID ile ürün getirir
 */
const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id).populate('companyId', 'firstName lastName email phoneNumber');

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Ürün bulunamadı',
      });
    }

    res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * updateProduct
 * Ürün bilgilerini günceller
 */
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    }).populate('companyId', 'firstName lastName');

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Ürün bulunamadı',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Ürün başarıyla güncellendi',
      data: product,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * deleteProduct
 * Ürünü siler
 */
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findByIdAndDelete(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Ürün bulunamadı',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Ürün başarıyla silindi',
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createProduct,
  getAllProducts,
  filterProducts,
  getCompanyProducts,
  getProductById,
  updateProduct,
  deleteProduct,
};

