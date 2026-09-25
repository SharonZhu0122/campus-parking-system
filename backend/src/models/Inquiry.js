const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Inquiry = sequelize.define('Inquiry', {
  question: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
  },
});

module.exports = Inquiry;
