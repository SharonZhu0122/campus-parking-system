const sequelize = require('../config/db');
const User = require('./User');
const GateArea = require('./GateArea');
const ParkingEvent = require('./ParkingEvent');
const Violation = require('./Violation');
const Inquiry = require('./Inquiry');
const PasswordReset = require('./PasswordReset');

module.exports = {
  sequelize,
  User,
  GateArea,
  ParkingEvent,
  Violation,
  Inquiry,
  PasswordReset,
};
