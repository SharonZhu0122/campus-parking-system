const { Op } = require('sequelize');
const { Violation } = require('../models');
const { MAX_OPEN_AUTOMATIC_VIOLATIONS } = require('./simulationConfig');

// Given open violations newest first, the ones beyond `keep` are the ones to drop.
function idsToDrop(newestFirst, keep) {
  return newestFirst.slice(keep).map((v) => v.id);
}

// Keep only the newest open detections from the rule engine. Staff-entered
// violations (source 'manual') and anything already handled stay untouched.
async function trimOpenViolations(keep = MAX_OPEN_AUTOMATIC_VIOLATIONS) {
  const open = await Violation.findAll({
    where: { resolved: false, source: 'automatic' },
    attributes: ['id'],
    order: [['createdAt', 'DESC'], ['id', 'DESC']],
  });
  const drop = idsToDrop(open, keep);
  if (drop.length === 0) return 0;

  const CHUNK = 500;
  for (let i = 0; i < drop.length; i += CHUNK) {
    await Violation.destroy({ where: { id: { [Op.in]: drop.slice(i, i + CHUNK) } } });
  }
  return drop.length;
}

module.exports = { idsToDrop, trimOpenViolations };
