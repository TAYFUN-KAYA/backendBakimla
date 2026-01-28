const mongoose = require('mongoose');
const Store = require("../models/Store");
const User = require("../models/User");
const Customer = require("../models/Customer");
const Appointment = require("../models/Appointment");
const QuickAppointment = require("../models/QuickAppointment");
const Review = require("../models/Review");
const { Wallet } = require("../models/Wallet");
const { validateSectorIds, getSectorById } = require("../constants/sectors");
const { deleteFromS3, extractS3Key } = require("../utils/s3Service");

// Create a new store
const createStore = async (req, res) => {
  try {
    const {
      companyId,
      storeName,
      authorizedPersonName,
      authorizedPersonTCKN,
      businessName,
      taxOffice,
      taxNumber,
      iban,
      businessDescription,
      interiorImage,
      exteriorImage,
      appIcon,
      serviceImages = [],
      workingDays = [],
      sectors = [],
      services = [],
      businessField,
      address = {},
      location = null,
    } = req.body;

    // Validate required fields
    if (
      !companyId ||
      !storeName ||
      !authorizedPersonName ||
      !authorizedPersonTCKN ||
      !businessName ||
      !taxOffice ||
      !taxNumber ||
      !iban ||
      !businessDescription ||
      !interiorImage ||
      !exteriorImage ||
      !appIcon ||
      !businessField
    ) {
      return res.status(400).json({
        success: false,
        message: "Tüm zorunlu alanlar doldurulmalıdır",
      });
    }

    // Validate sectors if provided
    if (sectors && sectors.length > 0) {
    const sectorValidation = validateSectorIds(sectors);
    if (!sectorValidation.valid) {
      return res.status(400).json({
        success: false,
          message: sectorValidation.message || "Geçersiz sektör ID'leri",
      });
      }
    }

    // Check if company exists
    const company = await User.findById(companyId);
    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Şirket bulunamadı",
      });
    }

    // Generate unique store code (6 digits)
    let storeCode;
      let isUnique = false;
    while (!isUnique) {
      storeCode = Math.floor(100000 + Math.random() * 900000).toString();
      const existingStore = await Store.findOne({ storeCode });
        if (!existingStore) {
          isUnique = true;
      }
    }

    // Generate store link from businessName (not storeName)
    const storeLink = `${businessName
        .toLowerCase()
      .replace(/\s+/g, "-")}/${storeCode}`;

    // Create store
    const store = new Store({
      companyId,
      storeName,
      authorizedPersonName,
      authorizedPersonTCKN,
      businessName,
      taxOffice,
      taxNumber,
      iban,
      businessDescription,
      interiorImage,
      exteriorImage,
      appIcon,
      serviceImages,
      workingDays,
      sectors: sectors.map((sectorId) => {
        const sector = getSectorById(sectorId);
        if (!sector) {
          throw new Error(`Geçersiz sektör ID: ${sectorId}`);
        }
        return {
          id: sectorId,
          name: sector.name,
          key: sector.key,
        };
      }),
      services,
      businessField,
      address: {
        city: address.city || "",
        district: address.district || "",
        fullAddress: address.fullAddress || "",
        building: address.building || "",
        no: address.no || "",
        addressDetail: address.addressDetail || "",
      },
      location: location
        ? {
            latitude: location.latitude,
            longitude: location.longitude,
            address: location.address || "",
          }
        : null,
      storeCode,
      storeLink: "https://bakimla.com/" + storeLink,
      isOpen: true,
      alwaysAcceptAppointmentRequests: false, // Default false
    });

    await store.save();

    // For company users: Add new store to activeStoreIds array
    if (company.userType === 'company') {
      // Initialize activeStoreIds if it doesn't exist
      if (!company.activeStoreIds || !Array.isArray(company.activeStoreIds)) {
        company.activeStoreIds = [];
      }
      
      // Add new store to activeStoreIds array if not already present
      const storeIdString = store._id.toString();
      if (!company.activeStoreIds.some(id => id.toString() === storeIdString)) {
        company.activeStoreIds.push(store._id);
      }
      
      // Also set as activeStoreId if not set (for backward compatibility)
      if (!company.activeStoreId) {
        company.activeStoreId = store._id;
      }
      
      await company.save();
    }

    res.status(201).json({
      success: true,
      message: "İşletme başarıyla oluşturuldu",
      data: store,
    });
  } catch (error) {
    console.error("createStore error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "İşletme oluşturulurken bir hata oluştu",
    });
  }
};

const getCompanyStores = async (req, res) => {
  try {
    // Get companyId from middleware (companyMiddleware sets req.user or req.companyId)
    const companyId = req.user?._id || req.user?.id || req.companyId;

    if (!companyId) {
      return res.status(401).json({
        success: false,
        message: "Kullanıcı bilgisi bulunamadı",
      });
    }

    // Find all stores for this company
    const stores = await Store.find({ companyId })
      .populate(
        "companyId",
        "firstName lastName email phoneNumber profileImage"
      )
      .sort({ createdAt: -1 })
      .lean();

    // Get active store IDs from User model
    const User = require("../models/User");
    const user = await User.findById(companyId).select("activeStoreId activeStoreIds userType").lean();
    
    // For company users: Use activeStoreIds array, fallback to activeStoreId, then first store
    let activeStoreId = null;
    if (user?.userType === 'company' && user?.activeStoreIds && Array.isArray(user.activeStoreIds) && user.activeStoreIds.length > 0) {
      // Use the first activeStoreId from array (or current activeStoreId if it's in the array)
      activeStoreId = user.activeStoreId?.toString() || user.activeStoreIds[0]?.toString() || null;
    } else {
      // Fallback to activeStoreId or first store
      activeStoreId = user?.activeStoreId?.toString() || stores[0]?._id?.toString() || null;
    }

    res.status(200).json({
      success: true,
      data: stores,
      activeStoreId: activeStoreId,
      activeStoreIds: user?.activeStoreIds?.map(id => id.toString()) || [], // Return all active store IDs
    });
  } catch (error) {
    console.error("getCompanyStores error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "İşletmeler yüklenirken bir hata oluştu",
    });
  }
};

const getStoreDetails = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate storeId
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Geçerli bir işletme ID'si gereklidir",
      });
    }

    // Get store details with populated company info
    const store = await Store.findById(id).populate('companyId', 'firstName lastName profileImage');

    if (!store) {
      return res.status(404).json({
        success: false,
        message: "İşletme bulunamadı",
      });
    }

    // Calculate average rating from reviews
    const ratingResult = await Review.aggregate([
      {
        $match: {
          companyId: store.companyId._id || store.companyId,
          isPublished: true,
        },
      },
      {
        $group: {
          _id: null,
          avgRating: { $avg: '$rating' },
          reviewCount: { $sum: 1 },
        },
      },
    ]);

    const rating = ratingResult[0]?.avgRating || store.rating || 0;
    const reviewCount = ratingResult[0]?.reviewCount || store.reviewCount || 0;

    res.status(200).json({
      success: true,
      data: {
        id: store._id,
        _id: store._id,
        storeName: store.storeName,
        businessName: store.businessName,
        name: store.storeName || store.businessName,
        logo: store.appIcon,
        appIcon: store.appIcon,
        coverImage: store.interiorImage || store.exteriorImage,
        interiorImage: store.interiorImage,
        interiorImages: store.interiorImages || (store.interiorImage ? [store.interiorImage] : []),
        exteriorImage: store.exteriorImage,
        description: store.businessDescription,
        businessDescription: store.businessDescription,
        address: {
          fullAddress: store.address?.fullAddress || store.location?.address || '',
          city: store.address?.city || '',
          district: store.address?.district || '',
          latitude: store.location?.latitude || store.address?.latitude || null,
          longitude: store.location?.longitude || store.address?.longitude || null,
        },
        location: store.location || {},
        businessField: store.businessField,
        sectors: store.sectors || [],
        services: store.services || [],
        workingDays: store.workingDays || [],
        rating: rating,
        reviewCount: reviewCount,
        verified: true, // TODO: Add verification logic
        isOpen: store.isOpen,
        storeCode: store.storeCode,
        storeLink: store.storeLink,
        serviceImages: store.serviceImages || [],
        companyId: store.companyId?._id,
        companyName: store.companyId?.firstName 
          ? `${store.companyId.firstName} ${store.companyId.lastName || ''}`.trim()
          : '',
      },
    });
  } catch (error) {
    console.error('getStoreDetails error:', error);
    res.status(500).json({
      success: false,
      message: "İşletme detayları getirilirken hata oluştu",
      error: error.message,
    });
  }
};

const getStoreByCompanyId = async (req, res) => {
  res.status(501).json({ success: false, message: "Not implemented" });
};

const setActiveStore = async (req, res) => {
  try {
    // Get companyId from middleware (companyMiddleware sets req.user or req.companyId)
    const companyId = req.user?._id || req.user?.id || req.companyId;
    const { storeId } = req.body;

    if (!companyId) {
      return res.status(401).json({
        success: false,
        message: "Kullanıcı bilgisi bulunamadı",
      });
    }

    if (!storeId) {
      return res.status(400).json({
        success: false,
        message: "Store ID gereklidir",
      });
    }

    // Verify that the store belongs to this company
    const store = await Store.findOne({ _id: storeId, companyId });
    if (!store) {
      return res.status(404).json({
        success: false,
        message: "İşletme bulunamadı veya bu işletmeye erişim yetkiniz yok",
      });
    }

    // Update User's activeStoreId and ensure store is in activeStoreIds array
    const User = require("../models/User");
    const user = await User.findById(companyId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Kullanıcı bulunamadı",
      });
    }

    // For company users: Add to activeStoreIds array if not present
    if (user.userType === 'company') {
      if (!user.activeStoreIds || !Array.isArray(user.activeStoreIds)) {
        user.activeStoreIds = [];
      }
      
      const storeIdString = storeId.toString();
      if (!user.activeStoreIds.some(id => id.toString() === storeIdString)) {
        user.activeStoreIds.push(storeId);
      }
    }

    // Update activeStoreId (for backward compatibility and current active store)
    user.activeStoreId = storeId;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Aktif işletme güncellendi",
      data: {
        storeId: storeId,
        storeName: store.storeName,
      },
    });
  } catch (error) {
    console.error("setActiveStore error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Aktif işletme güncellenirken bir hata oluştu",
    });
  }
};

const updateStore = async (req, res) => {
  res.status(501).json({ success: false, message: "Not implemented" });
};

// Update store by company ID (from header or body)
const updateStoreByCompanyId = async (req, res) => {
  try {
    // Get companyId from header or body
    const companyId = req.headers["x-company-id"] || req.body.companyId;

    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: "Company ID gereklidir",
      });
    }

    // Get storeId from body (for active store)
    const storeId = req.body.storeId;
    console.log('🔄 updateStoreByCompanyId - storeId from body:', storeId, 'type:', typeof storeId, 'companyId:', companyId);
    console.log('📦 Full request body:', JSON.stringify(req.body, null, 2));

    let store;
    if (storeId) {
      // Find store by storeId and verify it belongs to the company
      // Mongoose automatically handles string to ObjectId conversion
      console.log('🔍 Looking for store with _id:', storeId, '(will be converted to ObjectId) and companyId:', companyId);
      store = await Store.findOne({ 
        _id: storeId,
        companyId: companyId 
      });

      if (!store) {
        console.error('❌ Store not found or access denied. storeId:', storeId, 'companyId:', companyId);
        // Try to find all stores for this company to debug
        const allStores = await Store.find({ companyId }).select('_id storeName').lean();
        console.log('📋 All stores for this company:', allStores.map(s => ({ id: s._id.toString(), name: s.storeName })));
        return res.status(404).json({
          success: false,
          message: "İşletme bulunamadı veya bu işletmeye erişim yetkiniz yok",
        });
      }
      console.log('✅ Store found:', store._id.toString(), store.storeName);
    } else {
      // If no storeId provided, get active store from user's activeStoreIds
      const User = require("../models/User");
      const user = await User.findById(companyId).select("activeStoreIds userType").lean();
      
      let activeStoreId = null;
      if (user?.userType === 'company' && user?.activeStoreIds && Array.isArray(user.activeStoreIds) && user.activeStoreIds.length > 0) {
        activeStoreId = user.activeStoreIds[0];
      }

      if (activeStoreId) {
        store = await Store.findOne({ 
          _id: activeStoreId,
          companyId: companyId 
        });
      } else {
        // Fallback: Find first store by companyId
        store = await Store.findOne({ companyId });
      }
    }

    if (!store) {
      return res.status(404).json({
        success: false,
        message: "İşletme bulunamadı",
      });
    }

    if (!store) {
      return res.status(404).json({
        success: false,
        message: "İşletme bulunamadı",
      });
    }

    // Validate sectors if provided
    if (req.body.sectors && req.body.sectors.length > 0) {
      const sectorValidation = validateSectorIds(req.body.sectors);
      if (!sectorValidation.valid) {
        return res.status(400).json({
          success: false,
          message: sectorValidation.message || "Geçersiz sektör ID'leri",
        });
      }
    }

    // Update fields
    const updateFields = {};

    if (req.body.storeName) {
      updateFields.storeName = req.body.storeName;
    }
    // Regenerate storeLink if businessName changed (use businessName, not storeName)
    if (req.body.businessName) {
      const newStoreLink = `${req.body.businessName
        .toLowerCase()
        .replace(/\s+/g, "-")}/${store.storeCode}`;
      updateFields.storeLink = "https://bakimla.com/" + newStoreLink;
    }
    if (req.body.authorizedPersonName)
      updateFields.authorizedPersonName = req.body.authorizedPersonName;
    if (req.body.authorizedPersonTCKN)
      updateFields.authorizedPersonTCKN = req.body.authorizedPersonTCKN;
    if (req.body.businessName)
      updateFields.businessName = req.body.businessName;
    if (req.body.taxOffice) updateFields.taxOffice = req.body.taxOffice;
    if (req.body.taxNumber) updateFields.taxNumber = req.body.taxNumber;
    if (req.body.iban) updateFields.iban = req.body.iban;
    if (req.body.businessDescription)
      updateFields.businessDescription = req.body.businessDescription;
    if (req.body.interiorImage)
      updateFields.interiorImage = req.body.interiorImage;
    if (req.body.exteriorImage)
      updateFields.exteriorImage = req.body.exteriorImage;
    if (req.body.appIcon) updateFields.appIcon = req.body.appIcon;
    
    // Always update serviceImages if provided (even if empty array)
    if (req.body.serviceImages !== undefined) {
      console.log("=== DEBUG: Updating serviceImages ===");
      console.log("Current serviceImages in DB:", store.serviceImages);
      console.log("New serviceImages from request:", req.body.serviceImages);
      console.log("serviceImages length:", req.body.serviceImages?.length || 0);
      updateFields.serviceImages = req.body.serviceImages;
    }
    
    // Delete service images from S3 if provided
    if (req.body.deletedServiceImages && Array.isArray(req.body.deletedServiceImages) && req.body.deletedServiceImages.length > 0) {
      console.log("=== DEBUG: Deleting Service Images from S3 ===");
      console.log("Deleted service images URLs:", req.body.deletedServiceImages);
      
      // Delete each service image from S3
      const deletePromises = req.body.deletedServiceImages.map(async (imageUrl) => {
        try {
          if (!imageUrl || typeof imageUrl !== 'string') {
            console.warn("Invalid image URL:", imageUrl);
            return { success: false, url: imageUrl, error: "Invalid URL" };
          }
          
          // Extract S3 key from URL
          const s3Key = extractS3Key(imageUrl);
          if (!s3Key) {
            console.warn("Could not extract S3 key from URL:", imageUrl);
            return { success: false, url: imageUrl, error: "Could not extract S3 key" };
          }
          
          console.log(`Deleting S3 key: ${s3Key} from URL: ${imageUrl}`);
          const deleteResult = await deleteFromS3(s3Key);
          
          if (deleteResult.success) {
            console.log(`✅ Successfully deleted: ${s3Key}`);
            return { success: true, url: imageUrl, key: s3Key };
          } else {
            console.error(`❌ Failed to delete: ${s3Key}`, deleteResult.message);
            return { success: false, url: imageUrl, key: s3Key, error: deleteResult.message };
          }
        } catch (error) {
          console.error(`❌ Error deleting image ${imageUrl}:`, error);
          return { success: false, url: imageUrl, error: error.message };
        }
      });
      
      const deleteResults = await Promise.all(deletePromises);
      const successCount = deleteResults.filter(r => r.success).length;
      const failCount = deleteResults.filter(r => !r.success).length;
      
      console.log(`Deleted ${successCount} images successfully, ${failCount} failed`);
      console.log("Delete results:", deleteResults);
      console.log("=============================================");
    }
    
    if (req.body.workingDays) updateFields.workingDays = req.body.workingDays;
    if (req.body.services) updateFields.services = req.body.services;
    if (req.body.businessField)
      updateFields.businessField = req.body.businessField;
    if (req.body.isOpen !== undefined) updateFields.isOpen = req.body.isOpen;
    if (req.body.alwaysAcceptAppointmentRequests !== undefined) 
      updateFields.alwaysAcceptAppointmentRequests = req.body.alwaysAcceptAppointmentRequests;
    
    // Update notification preferences if provided
    if (req.body.notificationPreferences !== undefined) {
      updateFields.notificationPreferences = {
        appointmentReminder: req.body.notificationPreferences.appointmentReminder !== undefined 
          ? req.body.notificationPreferences.appointmentReminder 
          : (store.notificationPreferences?.appointmentReminder ?? true),
        campaignNotifications: req.body.notificationPreferences.campaignNotifications !== undefined 
          ? req.body.notificationPreferences.campaignNotifications 
          : (store.notificationPreferences?.campaignNotifications ?? true),
      };
    }

    // Update sectors if provided
    if (req.body.sectors && req.body.sectors.length > 0) {
      updateFields.sectors = req.body.sectors.map((sectorId) => {
        const sector = getSectorById(sectorId);
        if (!sector) {
          throw new Error(`Geçersiz sektör ID: ${sectorId}`);
        }
        return {
          id: sectorId,
          name: sector.name,
          key: sector.key,
        };
      });
    }

    // Update address if provided
    if (req.body.address) {
      updateFields.address = {
        city: req.body.address.city || store.address?.city || "",
        district: req.body.address.district || store.address?.district || "",
        fullAddress:
          req.body.address.fullAddress || store.address?.fullAddress || "",
        building: req.body.address.building || store.address?.building || "",
        no: req.body.address.no || store.address?.no || "",
        addressDetail:
          req.body.address.addressDetail || store.address?.addressDetail || "",
      };
    }

    // Update location if provided
    if (req.body.location) {
      updateFields.location = {
        latitude: req.body.location.latitude,
        longitude: req.body.location.longitude,
        address: req.body.location.address || "",
      };
    }

    // Apply updates
    console.log("=== DEBUG: Final updateFields ===");
    console.log("serviceImages in updateFields:", updateFields.serviceImages);
    console.log("updateFields keys:", Object.keys(updateFields));
    
    Object.assign(store, updateFields);
    
    console.log("=== DEBUG: Store before save ===");
    console.log("store.serviceImages:", store.serviceImages);
    console.log("store.serviceImages length:", store.serviceImages?.length || 0);
    
    await store.save();
    
    console.log("=== DEBUG: Store after save ===");
    console.log("store.serviceImages:", store.serviceImages);
    console.log("store.serviceImages length:", store.serviceImages?.length || 0);

    res.status(200).json({
      success: true,
      message: "İşletme başarıyla güncellendi",
      data: store,
    });
  } catch (error) {
    console.error("updateStoreByCompanyId error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "İşletme güncellenirken bir hata oluştu",
    });
  }
};

const getAllStores = async (req, res) => {
  try {
    const stores = await Store.find().populate(
      "companyId",
      "firstName lastName email phoneNumber"
    );
    res.status(200).json({
      success: true,
      count: stores.length,
      data: stores,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get current user's store info
const getMyStoreInfo = async (req, res) => {
  try {
    // Get companyId from middleware (companyMiddleware sets req.user or req.companyId)
    const companyId = req.user?._id || req.user?.id || req.companyId;

    if (!companyId) {
      return res.status(401).json({
        success: false,
        message: "Kullanıcı bilgisi bulunamadı",
      });
    }

    // Get storeId from query parameter or body (for active store)
    const storeId = req.query.storeId || req.body.storeId;

    let store;
    if (storeId) {
      // Convert storeId to ObjectId if needed
      let storeIdObj;
      try {
        storeIdObj = mongoose.Types.ObjectId.isValid(storeId) 
          ? new mongoose.Types.ObjectId(storeId) 
          : storeId;
      } catch (error) {
        console.error('❌ Invalid storeId format:', error);
        return res.status(400).json({
          success: false,
          message: "Geçersiz işletme ID formatı",
        });
      }

      console.log('🔍 getMyStoreInfo - Looking for store with _id:', storeIdObj, 'and companyId:', companyId);

      // Find store by storeId and verify it belongs to the company
      store = await Store.findOne({ 
        _id: storeIdObj,
        companyId: companyId 
      })
        .populate(
          "companyId",
          "firstName lastName email phoneNumber profileImage"
        )
        .lean();

      console.log('📦 getMyStoreInfo - Store found:', {
        found: !!store,
        storeId: store?._id,
        servicesCount: store?.services?.length || 0,
        hasServices: !!store?.services,
      });

      if (!store) {
        return res.status(404).json({
          success: false,
          message: "İşletme bulunamadı veya bu işletmeye erişim yetkiniz yok",
        });
      }
    } else {
      // If no storeId provided, get active store from user's activeStoreIds
      const User = require("../models/User");
      const user = await User.findById(companyId).select("activeStoreIds userType").lean();
      
      let activeStoreId = null;
      if (user?.userType === 'company' && user?.activeStoreIds && Array.isArray(user.activeStoreIds) && user.activeStoreIds.length > 0) {
        activeStoreId = user.activeStoreIds[0];
      }

      if (activeStoreId) {
        store = await Store.findOne({ 
          _id: activeStoreId,
          companyId: companyId 
        })
          .populate(
            "companyId",
            "firstName lastName email phoneNumber profileImage"
          )
          .lean();
      } else {
        // Fallback: Find first store by companyId
        store = await Store.findOne({ companyId })
          .populate(
            "companyId",
            "firstName lastName email phoneNumber profileImage"
          )
          .lean();
      }
    }

    if (!store) {
      return res.status(404).json({
        success: false,
        message: "İşletme bulunamadı",
      });
    }

    res.status(200).json({
      success: true,
      data: store,
    });
  } catch (error) {
    console.error("getMyStoreInfo error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "İşletme bilgileri yüklenirken bir hata oluştu",
    });
  }
};

const getStoreCustomers = async (req, res) => {
  try {
    // Get companyId from authenticated user
    // If user is company, use their _id
    // If user is employee, use their companyId
    let companyId = null;
    if (req.user) {
      if (req.user.userType === 'company') {
        companyId = req.user._id || req.user.id;
      } else if (req.user.userType === 'employee') {
        // companyId might be ObjectId or string
        companyId = req.user.companyId?._id || req.user.companyId || null;
        // If companyId is still null, fetch user again with populated companyId
        if (!companyId) {
          const employeeUser = await User.findById(req.user._id).select('companyId');
          companyId = employeeUser?.companyId?._id || employeeUser?.companyId || null;
        }
      }
    }

    if (!companyId) {
      return res.status(401).json({
        success: false,
        message: "Şirket bilgisi bulunamadı",
      });
    }

    // Convert to string if ObjectId
    if (companyId && typeof companyId === 'object') {
      companyId = companyId.toString();
    }

    // Find all customers for this company
    const customers = await Customer.find({ companyId })
      .sort({ createdAt: -1 })
      .lean();

    // For each customer, get their appointment count and last appointment
    const customersWithStats = await Promise.all(
      customers.map(async (customer) => {
        const appointmentCount = await Appointment.countDocuments({
          customerIds: customer._id,
          companyId: companyId,
        });

        const lastAppointment = await Appointment.findOne({
          customerIds: customer._id,
          companyId: companyId,
        })
          .sort({ appointmentDate: -1, appointmentTime: -1 })
          .lean();

        return {
          ...customer,
          appointmentCount,
          lastAppointment: lastAppointment || null,
        };
      })
    );

    res.status(200).json({
      success: true,
      count: customersWithStats.length,
      data: customersWithStats,
    });
  } catch (error) {
    console.error("getStoreCustomers error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Müşteriler yüklenirken bir hata oluştu",
    });
  }
};

const createCustomer = async (req, res) => {
  try {
    const { firstName, lastName, phoneNumber, notes, profileImage } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !phoneNumber) {
      return res.status(400).json({
        success: false,
        message: "Ad, soyad ve telefon numarası zorunludur",
      });
    }

    // Get companyId from authenticated user
    let companyId = null;
    if (req.user) {
      if (req.user.userType === 'company') {
        companyId = req.user._id || req.user.id;
      } else if (req.user.userType === 'employee') {
        // companyId might be ObjectId or string
        companyId = req.user.companyId?._id || req.user.companyId || null;
        // If companyId is still null, fetch user again with populated companyId
        if (!companyId) {
          const employeeUser = await User.findById(req.user._id).select('companyId');
          companyId = employeeUser?.companyId?._id || employeeUser?.companyId || null;
        }
      }
    }

    if (!companyId) {
      return res.status(401).json({
        success: false,
        message: "Şirket bilgisi bulunamadı",
      });
    }

    // Convert to string if ObjectId
    if (companyId && typeof companyId === 'object') {
      companyId = companyId.toString();
    }

    // Check if customer with same phone number already exists for this company
    const existingCustomer = await Customer.findOne({
      companyId,
      phoneNumber,
    });

    if (existingCustomer) {
      return res.status(400).json({
        success: false,
        message: "Bu telefon numarasına sahip bir müşteri zaten mevcut",
      });
    }

    // Create new customer
    const customer = new Customer({
      companyId,
      firstName,
      lastName,
      phoneNumber,
      notes: notes || "",
      profileImage: profileImage || "",
    });

    await customer.save();

    res.status(201).json({
      success: true,
      message: "Müşteri başarıyla oluşturuldu",
      data: customer,
    });
  } catch (error) {
    console.error("createCustomer error:", error);
    
    // Handle duplicate key error (unique index violation)
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Bu telefon numarasına sahip bir müşteri zaten mevcut",
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || "Müşteri oluşturulurken bir hata oluştu",
    });
  }
};

const debugUserStoreRelations = async (req, res) => {
  res.status(501).json({ success: false, message: "Not implemented" });
};

// QuickAppointment Controllers

// Get QuickAppointments for company
const getQuickAppointments = async (req, res) => {
  try {
    // Get companyId (storeId) from authenticated user's activeStoreId or activeStoreIds
    let companyId = null;
    if (req.user) {
      // Get user with activeStoreId and activeStoreIds
      const user = await User.findById(req.user._id).select('activeStoreId activeStoreIds userType companyId');
      
      if (user) {
        // For company users: Use activeStoreId first, then first from activeStoreIds array
        if (user.userType === 'company') {
          companyId = user.activeStoreId;
          
          // If no activeStoreId, try first from activeStoreIds array
          if (!companyId && user.activeStoreIds && Array.isArray(user.activeStoreIds) && user.activeStoreIds.length > 0) {
            companyId = user.activeStoreIds[0];
          }
          
          // If still no activeStoreId, get first store
          if (!companyId) {
            const Store = require('../models/Store');
            const firstStore = await Store.findOne({ companyId: user._id }).select('_id');
            companyId = firstStore?._id || null;
          }
        } else if (user.userType === 'employee') {
          // For employees, get their company's activeStoreId or activeStoreIds
          const companyUserId = user.companyId?._id || user.companyId;
          if (companyUserId) {
            const companyUser = await User.findById(companyUserId).select('activeStoreId activeStoreIds');
            companyId = companyUser?.activeStoreId;
            
            // If no activeStoreId, try first from activeStoreIds array
            if (!companyId && companyUser?.activeStoreIds && Array.isArray(companyUser.activeStoreIds) && companyUser.activeStoreIds.length > 0) {
              companyId = companyUser.activeStoreIds[0];
            }
          }
        }
      }
    }

    if (!companyId) {
      return res.status(401).json({
        success: false,
        message: "Aktif işletme bulunamadı. Lütfen bir işletme seçin.",
      });
    }

    // Convert to string if ObjectId
    if (companyId && typeof companyId === 'object') {
      companyId = companyId.toString();
    }

    // Find all QuickAppointments for this company, populate customer details
    const quickAppointments = await QuickAppointment.find({ companyId })
      .populate('customerIds', 'firstName lastName phoneNumber profileImage companyId')
      .sort({ createdAt: -1 })
      .lean();

    // Add companyId to each QuickAppointment in response
    const quickAppointmentsWithCompanyId = quickAppointments.map(qa => ({
      ...qa,
      companyId: companyId, // Add companyId to response
    }));

    res.status(200).json({
      success: true,
      count: quickAppointmentsWithCompanyId.length,
      data: quickAppointmentsWithCompanyId,
    });
  } catch (error) {
    console.error("getQuickAppointments error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Hızlı randevular yüklenirken bir hata oluştu",
    });
  }
};

// Create or Update QuickAppointment
const createOrUpdateQuickAppointment = async (req, res) => {
  try {
    const { customerIds } = req.body;

    // Validate customerIds
    if (!customerIds || !Array.isArray(customerIds) || customerIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "En az bir müşteri seçilmelidir",
      });
    }

    // Get companyId (storeId) from authenticated user's activeStoreId or activeStoreIds
    let companyId = null;
    if (req.user) {
      // Get user with activeStoreId and activeStoreIds
      const user = await User.findById(req.user._id).select('activeStoreId activeStoreIds userType companyId');
      
      if (user) {
        // For company users: Use activeStoreId first, then first from activeStoreIds array
        if (user.userType === 'company') {
          companyId = user.activeStoreId;
          
          // If no activeStoreId, try first from activeStoreIds array
          if (!companyId && user.activeStoreIds && Array.isArray(user.activeStoreIds) && user.activeStoreIds.length > 0) {
            companyId = user.activeStoreIds[0];
          }
          
          // If still no activeStoreId, get first store
          if (!companyId) {
            const Store = require('../models/Store');
            const firstStore = await Store.findOne({ companyId: user._id }).select('_id');
            companyId = firstStore?._id || null;
          }
        } else if (user.userType === 'employee') {
          // For employees, get their company's activeStoreId or activeStoreIds
          const companyUserId = user.companyId?._id || user.companyId;
          if (companyUserId) {
            const companyUser = await User.findById(companyUserId).select('activeStoreId activeStoreIds');
            companyId = companyUser?.activeStoreId;
            
            // If no activeStoreId, try first from activeStoreIds array
            if (!companyId && companyUser?.activeStoreIds && Array.isArray(companyUser.activeStoreIds) && companyUser.activeStoreIds.length > 0) {
              companyId = companyUser.activeStoreIds[0];
            }
          }
        }
      }
    }

    if (!companyId) {
      return res.status(401).json({
        success: false,
        message: "Aktif işletme bulunamadı. Lütfen bir işletme seçin.",
      });
    }

    // Convert to string if ObjectId
    if (companyId && typeof companyId === 'object') {
      companyId = companyId.toString();
    }

    // Verify that all customers belong to this store (companyId = storeId)
    // Note: Customers have companyId field which should match the store's companyId (owner)
    // We need to check if customers belong to the store's owner company
    const Store = require('../models/Store');
    const store = await Store.findById(companyId).select('companyId');
    if (!store) {
      return res.status(404).json({
        success: false,
        message: "İşletme bulunamadı",
      });
    }

    // Get the store owner's companyId (User._id)
    // store.companyId is ObjectId reference to User
    const storeOwnerCompanyId = (store.companyId?._id || store.companyId)?.toString();

    // Verify that all customers belong to this store's owner company
    const customers = await Customer.find({
      _id: { $in: customerIds },
      companyId: storeOwnerCompanyId,
    });

    if (customers.length !== customerIds.length) {
      return res.status(400).json({
        success: false,
        message: "Seçilen müşterilerden bazıları bu işletmeye ait değil",
      });
    }

    // Check if QuickAppointment already exists for this company
    // If exists, update it; otherwise create new one
    let quickAppointment = await QuickAppointment.findOne({ companyId });
    let isNew = false;

    if (quickAppointment) {
      // Update existing QuickAppointment
      quickAppointment.customerIds = customerIds;
      await quickAppointment.save();
    } else {
      // Create new QuickAppointment
      isNew = true;
      quickAppointment = new QuickAppointment({
        companyId,
        customerIds,
      });
      await quickAppointment.save();
    }

    // Populate customer details before returning
    await quickAppointment.populate('customerIds', 'firstName lastName phoneNumber profileImage');

    res.status(200).json({
      success: true,
      message: isNew ? "Hızlı randevular başarıyla oluşturuldu" : "Hızlı randevular başarıyla güncellendi",
      data: quickAppointment,
    });
  } catch (error) {
    console.error("createOrUpdateQuickAppointment error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Hızlı randevu oluşturulurken bir hata oluştu",
    });
  }
};

// Delete QuickAppointment
const deleteQuickAppointment = async (req, res) => {
  try {
    const { id } = req.params;

    // Get companyId (storeId) from authenticated user's activeStoreId or activeStoreIds
    let companyId = null;
    if (req.user) {
      // Get user with activeStoreId and activeStoreIds
      const user = await User.findById(req.user._id).select('activeStoreId activeStoreIds userType companyId');
      
      if (user) {
        // For company users: Use activeStoreId first, then first from activeStoreIds array
        if (user.userType === 'company') {
          companyId = user.activeStoreId;
          
          // If no activeStoreId, try first from activeStoreIds array
          if (!companyId && user.activeStoreIds && Array.isArray(user.activeStoreIds) && user.activeStoreIds.length > 0) {
            companyId = user.activeStoreIds[0];
          }
          
          // If still no activeStoreId, get first store
          if (!companyId) {
            const Store = require('../models/Store');
            const firstStore = await Store.findOne({ companyId: user._id }).select('_id');
            companyId = firstStore?._id || null;
          }
        } else if (user.userType === 'employee') {
          // For employees, get their company's activeStoreId or activeStoreIds
          const companyUserId = user.companyId?._id || user.companyId;
          if (companyUserId) {
            const companyUser = await User.findById(companyUserId).select('activeStoreId activeStoreIds');
            companyId = companyUser?.activeStoreId;
            
            // If no activeStoreId, try first from activeStoreIds array
            if (!companyId && companyUser?.activeStoreIds && Array.isArray(companyUser.activeStoreIds) && companyUser.activeStoreIds.length > 0) {
              companyId = companyUser.activeStoreIds[0];
            }
          }
        }
      }
    }

    if (!companyId) {
      return res.status(401).json({
        success: false,
        message: "Aktif işletme bulunamadı. Lütfen bir işletme seçin.",
      });
    }

    // Convert to string if ObjectId
    if (companyId && typeof companyId === 'object') {
      companyId = companyId.toString();
    }

    // Find and delete QuickAppointment
    const quickAppointment = await QuickAppointment.findOneAndDelete({
      _id: id,
      companyId: companyId,
    });

    if (!quickAppointment) {
      return res.status(404).json({
        success: false,
        message: "Hızlı randevu bulunamadı",
      });
    }

    res.status(200).json({
      success: true,
      message: "Hızlı randevu başarıyla silindi",
    });
  } catch (error) {
    console.error("deleteQuickAppointment error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Hızlı randevu silinirken bir hata oluştu",
    });
  }
};

/**
 * getStoresByCategory
 * Kategoriye göre işletmeleri getirir (pagination ile)
 * @param {string} category - Kategori key (örn: 'erkek_kuaförü', 'kadın_kuaförü', 'güzellik_merkezi', 'masaj_salonları', 'tırnak_salonları')
 * @param {number} page - Sayfa numarası (default: 1)
 * @param {number} limit - Sayfa başına kayıt sayısı (default: 10)
 */
const getStoresByCategory = async (req, res) => {
  try {
    const { category, page = 1, limit = 10 } = req.query;

    if (!category) {
      return res.status(400).json({
        success: false,
        message: "Kategori parametresi gereklidir",
      });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Sectors array'inde category key'ine sahip veya businessField'ı category'ye eşit olan store'ları bul
    const stores = await Store.find({
      $or: [
        { "sectors.key": category },
        { businessField: category }
      ],
      isOpen: true,
    })
      .populate(
        "companyId",
        "firstName lastName email phoneNumber profileImage"
      )
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Her store için rating hesapla
    const storesWithRating = await Promise.all(
      stores.map(async (store) => {
        const ratingResult = await Review.aggregate([
          {
            $match: {
              companyId: store.companyId._id || store.companyId,
              isPublished: true,
            },
          },
          {
            $group: {
              _id: null,
              avgRating: { $avg: '$rating' },
              reviewCount: { $sum: 1 },
            },
          },
        ]);

        const avgRating = ratingResult[0]?.avgRating || 0;
        const reviewCount = ratingResult[0]?.reviewCount || 0;

        return {
          ...store,
          rating: avgRating > 0 ? parseFloat(avgRating.toFixed(1)) : store.rating || 0,
          reviewCount: reviewCount || store.reviewCount || 0,
        };
      })
    );

    const total = await Store.countDocuments({
      $or: [
        { "sectors.key": category },
        { businessField: category }
      ],
      isOpen: true,
    });

    res.status(200).json({
      success: true,
      count: storesWithRating.length,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      data: storesWithRating,
    });
  } catch (error) {
    console.error("getStoresByCategory error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "İşletmeler yüklenirken bir hata oluştu",
    });
  }
};

/**
 * getPopularStoresByCategory
 * Kategoriye göre en çok randevu alınan işletmeleri getirir
 * @param {string} category - Kategori key
 * @param {number} limit - Maksimum kayıt sayısı (default: 10)
 */
const getPopularStoresByCategory = async (req, res) => {
  try {
    const { category, limit = 10 } = req.query;

    if (!category) {
      return res.status(400).json({
        success: false,
        message: "Kategori parametresi gereklidir",
      });
    }

    // Önce kategoriye göre store'ları bul (hem sectors.key hem de businessField'a göre)
    const stores = await Store.find({
      $or: [
        { "sectors.key": category },
        { businessField: category }
      ],
      isOpen: true,
    })
      .populate(
        "companyId",
        "firstName lastName email phoneNumber profileImage"
      )
      .lean();

    // Her store için randevu sayısını ve rating'i hesapla
    const storesWithAppointmentCount = await Promise.all(
      stores.map(async (store) => {
        const appointmentCount = await Appointment.countDocuments({
          companyId: store.companyId._id || store.companyId,
          serviceCategory: category,
        });

        // Rating hesapla
        const ratingResult = await Review.aggregate([
          {
            $match: {
              companyId: store.companyId._id || store.companyId,
              isPublished: true,
            },
          },
          {
            $group: {
              _id: null,
              avgRating: { $avg: '$rating' },
              reviewCount: { $sum: 1 },
            },
          },
        ]);

        const avgRating = ratingResult[0]?.avgRating || 0;
        const reviewCount = ratingResult[0]?.reviewCount || 0;

        return {
          ...store,
          appointmentCount,
          rating: avgRating > 0 ? parseFloat(avgRating.toFixed(1)) : store.rating || 0,
          reviewCount: reviewCount || store.reviewCount || 0,
        };
      })
    );

    // Randevu sayısına göre sırala ve limit uygula
    const popularStores = storesWithAppointmentCount
      .sort((a, b) => b.appointmentCount - a.appointmentCount)
      .slice(0, parseInt(limit));

    res.status(200).json({
      success: true,
      count: popularStores.length,
      data: popularStores,
    });
  } catch (error) {
    console.error("getPopularStoresByCategory error:", error);
    res.status(500).json({
      success: false,
      message:
        error.message || "Popüler işletmeler yüklenirken bir hata oluştu",
    });
  }
};

// Get store employees (company and employee types)
const getStoreEmployees = async (req, res) => {
  try {
    const { storeId } = req.params;

    // Find store and populate companyId
    const store = await Store.findById(storeId).populate('companyId');
    
    if (!store) {
      return res.status(404).json({
        success: false,
        message: 'İşletme bulunamadı',
      });
    }

    const companyId = store.companyId?._id || store.companyId;

    // Get all users with userType 'company' or 'employee' belonging to this company
    const employees = await User.find({
      $or: [
        { _id: companyId, userType: 'company' }, // Company owner
        { companyId: companyId, userType: 'employee' } // Employees
      ]
    }).select('firstName lastName profileImage position userType phoneNumber email');

    return res.status(200).json({
      success: true,
      data: employees,
      count: employees.length,
    });
  } catch (error) {
    console.error('Get store employees error:', error);
    return res.status(500).json({
      success: false,
      message: 'Çalışanlar yüklenirken bir hata oluştu',
      error: error.message,
    });
  }
};

module.exports = {
  createStore,
  getCompanyStores,
  getStoreDetails,
  getStoreByCompanyId,
  setActiveStore,
  updateStore,
  updateStoreByCompanyId,
  getAllStores,
  getMyStoreInfo,
  getStoreCustomers,
  createCustomer,
  debugUserStoreRelations,
  getStoresByCategory,
  getPopularStoresByCategory,
  getQuickAppointments,
  createOrUpdateQuickAppointment,
  deleteQuickAppointment,
  getStoreEmployees,
};
