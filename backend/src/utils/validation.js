// NZ plates are up to 6 letters/digits, including personalised ones.
const PLATE_PATTERN = /^[A-Z0-9]{2,6}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^\+?[0-9][0-9\s-]{6,18}$/;
const MIN_PASSWORD_LENGTH = 6;

function normalisePlate(plate) {
  return String(plate).toUpperCase().replace(/[\s-]/g, '');
}

module.exports = { PLATE_PATTERN, EMAIL_PATTERN, PHONE_PATTERN, MIN_PASSWORD_LENGTH, normalisePlate };
