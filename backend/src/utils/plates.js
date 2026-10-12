const PLATE_REGEX = /^[A-Z]{3}\d{3}$/;
const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

function generatePlateCandidate() {
  const letters = Array.from({ length: 3 }, () => LETTERS[Math.floor(Math.random() * LETTERS.length)]).join('');
  const digitCount = Math.random() < 0.1 ? Math.floor(Math.random() * 3) + 1 : 3;
  const digits = Array.from({ length: digitCount }, () => Math.floor(Math.random() * 10)).join('');
  return letters + digits;
}

function generateValidPlateNumber() {
  let plate = generatePlateCandidate();
  while (!PLATE_REGEX.test(plate)) {
    plate = generatePlateCandidate();
  }
  return plate;
}

module.exports = { PLATE_REGEX, generateValidPlateNumber };
