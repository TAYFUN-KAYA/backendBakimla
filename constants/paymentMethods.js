/**
 * Ödeme yöntemleri sabitleri
 * Tüm controller ve modellerde bu dosyadan okunur.
 */

/** Randevu (Appointment) ödeme yöntemleri */
const APPOINTMENT = {
  CASH: 'cash',
  CARD: 'card',
  /** Bazı yerlerde card ile aynı kabul edilir (online ödeme) */
  ONLINE: 'online',
  VALUES: ['cash', 'card'],
  /** Kart/online ödemesi mi (İşlet Kazan, cüzdan, reward için sayılır) */
  isCard: (p) => p === 'card' || p === 'online',
};

/** Sipariş (Order) ödeme yöntemleri */
const ORDER = {
  CARD: 'card',
  CASH_ON_DELIVERY: 'cash_on_delivery',
  VALUES: ['card', 'cash_on_delivery'],
  isCard: (p) => p === 'card',
};

/** Muhasebe (Accounting) ödeme yöntemleri */
const ACCOUNTING = {
  NAKIT: 'nakit',
  IBAN: 'iban',
  ONLINE: 'online',
  VALUES: ['nakit', 'iban', 'online'],
};

/** Randevu paymentMethod -> Muhasebe paymentMethod */
function mapAppointmentToAccounting(pm) {
  if (pm === APPOINTMENT.CASH) return ACCOUNTING.NAKIT;
  if (pm === APPOINTMENT.CARD || pm === APPOINTMENT.ONLINE) return ACCOUNTING.ONLINE;
  if (pm === 'iban') return ACCOUNTING.IBAN;
  return ACCOUNTING.NAKIT;
}

/** Randevu ödeme yöntemi metni */
function getAppointmentPaymentLabel(pm) {
  if (pm === APPOINTMENT.CASH) return 'Nakit';
  if (pm === APPOINTMENT.CARD || pm === APPOINTMENT.ONLINE) return 'Kredi Kartı';
  if (pm === 'iban') return 'IBAN';
  return 'Belirtilmemiş';
}

module.exports = {
  APPOINTMENT,
  ORDER,
  ACCOUNTING,
  mapAppointmentToAccounting,
  getAppointmentPaymentLabel,
};
