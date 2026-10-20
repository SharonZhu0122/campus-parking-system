// Creates (or resets the password of) an admin account.
// Usage: node src/scripts/createAdmin.js <username> <password>
require('dotenv').config();
const bcrypt = require('bcryptjs');
const { sequelize, User } = require('../models');
const { MIN_PASSWORD_LENGTH } = require('../utils/validation');

async function createAdmin(username, password) {
  if (!username || !password || password.length < MIN_PASSWORD_LENGTH) {
    throw new Error(`usage: createAdmin <username> <password of at least ${MIN_PASSWORD_LENGTH} characters>`);
  }
  const passwordHash = await bcrypt.hash(password, 10);
  const existing = await User.findOne({ where: { username } });
  if (existing) {
    await existing.update({ passwordHash, role: 'admin' });
    return 'updated';
  }
  await User.create({ username, passwordHash, role: 'admin' });
  return 'created';
}

createAdmin(process.argv[2], process.argv[3])
  .then((result) => console.log(`Admin account ${process.argv[2]} ${result}.`))
  .catch((err) => {
    console.error(err.message);
    process.exitCode = 1;
  })
  .finally(() => sequelize.close());
