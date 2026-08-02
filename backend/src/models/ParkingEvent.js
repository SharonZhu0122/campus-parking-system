const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const GateArea = require('./GateArea');

const ParkingEvent = sequelize.define('ParkingEvent', {
  plateNumber: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  parkType: {
    type: DataTypes.ENUM('standard', 'reserved', 'mobility', 'motorbike'),
    allowNull: false,
  },
  paymentStatus: {
    type: DataTypes.ENUM('paid', 'unpaid', 'not_required'),
    allowNull: false,
  },
  mobilityCardValid: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
  },
  eventTime: {
    type: DataTypes.DATE,
    allowNull: false,
  },
});

GateArea.hasMany(ParkingEvent, { foreignKey: 'gateAreaId' });
ParkingEvent.belongsTo(GateArea, { foreignKey: 'gateAreaId' });

module.exports = ParkingEvent;
