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
  resolvedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  resolvedBy: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  resolutionType: {
    type: DataTypes.ENUM('ticket_issued', 'false_positive', 'other'),
    allowNull: true,
  },
});

ParkingEvent.hasMany(Violation, { foreignKey: 'parkingEventId' });
Violation.belongsTo(ParkingEvent, { foreignKey: 'parkingEventId' });

module.exports = Violation;
