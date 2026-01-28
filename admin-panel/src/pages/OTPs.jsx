import GenericModelList from '../components/GenericModelList';
import { adminService } from '../services/adminService';
import { format } from 'date-fns';
import { CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';

export default function OTPs() {
  const columns = [
    { key: 'phoneNumber', label: 'Telefon Numarası' },
    { key: 'code', label: 'OTP Kodu' },
    { key: 'purpose', label: 'Amaç' },
    { key: 'status', label: 'Durum' },
    { key: 'attempts', label: 'Deneme Sayısı' },
    { key: 'expiresAt', label: 'Son Geçerlilik' },
    { key: 'createdAt', label: 'Gönderim Tarihi' },
  ];

  const getPurposeLabel = (purpose) => {
    const labels = {
      register: 'Kayıt',
      login: 'Giriş',
      forgot_password: 'Şifre Sıfırlama',
      'admin-login': 'Admin Girişi',
      'reset-password': 'Şifre Sıfırlama',
    };
    return labels[purpose] || purpose;
  };

  const getPurposeBadge = (purpose) => {
    const badges = {
      register: { color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
      login: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      forgot_password: { color: 'bg-amber-100 text-amber-800', icon: AlertCircle },
      'admin-login': { color: 'bg-purple-100 text-purple-800', icon: CheckCircle },
      'reset-password': { color: 'bg-amber-100 text-amber-800', icon: AlertCircle },
    };
    const badge = badges[purpose] || { color: 'bg-gray-100 text-gray-800', icon: CheckCircle };
    const Icon = badge.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${badge.color}`}>
        <Icon className="w-3 h-3" />
        {getPurposeLabel(purpose)}
      </span>
    );
  };

  const getStatusBadge = (item) => {
    const now = new Date();
    const expiresAt = item.expiresAt ? new Date(item.expiresAt) : null;
    const isExpired = expiresAt && expiresAt < now;
    const isUsed = item.isUsed === true || item.isUsed === 'true';

    if (isUsed) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800">
          <CheckCircle className="w-3 h-3" />
          Kullanıldı
        </span>
      );
    }

    if (isExpired) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800">
          <XCircle className="w-3 h-3" />
          Süresi Doldu
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
        <Clock className="w-3 h-3" />
        Aktif
      </span>
    );
  };

  const formatDateTime = (date) => {
    if (!date) return '-';
    try {
      return format(new Date(date), 'dd.MM.yyyy HH:mm:ss');
    } catch {
      return '-';
    }
  };

  const formatTimeRemaining = (expiresAt) => {
    if (!expiresAt) return '-';
    try {
      const now = new Date();
      const expires = new Date(expiresAt);
      const diff = expires - now;

      if (diff <= 0) {
        return 'Süresi Doldu';
      }

      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);

      if (minutes > 0) {
        return `${minutes} dk ${seconds} sn`;
      }
      return `${seconds} sn`;
    } catch {
      return '-';
    }
  };

  const getRowData = (item) => {
    const now = new Date();
    const expiresAt = item.expiresAt ? new Date(item.expiresAt) : null;
    const isExpired = expiresAt && expiresAt < now;
    const isUsed = item.isUsed === true || item.isUsed === 'true';

    return {
      phoneNumber: (
        <div className="font-mono text-sm font-medium">
          {item.phoneNumber || '-'}
        </div>
      ),
      code: (
        <div className="font-mono text-lg font-bold text-primary-600">
          {item.code || '-'}
        </div>
      ),
      purpose: getPurposeBadge(item.purpose),
      status: getStatusBadge(item),
      attempts: (
        <div className="flex items-center gap-1">
          <span className={`px-2 py-1 rounded text-xs font-medium ${
            (item.attempts || 0) >= 5 
              ? 'bg-red-100 text-red-800' 
              : (item.attempts || 0) >= 3 
              ? 'bg-yellow-100 text-yellow-800' 
              : 'bg-gray-100 text-gray-800'
          }`}>
            {item.attempts || 0} / 5
          </span>
        </div>
      ),
      expiresAt: (
        <div className="text-sm">
          <div className="font-medium">{formatDateTime(item.expiresAt)}</div>
          {!isUsed && !isExpired && (
            <div className="text-xs text-gray-500">
              {formatTimeRemaining(item.expiresAt)} kaldı
            </div>
          )}
          {isExpired && (
            <div className="text-xs text-red-500">Süresi doldu</div>
          )}
        </div>
      ),
      createdAt: formatDateTime(item.createdAt),
    };
  };

  return (
    <GenericModelList
      title="OTP Kodları"
      service={adminService.otps}
      columns={columns}
      getRowData={getRowData}
      searchFields={['phoneNumber', 'code']}
      filters={[
        {
          key: 'purpose',
          type: 'select',
          label: 'Amaç',
          placeholder: 'Tüm Amaçlar',
          options: [
            { value: 'register', label: 'Kayıt' },
            { value: 'login', label: 'Giriş' },
            { value: 'forgot_password', label: 'Şifre Sıfırlama' },
            { value: 'admin-login', label: 'Admin Girişi' },
            { value: 'reset-password', label: 'Şifre Sıfırlama' },
          ],
        },
        {
          key: 'isUsed',
          type: 'select',
          label: 'Kullanım Durumu',
          placeholder: 'Tüm Durumlar',
          options: [
            { value: 'true', label: 'Kullanıldı' },
            { value: 'false', label: 'Kullanılmadı' },
          ],
        },
      ]}
    />
  );
}
