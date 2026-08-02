const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const GateArea = sequelize.define('GateArea', {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  totalParks: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 50,
  },
});

module.exports = GateArea;
