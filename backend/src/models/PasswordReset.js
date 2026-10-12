const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

// Only a SHA-256 hash of the emailed token is stored, so a copy of the
// database cannot be used to reset anyone's password.
const PasswordReset = sequelize.define('PasswordReset', {
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  tokenHash: {
    type: DataTypes.STRING(64),
    allowNull: false,
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  usedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
});

module.exports = PasswordReset;
