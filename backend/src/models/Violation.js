const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const ParkingEvent = require('./ParkingEvent');

const Violation = sequelize.define('Violation', {
  violationType: {
    type: DataTypes.ENUM('reserved_violation', 'unpaid_violation', 'mobility_violation'),
    allowNull: false,
  },
  resolved: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
});

ParkingEvent.hasMany(Violation, { foreignKey: 'parkingEventId' });
Violation.belongsTo(ParkingEvent, { foreignKey: 'parkingEventId' });

module.exports = Violation;
