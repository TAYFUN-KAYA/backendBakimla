const Appointment = require('../models/Appointment');
const Customer = require('../models/Customer');
const User = require('../models/User');
const Store = require('../models/Store');
const Coupon = require('../models/Coupon');
const Campaign = require('../models/Campaign');
const { usePoints, addPoints } = require('./pointsController');
const { APPOINTMENT, mapAppointmentToAccounting, getAppointmentPaymentLabel } = require('../constants/paymentMethods');

/**
 * createAppointment
 * Yeni randevu oluşturur (tekli veya çoklu müşteri)
 */
const createAppointment = async (req, res) => {
  try {
    const {
      customerIds,
      companyId,
      employeeId,
      appointmentDate,
      appointmentTime,
      serviceCategory,
      taskType,
      serviceType,
      serviceDuration,
      servicePrice,
      paymentMethod,
      notes,
      services, // Array of services [{ serviceType, serviceDuration, servicePrice }]
      groupId, // For linking multiple appointments together
      isApproved, // İşletme sahibi veya çalışan eklediğinde true olabilir
    } = req.body;

    if (
      !customerIds ||
      !companyId ||
      !employeeId ||
      !appointmentDate ||
      !appointmentTime ||
      !serviceCategory ||
      !taskType ||
      !serviceType ||
      !serviceDuration ||
      servicePrice === undefined ||
      !paymentMethod
    ) {
      return res.status(400).json({
        success: false,
        message: 'Tüm zorunlu alanlar doldurulmalıdır',
      });
    }

    if (!APPOINTMENT.VALUES.includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        message: `Ödeme tipi "${APPOINTMENT.CASH}" veya "${APPOINTMENT.CARD}" olmalıdır`,
      });
    }

    if (!Array.isArray(customerIds) || customerIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'En az bir müşteri seçilmelidir',
      });
    }

    const company = await User.findById(companyId);
    if (!company || company.userType !== 'company') {
      return res.status(404).json({
        success: false,
        message: 'Şirket bulunamadı',
      });
    }

    const employee = await User.findById(employeeId);
    if (!employee || (employee.userType !== 'employee' && employee.userType !== 'company')) {
      return res.status(404).json({
        success: false,
        message: 'Çalışan bulunamadı',
      });
    }

    // Eğer işletme sahibi (userType: 'company') ise, companyId kontrolünü atla
    if (employee.userType === 'company') {
      // İşletme sahibinin kendi ID'si companyId ile eşleşmeli
      const employeeIdStr = employee._id.toString();
      const requestCompanyId = companyId ? companyId.toString() : null;
      
      console.log('🔍 Company Owner Check:', {
        employeeId: employeeIdStr,
        requestCompanyId,
        areEqual: employeeIdStr === requestCompanyId
      });

      if (!requestCompanyId || employeeIdStr !== requestCompanyId) {
        return res.status(400).json({
          success: false,
          message: 'İşletme sahibi bu şirkete ait değil',
          debug: {
            employeeId: employeeIdStr,
            requestCompanyId,
          }
        });
      }
      // İşletme sahibi her zaman onaylı kabul edilir, isApproved kontrolüne gerek yok
    } else {
      // Normal çalışan için companyId karşılaştırması
      const employeeCompanyId = employee.companyId ? employee.companyId.toString() : null;
      const requestCompanyId = companyId ? companyId.toString() : null;
      
      console.log('🔍 Company ID Comparison:', {
        employeeId: employeeId?.toString(),
        employeeCompanyId,
        requestCompanyId,
        employeeCompanyIdType: typeof employeeCompanyId,
        requestCompanyIdType: typeof requestCompanyId,
        areEqual: employeeCompanyId === requestCompanyId
      });

      if (!employeeCompanyId || !requestCompanyId || employeeCompanyId !== requestCompanyId) {
        return res.status(400).json({
          success: false,
          message: 'Çalışan bu şirkete ait değil',
          debug: {
            employeeCompanyId,
            requestCompanyId,
            employeeId: employeeId?.toString()
          }
        });
      }

      if (!employee.isApproved) {
        return res.status(400).json({
          success: false,
          message: 'Çalışan henüz onaylanmamış',
        });
      }
    }

    for (const customerId of customerIds) {
      const customer = await Customer.findById(customerId);
      if (!customer) {
        return res.status(404).json({
          success: false,
          message: `Müşteri bulunamadı: ${customerId}`,
        });
      }

      if (customer.companyId.toString() !== companyId.toString()) {
        return res.status(400).json({
          success: false,
          message: `Müşteri bu şirkete ait değil: ${customerId}`,
        });
      }
    }

    const appointmentDateObj = new Date(appointmentDate);
    const startOfDay = new Date(appointmentDateObj);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(appointmentDateObj);
    endOfDay.setHours(23, 59, 59, 999);

    // Eğer groupId yoksa ve tek müşteri varsa, meşgul saat kontrolü yap
    // Birden fazla müşteri için meşgul saat kontrolü yapma (her müşteri için ayrı randevu oluşturulacak)
    if (!groupId && customerIds.length === 1) {
      const existingAppointment = await Appointment.findOne({
        employeeId,
        appointmentDate: {
          $gte: startOfDay,
          $lte: endOfDay,
        },
        appointmentTime,
        status: { $in: ['pending', 'approved', 'completed'] },
      });

      if (existingAppointment) {
        return res.status(400).json({
          success: false,
          message: 'Bu saatte zaten bir randevu mevcut',
        });
      }
    }

    // Services array'ini hazırla ve fiyatları number'a çevir
    let servicesArray = [];
    if (services && Array.isArray(services) && services.length > 0) {
      servicesArray = services.map(svc => {
        // servicePrice'ı number'a çevir
        let price = 0;
        if (svc.servicePrice !== undefined && svc.servicePrice !== null) {
          if (typeof svc.servicePrice === 'string') {
            // String ise (örn: "222₺"), number'a çevir
            price = parseInt(String(svc.servicePrice).replace(/[^0-9]/g, '')) || 0;
          } else if (typeof svc.servicePrice === 'number') {
            price = svc.servicePrice;
          }
        } else if (svc.price !== undefined && svc.price !== null) {
          if (typeof svc.price === 'string') {
            price = parseInt(String(svc.price).replace(/[^0-9]/g, '')) || 0;
          } else if (typeof svc.price === 'number') {
            price = svc.price;
          }
        } else if (servicePrice !== undefined) {
          if (typeof servicePrice === 'string') {
            price = parseInt(String(servicePrice).replace(/[^0-9]/g, '')) || 0;
          } else {
            price = servicePrice;
          }
        }
        
        return {
          serviceType: svc.serviceType || svc.name || serviceType,
          serviceDuration: typeof svc.serviceDuration === 'number' 
            ? svc.serviceDuration 
            : (svc.duration || serviceDuration || 30),
          servicePrice: price,
        };
      });
    } else if (serviceType) {
      // Eğer services array yoksa ama serviceType varsa, onu services array'ine ekle
      const servicePriceNum = typeof servicePrice === 'string' 
        ? parseInt(String(servicePrice).replace(/[^0-9]/g, '')) || 0
        : (servicePrice || 0);
      
      servicesArray = [{
        serviceType: serviceType,
        serviceDuration: serviceDuration || 30,
        servicePrice: servicePriceNum,
      }];
    }

    // Total price hesapla - tüm servicePrice değerlerini topla
    const totalPrice = servicesArray.reduce((sum, svc) => {
      const price = typeof svc.servicePrice === 'number' ? svc.servicePrice : 0;
      return sum + price;
    }, 0) || (typeof servicePrice === 'string' 
      ? parseInt(String(servicePrice).replace(/[^0-9]/g, '')) || 0
      : (servicePrice || 0));
    
    // servicePrice'ı da number'a çevir
    const servicePriceNum = typeof servicePrice === 'string' 
      ? parseInt(String(servicePrice).replace(/[^0-9]/g, '')) || 0
      : (servicePrice || 0);

    // serviceType'ı services array'inden oluştur (duplicate'leri kaldır)
    // Eğer services array varsa, ondan serviceType oluştur
    let finalServiceType = serviceType;
    if (servicesArray && servicesArray.length > 0) {
      const serviceTypes = servicesArray
        .map(svc => svc.serviceType || svc.name)
        .filter(Boolean);
      // Duplicate'leri kaldır (case-insensitive)
      const uniqueServiceTypes = Array.from(
        new Set(serviceTypes.map(type => (type || '').toLowerCase().trim()))
      ).map(uniqueType => {
        // Orijinal case'i koru (ilk bulunan)
        return serviceTypes.find(type => (type || '').toLowerCase().trim() === uniqueType) || uniqueType;
      });
      finalServiceType = uniqueServiceTypes.join(', ');
    }

    const appointment = await Appointment.create({
      customerIds,
      companyId,
      employeeId,
      appointmentDate: appointmentDateObj,
      appointmentTime,
      serviceCategory,
      taskType,
      serviceType: finalServiceType, // Duplicate'leri kaldırılmış serviceType
      serviceDuration,
      servicePrice: servicePriceNum, // Number olarak kaydet
      totalPrice, // Number olarak hesaplandı
      paymentMethod,
      notes,
      services: servicesArray, // Her birinin servicePrice'ı number
      groupId: groupId || null,
      isApproved: isApproved === true ? true : false, // İşletme sahibi veya çalışan eklediğinde true
      status: isApproved === true ? 'approved' : 'pending', // isApproved true ise status da approved olmalı
    });

    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate('customerIds', 'firstName lastName phoneNumber profileImage')
      .populate('employeeId', 'firstName lastName profileImage jobTitle')
      .populate('companyId', 'firstName lastName');

    res.status(201).json({
      success: true,
      message: 'Randevu başarıyla oluşturuldu',
      data: populatedAppointment,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * getCompanyAppointments
 * Şirketin tüm randevularını getirir
 */
const getCompanyAppointments = async (req, res) => {
  try {
    // companyId token'dan (req.user) al - GET isteği olduğu için body yok
    const companyId = req.user?._id;
    const { status, startDate, endDate } = req.query;

    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: 'companyId gereklidir veya authentication token eksik',
      });
    }

    const query = { companyId };

    if (status) {
      // Eğer status "active" veya "planned" ise, completed ve cancelled dışındaki tüm randevuları getir
      if (status === 'active' || status === 'planned') {
        query.status = { $nin: ['completed', 'cancelled'] };
      } else {
        query.status = status;
      }
    }

    if (startDate || endDate) {
      query.appointmentDate = {};
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        query.appointmentDate.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.appointmentDate.$lte = end;
      }
    }

    const appointments = await Appointment.find(query)
      .populate('customerIds', 'firstName lastName phoneNumber profileImage')
      .populate('employeeId', 'firstName lastName')
      .populate('companyId', 'firstName lastName')
      .sort({ appointmentDate: -1, appointmentTime: -1 });

    res.status(200).json({
      success: true,
      count: appointments.length,
      data: appointments,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * getEmployeeAppointments
 * Çalışanın randevularını getirir
 * Company kullanıcıları kendi çalışanlarının randevularını görebilir
 * Employee kullanıcıları kendi randevularını görebilir
 */
const getEmployeeAppointments = async (req, res) => {
  try {
    const { employeeId } = req.body;
    const { status, startDate, endDate } = req.query;
    const user = req.user; // authMiddleware sets req.user

    // employeeId belirleme:
    // 1. Body'den gelen employeeId (company kullanıcıları için)
    // 2. Token'dan gelen user._id (employee kullanıcıları için)
    let finalEmployeeId = employeeId;
    
    if (!finalEmployeeId && user) {
      if (user.userType === 'employee') {
        // Employee ise, kendi randevularını getir
        finalEmployeeId = user._id.toString();
      } else if (user.userType === 'company') {
        // Company ise, employeeId body'den gelmeli
        return res.status(400).json({
          success: false,
          message: 'employeeId gereklidir',
        });
      }
    }

    if (!finalEmployeeId) {
      return res.status(400).json({
        success: false,
        message: 'employeeId gereklidir',
      });
    }

    // Company kullanıcıları sadece kendi çalışanlarının randevularını görebilir
    if (user.userType === 'company') {
      const employee = await User.findById(finalEmployeeId);
      if (!employee || employee.companyId?.toString() !== user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Bu çalışan size ait değil',
        });
      }
    }

    const query = { employeeId: finalEmployeeId };

    if (status) {
      query.status = status;
    }

    if (startDate || endDate) {
      query.appointmentDate = {};
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        query.appointmentDate.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.appointmentDate.$lte = end;
      }
    }

    console.log('📋 getEmployeeAppointments query:', {
      employeeId: finalEmployeeId,
      userType: user.userType,
      status,
      query
    });

    const appointments = await Appointment.find(query)
      .populate('customerIds', 'firstName lastName phoneNumber')
      .populate('employeeId', 'firstName lastName')
      .populate('companyId', 'firstName lastName')
      .sort({ appointmentDate: -1, appointmentTime: -1 });

    console.log('✅ Found appointments:', appointments.length);

    res.status(200).json({
      success: true,
      count: appointments.length,
      data: appointments,
    });
  } catch (error) {
    console.error('❌ getEmployeeAppointments error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const { processRewardOnCompletion } = require('./rewardController');
const Accounting = require('../models/Accounting');

/**
 * updateAppointment
 * Randevu bilgilerini günceller
 */
const updateAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, services, servicePrice, totalPrice } = req.body;

    // Güncellenecek alanları hazırla
    const updateData = { ...req.body };

    // Randevu onaylanıyor mu kontrol et (güncellemeden önce mevcut appointment'ı al)
    const isApproving = updateData.isApproved === true || updateData.status === 'approved';
    let existingAppointment = null;
    if (isApproving) {
      existingAppointment = await Appointment.findById(id);
      if (!existingAppointment) {
        return res.status(404).json({
          success: false,
          message: 'Randevu bulunamadı',
        });
      }
    }

    // Eğer services array gönderildiyse, replaceServices flag'ine göre işlem yap
    if (services && Array.isArray(services)) {
      if (!existingAppointment) {
        existingAppointment = await Appointment.findById(id);
      }
      if (!existingAppointment) {
        return res.status(404).json({
          success: false,
          message: 'Randevu bulunamadı',
        });
      }

      // replaceServices flag'i varsa ve true ise, services array'ini tamamen değiştir
      if (req.body.replaceServices === true) {
        // Services array'ini tamamen replace et (fiyatları number'a çevir)
        updateData.services = services.map(service => {
          let servicePrice = service.servicePrice || 0;
          if (typeof servicePrice === 'string') {
            servicePrice = parseFloat(String(servicePrice).replace(/[^0-9.,]/g, '').replace(',', '.')) || 0;
          }
          
          let serviceDuration = service.serviceDuration || 30;
          if (typeof serviceDuration === 'string') {
            serviceDuration = parseInt(String(serviceDuration).replace(/[^0-9]/g, '')) || 30;
          }
          
          return {
            serviceType: service.serviceType || service.name,
            serviceDuration: Number(serviceDuration),
            servicePrice: Number(servicePrice),
            personIndex: service.personIndex || undefined,
          };
        });
      } else {
        // Mevcut services'e ekle (append) - eski davranış
        const existingServices = existingAppointment.services || [];
        
        // Yeni servisleri ekle (duplicate kontrolü yap ve fiyatları number'a çevir)
        const newServices = services
          .filter(newService => {
            const newServiceType = newService.serviceType || newService.name;
            return !existingServices.some(existing => 
              (existing.serviceType || existing.name) === newServiceType
            );
          })
          .map(newService => {
            // Fiyatları number'a çevir (string ise)
            let servicePrice = newService.servicePrice || 0;
            if (typeof servicePrice === 'string') {
              servicePrice = parseFloat(String(servicePrice).replace(/[^0-9.,]/g, '').replace(',', '.')) || 0;
            }
            
            let serviceDuration = newService.serviceDuration || 30;
            if (typeof serviceDuration === 'string') {
              serviceDuration = parseInt(String(serviceDuration).replace(/[^0-9]/g, '')) || 30;
            }
            
            return {
              serviceType: newService.serviceType || newService.name,
              serviceDuration: Number(serviceDuration),
              servicePrice: Number(servicePrice),
              personIndex: newService.personIndex || undefined,
            };
          });

        // Tüm servisleri birleştir
        updateData.services = [...existingServices, ...newServices];
      }

      // Eğer serviceType gönderilmediyse ama services array güncellendiyse, serviceType'ı services'ten oluştur
      if (!updateData.serviceType && updateData.services && updateData.services.length > 0) {
        const serviceTypes = updateData.services
          .map(svc => svc.serviceType || svc.name)
          .filter(Boolean);
        // Duplicate'leri kaldır (case-insensitive)
        const uniqueServiceTypes = Array.from(
          new Set(serviceTypes.map(type => (type || '').toLowerCase().trim()))
        ).map(uniqueType => {
          // Orijinal case'i koru (ilk bulunan)
          return serviceTypes.find(type => (type || '').toLowerCase().trim() === uniqueType) || uniqueType;
        });
        updateData.serviceType = uniqueServiceTypes.join(', ');
      }

      // Eğer servicePrice gönderildiyse, toplam fiyatı güncelle (number'a çevir)
      if (servicePrice !== undefined) {
        let servicePriceNum = servicePrice;
        if (typeof servicePrice === 'string') {
          servicePriceNum = parseFloat(String(servicePrice).replace(/[^0-9.,]/g, '').replace(',', '.')) || 0;
        }
        updateData.servicePrice = Number(servicePriceNum);
      }
      
      // Eğer totalPrice gönderildiyse, onu kullan (number'a çevir)
      if (totalPrice !== undefined) {
        let totalPriceNum = totalPrice;
        if (typeof totalPrice === 'string') {
          totalPriceNum = parseFloat(String(totalPrice).replace(/[^0-9.,]/g, '').replace(',', '.')) || 0;
        }
        updateData.totalPrice = Number(totalPriceNum);
      } else if (servicePrice !== undefined) {
        // servicePrice gönderildiyse totalPrice'ı da güncelle
        let servicePriceNum = servicePrice;
        if (typeof servicePrice === 'string') {
          servicePriceNum = parseFloat(String(servicePrice).replace(/[^0-9.,]/g, '').replace(',', '.')) || 0;
        }
        updateData.totalPrice = Number(servicePriceNum);
      }
    }

    const appointment = await Appointment.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    })
      .populate('customerIds', 'firstName lastName phoneNumber')
      .populate('employeeId', 'firstName lastName')
      .populate('companyId', 'firstName lastName');

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Randevu bulunamadı',
      });
    }

    // Eğer randevu onaylandıysa (isApproved: true veya status: 'approved'), groupId'ye bağlı tüm randevuları da onayla
    if (isApproving && existingAppointment) {
      try {
        let relatedAppointmentIds = [];
        const appointmentGroupId = existingAppointment.groupId;

        // Eğer appointment.groupId varsa, aynı groupId'ye sahip tüm randevuları bul
        if (appointmentGroupId) {
          const relatedByGroupId = await Appointment.find({
            $or: [
              { _id: appointmentGroupId },
              { groupId: appointmentGroupId },
              { groupId: existingAppointment._id }
            ]
          }).select('_id');
          
          relatedAppointmentIds = relatedByGroupId
            .map(apt => apt._id.toString())
            .filter(aptId => aptId !== id.toString());
        } else {
          // Eğer appointment.groupId yoksa ama başka randevular bu randevuyu groupId olarak kullanıyorsa, onları bul
          const appointmentsWithThisAsGroup = await Appointment.find({
            groupId: existingAppointment._id
          }).select('_id');
          
          relatedAppointmentIds = appointmentsWithThisAsGroup.map(apt => apt._id.toString());
        }

        // İlgili randevuları onayla
        if (relatedAppointmentIds.length > 0) {
          await Appointment.updateMany(
            { _id: { $in: relatedAppointmentIds } },
            { 
              $set: { 
                isApproved: true,
                status: 'approved'
              }
            }
          );
          console.log(`✅ ${relatedAppointmentIds.length} ilgili randevu onaylandı (groupId: ${appointmentGroupId || existingAppointment._id})`);
        }
      } catch (groupError) {
        console.error('⚠️ İlgili randevular onaylanırken hata:', groupError);
        // Group onaylama hatası ana randevu güncellemesini engellemez
      }
    }

    // Eğer randevu tamamlandıysa ödüllü puanlama sistemini çalıştır
    if (status === 'completed') {
      await processRewardOnCompletion(id);
      
      // Randevu bilgilerini kontrol et
      const finalAppointment = await Appointment.findById(id);
      
      if (finalAppointment && finalAppointment.paymentReceived) {
        const paymentMethod = finalAppointment.paymentMethod || APPOINTMENT.CASH;
        const isOnlinePayment = APPOINTMENT.isCard(paymentMethod);
        
        // Online ödeme varsa wallet'a para ekle (eğer daha önce eklenmemişse)
        if (isOnlinePayment && finalAppointment.companyId) {
          try {
            const Payment = require('../models/Payment');
            const { addToWallet } = require('./walletController');
            
            // Payment kaydını bul
            const payment = await Payment.findOne({
              appointmentId: id,
              paymentStatus: 'success',
            });
            
            if (payment) {
              // Bu payment için wallet transaction var mı kontrol et
              const { WalletTransaction } = require('../models/Wallet');
              const existingTransaction = await WalletTransaction.findOne({
                paymentId: payment._id,
                appointmentId: id,
                type: 'deposit',
              });
              
              // Eğer wallet transaction yoksa, wallet'a ekle
              if (!existingTransaction) {
                const refundAmount = finalAppointment.totalPrice || finalAppointment.servicePrice || payment.price || 0;
                const description = `Online ödeme - Randevu tamamlandı - ${finalAppointment.serviceType || 'Hizmet'}`;
                
                const walletResult = await addToWallet(
                  finalAppointment.companyId,
                  refundAmount,
                  payment._id,
                  id,
                  description
                );
                
                if (walletResult.success) {
                  console.log('✅ Wallet\'a para eklendi (updateAppointment - completed):', {
                    appointmentId: id,
                    amount: refundAmount,
                    companyId: finalAppointment.companyId,
                  });
                } else {
                  console.error('⚠️ Wallet\'a para eklenirken hata (updateAppointment):', walletResult.error);
                }
              } else {
                console.log('ℹ️ Wallet transaction zaten mevcut (updateAppointment):', existingTransaction._id);
              }
            } else {
              console.warn('⚠️ Payment kaydı bulunamadı (updateAppointment):', id);
            }
          } catch (walletError) {
            console.error('⚠️ Wallet işlemi sırasında hata (updateAppointment):', walletError);
            // Wallet hatası randevu güncellemesini engellemez
          }
        }
        
        // Accounting kaydı oluştur (eğer daha önce oluşturulmamışsa)
        try {
          // Aynı randevu için daha önce accounting kaydı var mı kontrol et (appointmentId ile)
          const existingAccounting = await Accounting.findOne({
            appointmentId: id,
          });
          
          // Eğer accounting kaydı yoksa oluştur
          if (!existingAccounting) {
            const accountingData = {
              companyId: finalAppointment.companyId,
              employeeId: finalAppointment.employeeId || null,
              appointmentId: id || null,
              date: finalAppointment.appointmentDate || new Date(),
              income: finalAppointment.totalPrice || finalAppointment.servicePrice || 0,
              expense: 0,
              description: `Randevu ödemesi - ${finalAppointment.serviceType || 'Hizmet'}`,
              category: finalAppointment.serviceType || finalAppointment.serviceCategory || 'Randevu',
              paymentMethod: mapAppointmentToAccounting(paymentMethod),
            };
            
            await Accounting.create(accountingData);
            console.log('✅ Accounting kaydı oluşturuldu (updateAppointment):', accountingData);
          }
        } catch (accountingError) {
          console.error('⚠️ Accounting kaydı oluşturulurken hata (updateAppointment):', accountingError);
          // Accounting hatası randevu güncellemesini engellemez
        }
      }
    }

    res.status(200).json({
      success: true,
      message: 'Randevu başarıyla güncellendi',
      data: appointment,
    });
  } catch (error) {
    console.error('Update appointment error:', error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * getAppointmentSummary
 * Randevu özetini getirir
 */
const getAppointmentSummary = async (req, res) => {
  try {
    const { id } = req.params;

    console.log('📋 getAppointmentSummary called with id:', id);

    const appointment = await Appointment.findById(id)
      .populate('customerIds', 'firstName lastName phoneNumber profileImage notes')
      .populate('employeeId', 'firstName lastName email phoneNumber profileImage jobTitle')
      .populate('companyId', 'firstName lastName email phoneNumber');

    if (!appointment) {
      console.warn('⚠️ Appointment not found:', id);
      return res.status(404).json({
        success: false,
        message: 'Randevu bulunamadı',
      });
    }

    console.log('✅ Appointment found:', {
      id: appointment._id,
      status: appointment.status,
      customersCount: appointment.customerIds?.length,
      employeeId: appointment.employeeId?._id,
      groupId: appointment.groupId,
      servicesCount: appointment.services?.length
    });

    // Eğer groupId varsa, aynı gruba ait tüm randevuları getir
    let relatedAppointments = [];
    if (appointment.groupId) {
      relatedAppointments = await Appointment.find({
        $or: [
          { _id: appointment.groupId },
          { groupId: appointment.groupId },
          { groupId: appointment._id }
        ]
      })
        .populate('customerIds', 'firstName lastName phoneNumber profileImage notes')
        .populate('employeeId', 'firstName lastName email phoneNumber profileImage jobTitle')
        .sort({ appointmentDate: 1, appointmentTime: 1 });
    }

    // Eğer groupId yoksa ama başka randevular bu randevuyu groupId olarak kullanıyorsa, onları da getir
    if (!appointment.groupId) {
      const appointmentsWithThisAsGroup = await Appointment.find({
        groupId: appointment._id
      })
        .populate('customerIds', 'firstName lastName phoneNumber profileImage notes')
        .populate('employeeId', 'firstName lastName email phoneNumber profileImage jobTitle')
        .sort({ appointmentDate: 1, appointmentTime: 1 });
      
      if (appointmentsWithThisAsGroup.length > 0) {
        relatedAppointments = [appointment, ...appointmentsWithThisAsGroup];
      }
    }

    // Tüm müşterileri topla (mevcut randevu + bağlı randevular)
    const allCustomers = [];
    if (relatedAppointments.length > 0) {
      relatedAppointments.forEach(apt => {
        if (apt.customerIds && Array.isArray(apt.customerIds)) {
          apt.customerIds.forEach(customer => {
            if (!allCustomers.find(c => c._id.toString() === customer._id.toString())) {
              allCustomers.push(customer);
            }
          });
        }
      });
    } else {
      allCustomers.push(...(appointment.customerIds || []));
    }

    const summary = {
      appointmentId: appointment._id,
      date: appointment.appointmentDate,
      appointmentDate: appointment.appointmentDate,
      time: appointment.appointmentTime,
      appointmentTime: appointment.appointmentTime,
      status: appointment.status,
      paymentReceived: appointment.paymentReceived,
      isApproved: appointment.isApproved,
      customers: allCustomers,
      customerIds: allCustomers,
      employee: appointment.employeeId,
      employeeId: appointment.employeeId,
      company: appointment.companyId,
      companyId: appointment.companyId,
      service: {
        category: appointment.serviceCategory,
        type: appointment.serviceType,
        taskType: appointment.taskType,
        duration: appointment.serviceDuration,
        price: appointment.servicePrice,
      },
      serviceCategory: appointment.serviceCategory,
      serviceType: appointment.serviceType,
      servicePrice: appointment.servicePrice,
      serviceDuration: appointment.serviceDuration,
      totalPrice: appointment.totalPrice || appointment.servicePrice,
      services: appointment.services || [], // Services array
      payment: {
        method: appointment.paymentMethod,
        methodText: getAppointmentPaymentLabel(appointment.paymentMethod),
      },
      paymentMethod: appointment.paymentMethod,
      notes: appointment.notes,
      createdAt: appointment.createdAt,
      updatedAt: appointment.updatedAt,
      groupId: appointment.groupId,
      relatedAppointments: relatedAppointments.length > 0 ? relatedAppointments.map(apt => ({
        _id: apt._id,
        appointmentDate: apt.appointmentDate,
        appointmentTime: apt.appointmentTime,
        customerIds: apt.customerIds,
        services: apt.services || [],
        servicePrice: apt.servicePrice,
        totalPrice: apt.totalPrice || apt.servicePrice,
        status: apt.status,
        paymentReceived: apt.paymentReceived,
      })) : [],
    };

    res.status(200).json({
      success: true,
      data: summary,
    });
  } catch (error) {
    console.error('❌ getAppointmentSummary error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * deleteAppointment
 * Randevuyu siler
 */
const deleteAppointment = async (req, res) => {
  try {
    const { id } = req.params;

    const appointment = await Appointment.findByIdAndDelete(id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Randevu bulunamadı',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Randevu başarıyla silindi',
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * cancelAppointment
 * Randevuyu iptal eder (online ödeme varsa wallet'tan para çeker)
 */
const cancelAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const appointment = await Appointment.findById(id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Randevu bulunamadı',
      });
    }

    // Randevu zaten iptal edilmişse
    if (appointment.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Randevu zaten iptal edilmiş',
      });
    }

    // Online ödeme kontrolü - Eğer ödeme online (card) yapılmışsa wallet'tan para çek
    const isOnlinePayment = APPOINTMENT.isCard(appointment.paymentMethod);
    
    if (isOnlinePayment && appointment.paymentReceived && appointment.companyId) {
      // Payment kaydını bul
      const Payment = require('../models/Payment');
      const payment = await Payment.findOne({
        appointmentId: appointment._id,
        paymentStatus: 'success',
      });

      if (payment) {
        // Wallet'tan para çek (refund)
        const { refundFromWallet } = require('./walletController');
        const refundAmount = appointment.totalPrice || appointment.servicePrice || payment.price || 0;
        
        const refundResult = await refundFromWallet(
          appointment.companyId,
          refundAmount,
          payment._id,
          appointment._id,
          `Randevu iptali - ${reason || 'İptal edildi'}`
        );

        if (!refundResult.success) {
          console.error('Wallet refund error:', refundResult.error);
          // Hata olsa bile randevuyu iptal et, sadece log'la
        }
      }
    }

    // Randevuyu iptal et
    appointment.status = 'cancelled';
    if (reason) {
      appointment.cancellationReason = reason;
    }
    await appointment.save();

    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate('customerIds', 'firstName lastName phoneNumber')
      .populate('employeeId', 'firstName lastName')
      .populate('companyId', 'firstName lastName');

    res.status(200).json({
      success: true,
      message: 'Randevu başarıyla iptal edildi',
      data: populatedAppointment,
    });
  } catch (error) {
    console.error('Cancel Appointment Error:', error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * createAppointmentFromClient
 * Client uygulamasından randevu oluştur
 */
const createAppointmentFromClient = async (req, res) => {
  try {
    const userId = req.user._id;
    const {
      companyId,
      employeeId,
      appointmentDate,
      appointmentTime,
      services, // [{ serviceType, serviceDuration, servicePrice, personIndex }]
      personCount = 1,
      paymentMethod,
      couponId,
      campaignId,
      pointsToUse,
      notes,
    } = req.body;

    if (!companyId || !employeeId || !appointmentDate || !appointmentTime || !services || !paymentMethod) {
      return res.status(400).json({
        success: false,
        message: 'Tüm zorunlu alanlar doldurulmalıdır',
      });
    }

    if (!APPOINTMENT.VALUES.includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        message: `Ödeme tipi "${APPOINTMENT.CASH}" veya "${APPOINTMENT.CARD}" olmalıdır`,
      });
    }

    // Şirket kontrolü
    const company = await User.findById(companyId);
    if (!company || company.userType !== 'company') {
      return res.status(404).json({
        success: false,
        message: 'Şirket bulunamadı',
      });
    }

    // Çalışan kontrolü
    const employee = await User.findById(employeeId);
    if (!employee || employee.userType !== 'employee' || !employee.isApproved) {
      return res.status(404).json({
        success: false,
        message: 'Çalışan bulunamadı veya onaylanmamış',
      });
    }

    if (employee.companyId.toString() !== companyId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Çalışan bu şirkete ait değil',
      });
    }

    // Store bilgilerini al
    const store = await Store.findOne({ companyId });
    if (!store) {
      return res.status(404).json({
        success: false,
        message: 'İşletme bilgileri bulunamadı',
      });
    }

    // Müşteri oluştur veya bul (telefon numarasına göre)
    const user = await User.findById(userId);
    let customer = await Customer.findOne({
      companyId,
      phoneNumber: user.phoneNumber,
    });

    if (!customer) {
      customer = await Customer.create({
        companyId,
        firstName: user.firstName,
        lastName: user.lastName,
        phoneNumber: user.phoneNumber,
      });
    }

    // Hizmet fiyatlarını hesapla
    let totalServicePrice = 0;
    const serviceCategory = services[0]?.serviceCategory || store.serviceCategory || store.businessField || 'Güzellik';

    if (Array.isArray(services) && services.length > 0) {
      totalServicePrice = services.reduce((sum, service) => {
        return sum + (service.servicePrice || store.servicePrice || 0);
      }, 0);
    } else {
      totalServicePrice = store.servicePrice || 0;
    }

    // İndirim hesaplama
    let discount = 0;
    let finalPointsToUse = 0;

    // Kampanya kontrolü
    if (campaignId) {
      const campaign = await Campaign.findById(campaignId);
      if (campaign && campaign.isActive && campaign.serviceCategory === serviceCategory) {
        const now = new Date();
        if (now >= campaign.startDate && now <= campaign.endDate) {
          if (campaign.discountType === 'percentage') {
            discount += (totalServicePrice * campaign.discountValue) / 100;
          } else {
            discount += campaign.discountValue;
          }
        }
      }
    }

    // Kupon kontrolü
    if (couponId) {
      const coupon = await Coupon.findById(couponId);
      if (coupon && coupon.isActive && coupon.serviceCategory === serviceCategory) {
        const now = new Date();
        if (now >= coupon.startDate && now <= coupon.endDate) {
          discount += coupon.discountValue || 0;
        }
      }
    }

    // Puan kullanımı
    if (pointsToUse && pointsToUse > 0) {
      const pointsResult = await usePoints(userId, pointsToUse, null, null, 'Randevu için puan kullanıldı');
      if (pointsResult.success) {
        finalPointsToUse = pointsToUse;
      }
    }

    // Toplam fiyat
    const totalPrice = totalServicePrice - discount - (finalPointsToUse * 0.1);

    // Randevu tarih/saat kontrolü
    const appointmentDateObj = new Date(appointmentDate);
    const startOfDay = new Date(appointmentDateObj);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(appointmentDateObj);
    endOfDay.setHours(23, 59, 59, 999);

    const existingAppointment = await Appointment.findOne({
      employeeId,
      appointmentDate: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
      appointmentTime,
      status: { $in: ['pending', 'approved'] },
    });

    if (existingAppointment) {
      return res.status(400).json({
        success: false,
        message: 'Bu saatte zaten bir randevu mevcut',
      });
    }

    // Randevu oluştur
    const appointment = await Appointment.create({
      customerIds: [customer._id],
      userId,
      companyId,
      employeeId,
      appointmentDate: appointmentDateObj,
      appointmentTime,
      serviceCategory,
      taskType: services[0]?.taskType || store.serviceType,
      serviceType: services[0]?.serviceType || store.serviceType,
      serviceDuration: services[0]?.serviceDuration || store.serviceDuration,
      servicePrice: totalServicePrice,
      services,
      personCount,
      paymentMethod,
      totalPrice,
      discount,
      pointsUsed: finalPointsToUse,
      couponId: couponId || undefined,
      campaignId: campaignId || undefined,
      status: 'pending',
      isApproved: false,
      paymentReceived: paymentMethod === APPOINTMENT.CASH ? false : false,
      notes,
    });

    // Nakit ödeme ise direkt onaylanmış sayılır
    // NOT: Nakit ödeme için puan eklenmez (sadece kart ödemesi için puan eklenir)
    if (paymentMethod === APPOINTMENT.CASH) {
      appointment.status = 'approved';
      appointment.isApproved = true;
      await appointment.save();
    }

    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate('customerIds', 'firstName lastName phoneNumber')
      .populate('employeeId', 'firstName lastName')
      .populate('companyId', 'firstName lastName')
      .populate('userId', 'firstName lastName email phoneNumber');

    res.status(201).json({
      success: true,
      message: 'Randevu başarıyla oluşturuldu',
      data: populatedAppointment,
      requiresPayment: paymentMethod === APPOINTMENT.CARD,
    });
  } catch (error) {
    console.error('Create Appointment From Client Error:', error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * getClientAppointments
 * Client kullanıcısının randevularını getir
 */
const getClientAppointments = async (req, res) => {
  try {
    const userId = req.user._id;
    const { status, startDate, endDate } = req.query;

    const query = { userId };

    if (status) {
      query.status = status;
    }

    if (startDate || endDate) {
      query.appointmentDate = {};
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        query.appointmentDate.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.appointmentDate.$lte = end;
      }
    }

    const appointments = await Appointment.find(query)
      .populate('customerIds', 'firstName lastName phoneNumber')
      .populate('employeeId', 'firstName lastName')
      .populate('companyId', 'firstName lastName storeName')
      .populate('couponId', 'title discountValue')
      .populate('campaignId', 'title discountValue')
      .sort({ appointmentDate: -1, appointmentTime: -1 });

    // Her randevu için companyId'ye ait store'u bul
    const appointmentsWithStore = await Promise.all(
      appointments.map(async (appointment) => {
        const appointmentObj = appointment.toObject();
        if (appointment.companyId?._id) {
          const store = await Store.findOne({ companyId: appointment.companyId._id }).select('_id storeName services');
          if (store) {
            appointmentObj.storeId = store._id;
            appointmentObj.storeServices = store.services || [];
          }
        }
        return appointmentObj;
      })
    );

    res.status(200).json({
      success: true,
      count: appointmentsWithStore.length,
      data: appointmentsWithStore,
    });
  } catch (error) {
    console.error('Get Client Appointments Error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * getBusyDates
 * Şirketin randevusu olan günleri getirir
 */
const getBusyDates = async (req, res) => {
  try {
    const companyId = req.companyId || req.user._id;
    const { month, year } = req.query;

    const query = { companyId, status: { $in: ['pending', 'approved', 'completed'] } };

    if (month && year) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59, 999);
      query.appointmentDate = { $gte: startDate, $lte: endDate };
    }

    const appointments = await Appointment.find(query, 'appointmentDate');

    // Tarihleri YYYY-MM-DD formatında set yapalım (tekil olsunlar)
    const busyDates = [...new Set(appointments.map(a =>
      a.appointmentDate.toISOString().split('T')[0]
    ))];

    res.status(200).json({
      success: true,
      data: busyDates,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get appointments for a specific store by date range
 * Public endpoint - no auth required (for checking available hours)
 */
const getStoreAppointmentsByDateRange = async (req, res) => {
  try {
    const { storeId } = req.params;
    const { startDate, endDate } = req.query;

    if (!storeId) {
      return res.status(400).json({
        success: false,
        message: 'storeId gereklidir',
      });
    }

    // Find store and get companyId
    const store = await Store.findById(storeId);
    if (!store) {
      return res.status(404).json({
        success: false,
        message: 'İşletme bulunamadı',
      });
    }

    const companyId = store.companyId?._id || store.companyId;
    const query = { companyId };

    // Only get active appointments (not cancelled)
    query.status = { $nin: ['cancelled'] };

    if (startDate || endDate) {
      query.appointmentDate = {};
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        query.appointmentDate.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.appointmentDate.$lte = end;
      }
    }

    const appointments = await Appointment.find(query)
      .select('appointmentDate appointmentTime status')
      .sort({ appointmentDate: 1, appointmentTime: 1 });

    res.status(200).json({
      success: true,
      count: appointments.length,
      data: appointments,
    });
  } catch (error) {
    console.error('getStoreAppointmentsByDateRange error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createAppointment,
  createAppointmentFromClient,
  getCompanyAppointments,
  getEmployeeAppointments,
  getClientAppointments,
  getAppointmentSummary,
  updateAppointment,
  deleteAppointment,
  cancelAppointment,
  getBusyDates,
  getStoreAppointmentsByDateRange,
};

