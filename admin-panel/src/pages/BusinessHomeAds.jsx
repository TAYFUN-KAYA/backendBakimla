import { useState, useEffect } from 'react';
import GenericModelList from '../components/GenericModelList';
import { adminService } from '../services/adminService';
import { X, Save, Plus, Search, Upload, Trash2, Building2, Package } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export default function BusinessHomeAds() {
  const [createModal, setCreateModal] = useState({ open: false });
  const [editModal, setEditModal] = useState({ open: false, item: null });
  const [companies, setCompanies] = useState([]);
  const [products, setProducts] = useState([]);
  const [companySearch, setCompanySearch] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingProductImage, setUploadingProductImage] = useState(false);

  const [newAd, setNewAd] = useState({
    title: '',
    description: '',
    companyId: '',
    productId: '',
    discountPercent: 0,
    quantity: 0,
    image: '',
    productImage: '',
    link: '',
    order: 0,
    isActive: true,
    startDate: '',
    endDate: '',
  });

  const columns = [
    { key: 'companyId', label: 'İşletme' },
    { key: 'title', label: 'Başlık' },
    { key: 'product', label: 'Ürün' },
    { key: 'discount', label: 'İndirim' },
    { key: 'quantity', label: 'Adet' },
    { key: 'isActive', label: 'Aktif' },
    { key: 'startDate', label: 'Başlangıç' },
    { key: 'endDate', label: 'Bitiş' },
  ];

  const getRowData = (item) => {
    const companyName = item.companyId 
      ? (typeof item.companyId === 'object' 
          ? `${item.companyId.firstName || ''} ${item.companyId.lastName || ''}`.trim() || item.companyId.email || '-'
          : item.companyId)
      : '-';
    
    const productName = item.productId 
      ? (typeof item.productId === 'object' 
          ? item.productId.name || item.productId._id
          : item.productId)
      : '-';

    return {
      companyId: companyName,
      title: item.title || '-',
      product: productName,
      discount: item.discountPercent ? `%${item.discountPercent}` : '-',
      quantity: item.quantity || 0,
      isActive: item.isActive ? 'Evet' : 'Hayır',
      startDate: item.startDate ? format(new Date(item.startDate), 'dd.MM.yyyy') : '-',
      endDate: item.endDate ? format(new Date(item.endDate), 'dd.MM.yyyy') : '-',
    };
  };

  // İşletme arama
  useEffect(() => {
    const searchCompanies = async () => {
      if (companySearch.length < 2) {
        setCompanies([]);
        return;
      }
      setLoadingCompanies(true);
      try {
        const response = await adminService.getAllUsers({ search: companySearch, userType: 'company', limit: 10 });
        if (response.data.success) {
          const companyUsers = response.data.data.filter(u => u.userType === 'company');
          setCompanies(companyUsers);
        }
      } catch (error) {
        console.error('Company search error:', error);
      } finally {
        setLoadingCompanies(false);
      }
    };

    const debounce = setTimeout(searchCompanies, 300);
    return () => clearTimeout(debounce);
  }, [companySearch]);

  // Ürün arama
  useEffect(() => {
    const searchProducts = async () => {
      if (productSearch.length < 2) {
        setProducts([]);
        return;
      }
      setLoadingProducts(true);
      try {
        const response = await adminService.getAllProducts({ search: productSearch, limit: 10 });
        if (response.data.success) {
          setProducts(response.data.data || []);
        }
      } catch (error) {
        console.error('Product search error:', error);
      } finally {
        setLoadingProducts(false);
      }
    };

    const debounce = setTimeout(searchProducts, 300);
    return () => clearTimeout(debounce);
  }, [productSearch]);

  const handleCreate = () => {
    setNewAd({
      title: '',
      description: '',
      companyId: '',
      productId: '',
      discountPercent: 0,
      quantity: 0,
      image: '',
      productImage: '',
      link: '',
      order: 0,
      isActive: true,
      startDate: '',
      endDate: '',
    });
    setSelectedCompany(null);
    setSelectedProduct(null);
    setCompanySearch('');
    setProductSearch('');
    setCreateModal({ open: true });
  };

  const handleEdit = (item) => {
    setEditModal({ open: true, item: { ...item } });
    if (item.companyId && typeof item.companyId === 'object') {
      setSelectedCompany(item.companyId);
    }
    if (item.productId && typeof item.productId === 'object') {
      setSelectedProduct(item.productId);
    }
  };

  const handleImageUpload = async (file, isProductImage = false) => {
    if (isProductImage) {
      setUploadingProductImage(true);
    } else {
      setUploadingImage(true);
    }
    try {
      const response = await adminService.uploadImage(file, 'business-ads');
      if (response.data?.url) {
        if (isProductImage) {
          setNewAd({ ...newAd, productImage: response.data.url });
        } else {
          setNewAd({ ...newAd, image: response.data.url });
        }
        toast.success('Görsel başarıyla yüklendi');
      }
    } catch (error) {
      console.error('Image upload error:', error);
      toast.error('Görsel yüklenemedi');
    } finally {
      if (isProductImage) {
        setUploadingProductImage(false);
      } else {
        setUploadingImage(false);
      }
    }
  };

  const handleEditImageUpload = async (file, isProductImage = false) => {
    if (isProductImage) {
      setUploadingProductImage(true);
    } else {
      setUploadingImage(true);
    }
    try {
      const response = await adminService.uploadImage(file, 'business-ads');
      if (response.data?.url) {
        if (isProductImage) {
          setEditModal({ ...editModal, item: { ...editModal.item, productImage: response.data.url } });
        } else {
          setEditModal({ ...editModal, item: { ...editModal.item, image: response.data.url } });
        }
        toast.success('Görsel başarıyla yüklendi');
      }
    } catch (error) {
      console.error('Image upload error:', error);
      toast.error('Görsel yüklenemedi');
    } finally {
      if (isProductImage) {
        setUploadingProductImage(false);
      } else {
        setUploadingImage(false);
      }
    }
  };

  const handleCreateSubmit = async () => {
    if (!newAd.image) {
      toast.error('Reklam görseli zorunludur');
      return;
    }

    try {
      const adData = {
        title: newAd.title,
        description: newAd.description,
        image: newAd.image,
        link: newAd.link,
        order: parseInt(newAd.order) || 0,
        isActive: newAd.isActive,
        startDate: newAd.startDate || null,
        endDate: newAd.endDate || null,
      };

      if (newAd.companyId) {
        adData.companyId = newAd.companyId;
      }
      if (newAd.productId) {
        adData.productId = newAd.productId;
      }
      if (newAd.discountPercent > 0) {
        adData.discountPercent = parseFloat(newAd.discountPercent);
      }
      if (newAd.quantity > 0) {
        adData.quantity = parseInt(newAd.quantity);
      }
      if (newAd.productImage) {
        adData.productImage = newAd.productImage;
      }

      await adminService.businessHomeAds.create(adData);
      toast.success('Reklam başarıyla oluşturuldu');
      setCreateModal({ open: false });
      window.location.reload();
    } catch (error) {
      console.error('Create error:', error);
      toast.error('Reklam oluşturulamadı: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleEditSubmit = async () => {
    if (!editModal.item.image) {
      toast.error('Reklam görseli zorunludur');
      return;
    }

    try {
      const adData = {
        title: editModal.item.title || '',
        description: editModal.item.description || '',
        image: editModal.item.image,
        link: editModal.item.link || '',
        order: parseInt(editModal.item.order) || 0,
        isActive: editModal.item.isActive !== undefined ? editModal.item.isActive : true,
        startDate: editModal.item.startDate || null,
        endDate: editModal.item.endDate || null,
      };

      if (editModal.item.companyId) {
        adData.companyId = typeof editModal.item.companyId === 'object' 
          ? editModal.item.companyId._id 
          : editModal.item.companyId;
      }
      if (editModal.item.productId) {
        adData.productId = typeof editModal.item.productId === 'object' 
          ? editModal.item.productId._id 
          : editModal.item.productId;
      }
      if (editModal.item.discountPercent) {
        adData.discountPercent = parseFloat(editModal.item.discountPercent);
      }
      if (editModal.item.quantity) {
        adData.quantity = parseInt(editModal.item.quantity);
      }
      if (editModal.item.productImage) {
        adData.productImage = editModal.item.productImage;
      }

      await adminService.businessHomeAds.update(editModal.item._id, adData);
      toast.success('Reklam başarıyla güncellendi');
      setEditModal({ open: false, item: null });
      window.location.reload();
    } catch (error) {
      console.error('Update error:', error);
      toast.error('Reklam güncellenemedi: ' + (error.response?.data?.message || error.message));
    }
  };

  const selectCompany = (company) => {
    setSelectedCompany(company);
    setNewAd({ ...newAd, companyId: company._id });
    setCompanySearch('');
    setCompanies([]);
  };

  const selectProduct = (product) => {
    setSelectedProduct(product);
    setNewAd({ 
      ...newAd, 
      productId: product._id,
      title: product.name || newAd.title,
      description: product.description || product.shortDescription || newAd.description,
      discountPercent: product.discountPercent || 0,
      productImage: product.images?.[0] || newAd.productImage,
    });
    setProductSearch('');
    setProducts([]);
  };

  return (
    <>
      <GenericModelList
        title="İşletme Ana Sayfa Reklamları"
        service={adminService.businessHomeAds}
        columns={columns}
        getRowData={getRowData}
        searchFields={['title', 'description']}
        onCreate={handleCreate}
        onEdit={handleEdit}
        onDelete={true}
      />

      {/* Create Modal */}
      {createModal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Plus className="w-5 h-5 text-primary-600" />
                Yeni Reklam Ekle
              </h2>
              <button
                onClick={() => setCreateModal({ open: false })}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {/* İşletme Seçimi */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">İşletme (Opsiyonel)</label>
                {selectedCompany ? (
                  <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-5 h-5 text-green-600" />
                      <div>
                        <p className="font-medium text-gray-900">
                          {`${selectedCompany.firstName || ''} ${selectedCompany.lastName || ''}`.trim() || selectedCompany.email}
                        </p>
                        {selectedCompany.email && (
                          <p className="text-sm text-gray-500">{selectedCompany.email}</p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedCompany(null);
                        setNewAd({ ...newAd, companyId: '' });
                      }}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      value={companySearch}
                      onChange={(e) => setCompanySearch(e.target.value)}
                      placeholder="İşletme ara (isim, email)..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                    {!loadingCompanies && companies.length > 0 && (
                      <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg mt-1 max-h-48 overflow-y-auto shadow-lg z-10">
                        {companies.map((company) => (
                          <button
                            key={company._id}
                            onClick={() => selectCompany(company)}
                            className="w-full text-left px-4 py-2 hover:bg-gray-50 border-b last:border-b-0"
                          >
                            <div className="flex items-center gap-2">
                              <Building2 className="w-4 h-4 text-gray-400" />
                              <div>
                                <p className="font-medium text-gray-900">
                                  {`${company.firstName || ''} ${company.lastName || ''}`.trim() || company.email}
                                </p>
                                <p className="text-sm text-gray-500">{company.email}</p>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Ürün Seçimi */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ürün (Opsiyonel)</label>
                {selectedProduct ? (
                  <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Package className="w-5 h-5 text-blue-600" />
                      <div>
                        <p className="font-medium text-gray-900">{selectedProduct.name}</p>
                        <p className="text-sm text-gray-500">{formatCurrency(selectedProduct.price || 0)}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedProduct(null);
                        setNewAd({ ...newAd, productId: '', title: '', description: '', discountPercent: 0, productImage: '' });
                      }}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      placeholder="Ürün ara..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                    {!loadingProducts && products.length > 0 && (
                      <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg mt-1 max-h-48 overflow-y-auto shadow-lg z-10">
                        {products.map((product) => (
                          <button
                            key={product._id}
                            onClick={() => selectProduct(product)}
                            className="w-full text-left px-4 py-2 hover:bg-gray-50 border-b last:border-b-0"
                          >
                            <div className="flex items-center gap-2">
                              <Package className="w-4 h-4 text-gray-400" />
                              <div>
                                <p className="font-medium text-gray-900">{product.name}</p>
                                <p className="text-sm text-gray-500">{formatCurrency(product.price || 0)}</p>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Başlık</label>
                <input
                  type="text"
                  value={newAd.title}
                  onChange={(e) => setNewAd({ ...newAd, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  placeholder="Reklam başlığı..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Açıklama</label>
                <textarea
                  value={newAd.description}
                  onChange={(e) => setNewAd({ ...newAd, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  placeholder="Reklam açıklaması..."
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">İndirim Oranı (%)</label>
                  <input
                    type="number"
                    value={newAd.discountPercent || ''}
                    onChange={(e) => setNewAd({ ...newAd, discountPercent: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    min="0"
                    max="100"
                    step="0.01"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Adet</label>
                  <input
                    type="number"
                    value={newAd.quantity || ''}
                    onChange={(e) => setNewAd({ ...newAd, quantity: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    min="0"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sıralama</label>
                  <input
                    type="number"
                    value={newAd.order || ''}
                    onChange={(e) => setNewAd({ ...newAd, order: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    min="0"
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Başlangıç Tarihi</label>
                  <input
                    type="date"
                    value={newAd.startDate}
                    onChange={(e) => setNewAd({ ...newAd, startDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bitiş Tarihi</label>
                  <input
                    type="date"
                    value={newAd.endDate}
                    onChange={(e) => setNewAd({ ...newAd, endDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Link</label>
                <input
                  type="text"
                  value={newAd.link}
                  onChange={(e) => setNewAd({ ...newAd, link: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  placeholder="https://..."
                />
              </div>

              {/* Reklam Görseli */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reklam Görseli *</label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer px-4 py-2 border border-dashed border-gray-400 rounded-lg hover:bg-gray-50 text-sm text-gray-600">
                    <Upload className="w-4 h-4" />
                    {uploadingImage ? 'Yükleniyor...' : 'Görsel Yükle'}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files[0]) {
                          handleImageUpload(e.target.files[0], false);
                        }
                      }}
                    />
                  </label>
                  {newAd.image && (
                    <div className="relative">
                      <img src={newAd.image} alt="Preview" className="w-20 h-20 object-cover rounded" />
                      <button
                        onClick={() => setNewAd({ ...newAd, image: '' })}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
                {newAd.image && (
                  <input
                    type="text"
                    value={newAd.image}
                    onChange={(e) => setNewAd({ ...newAd, image: e.target.value })}
                    className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm"
                    placeholder="Veya URL girin"
                  />
                )}
              </div>

              {/* Ürün Görseli */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ürün Görseli (Opsiyonel)</label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer px-4 py-2 border border-dashed border-gray-400 rounded-lg hover:bg-gray-50 text-sm text-gray-600">
                    <Upload className="w-4 h-4" />
                    {uploadingProductImage ? 'Yükleniyor...' : 'Görsel Yükle'}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files[0]) {
                          handleImageUpload(e.target.files[0], true);
                        }
                      }}
                    />
                  </label>
                  {newAd.productImage && (
                    <div className="relative">
                      <img src={newAd.productImage} alt="Preview" className="w-20 h-20 object-cover rounded" />
                      <button
                        onClick={() => setNewAd({ ...newAd, productImage: '' })}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
                {newAd.productImage && (
                  <input
                    type="text"
                    value={newAd.productImage}
                    onChange={(e) => setNewAd({ ...newAd, productImage: e.target.value })}
                    className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm"
                    placeholder="Veya URL girin"
                  />
                )}
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={newAd.isActive}
                  onChange={(e) => setNewAd({ ...newAd, isActive: e.target.checked })}
                  className="w-4 h-4"
                />
                <label className="text-sm font-medium text-gray-700">Aktif</label>
              </div>
            </div>
            <div className="flex justify-end gap-3 p-4 border-t">
              <button
                onClick={() => setCreateModal({ open: false })}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                İptal
              </button>
              <button
                onClick={handleCreateSubmit}
                className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                <Save className="w-4 h-4" />
                Kaydet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editModal.open && editModal.item && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-xl font-semibold">Reklam Düzenle</h2>
              <button
                onClick={() => setEditModal({ open: false, item: null })}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="p-3 bg-gray-50 rounded-lg">
                <label className="block text-sm font-medium text-gray-500">İşletme</label>
                <p className="mt-1 text-gray-900 font-medium">
                  {editModal.item.companyId 
                    ? (typeof editModal.item.companyId === 'object' 
                        ? `${editModal.item.companyId.firstName || ''} ${editModal.item.companyId.lastName || ''}`.trim() || editModal.item.companyId.email || '-'
                        : editModal.item.companyId)
                    : '-'}
                </p>
              </div>

              {editModal.item.productId && (
                <div className="p-3 bg-blue-50 rounded-lg">
                  <label className="block text-sm font-medium text-blue-700">Ürün</label>
                  <p className="mt-1 text-blue-900">
                    {typeof editModal.item.productId === 'object' 
                      ? editModal.item.productId.name || editModal.item.productId._id
                      : editModal.item.productId}
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Başlık</label>
                <input
                  type="text"
                  value={editModal.item.title || ''}
                  onChange={(e) => setEditModal({ ...editModal, item: { ...editModal.item, title: e.target.value } })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Açıklama</label>
                <textarea
                  value={editModal.item.description || ''}
                  onChange={(e) => setEditModal({ ...editModal, item: { ...editModal.item, description: e.target.value } })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">İndirim Oranı (%)</label>
                  <input
                    type="number"
                    value={editModal.item.discountPercent || ''}
                    onChange={(e) => setEditModal({ ...editModal, item: { ...editModal.item, discountPercent: parseFloat(e.target.value) || 0 } })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    min="0"
                    max="100"
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Adet</label>
                  <input
                    type="number"
                    value={editModal.item.quantity || ''}
                    onChange={(e) => setEditModal({ ...editModal, item: { ...editModal.item, quantity: parseInt(e.target.value) || 0 } })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sıralama</label>
                  <input
                    type="number"
                    value={editModal.item.order || ''}
                    onChange={(e) => setEditModal({ ...editModal, item: { ...editModal.item, order: parseInt(e.target.value) || 0 } })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    min="0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Başlangıç Tarihi</label>
                  <input
                    type="date"
                    value={editModal.item.startDate ? format(new Date(editModal.item.startDate), 'yyyy-MM-dd') : ''}
                    onChange={(e) => setEditModal({ ...editModal, item: { ...editModal.item, startDate: e.target.value } })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bitiş Tarihi</label>
                  <input
                    type="date"
                    value={editModal.item.endDate ? format(new Date(editModal.item.endDate), 'yyyy-MM-dd') : ''}
                    onChange={(e) => setEditModal({ ...editModal, item: { ...editModal.item, endDate: e.target.value } })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Link</label>
                <input
                  type="text"
                  value={editModal.item.link || ''}
                  onChange={(e) => setEditModal({ ...editModal, item: { ...editModal.item, link: e.target.value } })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>

              {/* Reklam Görseli */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reklam Görseli *</label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer px-4 py-2 border border-dashed border-gray-400 rounded-lg hover:bg-gray-50 text-sm text-gray-600">
                    <Upload className="w-4 h-4" />
                    {uploadingImage ? 'Yükleniyor...' : 'Görsel Yükle'}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files[0]) {
                          handleEditImageUpload(e.target.files[0], false);
                        }
                      }}
                    />
                  </label>
                  {editModal.item.image && (
                    <div className="relative">
                      <img src={editModal.item.image} alt="Preview" className="w-20 h-20 object-cover rounded" />
                    </div>
                  )}
                </div>
                {editModal.item.image && (
                  <input
                    type="text"
                    value={editModal.item.image}
                    onChange={(e) => setEditModal({ ...editModal, item: { ...editModal.item, image: e.target.value } })}
                    className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm"
                  />
                )}
              </div>

              {/* Ürün Görseli */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ürün Görseli</label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer px-4 py-2 border border-dashed border-gray-400 rounded-lg hover:bg-gray-50 text-sm text-gray-600">
                    <Upload className="w-4 h-4" />
                    {uploadingProductImage ? 'Yükleniyor...' : 'Görsel Yükle'}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files[0]) {
                          handleEditImageUpload(e.target.files[0], true);
                        }
                      }}
                    />
                  </label>
                  {editModal.item.productImage && (
                    <div className="relative">
                      <img src={editModal.item.productImage} alt="Preview" className="w-20 h-20 object-cover rounded" />
                    </div>
                  )}
                </div>
                {editModal.item.productImage && (
                  <input
                    type="text"
                    value={editModal.item.productImage || ''}
                    onChange={(e) => setEditModal({ ...editModal, item: { ...editModal.item, productImage: e.target.value } })}
                    className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm"
                  />
                )}
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={editModal.item.isActive !== undefined ? editModal.item.isActive : true}
                  onChange={(e) => setEditModal({ ...editModal, item: { ...editModal.item, isActive: e.target.checked } })}
                  className="w-4 h-4"
                />
                <label className="text-sm font-medium text-gray-700">Aktif</label>
              </div>
            </div>
            <div className="flex justify-end gap-3 p-4 border-t">
              <button
                onClick={() => setEditModal({ open: false, item: null })}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                İptal
              </button>
              <button
                onClick={handleEditSubmit}
                className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                <Save className="w-4 h-4" />
                Kaydet
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

const formatCurrency = (amount) => {
  if (!amount && amount !== 0) return '-';
  return `${parseFloat(amount).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺`;
};
