/**
 * Sektör Tipleri Constants
 * Her sektörün benzersiz bir ID'si var
 */

const SECTORS = {
  ERKEK_KUAFOR: {
    id: 1,
    name: 'Erkek Kuaförü',
    key: 'erkek_kuafor'
  },
  KADIN_KUAFOR: {
    id: 2,
    name: 'Kadın Kuaförü',
    key: 'kadin_kuafor'
  },
  UNISEX_KUAFOR: {
    id: 3,
    name: 'Unisex Kuaför Salonu',
    key: 'unisex_kuafor'
  },
  GUZELLIK_MERKEZI: {
    id: 4,
    name: 'Güzellik Merkezi',
    key: 'guzellik_merkezi'
  },
  TIRNAK_SALONU: {
    id: 5,
    name: 'Tırnak Salonu',
    key: 'tirnak_salonu'
  },
  MASAJ_SALONU: {
    id: 6,
    name: 'Masaj Salonu',
    key: 'masaj_salonu'
  },
  MAKYAJ_UZMANI: {
    id: 7,
    name: 'Makyaj Uzmanı',
    key: 'makyaj_uzmani'
  },
  SPA: {
    id: 8,
    name: 'Spa & Wellness',
    key: 'spa'
  },
  BARBER_SHOP: {
    id: 9,
    name: 'Barber Shop',
    key: 'barber_shop'
  }
};

/**
 * ID'den sektör bilgisini getir
 */
const getSectorById = (id) => {
  return Object.values(SECTORS).find(sector => sector.id === parseInt(id));
};

/**
 * Key'den sektör bilgisini getir
 */
const getSectorByKey = (key) => {
  return Object.values(SECTORS).find(sector => sector.key === key);
};

/**
 * Name'den sektör bilgisini getir
 */
const getSectorByName = (name) => {
  return Object.values(SECTORS).find(sector => sector.name === name);
};

/**
 * Tüm sektörleri array olarak getir
 */
const getAllSectors = () => {
  return Object.values(SECTORS);
};

/**
 * Sektör ID'sinin geçerli olup olmadığını kontrol et
 */
const isValidSectorId = (id) => {
  return Object.values(SECTORS).some(sector => sector.id === parseInt(id));
};

/**
 * Sektör ID'lerini validate et
 */
const validateSectorIds = (sectorIds) => {
  if (!Array.isArray(sectorIds)) {
    return { valid: false, message: 'Sektörler array formatında olmalıdır' };
  }

  if (sectorIds.length === 0) {
    return { valid: false, message: 'En az bir sektör seçilmelidir' };
  }

  const invalidIds = sectorIds.filter(id => !isValidSectorId(id));
  if (invalidIds.length > 0) {
    return { 
      valid: false, 
      message: `Geçersiz sektör ID'leri: ${invalidIds.join(', ')}` 
    };
  }

  return { valid: true };
};

module.exports = {
  SECTORS,
  getSectorById,
  getSectorByKey,
  getSectorByName,
  getAllSectors,
  isValidSectorId,
  validateSectorIds
};

