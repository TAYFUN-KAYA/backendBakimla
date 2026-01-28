import { useState, useEffect } from 'react';
import { X, Upload } from 'lucide-react';
import { adminService } from '../../services/adminService';
import toast from 'react-hot-toast';

const emptyForm = () => ({
  firstName: '',
  lastName: '',
  gender: 'male',
  email: '',
  phoneNumber: '',
  username: '',
  birthDate: '',
  profileImage: '',
  city: '',
  district: '',
  newPassword: '',
  userType: 'user',
  companyId: '',
  isApproved: false,
  appNotifications: false,
  campaignNotifications: false,
  appointmentReminders: true,
  bio: '',
  jobTitle: '',
  position: '',
  points: 0,
  expertiseDocumentsText: '',
  workExampleOncesi: '',
  workExampleSonrasi: '',
});

const userToForm = (u) => {
  if (!u) return emptyForm();
  const np = u.notificationPreferences || {};
  return {
    firstName: u.firstName || '',
    lastName: u.lastName || '',
    gender: u.gender || 'male',
    email: u.email || '',
    phoneNumber: u.phoneNumber || '',
    username: u.username || '',
    birthDate: u.birthDate ? new Date(u.birthDate).toISOString().slice(0, 10) : '',
    profileImage: u.profileImage || '',
    city: u.city || '',
    district: u.district || '',
    newPassword: '',
    userType: u.userType || 'user',
    companyId: u.companyId?._id || u.companyId || '',
    isApproved: !!u.isApproved,
    appNotifications: !!np.appNotifications,
    campaignNotifications: !!np.campaignNotifications,
    appointmentReminders: np.appointmentReminders !== false,
    bio: u.bio || '',
    jobTitle: u.jobTitle || '',
    position: u.position || '',
    points: u.points ?? 0,
    expertiseDocumentsText: (u.expertiseDocuments || []).join('\n'),
    workExampleOncesi: (u.workExamples || []).find(w => w.type === 'öncesi')?.url || '',
    workExampleSonrasi: (u.workExamples || []).find(w => w.type === 'sonrası')?.url || '',
  };
};

const formToPayload = (f, profileImageUrl, pendingProfileFile) => {
  const p = {
    firstName: f.firstName || undefined,
    lastName: f.lastName || undefined,
    gender: f.gender || undefined,
    email: f.email || undefined,
    phoneNumber: f.phoneNumber || undefined,
    username: f.username || undefined,
    birthDate: f.birthDate || undefined,
    profileImage: profileImageUrl || f.profileImage || undefined,
    city: f.city || undefined,
    district: f.district || undefined,
    userType: f.userType || undefined,
    companyId: f.userType === 'employee' ? (f.companyId || null) : null,
    isApproved: f.userType === 'employee' ? !!f.isApproved : undefined,
    notificationPreferences: {
      appNotifications: !!f.appNotifications,
      campaignNotifications: !!f.campaignNotifications,
      appointmentReminders: !!f.appointmentReminders,
    },
    bio: f.bio || undefined,
    jobTitle: f.jobTitle || undefined,
    position: f.position || undefined,
    points: parseInt(f.points, 10) >= 0 ? parseInt(f.points, 10) : undefined,
    expertiseDocuments: f.expertiseDocumentsText ? f.expertiseDocumentsText.split('\n').map(u => u.trim()).filter(Boolean) : undefined,
    workExamples: (() => {
      const a = [
        ...(f.workExampleOncesi?.trim() ? [{ type: 'öncesi', url: f.workExampleOncesi.trim() }] : []),
        ...(f.workExampleSonrasi?.trim() ? [{ type: 'sonrası', url: f.workExampleSonrasi.trim() }] : []),
      ];
      return a.length ? a : undefined;
    })(),
  };
  if (f.newPassword && f.newPassword.trim()) p.password = f.newPassword.trim();
  return p;
};

export default function UserModal({ userId, companies, onClose, onSave }) {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(!!userId);
  const [formData, setFormData] = useState(emptyForm());
  const [pendingProfileFile, setPendingProfileFile] = useState(null);

  useEffect(() => {
    setPendingProfileFile(null);
    if (userId) {
      setFetching(true);
      adminService.getUserById(userId)
        .then((res) => {
          if (res.data?.success && res.data?.data) setFormData(userToForm(res.data.data));
        })
        .catch(() => toast.error('Kullanıcı yüklenemedi'))
        .finally(() => setFetching(false));
    } else {
      setFormData(emptyForm());
    }
  }, [userId]);

  const update = (key, value) => setFormData((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.phoneNumber || !formData.gender || !formData.userType) {
      toast.error('Ad, soyad, e-posta, telefon, cinsiyet ve kullanıcı tipi zorunludur');
      return;
    }
    if (formData.userType === 'employee' && !formData.companyId) {
      toast.error('Çalışan için işletme seçin');
      return;
    }
    setLoading(true);
    try {
      let profileImageUrl = formData.profileImage;
      if (pendingProfileFile) {
        const res = await adminService.uploadImage(pendingProfileFile, 'users');
        if (res.data?.url) profileImageUrl = res.data.url;
      }
      const payload = formToPayload(formData, profileImageUrl, pendingProfileFile);
      await adminService.updateUser(userId, payload);
      toast.success('Kullanıcı güncellendi');
      onSave();
    } catch (err) {
      console.error('User save error:', err);
      toast.error(err.response?.data?.message || 'Güncelleme başarısız');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-8">Yükleniyor...</div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b shrink-0">
          <h2 className="text-xl font-bold text-gray-800">Kullanıcıyı Düzenle</h2>
          <button type="button" onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="p-4 overflow-y-auto space-y-4 flex-1">
            {/* Temel */}
            <section>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Temel bilgiler</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Ad *</label>
                  <input type="text" required value={formData.firstName} onChange={(e) => update('firstName', e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Soyad *</label>
                  <input type="text" required value={formData.lastName} onChange={(e) => update('lastName', e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Cinsiyet *</label>
                  <select value={formData.gender} onChange={(e) => update('gender', e.target.value)} className="w-full px-3 py-2 border rounded-lg">
                    <option value="male">Erkek</option>
                    <option value="female">Kadın</option>
                    <option value="other">Diğer</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Doğum tarihi</label>
                  <input type="date" value={formData.birthDate} onChange={(e) => update('birthDate', e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm text-gray-600 mb-1">E-posta *</label>
                  <input type="email" required value={formData.email} onChange={(e) => update('email', e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Telefon *</label>
                  <input type="text" required value={formData.phoneNumber} onChange={(e) => update('phoneNumber', e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Kullanıcı adı</label>
                  <input type="text" value={formData.username} onChange={(e) => update('username', e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
                </div>
              </div>
            </section>

            {/* Profil fotoğrafı */}
            <section>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Profil fotoğrafı</h3>
              <div className="flex flex-wrap items-end gap-4">
                <div className="flex flex-col">
                  {(formData.profileImage || pendingProfileFile) && (
                    <img src={pendingProfileFile ? URL.createObjectURL(pendingProfileFile) : formData.profileImage} alt="" className="w-20 h-20 rounded-full object-cover border" />
                  )}
                  {!formData.profileImage && !pendingProfileFile && (
                    <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-sm">Foto yok</div>
                  )}
                  <label className="mt-2 flex items-center gap-1 cursor-pointer text-sm text-primary-600 hover:underline w-fit">
                    <Upload className="w-4 h-4" /> Dosyadan yükle
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) setPendingProfileFile(f); e.target.value = ''; }} />
                  </label>
                </div>
                <div className="flex-1 min-w-0">
                  <label className="block text-sm text-gray-600 mb-1">Veya URL</label>
                  <input type="url" value={formData.profileImage} onChange={(e) => update('profileImage', e.target.value)} placeholder="https://..." className="w-full px-3 py-2 border rounded-lg" />
                </div>
              </div>
            </section>

            {/* Konum */}
            <section>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Konum</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Şehir</label>
                  <input type="text" value={formData.city} onChange={(e) => update('city', e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">İlçe</label>
                  <input type="text" value={formData.district} onChange={(e) => update('district', e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
                </div>
              </div>
            </section>

            {/* Şifre */}
            <section>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Şifre değiştir</h3>
              <input type="password" value={formData.newPassword} onChange={(e) => update('newPassword', e.target.value)} placeholder="Boş bırak = değişmez" className="w-full px-3 py-2 border rounded-lg" />
            </section>

            {/* Hesap */}
            <section>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Hesap</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Kullanıcı tipi *</label>
                  <select value={formData.userType} onChange={(e) => update('userType', e.target.value)} className="w-full px-3 py-2 border rounded-lg">
                    <option value="user">Müşteri</option>
                    <option value="company">İşletme</option>
                    <option value="employee">Çalışan</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                {formData.userType === 'employee' && (
                  <>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">İşletme *</label>
                      <select required value={formData.companyId} onChange={(e) => update('companyId', e.target.value)} className="w-full px-3 py-2 border rounded-lg">
                        <option value="">Seçin</option>
                        {(companies || []).map((c) => (
                          <option key={c._id} value={c._id}>{c.firstName} {c.lastName}</option>
                        ))}
                      </select>
                    </div>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" checked={formData.isApproved} onChange={(e) => update('isApproved', e.target.checked)} className="rounded" />
                      <span className="text-sm">Onaylı</span>
                    </label>
                  </>
                )}
              </div>
            </section>

            {/* Bildirim tercihleri */}
            <section>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Bildirim tercihleri</h3>
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={formData.appNotifications} onChange={(e) => update('appNotifications', e.target.checked)} className="rounded" />
                  <span className="text-sm">Uygulama bildirimleri</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={formData.campaignNotifications} onChange={(e) => update('campaignNotifications', e.target.checked)} className="rounded" />
                  <span className="text-sm">Kampanya bildirimleri</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={formData.appointmentReminders} onChange={(e) => update('appointmentReminders', e.target.checked)} className="rounded" />
                  <span className="text-sm">Randevu hatırlatmaları</span>
                </label>
              </div>
            </section>

            {/* Ek bilgiler */}
            <section>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Ek bilgiler</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Biyografi</label>
                  <textarea value={formData.bio} onChange={(e) => update('bio', e.target.value)} rows={2} className="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">İş unvanı</label>
                    <input type="text" value={formData.jobTitle} onChange={(e) => update('jobTitle', e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Pozisyon</label>
                    <input type="text" value={formData.position} onChange={(e) => update('position', e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Puan</label>
                    <input type="number" min={0} value={formData.points} onChange={(e) => update('points', e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Uzmanlık belgeleri (her satıra bir URL)</label>
                  <textarea value={formData.expertiseDocumentsText} onChange={(e) => update('expertiseDocumentsText', e.target.value)} rows={2} placeholder="https://..." className="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Örnek iş öncesi URL</label>
                    <input type="url" value={formData.workExampleOncesi} onChange={(e) => update('workExampleOncesi', e.target.value)} placeholder="https://..." className="w-full px-3 py-2 border rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Örnek iş sonrası URL</label>
                    <input type="url" value={formData.workExampleSonrasi} onChange={(e) => update('workExampleSonrasi', e.target.value)} placeholder="https://..." className="w-full px-3 py-2 border rounded-lg" />
                  </div>
                </div>
              </div>
            </section>
          </div>

          <div className="p-4 border-t flex justify-end gap-2 shrink-0">
            <button type="button" onClick={onClose} className="px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-50">İptal</button>
            <button type="submit" disabled={loading} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50">{loading ? 'Kaydediliyor...' : 'Güncelle'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
